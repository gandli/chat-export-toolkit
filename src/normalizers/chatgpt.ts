/**
 * ChatGPT Normalizer 实现
 * 
 * 负责将 ChatGPT 平台的原始数据转换为统一的 Conversation schema
 * 
 * 重要说明：
 * - 这是一个最小骨架实现，用于定义边界和接口
 * - 真实的标准化逻辑需要实际的 ChatGPT 样本数据验证
 * - ChatGPT 的数据结构可能频繁变化
 */

import { BaseNormalizer } from './base';
import type {
  ChatGPTConversationDetail,
  ChatGPTMessage,
  ChatGPTMessageBlock,
} from '../adapters/chatgpt-types';
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
 * ChatGPT Normalizer
 * 
 * 主要职责：
 * 1. 将 ChatGPT 的 messages/mapping 转换为统一的 Message 格式
 * 2. 处理多种消息块类型（text, code, image, etc.）
 * 3. 支持多结构兼容
 * 
 * 能力级别目标：
 * - L1: 标准化纯文本消息（基础）
 * - L2: 标准化代码块和简单附件（中等）
 * - L3: 完整支持所有 ChatGPT 消息类型（完整）
 */
export class ChatGPTRNormalizer extends BaseNormalizer {
  readonly platform: PlatformType = 'chatgpt';

  /**
   * 标准化对话
   * 
   * 将 ChatGPT 原始对话数据转换为统一的 Conversation 格式
   * 
   * @param rawConversation 原始对话数据
   */
  async normalizeConversation(
    rawConversation: RawConversation
  ): Promise<Conversation> {
    console.log('[ChatGPTRNormalizer] normalizeConversation called');

    const data = rawConversation.data as ChatGPTConversationDetail;
    
    // 提取消息列表
    const messages: ChatGPTMessage[] = this.extractMessagesFromData(data);

    // 提取对话 ID
    const conversationId =
      data.conversation_id ||
      data.id ||
      this.generateId('chatgpt_');

    // 提取标题
    const title = data.title || data.metadata?.title || 'ChatGPT Chat';

    // 标准化所有消息
    const normalizedMessages: Message[] = [];
    for (const msg of messages) {
      try {
        const message = await this.normalizeMessage(
          { platform: this.platform, data: msg },
          conversationId
        );
        if (message) {
          normalizedMessages.push(message);
        }
      } catch (error) {
        console.error(
          '[ChatGPTRNormalizer] Failed to normalize message:',
          msg.id,
          error
        );
      }
    }

    // 按时间戳排序
    normalizedMessages.sort((a, b) => a.timestamp - b.timestamp);

    // 计算创建和更新时间
    const timestamps = normalizedMessages
      .map((m) => m.timestamp)
      .filter((t) => t > 0);
    const createdAt = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
    const updatedAt = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();

    return {
      id: conversationId,
      title,
      messages: normalizedMessages,
      createdAt,
      updatedAt,
      metadata: {
        platform: this.platform,
        participantCount: this.countParticipants(normalizedMessages),
        messageCount: normalizedMessages.length,
        originalData: data,
        model: data.metadata?.model,
      },
    };
  }

  /**
   * 标准化单个消息
   * 
   * 将 ChatGPT 的 message 转换为统一的 Message 格式
   * 
   * @param rawMessage 原始消息数据
   * @param conversationId 所属对话 ID
   */
  async normalizeMessage(
    rawMessage: RawMessage,
    conversationId: string
  ): Promise<Message> {
    console.log('[ChatGPTRNormalizer] normalizeMessage called');

    const msg = rawMessage.data as ChatGPTMessage;
    return this.normalizeChatGPTMessage(msg, conversationId);
  }

  /**
   * 批量标准化
   */
  async normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]> {
    console.log(
      `[ChatGPTRNormalizer] Normalizing ${rawConversations.length} conversations`
    );

    const results: Conversation[] = [];
    for (const raw of rawConversations) {
      try {
        const normalized = await this.normalizeConversation(raw);
        results.push(normalized);
      } catch (error) {
        console.error('[ChatGPTRNormalizer] Failed to normalize conversation:', error);
      }
    }
    return results;
  }

  // ============================================================================
  // 内部方法：标准化逻辑
  // ============================================================================

  /**
   * 标准化一个 ChatGPT 消息
   */
  private async normalizeChatGPTMessage(
    msg: ChatGPTMessage,
    conversationId: string
  ): Promise<Message> {
    const role = this.mapChatGPTRole(msg.role);
    const timestamp = this.parseTimestamp(
      msg.timestamp || msg.createTime || Date.now()
    );
    const blocks = this.extractMessageBlocks(msg);

    // 合并所有内容块
    const textParts: string[] = [];
    for (const block of blocks) {
      if (block.type === 'code') {
        // 代码块使用代码块格式
        const lang = block.metadata?.language || '';
        textParts.push(`\`\`\`${lang}\n${block.text}\n\`\`\``);
      } else if (block.type === 'image') {
        // 图片使用占位符
        textParts.push(`![Image](${block.text || 'image'})`);
      } else if (block.type === 'file') {
        // 文件使用链接格式
        textParts.push(`[File: ${block.title || 'attachment'}]`);
      } else {
        // 普通文本
        textParts.push(block.text);
      }
    }

    const content: MessageContent = {
      text: textParts.join('\n\n').trim() || '_No content_',
      metadata: {
        blockCount: blocks.length,
        originalRole: msg.role,
      },
    };

    return {
      id: this.generateMessageId(conversationId, msg.id),
      role,
      content,
      timestamp,
      metadata: {
        platform: this.platform,
        originalId: msg.id,
        originalAuthor: msg.author?.role,
        originalMetadata: msg.metadata,
      },
    };
  }

  /**
   * 映射 ChatGPT 角色到统一角色
   */
  private mapChatGPTRole(role?: string): MessageRole {
    if (!role) {
      return 'unknown';
    }

    const normalizedRole = role.toLowerCase();
    
    if (normalizedRole === 'assistant' || normalizedRole === 'ai') {
      return 'assistant';
    }
    if (normalizedRole === 'user' || normalizedRole === 'human') {
      return 'user';
    }
    if (normalizedRole === 'system') {
      return 'system';
    }
    if (normalizedRole === 'tool' || normalizedRole === 'function') {
      return 'tool';
    }
    
    return 'unknown';
  }

  /**
   * 从消息中提取内容块
   * 
   * 处理 content 可能是字符串或对象数组的情况
   */
  private extractMessageBlocks(msg: ChatGPTMessage): ChatGPTMessageBlock[] {
    const blocks: ChatGPTMessageBlock[] = [];

    const content = msg.content;

    if (typeof content === 'string') {
      // 简单字符串内容
      blocks.push({
        type: 'text',
        text: content,
      });
    } else if (Array.isArray(content)) {
      // 内容块数组
      for (const part of content) {
        const block = this.extractBlockContent(part);
        if (block) {
          blocks.push(block);
        }
      }
    } else if (typeof content === 'object' && content !== null) {
      // 单个内容对象
      const block = this.extractBlockContent(content);
      if (block) {
        blocks.push(block);
      }
    }

    return blocks;
  }

  /**
   * 提取单个内容块
   * 
   * 支持多种块类型：
   * - text: 普通文本
   * - code: 代码块
   * - image: 图片
   * - file: 文件附件
   * - unsupported: 不支持的类型
   */
  private extractBlockContent(part: any): ChatGPTMessageBlock | null {
    const type = (part.type || 'text').toLowerCase();

    // 文本块
    if (type === 'text' || !part.type) {
      const text = part.text || part.content || String(part);
      return {
        type: 'text',
        text: this.adjustHeaderLevels(text, 1),
      };
    }

    // 代码块
    if (type === 'code') {
      return {
        type: 'code',
        text: part.text || part.content || part.code || '',
        metadata: {
          language: part.language || part.lang || '',
        },
      };
    }

    // 图片块
    if (type === 'image') {
      return {
        type: 'image',
        text: part.url || part.src || part.data || '',
        metadata: {
          alt: part.alt || part.title || '',
        },
      };
    }

    // 文件块
    if (type === 'file' || type === 'attachment') {
      return {
        type: 'file',
        text: part.url || part.path || '',
        title: part.name || part.filename || part.title || 'Attachment',
        metadata: {
          mimeType: part.mimeType || part.type || '',
          size: part.size,
        },
      };
    }

    // 其他类型：尝试提取文本或标记为不支持
    const text = part.text || part.content || part.msg || String(part);
    if (text) {
      return {
        type: 'unsupported',
        text: `[${type}] ${text}`,
        metadata: {
          originalType: part.type,
          originalPart: part,
        },
      };
    }

    return null;
  }

  /**
   * 从原始数据中提取消息列表
   * 
   * 支持多种数据结构：
   * - messages 数组
   * - mapping 对象
   */
  private extractMessagesFromData(data: ChatGPTConversationDetail): ChatGPTMessage[] {
    // 优先从 messages 数组提取
    if (Array.isArray(data.messages)) {
      return data.messages;
    }

    // 从 mapping 结构提取
    if (data.mapping) {
      return this.extractMessagesFromMapping(data.mapping);
    }

    // 从嵌套结构中提取
    if (data.data?.messages) {
      return data.data.messages;
    }
    if (data.result?.messages) {
      return data.result.messages;
    }

    return [];
  }

  /**
   * 从 mapping 结构中提取消息
   */
  private extractMessagesFromMapping(
    mapping: Record<string, any>
  ): ChatGPTMessage[] {
    const messages: ChatGPTMessage[] = [];
    const visited = new Set<string>();

    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);

      const node = mapping[nodeId];
      if (!node) {
        return;
      }

      if (node.message) {
        messages.push(node.message as ChatGPTMessage);
      }

      const children = Array.isArray(node.children) ? node.children : [];
      for (const childId of children) {
        if (typeof childId === 'string') {
          visit(childId);
        }
      }
    };

    for (const [nodeId, node] of Object.entries(mapping)) {
      if (!node?.parent || !mapping[node.parent]) {
        visit(nodeId);
      }
    }

    for (const nodeId of Object.keys(mapping)) {
      visit(nodeId);
    }

    return messages.sort((a, b) => {
      const left = this.parseTimestamp(a.timestamp || a.createTime || 0);
      const right = this.parseTimestamp(b.timestamp || b.createTime || 0);
      return left - right;
    });
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
    messageId?: string
  ): string {
    const id = messageId || Date.now().toString();
    return `${conversationId}_msg_${id}`;
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
// 辅助函数：直接输出 Markdown
// ============================================================================

/**
 * 将 ChatGPT 对话转换为 Markdown
 * 
 * 用于需要直接输出 Markdown 的场景
 * 
 * TODO: 需要根据实际数据结构调整
 */
export function chatgptToMarkdown(data: ChatGPTConversationDetail): string {
  const title = data.title || data.metadata?.title || 'ChatGPT Chat';
  const out: string[] = [];

  out.push(`# ${title}`);
  out.push('');
  out.push(`> Exported at: ${new Date().toLocaleString()}`);
  if (data.metadata?.model) {
    out.push(`> Model: ${data.metadata.model}`);
  }
  out.push('');

  const messages = Array.isArray(data.messages) ? [...data.messages] : [];

  for (const msg of messages) {
    const role = mapRole(msg.role);
    const id = msg.id ? ` (ID: ${msg.id})` : '';
    const ts = formatTimestamp(msg.timestamp || msg.createTime);

    out.push(`## ${role}${id}`);
    if (ts) out.push(`*${ts}*`);
    out.push('');

    const content = msg.content;
    if (typeof content === 'string') {
      out.push(content);
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'text' || !part.type) {
          out.push(part.text || part.content || '');
        } else if (part.type === 'code') {
          const lang = part.language || '';
          out.push(`\`\`\`${lang}\n${part.text || part.content || ''}\n\`\`\``);
        } else {
          out.push(`[${part.type}] ${part.text || part.content || ''}`);
        }
      }
    } else {
      out.push('_Unsupported content format_');
    }

    out.push('');
    out.push('---');
    out.push('');
  }

  return out.join('\n').trim() + '\n';
}

/**
 * 映射角色
 */
function mapRole(role?: string): string {
  if (!role) return 'Unknown';
  const r = role.toLowerCase();
  if (r === 'assistant' || r === 'ai') return 'Assistant';
  if (r === 'user' || r === 'human') return 'User';
  if (r === 'system') return 'System';
  return role;
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

// 导出单例实例
export const chatgptNormalizer = new ChatGPTRNormalizer();
