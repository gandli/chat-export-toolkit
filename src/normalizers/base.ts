/**
 * Normalizer 基类
 * 提供通用的标准化实现框架
 */

import type { INormalizer } from '../core';
import type { Conversation, Message, PlatformType, MessageRole, RawConversation, RawMessage } from '../types';

/**
 * Normalizer 抽象基类
 */
export abstract class BaseNormalizer implements INormalizer {
  abstract readonly platform: PlatformType;

  /**
   * 标准化对话
   * 子类必须实现
   */
  abstract normalizeConversation(rawConversation: RawConversation): Promise<Conversation>;

  /**
   * 标准化消息
   * 子类必须实现
   */
  abstract normalizeMessage(rawMessage: RawMessage, conversationId: string): Promise<Message>;

  /**
   * 批量标准化
   * 默认实现：逐个调用 normalizeConversation
   */
  async normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]> {
    console.log(`[${this.platform}] Normalizing ${rawConversations.length} conversations`);
    const results: Conversation[] = [];
    for (const raw of rawConversations) {
      try {
        const normalized = await this.normalizeConversation(raw);
        results.push(normalized);
      } catch (error) {
        console.error(`[${this.platform}] Failed to normalize conversation:`, error);
      }
    }
    return results;
  }

  /**
   * 辅助方法：映射角色类型
   * @param rawRole 原始角色字符串
   */
  protected mapRole(rawRole: string): MessageRole {
    const roleMap: Record<string, MessageRole> = {
      user: 'user',
      human: 'user',
      assistant: 'assistant',
      ai: 'assistant',
      bot: 'assistant',
      system: 'system',
      tool: 'tool',
      function: 'tool',
    };
    return roleMap[rawRole.toLowerCase()] || 'unknown';
  }

  /**
   * 辅助方法：解析时间戳
   * @param timestamp 各种格式的时间戳
   */
  protected parseTimestamp(timestamp: string | number | Date | undefined | null): number {
    // 处理 null/undefined
    if (timestamp == null) {
      return Date.now();
    }
    
    if (typeof timestamp === 'number') {
      // 如果是秒级时间戳，转换为毫秒
      return timestamp < 1e12 ? timestamp * 1000 : timestamp;
    }
    
    if (typeof timestamp === 'string') {
      // 尝试解析数字字符串
      const num = Number(timestamp);
      if (!Number.isNaN(num)) {
        return num < 1e12 ? num * 1000 : num;
      }
      // 尝试解析日期字符串
      const parsed = new Date(timestamp).getTime();
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
      // 解析失败，返回当前时间
      return Date.now();
    }
    
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    
    // 兜底：返回当前时间
    return Date.now();
  }

  /**
   * 辅助方法：提取文本内容
   * @param content 可能是字符串或复杂对象
   */
  protected extractText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object' && content !== null) {
      // 尝试从常见格式中提取文本
      const obj = content as Record<string, unknown>;
      if (typeof obj.text === 'string') return obj.text;
      if (typeof obj.content === 'string') return obj.content;
      if (typeof obj.body === 'string') return obj.body;
      return JSON.stringify(content);
    }
    return String(content);
  }

  /**
   * 生成唯一 ID
   */
  protected generateId(prefix: string = ''): string {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
