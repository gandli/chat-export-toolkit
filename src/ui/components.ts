/**
 * UI 组件实现
 * 包含 FAB、Panel、Toast、Progress 等组件
 */

import type { Conversation, ExportFormat } from '../types';
import { injectStyles } from './styles';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Toast 类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast 配置
 */
export interface ToastOptions {
  type: ToastType;
  title: string;
  message: string;
  duration?: number; // 毫秒，0 表示不自动关闭
}

/**
 * 进度配置
 */
export interface ProgressOptions {
  current: number;
  total: number;
  message?: string;
}

/**
 * UI 状态
 */
export interface UIState {
  panelVisible: boolean;
  exportScope: 'current' | 'all';
  exportFormat: ExportFormat;
  isExporting: boolean;
  progress: ProgressOptions | null;
}

/**
 * UI 事件回调
 */
export interface UIEventCallbacks {
  onExportStart?: (options: { scope: 'current' | 'all'; format: ExportFormat }) => void;
  onExportProgress?: (progress: number, message: string) => void;
  onExportComplete?: (result: any) => void;
  onExportError?: (error: Error) => void;
  onConversationSelect?: (conversation: Conversation) => void;
}

/**
 * UI 配置
 */
export interface UIConfig {
  container?: HTMLElement | string;
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
  callbacks?: UIEventCallbacks;
}

// ============================================================================
// SVG 图标
// ============================================================================

const ICONS = {
  fab: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>`,
  
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>`,
  
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 6L9 17l-5-5"/>
  </svg>`,
  
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M15 9l-6 6M9 9l6 6"/>
  </svg>`,
  
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <path d="M12 9v4M12 17h.01"/>
  </svg>`,
  
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4M12 8h.01"/>
  </svg>`,
  
  export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>`,
  
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>`,
};

// ============================================================================
// UI 组件类
// ============================================================================

/**
 * Chat Export Toolkit UI
 * 提供完整的用户界面组件
 */
export class ChatExportUI {
  private container: HTMLElement | null = null;
  private config: UIConfig;
  private state: UIState;
  private isInitialized = false;
  
  // DOM 元素引用
  private fabEl: HTMLButtonElement | null = null;
  private panelEl: HTMLElement | null = null;
  private toastContainerEl: HTMLElement | null = null;
  
  // Toast 管理
  private toastCounter = 0;
  private toastTimers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(config: UIConfig = {}) {
    this.config = {
      theme: 'auto',
      locale: 'zh-CN',
      ...config,
    };
    
    this.state = {
      panelVisible: false,
      exportScope: 'current',
      exportFormat: 'json',
      isExporting: false,
      progress: null,
    };
  }

  /**
   * 初始化 UI
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[ChatExportUI] Already initialized');
      return;
    }

    console.log('[ChatExportUI] Initializing...');

    // 注入样式
    injectStyles();

    // 获取容器
    if (typeof this.config.container === 'string') {
      this.container = document.querySelector(this.config.container);
    } else if (this.config.container instanceof HTMLElement) {
      this.container = this.config.container;
    } else {
      this.container = document.body;
    }

    if (!this.container) {
      throw new Error('[ChatExportUI] Container not found');
    }

    // 创建容器元素
    const wrapper = document.createElement('div');
    wrapper.className = 'cet-container';
    wrapper.id = 'cet-ui-container';
    this.container.appendChild(wrapper);

    // 渲染组件
    this.renderFab(wrapper);
    this.renderPanel(wrapper);
    this.renderToastContainer(wrapper);

    // 应用主题
    this.applyTheme(this.config.theme || 'auto');

    // 绑定事件
    this.bindEvents();

    this.isInitialized = true;
    console.log('[ChatExportUI] Initialized successfully');
  }

  /**
   * 渲染 FAB 按钮
   */
  private renderFab(container: HTMLElement): void {
    const fab = document.createElement('button');
    fab.className = 'cet-fab';
    fab.innerHTML = `<span class="cet-fab-icon">${ICONS.fab}</span>`;
    fab.title = 'Chat Export Toolkit';
    container.appendChild(fab);
    this.fabEl = fab;
  }

  /**
   * 渲染导出面板
   */
  private renderPanel(container: HTMLElement): void {
    const panel = document.createElement('div');
    panel.className = 'cet-panel cet-panel-hidden';
    panel.innerHTML = `
      <div class="cet-panel-header">
        <h3 class="cet-panel-title">导出对话</h3>
        <button class="cet-panel-close" title="关闭">
          ${ICONS.close}
        </button>
      </div>
      <div class="cet-panel-body">
        <div class="cet-panel-section">
          <label class="cet-panel-label">导出范围</label>
          <div class="cet-panel-options">
            <label class="cet-option cet-option-selected" data-option="scope" data-value="current">
              <input type="radio" name="cet-scope" value="current" class="cet-option-input" checked>
              <div class="cet-option-text">
                <div>当前会话</div>
                <div class="cet-option-desc">仅导出当前显示的对话</div>
              </div>
            </label>
            <label class="cet-option" data-option="scope" data-value="all">
              <input type="radio" name="cet-scope" value="all" class="cet-option-input">
              <div class="cet-option-text">
                <div>全部会话</div>
                <div class="cet-option-desc">导出所有历史对话（ZIP 打包）</div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="cet-panel-section">
          <label class="cet-panel-label">导出格式</label>
          <div class="cet-panel-options">
            <label class="cet-option cet-option-selected" data-option="format" data-value="json">
              <input type="radio" name="cet-format" value="json" class="cet-option-input" checked>
              <div class="cet-option-text">
                <div>JSON</div>
                <div class="cet-option-desc">结构化数据，适合程序处理</div>
              </div>
            </label>
            <label class="cet-option" data-option="format" data-value="markdown">
              <input type="radio" name="cet-format" value="markdown" class="cet-option-input">
              <div class="cet-option-text">
                <div>Markdown</div>
                <div class="cet-option-desc">可读性强，适合阅读</div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="cet-panel-actions">
          <button class="cet-btn cet-btn-secondary" data-action="cancel" disabled>
            取消
          </button>
          <button class="cet-btn cet-btn-primary" data-action="export">
            <span class="cet-btn-icon">${ICONS.download}</span>
            导出
          </button>
        </div>
      </div>
    `;
    container.appendChild(panel);
    this.panelEl = panel;
  }

  /**
   * 渲染 Toast 容器
   */
  private renderToastContainer(container: HTMLElement): void {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'cet-toast-container';
    container.appendChild(toastContainer);
    this.toastContainerEl = toastContainer;
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.fabEl || !this.panelEl) return;

    // FAB 点击 - 切换面板显示
    this.fabEl.addEventListener('click', () => {
      this.togglePanel();
    });

    // 面板关闭按钮
    const closeBtn = this.panelEl.querySelector('.cet-panel-close');
    closeBtn?.addEventListener('click', () => {
      this.hidePanel();
    });

    // 选项选择
    const options = this.panelEl.querySelectorAll('.cet-option');
    options.forEach((option) => {
      option.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const optionType = target.dataset.option;
        const value = target.dataset.value;
        
        if (optionType === 'scope') {
          this.state.exportScope = value as 'current' | 'all';
        } else if (optionType === 'format') {
          this.state.exportFormat = value as ExportFormat;
        }
        
        // 更新选中状态
        const parent = target.parentElement;
        parent?.querySelectorAll('.cet-option').forEach((opt) => {
          opt.classList.remove('cet-option-selected');
        });
        target.classList.add('cet-option-selected');
        
        // 更新 radio 状态
        const input = target.querySelector('input');
        input?.click();
      });
    });

    // 导出按钮
    const exportBtn = this.panelEl.querySelector('[data-action="export"]');
    exportBtn?.addEventListener('click', () => {
      this.handleExport();
    });

    // 取消按钮
    const cancelBtn = this.panelEl.querySelector('[data-action="cancel"]');
    cancelBtn?.addEventListener('click', () => {
      this.handleCancel();
    });
  }

  /**
   * 应用主题
   */
  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    if (!this.container) return;

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }

    this.container.setAttribute('data-theme', theme);
    console.log(`[ChatExportUI] Applied theme: ${theme}`);
  }

  /**
   * 切换面板显示
   */
  private togglePanel(): void {
    if (this.state.panelVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  /**
   * 显示面板
   */
  private showPanel(): void {
    if (!this.panelEl) return;
    
    this.state.panelVisible = true;
    this.panelEl.classList.remove('cet-panel-hidden');
    this.fabEl?.classList.add('cet-fab-expanded');
  }

  /**
   * 隐藏面板
   */
  private hidePanel(): void {
    if (!this.panelEl) return;
    
    this.state.panelVisible = false;
    this.panelEl.classList.add('cet-panel-hidden');
    this.fabEl?.classList.remove('cet-fab-expanded');
  }

  /**
   * 处理导出
   */
  private handleExport(): void {
    if (this.state.isExporting) return;

    const { exportScope, exportFormat } = this.state;
    
    console.log('[ChatExportUI] Export started:', {
      scope: exportScope,
      format: exportFormat,
    });

    this.state.isExporting = true;
    this.updateExportButton(true);
    
    // 触发回调
    this.config.callbacks?.onExportStart?.({
      scope: exportScope,
      format: exportFormat,
    });

    // 显示 Toast
    this.showToast({
      type: 'info',
      title: '开始导出',
      message: exportScope === 'current' ? '正在导出当前会话...' : '正在导出全部会话...',
      duration: 3000,
    });
  }

  /**
   * 处理取消
   */
  private handleCancel(): void {
    if (!this.state.isExporting) return;

    console.log('[ChatExportUI] Export cancelled');
    
    this.state.isExporting = false;
    this.updateExportButton(false);
    this.updateProgress(null);
    
    this.config.callbacks?.onExportError?.(new Error('User cancelled'));
    
    this.showToast({
      type: 'warning',
      title: '已取消',
      message: '导出已取消',
      duration: 2000,
    });
  }

  /**
   * 更新导出按钮状态
   */
  private updateExportButton(isExporting: boolean): void {
    if (!this.panelEl) return;
    
    const exportBtn = this.panelEl.querySelector('[data-action="export"]') as HTMLButtonElement;
    const cancelBtn = this.panelEl.querySelector('[data-action="cancel"]') as HTMLButtonElement;
    
    if (exportBtn) {
      exportBtn.disabled = isExporting;
      exportBtn.innerHTML = isExporting
        ? '<span class="cet-spinner" style="width:16px;height:16px;border-width:2px;"></span> 导出中...'
        : `<span class="cet-btn-icon">${ICONS.download}</span> 导出`;
    }
    
    if (cancelBtn) {
      cancelBtn.disabled = !isExporting;
    }
  }

  /**
   * 显示 Toast
   */
  showToast(options: ToastOptions): number {
    if (!this.toastContainerEl) {
      console.warn('[ChatExportUI] Toast container not ready');
      return -1;
    }

    const toastId = ++this.toastCounter;
    const { type, title, message, duration = 3000 } = options;

    const toast = document.createElement('div');
    toast.className = `cet-toast cet-toast-${type}`;
    toast.dataset.toastId = String(toastId);
    toast.innerHTML = `
      <div class="cet-toast-icon">
        ${this.getToastIcon(type)}
      </div>
      <div class="cet-toast-content">
        <div class="cet-toast-title">${this.escapeHtml(title)}</div>
        <div class="cet-toast-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="cet-toast-close">${ICONS.close}</button>
    `;

    // 关闭按钮事件
    const closeBtn = toast.querySelector('.cet-toast-close');
    closeBtn?.addEventListener('click', () => {
      this.hideToast(toastId);
    });

    this.toastContainerEl.appendChild(toast);

    // 自动关闭
    if (duration > 0) {
      const timer = setTimeout(() => {
        this.hideToast(toastId);
      }, duration);
      this.toastTimers.set(toastId, timer);
    }

    return toastId;
  }

  /**
   * 隐藏 Toast
   */
  hideToast(toastId: number): void {
    const toast = this.toastContainerEl?.querySelector(`[data-toast-id="${toastId}"]`);
    if (!toast) return;

    // 清除定时器
    const timer = this.toastTimers.get(toastId);
    if (timer) {
      clearTimeout(timer);
      this.toastTimers.delete(toastId);
    }

    // 添加隐藏动画
    toast.classList.add('cet-toast-hiding');
    
    // 动画结束后移除
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  /**
   * 获取 Toast 图标
   */
  private getToastIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return ICONS.check;
      case 'error':
        return ICONS.error;
      case 'warning':
        return ICONS.warning;
      case 'info':
      default:
        return ICONS.info;
    }
  }

  /**
   * 更新进度
   */
  updateProgress(progress: ProgressOptions | null): void {
    this.state.progress = progress;

    if (!progress) {
      // 清除进度显示
      const existingProgress = this.panelEl?.querySelector('.cet-progress');
      existingProgress?.remove();
      return;
    }

    if (!this.panelEl) return;

    // 创建或更新进度条
    let progressEl = this.panelEl.querySelector('.cet-progress') as HTMLElement;
    
    if (!progressEl) {
      progressEl = document.createElement('div');
      progressEl.className = 'cet-progress';
      progressEl.innerHTML = `
        <div class="cet-progress-bar">
          <div class="cet-progress-fill"></div>
        </div>
        <div class="cet-progress-info">
          <span class="cet-progress-text"></span>
          <span class="cet-progress-percent">0%</span>
        </div>
      `;
      
      const actionsEl = this.panelEl.querySelector('.cet-panel-actions');
      actionsEl?.parentNode?.insertBefore(progressEl, actionsEl);
    }

    // 更新进度值
    const percent = Math.round((progress.current / progress.total) * 100);
    const fillEl = progressEl.querySelector('.cet-progress-fill') as HTMLElement;
    const textEl = progressEl.querySelector('.cet-progress-text') as HTMLElement;
    const percentEl = progressEl.querySelector('.cet-progress-percent') as HTMLElement;

    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = progress.message || `处理中 ${progress.current}/${progress.total}`;
    if (percentEl) percentEl.textContent = `${percent}%`;

    // 触发回调
    this.config.callbacks?.onExportProgress?.(percent, progress.message || '');
  }

  /**
   * 导出完成
   */
  exportComplete(result: any): void {
    this.state.isExporting = false;
    this.updateExportButton(false);
    this.updateProgress(null);

    this.config.callbacks?.onExportComplete?.(result);

    this.showToast({
      type: 'success',
      title: '导出完成',
      message: '文件已下载到您的设备',
      duration: 3000,
    });
  }

  /**
   * 导出失败
   */
  exportError(error: Error): void {
    this.state.isExporting = false;
    this.updateExportButton(false);
    this.updateProgress(null);

    this.config.callbacks?.onExportError?.(error);

    this.showToast({
      type: 'error',
      title: '导出失败',
      message: error.message,
      duration: 5000,
    });
  }

  /**
   * 获取当前状态
   */
  getState(): UIState {
    return { ...this.state };
  }

  /**
   * 更新状态
   */
  setState(state: Partial<UIState>): void {
    this.state = { ...this.state, ...state };
    
    // 根据状态更新 UI
    if (state.panelVisible !== undefined) {
      if (state.panelVisible) {
        this.showPanel();
      } else {
        this.hidePanel();
      }
    }
  }

  /**
   * 销毁 UI
   */
  destroy(): void {
    console.log('[ChatExportUI] Destroying...');

    // 清除所有 Toast 定时器
    this.toastTimers.forEach((timer) => clearTimeout(timer));
    this.toastTimers.clear();

    // 移除容器
    if (this.container) {
      const wrapper = this.container.querySelector('#cet-ui-container');
      wrapper?.remove();
    }

    this.isInitialized = false;
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * 创建 UI 实例
 */
export function createUI(config?: UIConfig): ChatExportUI {
  return new ChatExportUI(config);
}
