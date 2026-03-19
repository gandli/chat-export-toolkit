/**
 * Claude (Anthropic) Normalizer 实现
 * 
 * 负责将 Claude 平台的原始数据转换为统一的 Conversation schema
 * 
 * ⚠️ 重要说明：
 * - 这是一个最小骨架实现，用于定义边界和接口
 * - 真实的标准化逻辑需要实际的 Claude 样本数据验证
 * - Claude 的数据结构可能频繁变化
 * 
 * @see https://claude.ai/
 */

import { BaseNormalizer } from './base';
import type {
  ClaudeConversationDetail,
  ClaudeMessage,
  ClaudeMessageBlock,
} from '../adapters/claude-types';
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
 * Claude Normalizer
 * 
 * 主要职责：
 * 1. 将 Claude 的 messages/turns 转换为统一的 Message 格式
 * 2. 处理多种消息块类型（text, code, image, file, tool_use, tool_result）
 * 3. 支持多结构兼容
 * 
 * 能力级别目标：
 * - L1: 标准化纯文本消息（基础）
 * - L2: 标准化代码块和简单附件（中等）
 * - L3: 完整支持所有 Claude 消息类型（完整）
 */
export class ClaudeNormalizer extends BaseNormalizer {
  readonly platform: PlatformType = 'claude';

  /**
   * 标准化对话
   * 
   * 将 Claude 原始对话数据转换为统一的 Conversation 格式
   * 
   * @param rawConversation 原始对话数据
   */
  async normalizeConversation(
    rawConversation: RawConversation
  ): Promise<Conversation> {
    console.log('[ClaudeNormalizer] normalizeConversation called');

    const data = rawConversation.data as ClaudeConversationDetail;
    
    // 提取消息列表
    const messages: ClaudeMessage[] = this.extractMessagesFromData(data);

    // 提取对话 ID
    const conversationId =
      data.uuid ||
      data.id ||
      data.conversation_id ||
      data.chat_id ||
      this.generateId('claude_');

    // 提取标题
    const title = data.title || data.metadata?.title || 'Claude Chat';

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
          '[ClaudeNormalizer] Failed to normalize message:',
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
        projectUuid: data.project_uuid || data.metadata?.project_uuid,
        organizationUuid: data.organization_uuid || data.metadata?.organization_uuid,
      },
    };
  }

  /**
   * 标准化单个消息
   * 
   * 将 Claude 的 message 转换为统一的 Message 格式
   * 
   * @param rawMessage 原始消息数据
   * @param conversationId 所属对话 ID
   */
  async normalizeMessage(
    rawMessage: RawMessage,
    conversationId: string
  ): Promise<Message> {
    console.log('[ClaudeNormalizer] normalizeMessage called');

    const msg = rawMessage.data as ClaudeMessage;
    return this.normalizeClaudeMessage(msg, conversationId);
  }

  /**
   * 批量标准化
   */
  async normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]> {
    console.log(
      `[ClaudeNormalizer] Normalizing ${rawConversations.length} conversations`
    );

    const results: Conversation[] = [];
    for (const raw of rawConversations) {
      try {
        const normalized = await this.normalizeConversation(raw);
        results.push(normalized);
      } catch (error) {
        console.error('[ClaudeNormalizer] Failed to normalize conversation:', error);
      }
    }
    return results;
  }

  // ============================================================================
  // 内部方法：标准化逻辑
  // ============================================================================

  /**
   * 标准化一个 Claude 消息
   */
  private async normalizeClaudeMessage(
    msg: ClaudeMessage,
    conversationId: string
  ): Promise<Message> {
    const role = this.mapClaudeRole(msg.role);
    const timestamp = this.parseTimestamp(
      msg.timestamp || msg.created_at || msg.updated_at || Date.now()
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
        // 图片使用占位符或附件
        const attachment: Attachment = {
          id: this.generateId('img_'),
          type: 'image',
          url: block.text || undefined,
          name: block.title || 'Image',
          mimeType: block.metadata?.mimeType as string | undefined,
        };
        attachments.push(attachment);
        textParts.push(`![${block.title || 'Image'}](${block.text || 'image'})`);
      } else if (block.type === 'file') {
        // 文件使用附件
        const attachment: Attachment = {
          id: this.generateId('file_'),
          type: 'file',
          url: block.text || undefined,
          name: block.title || 'Attachment',
          mimeType: block.metadata?.mimeType as string | undefined,
          size: block.metadata?.size as number | undefined,
        };
        attachments.push(attachment);
        textParts.push(`[📎 ${block.title || 'Attachment'}]`);
      } else if (block.type === 'tool_use') {
        // 工具调用使用特殊标记
        textParts.push(`[🔧 Tool Use: ${block.title || 'unknown'}]`);
        if (block.text) {
          textParts.push(`\`\`\`json\n${block.text}\n\`\`\``);
        }
      } else if (block.type === 'tool_result') {
        // 工具结果使用特殊标记
        textParts.push(`[🔧 Tool Result: ${block.title || 'unknown'}]`);
        if (block.text) {
          textParts.push(`\`\`\`\n${block.text}\n\`\`\``);
        }
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
      },
    };

    return {
      id: this.generateMessageId(conversationId, msg.id || msg.uuid),
      role,
      content,
      timestamp,
      metadata: {
        platform: this.platform,
        originalId: msg.id || msg.uuid,
        originalSender: msg.sender?.role,
        originalMetadata: msg.metadata,
      },
    };
  }

  /**
   * 映射 Claude 角色到统一角色
   */
  private mapClaudeRole(role?: string): MessageRole {
    if (!role) {
      return 'unknown';
    }

    const normalizedRole = role.toLowerCase();
    
    if (normalizedRole === 'assistant' || normalizedRole === 'ai' || normalizedRole === 'claude') {
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
  private extractMessageBlocks(msg: ClaudeMessage): ClaudeMessageBlock[] {
    const blocks: ClaudeMessageBlock[] = [];

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
   * - tool_use: 工具调用
   * - tool_result: 工具结果
   * - unsupported: 不支持的类型
   */
  private extractBlockContent(part: any): ClaudeMessageBlock | null {
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
      const source = part.source;
      let url = '';
      let mimeType = '';
      
      if (typeof source === 'object' && source !== null) {
        url = (source as any).data || (source as any).url || '';
        mimeType = (source as any).media_type || '';
      } else {
        url = part.url || part.src || part.data || '';
      }
      
      return {
        type: 'image',
        text: url,
        title: part.alt || part.title || part.name || 'Image',
        metadata: {
          mimeType,
          sourceType: source?.type,
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

    // 工具调用
    if (type === 'tool_use') {
      return {
        type: 'tool_use',
        text: JSON.stringify(part.input || part.parameters || {}, null, 2),
        title: part.name || part.tool_name || 'Tool',
        metadata: {
          toolId: part.id,
          toolName: part.name,
        },
      };
    }

    // 工具结果
    if (type === 'tool_result') {
      const content = part.content || part.result || part.output || '';
      return {
        type: 'tool_result',
        text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        title: part.tool_name || part.tool_use_id || 'Tool Result',
        metadata: {
          toolUseId: part.tool_use_id,
          isError: part.is_error,
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
   * - turns 数组
   * - chat_history 数组
   */
  private extractMessagesFromData(data: ClaudeConversationDetail): ClaudeMessage[] {
    // 优先从 messages 数组提取
    if (Array.isArray(data.messages)) {
      return data.messages;
    }

    // 从 turns 数组提取
    if (Array.isArray(data.turns)) {
      return data.turns;
    }

    // 从 chat_history 数组提取
    if (Array.isArray(data.chat_history)) {
      return data.chat_history;
    }

    // 从嵌套结构中提取
    if (data.chat?.messages) {
      return data.chat.messages;
    }
    if (data.conversation?.messages) {
      return data.conversation.messages;
    }
    if (data.data?.messages) {
      return data.data.messages;
    }
    if (data.result?.messages) {
      return data.result.messages;
    }

    return [];
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
 * 将 Claude 对话转换为 Markdown
 * 
 * 用于需要直接输出 Markdown 的场景
 * 
 * TODO: 需要根据实际数据结构调整
 */
export function claudeToMarkdown(data: ClaudeConversationDetail): string {
  const title = data.title || data.metadata?.title || 'Claude Chat';
  const out: string[] = [];

  out.push(`# ${title}`);
  out.push('');
  out.push(`> Exported at: ${new Date().toLocaleString()}`);
  if (data.metadata?.model) {
    out.push(`> Model: ${data.metadata.model}`);
  }
  if (data.project_uuid) {
    out.push(`> Project: ${data.project_uuid}`);
  }
  if (data.organization_uuid) {
    out.push(`> Organization: ${data.organization_uuid}`);
  }
  out.push('');

  const messages = Array.isArray(data.messages) ? [...data.messages] : [];

  for (const msg of messages) {
    const role = mapRole(msg.role);
    const id = msg.id ? ` (ID: ${msg.id})` : '';
    const ts = formatTimestamp(msg.created_at || msg.timestamp || msg.updated_at);

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
          out.push(`![Image](${part.url || part.data || 'image'})`);
        } else if (part.type === 'tool_use') {
          out.push(`[🔧 Tool: ${part.name || 'unknown'}]`);
          out.push(`\`\`\`json\n${JSON.stringify(part.input || {}, null, 2)}\n\`\`\``);
        } else if (part.type === 'tool_result') {
          out.push(`[🔧 Tool Result]`);
          out.push(typeof part.content === 'string' ? part.content : JSON.stringify(part.content, null, 2));
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
  if (r === 'assistant' || r === 'ai' || r === 'claude') return 'Assistant';
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
export const claudeNormalizer = new ClaudeNormalizer();
