/**
 * PlatformAdapter 基类
 * 提供通用的实现框架
 */

import type { IPlatformAdapter } from '../core';
import type { PlatformType, RawConversation, RawMessage } from '../types';

/**
 * PlatformAdapter 抽象基类
 */
export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly platform: PlatformType;

  /**
   * 检测当前页面是否属于此平台
   * 子类必须实现具体的检测逻辑
   */
  abstract detect(): boolean;

  /**
   * 获取单个对话
   * 默认实现返回 null，子类按需覆盖
   */
  async getConversation(conversationId?: string): Promise<RawConversation | null> {
    console.log(`[${this.platform}] getConversation called`, { conversationId });
    // TODO: 实现具体的获取逻辑
    return null;
  }

  /**
   * 获取对话列表
   * 默认实现返回空数组，子类必须覆盖
   */
  async listConversations(): Promise<RawConversation[]> {
    console.log(`[${this.platform}] listConversations called`);
    // TODO: 实现具体的列表获取逻辑
    return [];
  }

  /**
   * 提取消息列表
   * 默认实现返回空数组，子类必须覆盖
   */
  extractMessages(rawConversation: RawConversation): RawMessage[] {
    console.log(`[${this.platform}] extractMessages called`, { rawConversation });
    // TODO: 实现具体的消息提取逻辑
    return [];
  }

  /**
   * 获取平台元数据
   * 可选实现
   */
  async getMetadata?(): Promise<Record<string, unknown>> {
    console.log(`[${this.platform}] getMetadata called`);
    return {};
  }

  /**
   * 辅助方法：安全地查询 DOM 元素
   * @param selector CSS 选择器
   * @param context 上下文元素（可选）
   */
  protected querySelectorSafe<T extends Element>(
    selector: string,
    context: Element | Document = document
  ): T | null {
    try {
      return context.querySelector<T>(selector);
    } catch (error) {
      console.warn(`[${this.platform}] Failed to query selector:`, selector, error);
      return null;
    }
  }

  /**
   * 辅助方法：安全地查询所有 DOM 元素
   */
  protected querySelectorAllSafe<T extends Element>(
    selector: string,
    context: Element | Document = document
  ): T[] {
    try {
      return Array.from(context.querySelectorAll<T>(selector));
    } catch (error) {
      console.warn(`[${this.platform}] Failed to query selectors:`, selector, error);
      return [];
    }
  }

  /**
   * 辅助方法：等待元素出现
   * @param selector CSS 选择器
   * @param timeout 超时时间（ms）
   */
  protected async waitForElement<T extends Element>(
    selector: string,
    timeout = 5000
  ): Promise<T | null> {
    return new Promise((resolve) => {
      const element = this.querySelectorSafe<T>(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const el = this.querySelectorSafe<T>(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
}
