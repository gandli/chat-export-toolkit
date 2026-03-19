/**
 * 占位 UI 组件
 * 最小化的 UI 实现示例（向后兼容）
 */

import { BaseUI } from './base';
import { ChatExportUI, type UIConfig } from './components';

/**
 * 占位 UI
 * 仅用于演示和测试（向后兼容）
 * @deprecated 请使用 ChatExportUI
 */
export class PlaceholderUI extends BaseUI {

  protected async render(): Promise<void> {
    if (!this.container) return;

    console.log('[PlaceholderUI] Rendering...');

    // 创建简单的占位 UI
    const wrapper = document.createElement('div');
    wrapper.className = 'cet-placeholder';
    wrapper.innerHTML = `
      <div class="cet-placeholder-header">
        <h3>Chat Export Toolkit V2</h3>
        <span class="cet-version">v2.0.0-alpha</span>
      </div>
      <div class="cet-placeholder-body">
        <p>🚧 Under Construction</p>
        <p class="cet-status">Initializing...</p>
      </div>
      <div class="cet-placeholder-footer">
        <button class="cet-btn cet-btn-primary" data-action="init">
          Initialize
        </button>
      </div>
    `;

    this.container.appendChild(wrapper);
  }

  protected bindEvents(): void {
    super.bindEvents();
    
    if (!this.container) return;

    const initBtn = this.container.querySelector('[data-action="init"]');
    if (initBtn) {
      initBtn.addEventListener('click', () => {
        console.log('[PlaceholderUI] Init button clicked');
        this.showSuccess('Initialized! (placeholder)');
      });
    }
  }
}

/**
 * 创建占位 UI 实例
 * @deprecated 请使用 createUI
 */
export function createPlaceholderUI(container?: HTMLElement | string): PlaceholderUI {
  return new PlaceholderUI({ container });
}

/**
 * 创建 ChatExportUI 实例（推荐）
 */
export function createChatExportUI(config?: UIConfig): ChatExportUI {
  return new ChatExportUI(config);
}
