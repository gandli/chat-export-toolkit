/**
 * Kimi Normalizer 实现
 * 
 * 负责将 Kimi 平台的原始数据转换为统一的 Conversation schema
 * 
 * ⚠️ 重要说明：
 * - 这是一个最小骨架实现，用于定义边界和接口
 * - 真实的标准化逻辑需要实际的 Kimi 样本数据验证
 * - Kimi 的数据结构可能频繁变化
 * 
 * @see https://kimi.moonshot.cn/
 */

import { BaseNormalizer } from './base';
import type {
  KimiConversationDetail,
  KimiMessage,
  KimiMessageBlock,
} from '../adapters/kimi-types';
import type {
  PlatformType,
  RawConversation,
  RawMessage,
  Conversation,
  Message,
  MessageRole,
  MessageContent,
  Attachment,
} from '../types';

/**
 * Kimi Normalizer
 * 
 * 主要职责：
 * 1. 将 Kimi 的 messages/chats/turns 转换为统一的 Message 格式
 * 2. 处理多种消息块类型（text, code, image, file, search, etc.）
 * 3. 支持多结构兼容
 * 
 * 能力级别目标：
 * - L1: 标准化纯文本消息（基础）
 * - L2: 标准化代码块和简单附件（中等）
 * - L3: 完整支持所有 Kimi 消息类型（包括搜索引用、文件等）
 * 
 * 当前实现状态：L1 骨架（需要真实样本验证）
 */
export class KimiNormalizer extends BaseNormalizer {
  readonly platform: PlatformType = 'kimi';

  /**
   * 标准化对话
   * 
   * 将 Kimi 原始对话数据转换为统一的 Conversation 格式
   * 
   * @param rawConversation 原始对话数据
   * @returns 标准化后的对话
   */
  async normalizeConversation(
    rawConversation: RawConversation
  ): Promise<Conversation> {
    console.log('[KimiNormalizer] normalizeConversation called');

    const data = rawConversation.data as KimiConversationDetail;
    
    // 提取消息列表
    const messages: KimiMessage[] = this.extractMessagesFromData(data);

    // 提取对话 ID
    const conversationId =
      data.conversation_id ||
      data.chat_id ||
      data.session_id ||
      data.id ||
      this.generateId('kimi_');

    // 提取标题
    const title = data.title || data.metadata?.title || 'Kimi Chat';

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
          '[KimiNormalizer] Failed to normalize message:',
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
        // Kimi 特有元数据
        searchEnabled: data.search_enabled,
        files: data.files,
      },
    };
  }

  /**
   * 标准化单个消息
   * 
   * 将 Kimi 的 message 转换为统一的 Message 格式
   * 
   * @param rawMessage 原始消息数据
   * @param conversationId 所属对话 ID
   * @returns 标准化后的消息
   */
  async normalizeMessage(
    rawMessage: RawMessage,
    conversationId: string
  ): Promise<Message> {
    console.log('[KimiNormalizer] normalizeMessage called');

    const msg = rawMessage.data as KimiMessage;
    return this.normalizeKimiMessage(msg, conversationId);
  }

  /**
   * 批量标准化
   * 
   * @param rawConversations 原始对话列表
   * @returns 标准化后的对话列表
   */
  async normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]> {
    console.log(
      `[KimiNormalizer] Normalizing ${rawConversations.length} conversations`
    );

    const results: Conversation[] = [];
    for (const raw of rawConversations) {
      try {
        const normalized = await this.normalizeConversation(raw);
        results.push(normalized);
      } catch (error) {
        console.error('[KimiNormalizer] Failed to normalize conversation:', error);
      }
    }
    return results;
  }

  // ============================================================================
  // 内部方法：标准化逻辑
  // ============================================================================

  /**
   * 标准化一个 Kimi 消息
   * 
   * @param msg Kimi 原始消息
   * @param conversationId 所属对话 ID
   * @returns 标准化后的消息
   */
  private async normalizeKimiMessage(
    msg: KimiMessage,
    conversationId: string
  ): Promise<Message> {
    const role = this.mapKimiRole(msg.role);
    const timestamp = this.parseTimestamp(
      msg.timestamp || msg.create_time || Date.now()
    );
    const blocks = this.extractMessageBlocks(msg);

    // 合并所有内容块
    const textParts: string[] = [];
    const attachments: Attachment[] = [];

    for (const block of blocks) {
      if (block.type === 'code') {
        // 代码块使用代码块格式
        const lang = block.metadata?.language || '';
        textParts.push(`\`\`\`${lang}\n${block.text}\n\`\`\``);
      } else if (block.type === 'image') {
        // 图片添加为附件
        const attachment: Attachment = {
          id: this.generateId('img_'),
          type: 'image',
          url: block.text,
          name: typeof block.metadata?.alt === 'string' ? block.metadata.alt : 'image',
        };
        attachments.push(attachment);
        textParts.push(`![Image](${block.text || 'image'})`);
      } else if (block.type === 'file') {
        // 文件添加为附件
        const attachment: Attachment = {
          id: this.generateId('file_'),
          type: 'file',
          url: block.text,
          name: block.title || 'attachment',
          mimeType: block.metadata?.mimeType as string | undefined,
          size: typeof block.metadata?.size === 'number' ? block.metadata.size : undefined,
        };
        attachments.push(attachment);
        textParts.push(`[File: ${block.title || 'attachment'}]`);
      } else if (block.type === 'link') {
        // 链接使用 Markdown 格式
        textParts.push(`[Link](${block.text})`);
      } else if (block.type === 'search') {
        // 搜索结果使用引用格式
        textParts.push(`> 🔍 Search: ${block.text}`);
      } else if (block.type === 'unsupported') {
        // 不支持的类型保留原始信息
        textParts.push(`[${block.metadata?.originalType || 'unknown'}] ${block.text}`);
      } else {
        // 普通文本
        textParts.push(block.text);
      }
    }

    const content: MessageContent = {
      text: textParts.join('\n\n').trim() || '_No content_',
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        blockCount: blocks.length,
        originalRole: msg.role,
        // Kimi 特有元数据
        searchInfo: msg.search_info,
        fileInfo: msg.file_info,
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
   * 映射 Kimi 角色到统一角色
   * 
   * @param role Kimi 原始角色
   * @returns 统一的角色类型
   */
  private mapKimiRole(role?: string): MessageRole {
    if (!role) {
      return 'unknown';
    }

    const normalizedRole = role.toLowerCase();
    
    if (normalizedRole === 'assistant' || normalizedRole === 'ai' || normalizedRole === 'bot') {
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
   * 
   * @param msg Kimi 消息
   * @returns 内容块列表
   */
  private extractMessageBlocks(msg: KimiMessage): KimiMessageBlock[] {
    const blocks: KimiMessageBlock[] = [];

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
   * - link: 链接
   * - search: 搜索结果引用
   * - unsupported: 不支持的类型
   * 
   * @param part 内容部分
   * @returns 提取的内容块
   */
  private extractBlockContent(part: any): KimiMessageBlock | null {
    const type = (part.type || 'text').toLowerCase();

    // 文本块
    if (type === 'text' || !part.type) {
      return {
        type: 'text',
        text: this.adjustHeaderLevels(part.text || part.content || String(part), 1),
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

    // 链接块
    if (type === 'link' || type === 'url') {
      return {
        type: 'link',
        text: part.url || part.href || part.link || '',
        title: part.title || part.name || '',
        metadata: {
          description: part.description || part.snippet || '',
        },
      };
    }

    // 搜索结果块（Kimi 特有）
    if (type === 'search' || type === 'search_result') {
      return {
        type: 'search',
        text: part.title || part.url || part.snippet || 'Search Result',
        metadata: {
          source: part.source || part.domain || '',
          url: part.url || part.link || '',
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
   * - chats 数组（Kimi 可能使用）
   * - turns 数组
   * - mapping 对象
   * 
   * @param data Kimi 原始对话数据
   * @returns 消息列表
   */
  private extractMessagesFromData(data: KimiConversationDetail): KimiMessage[] {
    // 优先从 messages 数组提取
    if (Array.isArray(data.messages)) {
      return data.messages;
    }

    // 从 chats 数组提取（Kimi 可能使用这个字段）
    if (Array.isArray(data.chats)) {
      return data.chats;
    }

    // 从 turns 数组提取
    if (Array.isArray(data.turns)) {
      return data.turns;
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
    if (data.response?.messages) {
      return data.response.messages;
    }

    return [];
  }

  /**
   * 从 mapping 结构中提取消息
   * 
   * @param mapping Kimi mapping 对象
   * @returns 消息列表
   */
  private extractMessagesFromMapping(
    mapping: Record<string, any>
  ): KimiMessage[] {
    const messages: KimiMessage[] = [];

    for (const key of Object.keys(mapping)) {
      const node = mapping[key];
      if (node?.message) {
        messages.push(node.message as KimiMessage);
      }
    }

    // TODO: 如果需要保持顺序，需要根据 parent/children 关系重建顺序
    return messages;
  }

  /**
   * 调整 Markdown 标题级别
   * 
   * 将所有标题级别增加 1 级，避免与对话标题冲突
   * 
   * @param text 原始文本
   * @param increaseBy 增加的级别数
   * @returns 调整后的文本
   */
  private adjustHeaderLevels(text: string, increaseBy: number = 1): string {
    if (!text) return '';
    return String(text).replace(/^(#+)(\s*)(.*?)\s*$/gm, (_m, hashes, _space, content) => {
      return '#'.repeat(hashes.length + increaseBy) + ' ' + String(content).trim();
    });
  }

  /**
   * 生成消息 ID
   * 
   * @param conversationId 对话 ID
   * @param messageId 原始消息 ID
   * @returns 生成的唯一 ID
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
   * 
   * @param messages 消息列表
   * @returns 参与者数量
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
 * 将 Kimi 对话转换为 Markdown
 * 
 * 用于需要直接输出 Markdown 的场景
 * 
 * TODO: 需要根据实际数据结构调整
 * 
 * @param data Kimi 原始对话数据
 * @returns Markdown 格式的对话
 */
export function kimiToMarkdown(data: KimiConversationDetail): string {
  const title = data.title || data.metadata?.title || 'Kimi Chat';
  const out: string[] = [];

  out.push(`# ${title}`);
  out.push('');
  out.push(`> Exported at: ${new Date().toLocaleString()}`);
  if (data.metadata?.model) {
    out.push(`> Model: ${data.metadata.model}`);
  }
  if (data.search_enabled) {
    out.push(`> Search Enabled: Yes`);
  }
  out.push('');

  const messages = extractMessages(data);

  for (const msg of messages) {
    const role = mapRole(msg.role);
    const id = msg.id ? ` (ID: ${msg.id})` : '';
    const ts = formatTimestamp(msg.timestamp || msg.create_time);

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
        } else if (part.type === 'image') {
          out.push(`![Image](${part.url || part.src || ''})`);
        } else if (part.type === 'file') {
          out.push(`[File: ${part.name || part.filename || 'attachment'}](${part.url || part.path || ''})`);
        } else if (part.type === 'search') {
          out.push(`> 🔍 ${part.title || part.url || 'Search Result'}`);
          if (part.snippet) out.push(`> ${part.snippet}`);
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
 * 从数据中提取消息列表
 */
function extractMessages(data: KimiConversationDetail): KimiMessage[] {
  if (Array.isArray(data.messages)) return data.messages;
  if (Array.isArray(data.chats)) return data.chats;
  if (Array.isArray(data.turns)) return data.turns;
  if (data.mapping) {
    const msgs: KimiMessage[] = [];
    for (const key of Object.keys(data.mapping)) {
      const node = data.mapping[key];
      if (node?.message) msgs.push(node.message);
    }
    return msgs;
  }
  return [];
}

/**
 * 映射角色
 */
function mapRole(role?: string): string {
  if (!role) return 'Unknown';
  const r = role.toLowerCase();
  if (r === 'assistant' || r === 'ai' || r === 'bot') return 'Assistant';
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
export const kimiNormalizer = new KimiNormalizer();
