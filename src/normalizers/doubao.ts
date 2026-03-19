/**
 * Doubao (豆包) Normalizer 实现
 * 
 * 负责将 Doubao 平台的原始数据转换为统一的 Conversation schema
 * 
 * @see https://doubao.com
 * 
 * 注意：此标准化器为骨架实现，待真实数据样本补充
 * 当前基于常见 AI 对话平台的消息结构进行推测
 */

import { BaseNormalizer } from './base';
import type {
  DoubaoConversationDetail,
  DoubaoTurn,
  DoubaoContentBlock,
  DoubaoMessageBlock,
} from '../adapters/doubao-types';
import type {
  PlatformType,
  RawConversation,
  RawMessage,
  Conversation,
  Message,
  MessageRole,
  MessageContent,
} from '../types';

/**
 * Doubao Normalizer
 * 
 * 主要职责：
 * 1. 将 Doubao 的原始对话数据转换为统一的 Conversation 格式
 * 2. 处理多种消息块类型（text, think, image, code, etc.）
 * 3. 支持多结构兼容
 */
export class DoubaoNormalizer extends BaseNormalizer {
  readonly platform: PlatformType = 'doubao';

  /**
   * 标准化对话
   * 
   * 将 Doubao 原始对话数据转换为统一的 Conversation 格式
   */
  async normalizeConversation(
    rawConversation: RawConversation
  ): Promise<Conversation> {
    console.log('[DoubaoNormalizer] normalizeConversation called');

    const data = rawConversation.data as DoubaoConversationDetail;
    
    // 提取对话轮次（尝试多种可能的字段）
    const turns =
      data.data ||
      data.messages ||
      data.turns ||
      data.convs ||
      [];

    // 提取对话 ID
    const conversationId =
      data.conversationId ||
      data.conversation_id ||
      data.convId ||
      data.id ||
      data.sessionId ||
      data.chatId ||
      this.generateId('doubao_');

    // 提取标题
    const title = data.title || data.sessionTitle || data.name || 'Doubao Chat';

    // 标准化所有消息
    const messages: Message[] = [];
    for (const turn of turns) {
      try {
        const message = await this.normalizeTurn(turn, conversationId);
        if (message) {
          messages.push(message);
        }
      } catch (error) {
        console.error(
          '[DoubaoNormalizer] Failed to normalize turn:',
          turn.index,
          error
        );
      }
    }

    // 按时间戳排序
    messages.sort((a, b) => a.timestamp - b.timestamp);

    // 计算创建和更新时间
    const timestamps = messages.map((m) => m.timestamp).filter((t) => t > 0);
    const createdAt = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
    const updatedAt = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();

    return {
      id: conversationId,
      title,
      messages,
      createdAt,
      updatedAt,
      metadata: {
        platform: this.platform,
        participantCount: this.countParticipants(messages),
        messageCount: messages.length,
        originalData: data,
      },
    };
  }

  /**
   * 标准化单个消息
   * 
   * 将 Doubao 的 turn 转换为统一的 Message 格式
   */
  async normalizeMessage(
    rawMessage: RawMessage,
    _conversationId: string
  ): Promise<Message> {
    console.log('[DoubaoNormalizer] normalizeMessage called');

    const turn = rawMessage.data as DoubaoTurn;
    return this.normalizeTurn(turn, _conversationId);
  }

  /**
   * 批量标准化
   */
  async normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]> {
    console.log(
      `[DoubaoNormalizer] Normalizing ${rawConversations.length} conversations`
    );

    const results: Conversation[] = [];
    for (const raw of rawConversations) {
      try {
        const normalized = await this.normalizeConversation(raw);
        results.push(normalized);
      } catch (error) {
        console.error('[DoubaoNormalizer] Failed to normalize conversation:', error);
      }
    }
    return results;
  }

  // ============================================================================
  // 内部方法：标准化逻辑
  // ============================================================================

  /**
   * 标准化一个对话轮次
   */
  private async normalizeTurn(
    turn: DoubaoTurn,
    conversationId: string
  ): Promise<Message> {
    const role = this.mapDoubaoRole(turn.role || turn.speaker);
    const timestamp = this.parseTimestamp(turn.createTime || turn.timestamp || Date.now());
    const blocks = this.extractMessageBlocks(turn);

    // 合并所有内容块
    const contentParts: string[] = [];
    for (const block of blocks) {
      contentParts.push(this.formatBlock(block));
    }

    const content: MessageContent = {
      text: contentParts.join('\n\n').trim() || '_No content_',
      metadata: {
        blockCount: blocks.length,
        blockTypes: blocks.map((b) => b.type),
      },
    };

    return {
      id: this.generateMessageId(conversationId, turn.index),
      role,
      content,
      timestamp,
      metadata: {
        platform: this.platform,
        originalIndex: turn.index,
        originalRole: turn.role || turn.speaker,
        turnId: turn.id,
      },
    };
  }

  /**
   * 映射 Doubao 角色到统一角色
   */
  private mapDoubaoRole(speaker?: string): MessageRole {
    if (!speaker) {
      return 'unknown';
    }

    const role = speaker.toLowerCase();
    
    // AI 角色
    if (role === 'ai' || role === 'assistant' || role === 'bot') {
      return 'assistant';
    }
    
    // 用户角色
    if (role === 'user' || role === 'human') {
      return 'user';
    }
    
    // 系统角色
    if (role === 'system') {
      return 'system';
    }
    
    // 工具角色
    if (role === 'tool' || role === 'function') {
      return 'tool';
    }
    
    return 'unknown';
  }

  /**
   * 从 turn 中提取消息块
   * 
   * 处理多种可能的数据结构：
   * - messages 数组
   * - blocks 数组
   * - content 字段
   */
  private extractMessageBlocks(turn: DoubaoTurn): DoubaoMessageBlock[] {
    const blocks: DoubaoMessageBlock[] = [];

    // 尝试从 messages 中提取
    const messages = turn.messages || [];
    for (const msg of messages) {
      const contentBlocks = msg.content || [];
      for (const block of contentBlocks) {
        const extracted = this.extractBlockContent(block);
        if (extracted) {
          blocks.push(extracted);
        }
      }
      // 或者直接有 text 字段
      if (msg.text) {
        blocks.push({
          type: 'text',
          text: msg.text,
        });
      }
    }

    // 尝试从 blocks 中提取
    const turnBlocks = turn.blocks || [];
    for (const block of turnBlocks) {
      const extracted = this.extractBlockContent(block);
      if (extracted) {
        blocks.push(extracted);
      }
    }

    // 如果都没有，但有直接的 content 字段
    if (blocks.length === 0 && turn.content) {
      blocks.push({
        type: 'text',
        text: turn.content,
      });
    }

    return blocks;
  }

  /**
   * 提取单个内容块
   * 
   * 支持多种块类型：
   * - text: 普通文本
   * - think: 思考过程
   * - code: 代码块
   * - image: 图片
   * - file: 文件
   * - 其他：标记为 unsupported
   */
  private extractBlockContent(block: DoubaoContentBlock): DoubaoMessageBlock | null {
    const type = block.type?.toLowerCase() || 'unknown';

    // 文本块
    if (type === 'text') {
      const text = block.content as string || block.text || '';
      return {
        type: 'text',
        text: this.adjustHeaderLevels(text, 1),
      };
    }

    // 思考块
    if (type === 'think') {
      const title = block.title || '';
      const content = Array.isArray(block.content)
        ? block.content.map((b) => this.extractBlockContent(b)?.text).join('\n')
        : String(block.content || block.text || '');

      return {
        type: 'think',
        text: content,
        title,
        metadata: {
          originalType: block.type,
        },
      };
    }

    // 代码块
    if (type === 'code') {
      const code = block.content as string || block.text || '';
      const language = block.language || 'plaintext';
      return {
        type: 'code',
        text: `\`\`\`${language}\n${code}\n\`\`\``,
        language,
        metadata: {
          originalType: block.type,
        },
      };
    }

    // 图片块
    if (type === 'image') {
      const url = block.url || block.data;
      const alt = block.title || '[Image]';
      return {
        type: 'image',
        text: url ? `![${alt}](${url})` : `![${alt}]()`,
        url,
        metadata: {
          originalType: block.type,
        },
      };
    }

    // 文件块
    if (type === 'file') {
      const url = block.url || block.data;
      const name = block.title || '[File]';
      return {
        type: 'file',
        text: url ? `[📎 ${name}](${url})` : `📎 ${name}`,
        url,
        metadata: {
          originalType: block.type,
        },
      };
    }

    // 其他类型：尝试提取文本或标记为不支持
    const textContent = 
      (block.content as string) || 
      block.text || 
      block.data || 
      block.title ||
      '';
    
    if (textContent) {
      return {
        type: 'unsupported',
        text: `[${type}] ${textContent}`,
        metadata: {
          originalType: block.type,
          originalBlock: block,
        },
      };
    }

    return null;
  }

  /**
   * 格式化消息块为文本
   */
  private formatBlock(block: DoubaoMessageBlock): string {
    switch (block.type) {
      case 'think':
        const title = block.title ? `[Think] ${block.title}` : '[Think]';
        return `> ${title}\n> ${block.text.replace(/\n/g, '\n> ')}`;
      
      case 'code':
        return block.text; // 代码块已经有 markdown 格式
      
      case 'image':
        return block.text; // 图片已经是 markdown 格式
      
      case 'file':
        return block.text; // 文件已经是 markdown 格式
      
      case 'text':
      default:
        return block.text;
    }
  }

  /**
   * 调整 Markdown 标题级别
   * 
   * 将所有标题级别增加 1 级，避免与对话标题冲突
   */
  private adjustHeaderLevels(text: string, increaseBy: number = 1): string {
    if (!text) return '';
    return String(text).replace(/^(#+)(\s*)(.*?)\s*$/gm, (_m, hashes, _space, content) => {
      return '#'.repeat(hashes.length + increaseBy) + ' ' + String(content).trim();
    });
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(
    conversationId: string,
    turnIndex?: number
  ): string {
    const index = turnIndex != null ? turnIndex : Date.now();
    return `${conversationId}_msg_${index}`;
  }

  /**
   * 统计参与者数量
   */
  private countParticipants(messages: Message[]): number {
    const roles = new Set(messages.map((m) => m.role));
    return roles.size;
  }
}

// ============================================================================
// 辅助函数：导出为 Markdown
// ============================================================================

/**
 * 将 Doubao 对话转换为 Markdown
 * 
 * 用于需要直接输出 Markdown 的场景
 */
export function doubaoToMarkdown(data: DoubaoConversationDetail): string {
  const title = data.title || data.sessionTitle || data.name || 'Doubao Chat';
  const out: string[] = [];

  out.push(`# ${title}`);
  out.push('');
  out.push(`> Exported at: ${new Date().toLocaleString()}`);
  out.push('');

  // 提取对话轮次
  const turns =
    data.data ||
    data.messages ||
    data.turns ||
    data.convs ||
    [];

  // 排序
  const sortedTurns = [...turns].sort((a, b) => {
    const indexA = a.index ?? 0;
    const indexB = b.index ?? 0;
    if (indexA !== indexB) return indexA - indexB;
    
    const timeA = parseTimestamp(a.createTime || a.timestamp);
    const timeB = parseTimestamp(b.createTime || b.timestamp);
    return timeA - timeB;
  });

  for (const turn of sortedTurns) {
    const speaker = String(turn.role || turn.speaker || '').toLowerCase();
    const role =
      speaker === 'ai' || speaker === 'assistant' || speaker === 'bot'
        ? 'Assistant'
        : speaker === 'user' || speaker === 'human'
        ? 'User'
        : speaker || 'Unknown';
    
    const idx = turn.index != null ? ` (Turn ${turn.index})` : '';
    const ts = formatTimestamp(turn.createTime || turn.timestamp);

    out.push(`## ${role}${idx}`);
    if (ts) out.push(`*${ts}*`);
    out.push('');

    // 提取内容
    const messages = turn.messages || [];
    const blocks = turn.blocks || [];
    const contentParts: string[] = [];

    // 从 messages 中提取
    for (const msg of messages) {
      const contentBlocks = msg.content || [];
      for (const block of contentBlocks) {
        contentParts.push(formatBlockContent(block));
      }
      if (msg.text) {
        contentParts.push(msg.text);
      }
    }

    // 从 blocks 中提取
    for (const block of blocks) {
      contentParts.push(formatBlockContent(block));
    }

    // 直接使用 content
    if (contentParts.length === 0 && turn.content) {
      contentParts.push(String(turn.content));
    }

    const body = contentParts.join('\n\n').trim();
    out.push(body || '_No content_');
    out.push('');
    out.push('---');
    out.push('');
  }

  return out.join('\n').trim() + '\n';
}

/**
 * 格式化内容块
 */
function formatBlockContent(block: DoubaoContentBlock): string {
  const type = block.type?.toLowerCase() || 'unknown';

  if (type === 'text') {
    return String(block.content || block.text || '');
  }

  if (type === 'think') {
    const title = block.title ? `[Think] ${block.title}` : '[Think]';
    const content = String(block.content || block.text || '');
    return `> ${title}\n> ${content.replace(/\n/g, '\n> ')}`;
  }

  if (type === 'code') {
    const code = String(block.content || block.text || '');
    const lang = block.language || 'plaintext';
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  }

  if (type === 'image') {
    const url = block.url || block.data || '';
    const alt = block.title || 'Image';
    return url ? `![${alt}](${url})` : `![${alt}]()`;
  }

  if (type === 'file') {
    const url = block.url || block.data || '';
    const name = block.title || 'File';
    return url ? `[📎 ${name}](${url})` : `📎 ${name}`;
  }

  // 其他类型
  return `[${type}] ${String(block.content || block.text || block.title || '')}`;
}

/**
 * 格式化时间戳
 */
function formatTimestamp(ts: number | string | undefined): string {
  if (!ts) return '';
  try {
    const n = typeof ts === 'string' ? Number.parseInt(ts, 10) : ts;
    const d = new Date(typeof n === 'number' && n < 1e12 ? n * 1000 : n);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
  } catch {
    return '';
  }
}

/**
 * 解析时间戳
 */
function parseTimestamp(timestamp: string | number | undefined): number {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') {
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
  }
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// 导出单例实例
export const doubaoNormalizer = new DoubaoNormalizer();
