/**
 * Yuanbao (腾讯元宝) Normalizer 实现
 * 
 * 负责将 Yuanbao 平台的原始数据转换为统一的 Conversation schema
 * 基于 V1 代码中的 yuanbaoToMarkdown 逻辑
 */

import { BaseNormalizer } from './base';
import type {
  YuanbaoConversationDetail,
  YuanbaoTurn,
  YuanbaoContentBlock,
  YuanbaoMessageBlock,
} from '../adapters/yuanbao-types';
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
 * Yuanbao Normalizer
 * 
 * 主要职责：
 * 1. 将 Yuanbao 的 convs 数组转换为统一的 Message 格式
 * 2. 处理多种消息块类型（text, think, etc.）
 * 3. 支持多结构兼容
 */
export class YuanbaoNormalizer extends BaseNormalizer {
  readonly platform: PlatformType = 'yuanbao';

  /**
   * 标准化对话
   * 
   * 将 Yuanbao 原始对话数据转换为统一的 Conversation 格式
   */
  async normalizeConversation(
    rawConversation: RawConversation
  ): Promise<Conversation> {
    console.log('[YuanbaoNormalizer] normalizeConversation called');

    // 防御性检查：处理 null/undefined 输入
    if (!rawConversation || !rawConversation.data) {
      console.warn('[YuanbaoNormalizer] Invalid input, returning empty conversation');
      const now = Date.now();
      return {
        id: this.generateId('yuanbao_'),
        title: 'Yuanbao Chat',
        messages: [],
        createdAt: now,
        updatedAt: now,
        metadata: {
          platform: this.platform,
          participantCount: 0,
          messageCount: 0,
        },
      };
    }

    const data = rawConversation.data as YuanbaoConversationDetail;
    const convs = data?.convs || [];

    // 提取对话 ID
    const conversationId =
      data.conversationId ||
      data.conversation_id ||
      data.convId ||
      data.conversationUuid ||
      data.sessionId ||
      data.chatId ||
      data.id ||
      this.generateId('yuanbao_');

    // 提取标题（sessionTitle 优先级更高，回退到 title）
    const title = data.sessionTitle || data.title || 'Yuanbao Chat';

    // 标准化所有消息
    const messages: Message[] = [];
    for (const turn of convs) {
      // 防御性检查：跳过 null/undefined turn
      if (!turn) {
        console.warn('[YuanbaoNormalizer] Skipping null/undefined turn');
        continue;
      }
      try {
        const message = await this.normalizeTurn(turn, conversationId);
        if (message) {
          messages.push(message);
        }
      } catch (error) {
        console.error(
          '[YuanbaoNormalizer] Failed to normalize turn:',
          (turn as any)?.index ?? 'unknown',
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
   * 将 Yuanbao 的 turn 转换为统一的 Message 格式
   */
  async normalizeMessage(
    rawMessage: RawMessage,
    _conversationId: string
  ): Promise<Message> {
    console.log('[YuanbaoNormalizer] normalizeMessage called');

    const turn = rawMessage.data as YuanbaoTurn;
    // 从 turn 中提取 conversationId（如果需要）
    return this.normalizeTurn(turn, _conversationId);
  }

  /**
   * 批量标准化
   */
  async normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]> {
    console.log(
      `[YuanbaoNormalizer] Normalizing ${rawConversations.length} conversations`
    );

    const results: Conversation[] = [];
    for (const raw of rawConversations) {
      try {
        const normalized = await this.normalizeConversation(raw);
        results.push(normalized);
      } catch (error) {
        console.error('[YuanbaoNormalizer] Failed to normalize conversation:', error);
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
    turn: YuanbaoTurn,
    conversationId: string
  ): Promise<Message> {
    const role = this.mapYuanbaoRole(turn.speaker);
    const timestamp = this.parseTimestamp(turn.createTime || Date.now());
    const blocks = this.extractMessageBlocks(turn);

    // 合并所有文本块
    const textParts: string[] = [];
    for (const block of blocks) {
      if (block.type === 'think') {
        // 思考内容使用引用格式
        const title = block.title ? `[Think] ${block.title}` : '[Think]';
        textParts.push(`> ${title}\n> ${block.text.replace(/\n/g, '\n> ')}`);
      } else {
        textParts.push(block.text);
      }
    }

    const content: MessageContent = {
      text: textParts.join('\n\n').trim() || '_No content_',
      metadata: {
        turnIndex: turn.index,
        blockCount: blocks.length,
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
        originalSpeaker: turn.speaker,
        blockCount: blocks.length,
      },
    };
  }

  /**
   * 映射 Yuanbao 角色到统一角色
   */
  private mapYuanbaoRole(speaker?: string): MessageRole {
    if (!speaker) {
      return 'unknown';
    }

    const role = speaker.toLowerCase();
    if (role === 'ai') {
      return 'assistant';
    }
    if (role === 'user' || role === 'human') {
      return 'user';
    }
    if (role === 'system') {
      return 'system';
    }
    return 'unknown';
  }

  /**
   * 从 turn 中提取消息块
   * 
   * 处理 speechesV2 数组中的多种块类型
   */
  private extractMessageBlocks(turn: YuanbaoTurn): YuanbaoMessageBlock[] {
    const blocks: YuanbaoMessageBlock[] = [];

    const speeches = turn.speechesV2 || [];
    for (const speech of speeches) {
      const contentBlocks = (speech.content as YuanbaoContentBlock[] | undefined) || [];
      for (const block of contentBlocks) {
        const extracted = this.extractBlockContent(block);
        if (extracted) {
          blocks.push(extracted);
        }
      }
    }

    return blocks;
  }

  /**
   * 提取单个内容块
   * 
   * 支持多种块类型：
   * - text: 普通文本
   * - think: 思考过程
   * - 其他：标记为 unsupported
   */
  private extractBlockContent(block: YuanbaoContentBlock): YuanbaoMessageBlock | null {
    const type = block.type?.toLowerCase() || 'unknown';

    if (type === 'text') {
      return {
        type: 'text',
        text: this.adjustHeaderLevels(block.msg || '', 1),
      };
    }

    if (type === 'think') {
      const title = block.title || '';
      const content = Array.isArray(block.content)
        ? block.content.map((b) => this.extractBlockContent(b)?.text).join('\n')
        : String(block.content || '');

      return {
        type: 'think',
        text: content,
        title,
        metadata: {
          originalType: block.type,
        },
      };
    }

    // 其他类型：尝试提取文本或标记为不支持
    if (block.msg) {
      return {
        type: 'unsupported',
        text: `[${type}] ${block.msg}`,
        metadata: {
          originalType: block.type,
          originalBlock: block,
        },
      };
    }

    return null;
  }

  /**
   * 调整 Markdown 标题级别
   * 
   * V1 逻辑：将所有标题级别增加 1 级，避免与对话标题冲突
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
// 辅助函数：V1 yuanbaoToMarkdown 逻辑的现代化重构
// ============================================================================

/**
 * 将 Yuanbao 对话转换为 Markdown
 * 
 * 这是 V1 yuanbaoToMarkdown 函数的重构版本
 * 用于需要直接输出 Markdown 的场景
 */
export function yuanbaoToMarkdown(data: YuanbaoConversationDetail): string {
  const title = data.sessionTitle || data.title || 'Yuanbao Chat';
  const out: string[] = [];

  out.push(`# ${title}`);
  out.push('');
  out.push(`> Exported at: ${new Date().toLocaleString()}`);
  out.push('');

  const convs = Array.isArray(data.convs) ? [...data.convs] : [];
  convs.sort((a, b) => (a?.index || 0) - (b?.index || 0));

  for (const turn of convs) {
    const speaker = String(turn.speaker || '').toLowerCase();
    const role =
      speaker === 'ai'
        ? 'Assistant'
        : speaker === 'user' || speaker === 'human'
        ? 'User'
        : speaker || 'Unknown';
    const idx = turn.index != null ? ` (Turn ${turn.index})` : '';
    const ts = formatTimestamp(turn.createTime);

    out.push(`## ${role}${idx}`);
    if (ts) out.push(`*${ts}*`);
    out.push('');

    const blocks: string[] = [];
    const speeches = Array.isArray(turn.speechesV2) ? turn.speechesV2 : [];

    for (const speech of speeches) {
      const content = Array.isArray(speech.content) ? speech.content : [];
      for (const block of content) {
        if (block?.type === 'text') {
          blocks.push(adjustHeaderLevels(block.msg || '', 1));
        } else if (block?.type === 'think') {
          const t = block.title ? `> [Think] ${block.title}` : '> [Think]';
          const body = String(block.content || '').replace(/\n/g, '\n> ');
          blocks.push(`${t}\n> ${body}`);
        } else if (block?.msg) {
          blocks.push(String(block.msg));
        } else {
          blocks.push('`[Unsupported block]`');
        }
      }
    }

    const body = blocks.join('\n\n').trim();
    out.push(body || '_No content_');
    out.push('');
    out.push('---');
    out.push('');
  }

  return out.join('\n').trim() + '\n';
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
 * 调整 Markdown 标题级别
 */
function adjustHeaderLevels(text: string, increaseBy: number = 1): string {
  if (!text) return '';
  return String(text).replace(/^(#+)(\s*)(.*?)\s*$/gm, (_m, hashes, _space, content) => {
    return '#'.repeat(hashes.length + increaseBy) + ' ' + String(content).trim();
  });
}

// 导出单例实例
export const yuanbaoNormalizer = new YuanbaoNormalizer();
