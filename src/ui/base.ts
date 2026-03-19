/**
 * UI 基础组件
 * 提供通用的 UI 框架
 */

import type { UIConfig, UIEvents, Conversation, ExportOptions } from '../types';

/**
 * UI 基类
 */
export abstract class BaseUI implements UIEvents {
  protected container: HTMLElement | null = null;
  protected config: UIConfig;
  protected isInitialized = false;

  constructor(config: UIConfig = {}) {
    this.config = {
      theme: 'auto',
      locale: 'zh-CN',
      ...config,
    };
  }

  /**
   * 初始化 UI
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[UI] Already initialized');
      return;
    }

    console.log('[UI] Initializing...');

    // 获取容器
    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else if (this.config.container instanceof HTMLElement) {
      this.container = this.config.container;
    } else {
      this.container = document.body;
    }

    if (!this.container) {
      throw new Error('[UI] Container not found');
    }

    // 应用主题
    this.applyTheme(this.config.theme || 'auto');

    // 渲染 UI
    await this.render();

    // 绑定事件
    this.bindEvents();

    this.isInitialized = true;
    console.log('[UI] Initialized successfully');
  }

  /**
   * 渲染 UI
   * 子类必须实现
   */
  protected abstract render(): Promise<void>;

  /**
   * 绑定事件
   * 子类可以覆盖
   */
  protected bindEvents(): void {
    console.log('[UI] Binding events');
  }

  /**
   * 应用主题
   */
  protected applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    if (!this.container) return;

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }

    this.container.setAttribute('data-theme', theme);
    console.log(`[UI] Applied theme: ${theme}`);
  }

  /**
   * 显示加载状态
   */
  protected showLoading(message: string = 'Loading...'): void {
    if (!this.container) return;
    
    const loader = document.createElement('div');
    loader.className = 'cet-loading';
    loader.textContent = message;
    this.container.appendChild(loader);
  }

  /**
   * 隐藏加载状态
   */
  protected hideLoading(): void {
    if (!this.container) return;
    const loader = this.container.querySelector('.cet-loading');
    if (loader) loader.remove();
  }

  /**
   * 显示错误
   */
  protected showError(message: string): void {
    console.error('[UI] Error:', message);
    
    if (!this.container) return;
    
    const errorEl = document.createElement('div');
    errorEl.className = 'cet-error';
    errorEl.textContent = message;
    this.container.appendChild(errorEl);

    setTimeout(() => errorEl.remove(), 5000);
  }

  /**
   * 显示成功提示
   */
  protected showSuccess(message: string): void {
    console.log('[UI] Success:', message);
    
    if (!this.container) return;
    
    const successEl = document.createElement('div');
    successEl.className = 'cet-success';
    successEl.textContent = message;
    this.container.appendChild(successEl);

    setTimeout(() => successEl.remove(), 3000);
  }

  /**
   * 更新进度
   */
  protected updateProgress(progress: number, message: string): void {
    console.log(`[UI] Progress: ${progress}% - ${message}`);
    this.onExportProgress?.(progress, message);
  }

  /**
   * 销毁 UI
   */
  destroy(): void {
    console.log('[UI] Destroying...');
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.isInitialized = false;
  }

  // UIEvents 实现
  onExportStart?: (options: ExportOptions) => void;
  onExportProgress?: (progress: number, message: string) => void;
  onExportComplete?: (result: any) => void;
  onExportError?: (error: Error) => void;
  onConversationSelect?: (conversation: Conversation) => void;
}
