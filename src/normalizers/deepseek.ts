/**
 * DeepSeek Normalizer 实现
 * 
 * 负责将 DeepSeek 平台的原始数据转换为统一的 Conversation schema
 * 
 * ⚠️ 重要说明：
 * - 这是一个骨架实现，待真实数据样本补充
 * - 当前基于常见 AI 对话平台的消息结构进行推测
 * 
 * @see https://chat.deepseek.com/
 */

import { BaseNormalizer } from './base';
import type {
  DeepSeekConversationDetail,
  DeepSeekMessage,
} from '../adapters/deepseek-types';
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
 * DeepSeek Normalizer
 * 
 * 主要职责：
 * 1. 将 DeepSeek 的原始对话数据转换为统一的 Conversation 格式
 * 2. 处理多种消息块类型（text, code, image, file, reasoning 等）
 * 3. 支持多结构兼容
 */
export class DeepSeekNormalizer extends BaseNormalizer {
  readonly platform: PlatformType = 'deepseek';

  /**
   * 标准化对话
   * 
   * 将 DeepSeek 原始对话数据转换为统一的 Conversation 格式
   */
  async normalizeConversation(
    rawConversation: RawConversation
  ): Promise<Conversation> {
    console.log('[DeepSeekNormalizer] normalizeConversation called');

    // 防御性检查：处理 null/undefined 输入
    if (!rawConversation || !rawConversation.data) {
      console.warn('[DeepSeekNormalizer] Invalid input, returning empty conversation');
      return {
        id: this.generateId('deepseek_'),
        title: 'DeepSeek Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          platform: this.platform,
          participantCount: 0,
          messageCount: 0,
        },
      };
    }

    const data = rawConversation.data as DeepSeekConversationDetail;
    
    // 提取对话消息（尝试多种可能的字段）
    const messages = (
      data.messages ||
      data.chats ||
      data.turns ||
      []
    ) as DeepSeekMessage[];

    // 提取对话 ID
    const conversationId: string =
      data.conversation_id ||
      (data as Record<string, string>).conversationId ||
      data.chat_id ||
      (data as Record<string, string>).chatId ||
      data.session_id ||
      (data as Record<string, string>).sessionId ||
      data.id ||
      this.generateId('deepseek_');

    // 提取标题
    const title: string = data.title || data.metadata?.title || 'DeepSeek Chat';

    // 标准化所有消息
    const normalizedMessages: Message[] = [];
    for (const msg of messages) {
      try {
        const message = await this.normalizeMessageItem(msg, conversationId);
        if (message) {
          normalizedMessages.push(message);
        }
      } catch (error) {
        console.error(
          '[DeepSeekNormalizer] Failed to normalize message:',
          String(msg.id ?? 'unknown'),
          error
        );
      }
    }

    // 按时间戳排序
    normalizedMessages.sort((a, b) => a.timestamp - b.timestamp);

    // 计算创建和更新时间
    const timestamps = normalizedMessages.map((m) => m.timestamp).filter((t) => t > 0);
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
        model: (data.model as string | undefined) || (data.metadata?.model as string | undefined) || '',
      },
    };
  }

  /**
   * 标准化单个消息
   * 
   * 将 DeepSeek 的 message 转换为统一的 Message 格式
   */
  async normalizeMessage(
    rawMessage: RawMessage,
    _conversationId: string
  ): Promise<Message> {
    console.log('[DeepSeekNormalizer] normalizeMessage called');

    const msg = rawMessage.data as DeepSeekMessage;
    return this.normalizeMessageItem(msg, _conversationId);
  }

  /**
   * 批量标准化
   */
  async normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]> {
    console.log(
      `[DeepSeekNormalizer] Normalizing ${rawConversations.length} conversations`
    );

    const results: Conversation[] = [];
    for (const raw of rawConversations) {
      try {
        const normalized = await this.normalizeConversation(raw);
        results.push(normalized);
      } catch (error) {
        console.error('[DeepSeekNormalizer] Failed to normalize conversation:', error);
      }
    }
    return results;
  }

  // ============================================================================
  // 内部方法：标准化逻辑
  // ============================================================================

  /**
   * 标准化单个消息项
   */
  private async normalizeMessageItem(
    msg: DeepSeekMessage,
    conversationId: string
  ): Promise<Message> {
    const role = this.mapDeepSeekRole(msg.role);
    const timestamp = this.parseTimestamp(msg.created_at || msg.timestamp || Date.now());
    
    // 提取并格式化内容
    const contentResult = this.extractAndFormatContent(msg);

    const content: MessageContent = {
      text: contentResult.text || '_No content_',
      attachments: contentResult.attachments,
      metadata: {
        blockTypes: contentResult.blockTypes,
        hasReasoning: !!msg.reasoning_content,
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
        originalRole: msg.role,
        model: msg.metadata?.model,
        hasReasoning: !!msg.reasoning_content,
      },
    };
  }

  /**
   * 映射 DeepSeek 角色到统一角色
   */
  private mapDeepSeekRole(role?: string): MessageRole {
    if (!role) {
      return 'unknown';
    }

    const r = role.toLowerCase();
    
    // AI 角色
    if (r === 'assistant' || r === 'ai' || r === 'bot' || r === 'model') {
      return 'assistant';
    }
    
    // 用户角色
    if (r === 'user' || r === 'human') {
      return 'user';
    }
    
    // 系统角色
    if (r === 'system') {
      return 'system';
    }
    
    // 工具角色
    if (r === 'tool' || r === 'function') {
      return 'tool';
    }
    
    return 'unknown';
  }

  /**
   * 提取并格式化消息内容
   * 
   * 处理多种可能的内容格式：
   * - 纯文本
   * - 内容块数组
   * - 复杂对象
   */
  private extractAndFormatContent(msg: DeepSeekMessage): {
    text: string;
    attachments?: Attachment[];
    blockTypes: string[];
  } {
    const contentParts: string[] = [];
    const attachments: Attachment[] = [];
    const blockTypes: string[] = [];

    // 处理推理内容（如果有）
    if (msg.reasoning_content) {
      contentParts.push(`> [Reasoning]\n> ${String(msg.reasoning_content).replace(/\n/g, '\n> ')}`);
      blockTypes.push('reasoning');
    }

    // 处理主要内容
    const content = msg.content;
    
    if (typeof content === 'string') {
      // 纯文本内容
      contentParts.push(this.adjustHeaderLevels(content, 1));
      blockTypes.push('text');
    } else if (Array.isArray(content)) {
      // 内容块数组
      for (const part of content) {
        const result = this.processContentPart(part);
        if (result.text) {
          contentParts.push(result.text);
        }
        if (result.type) {
          blockTypes.push(result.type);
        }
        if (result.attachment) {
          attachments.push(result.attachment);
        }
      }
    } else if (typeof content === 'object' && content !== null) {
      // 复杂对象，尝试提取文本
      const obj = content as Record<string, unknown>;
      const text = obj.text || obj.content || obj.body || '';
      if (text) {
        contentParts.push(this.adjustHeaderLevels(String(text), 1));
        blockTypes.push('text');
      }
    }

    // 处理附件（如果有）
    if (msg.attachments && Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        const attachment = this.normalizeAttachment(att as Record<string, unknown>);
        if (attachment) {
          attachments.push(attachment);
        }
      }
    }

    return {
      text: contentParts.join('\n\n').trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      blockTypes,
    };
  }

  /**
   * 处理单个内容块
   */
  private processContentPart(part: Record<string, unknown>): {
    text?: string;
    type?: string;
    attachment?: Attachment;
  } {
    const type = (part.type as string)?.toLowerCase() || 'text';

    // 文本块
    if (type === 'text' || !part.type) {
      const text = (part.text || part.content || '') as string;
      return {
        text: this.adjustHeaderLevels(text, 1),
        type: 'text',
      };
    }

    // 代码块
    if (type === 'code') {
      const code = (part.text || part.content || '') as string;
      const language = (part.language as string) || 'plaintext';
      return {
        text: `\`\`\`${language}\n${code}\n\`\`\``,
        type: 'code',
      };
    }

    // 图片块
    if (type === 'image') {
      const url = part.url || part.data;
      const alt = (part.alt || part.title || 'Image') as string;
      if (url) {
        return {
          text: `![${alt}](${url})`,
          type: 'image',
          attachment: {
            id: this.generateId('img_'),
            type: 'image',
            url: String(url),
            name: alt,
          },
        };
      }
    }

    // 文件块
    if (type === 'file') {
      const url = part.url || part.data;
      const name = (part.name || part.title || 'File') as string;
      if (url) {
        return {
          text: `[📎 ${name}](${url})`,
          type: 'file',
          attachment: {
            id: this.generateId('file_'),
            type: 'file',
            url: String(url),
            name,
            mimeType: (part.mime_type || part.type) as string,
          },
        };
      }
    }

    // 链接块
    if (type === 'link') {
      const url = part.url || (part.href as string);
      const title = (part.title || part.text || url) as string;
      if (url) {
        return {
          text: `[${title}](${url})`,
          type: 'link',
        };
      }
    }

    // 引用/来源块
    if (type === 'citation' || type === 'source') {
      const title = (part.title || part.name || 'Source') as string;
      const url = part.url || (part.href as string);
      const snippet = (part.snippet || part.description || '') as string;
      const text = url ? `[${title}](${url})` : title;
      return {
        text: snippet ? `${text}\n> ${snippet}` : text,
        type: 'citation',
      };
    }

    // 其他类型：尝试提取文本或标记为不支持
    const textContent = (part.text || part.content || part.data || '') as string;
    if (textContent) {
      return {
        text: `[${type}] ${textContent}`,
        type: 'unsupported',
      };
    }

    return {};
  }

  /**
   * 标准化附件
   */
  private normalizeAttachment(att: Record<string, unknown>): Attachment | null {
    const id = (att.id || (att.file_id as string)) as string;
    const url = att.url || (att.download_url as string);
    const name = (att.name || (att.filename as string) || 'Attachment') as string;
    const mimeType = (att.type || (att.mime_type as string) || (att.mimeType as string)) as string;
    const size = att.size as number;

    if (!url) {
      return null;
    }

    // 根据 MIME 类型推断附件类型
    let type: Attachment['type'] = 'file';
    if (typeof mimeType === 'string') {
      if (mimeType.startsWith('image/')) type = 'image';
      else if (mimeType.startsWith('video/')) type = 'video';
      else if (mimeType.startsWith('audio/')) type = 'audio';
    }

    return {
      id: id || this.generateId('att_'),
      type,
      url: String(url),
      name,
      mimeType: mimeType as string,
      size,
      metadata: att,
    };
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
    if (messageId) {
      return `${conversationId}_msg_${messageId}`;
    }
    return `${conversationId}_msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
 * 将 DeepSeek 对话转换为 Markdown
 * 
 * 用于需要直接输出 Markdown 的场景
 */
export function deepseekToMarkdown(data: DeepSeekConversationDetail): string {
  const title = data.title || data.metadata?.title || data.model || 'DeepSeek Chat';
  const out: string[] = [];

  out.push(`# ${title}`);
  out.push('');
  out.push(`> Exported at: ${new Date().toLocaleString()}`);
  if (data.model) {
    out.push(`> Model: ${data.model}`);
  }
  out.push('');

  // 提取消息
  const messages =
    data.messages ||
    data.chats ||
    data.turns ||
    [];

  // 排序
  const sortedMessages = [...messages].sort((a, b) => {
    const timeA = parseTimestamp(a.created_at || a.timestamp);
    const timeB = parseTimestamp(b.created_at || b.timestamp);
    return timeA - timeB;
  });

  for (const msg of sortedMessages) {
    const role = mapRole(msg.role);
    const ts = formatTimestamp(msg.created_at || msg.timestamp);

    const roleLabel = role === 'assistant' ? 'Assistant' : role === 'user' ? 'User' : msg.role || 'Unknown';
    out.push(`## ${roleLabel}`);
    if (ts) out.push(`*${ts}*`);
    out.push('');

    // 推理内容（如果有）
    if (msg.reasoning_content) {
      out.push('> [Reasoning]');
      out.push(`> ${String(msg.reasoning_content).replace(/\n/g, '\n> ')}`);
      out.push('');
    }

    // 主要内容
    const content = formatMessageContent(msg);
    out.push(content || '_No content_');
    out.push('');

    // 附件
    if (msg.attachments && msg.attachments.length > 0) {
      out.push('**Attachments:**');
      for (const att of msg.attachments) {
        const name = att.name || att.filename || 'File';
        const url = att.url || att.download_url;
        if (url) {
          out.push(`- [📎 ${name}](${url})`);
        }
      }
      out.push('');
    }

    out.push('---');
    out.push('');
  }

  return out.join('\n').trim() + '\n';
}

/**
 * 格式化消息内容
 */
function formatMessageContent(msg: DeepSeekMessage): string {
  const content = msg.content;
  const parts: string[] = [];

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      parts.push(formatContentPart(part));
    }
    return parts.join('\n\n');
  }

  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    return String(obj.text || obj.content || obj.body || '');
  }

  return String(content || '');
}

/**
 * 格式化内容块
 */
function formatContentPart(part: Record<string, unknown>): string {
  const type = (part.type as string)?.toLowerCase() || 'text';

  if (type === 'text' || !part.type) {
    return String(part.text || part.content || '');
  }

  if (type === 'code') {
    const code = String(part.text || part.content || '');
    const lang = (part.language as string) || 'plaintext';
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  }

  if (type === 'image') {
    const url = part.url || part.data;
    const alt = (part.alt || part.title || 'Image') as string;
    return url ? `![${alt}](${url})` : `![${alt}]()`;
  }

  if (type === 'file') {
    const url = part.url || part.data;
    const name = (part.name || part.title || 'File') as string;
    return url ? `[📎 ${name}](${url})` : `📎 ${name}`;
  }

  if (type === 'link') {
    const url = part.url || (part.href as string);
    const title = (part.title || part.text || url) as string;
    return url ? `[${title}](${url})` : String(title);
  }

  // 其他类型
  return `[${type}] ${String(part.text || part.content || part.title || '')}`;
}

/**
 * 映射角色
 */
function mapRole(role?: string): string {
  if (!role) return 'unknown';
  const r = role.toLowerCase();
  if (r === 'assistant' || r === 'ai' || r === 'bot') return 'assistant';
  if (r === 'user' || r === 'human') return 'user';
  if (r === 'system') return 'system';
  return r;
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
function parseTimestamp(timestamp: number | string | undefined): number {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') {
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
  }
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// 导出单例实例
export const deepseekNormalizer = new DeepSeekNormalizer();
