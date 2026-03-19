/**
 * UI 组件测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatExportUI } from '../../src/ui/components';

describe('ChatExportUI', () => {
  let ui: ChatExportUI;
  let container: HTMLElement;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // 创建 UI 实例
    ui = new ChatExportUI({
      container,
      theme: 'light',
    });
  });

  afterEach(() => {
    // 清理
    ui.destroy();
    container.remove();
  });

  describe('初始化', () => {
    it('应该成功初始化', async () => {
      await ui.init();
      expect(ui.getState().panelVisible).toBe(false);
    });

    it('应该注入样式', async () => {
      await ui.init();
      const styleEl = document.getElementById('cet-styles');
      expect(styleEl).not.toBeNull();
    });

    it('应该创建 FAB 按钮', async () => {
      await ui.init();
      const fab = container.querySelector('.cet-fab');
      expect(fab).not.toBeNull();
    });

    it('应该创建导出面板', async () => {
      await ui.init();
      const panel = container.querySelector('.cet-panel');
      expect(panel).not.toBeNull();
    });

    it('应该创建 Toast 容器', async () => {
      await ui.init();
      const toastContainer = container.querySelector('.cet-toast-container');
      expect(toastContainer).not.toBeNull();
    });
  });

  describe('面板控制', () => {
    it('应该切换面板显示状态', async () => {
      await ui.init();
      
      // 初始状态：隐藏
      expect(ui.getState().panelVisible).toBe(false);
      
      // 显示面板
      ui.setState({ panelVisible: true });
      expect(ui.getState().panelVisible).toBe(true);
      
      // 隐藏面板
      ui.setState({ panelVisible: false });
      expect(ui.getState().panelVisible).toBe(false);
    });

    it('应该点击 FAB 切换面板', async () => {
      await ui.init();
      
      const fab = container.querySelector('.cet-fab') as HTMLButtonElement;
      expect(fab).not.toBeNull();
      
      // 点击 FAB
      fab.click();
      expect(ui.getState().panelVisible).toBe(true);
      
      // 再次点击
      fab.click();
      expect(ui.getState().panelVisible).toBe(false);
    });
  });

  describe('导出选项', () => {
    it('应该默认选择当前会话', async () => {
      await ui.init();
      expect(ui.getState().exportScope).toBe('current');
    });

    it('应该默认选择 JSON 格式', async () => {
      await ui.init();
      expect(ui.getState().exportFormat).toBe('json');
    });

    it('应该切换导出范围', async () => {
      await ui.init();
      
      const allOption = container.querySelector('[data-option="scope"][data-value="all"]');
      expect(allOption).not.toBeNull();
      
      if (allOption) {
        (allOption as HTMLElement).click();
        expect(ui.getState().exportScope).toBe('all');
      }
    });

    it('应该切换导出格式', async () => {
      await ui.init();
      
      const mdOption = container.querySelector('[data-option="format"][data-value="markdown"]');
      expect(mdOption).not.toBeNull();
      
      if (mdOption) {
        (mdOption as HTMLElement).click();
        expect(ui.getState().exportFormat).toBe('markdown');
      }
    });
  });

  describe('Toast 通知', () => {
    it('应该显示 Toast', async () => {
      await ui.init();
      
      const toastId = ui.showToast({
        type: 'info',
        title: '测试',
        message: '这是一条测试消息',
        duration: 1000,
      });
      
      expect(toastId).toBeGreaterThan(0);
      
      const toast = container.querySelector('.cet-toast');
      expect(toast).not.toBeNull();
    });

    it('应该显示不同类型的 Toast', async () => {
      await ui.init();
      
      const types: Array<'success' | 'error' | 'warning' | 'info'> = ['success', 'error', 'warning', 'info'];
      
      types.forEach((type) => {
        const toastId = ui.showToast({
          type,
          title: `${type} 测试`,
          message: `这是一条 ${type} 消息`,
          duration: 0,
        });
        
        expect(toastId).toBeGreaterThan(0);
      });
      
      const toasts = container.querySelectorAll('.cet-toast');
      expect(toasts.length).toBe(4);
    });

    it('应该自动关闭 Toast', async () => {
      vi.useFakeTimers();
      
      await ui.init();
      
      const toastId = ui.showToast({
        type: 'info',
        title: '测试',
        message: '这是一条测试消息',
        duration: 100,
      });
      
      // 快进时间：100ms (duration) + 300ms (动画) = 400ms
      await vi.advanceTimersByTimeAsync(400);
      
      const toast = container.querySelector(`[data-toast-id="${toastId}"]`);
      expect(toast).toBeNull();
      
      vi.useRealTimers();
    });

    it('应该手动关闭 Toast', async () => {
      vi.useFakeTimers();
      
      await ui.init();
      
      const toastId = ui.showToast({
        type: 'info',
        title: '测试',
        message: '这是一条测试消息',
        duration: 0, // 不自动关闭
      });
      
      // 手动关闭
      ui.hideToast(toastId);
      
      // 快进动画时间 (300ms)
      await vi.advanceTimersByTimeAsync(350);
      
      const toast = container.querySelector(`[data-toast-id="${toastId}"]`);
      expect(toast).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('进度条', () => {
    it('应该更新进度', async () => {
      await ui.init();
      
      ui.updateProgress({
        current: 5,
        total: 10,
        message: '处理中...',
      });
      
      const progressFill = container.querySelector('.cet-progress-fill') as HTMLElement;
      expect(progressFill).not.toBeNull();
      expect(progressFill.style.width).toBe('50%');
      
      const progressText = container.querySelector('.cet-progress-text');
      expect(progressText?.textContent).toContain('处理中...');
      
      const progressPercent = container.querySelector('.cet-progress-percent');
      expect(progressPercent?.textContent).toBe('50%');
    });

    it('应该清除进度', async () => {
      await ui.init();
      
      // 设置进度
      ui.updateProgress({
        current: 5,
        total: 10,
        message: '处理中...',
      });
      
      // 清除进度
      ui.updateProgress(null);
      
      const progress = container.querySelector('.cet-progress');
      expect(progress).toBeNull();
    });
  });

  describe('回调函数', () => {
    it('应该触发 onExportStart 回调', async () => {
      const onExportStart = vi.fn();
      
      ui = new ChatExportUI({
        container,
        callbacks: { onExportStart },
      });
      
      await ui.init();
      
      // 点击导出按钮
      const exportBtn = container.querySelector('[data-action="export"]') as HTMLButtonElement;
      exportBtn.click();
      
      expect(onExportStart).toHaveBeenCalledWith({
        scope: 'current',
        format: 'json',
      });
    });

    it('应该触发 onExportProgress 回调', async () => {
      const onExportProgress = vi.fn();
      
      ui = new ChatExportUI({
        container,
        callbacks: { onExportProgress },
      });
      
      await ui.init();
      
      ui.updateProgress({
        current: 5,
        total: 10,
        message: '处理中...',
      });
      
      expect(onExportProgress).toHaveBeenCalledWith(50, '处理中...');
    });
  });

  describe('主题', () => {
    it('应该应用亮色主题', async () => {
      ui = new ChatExportUI({
        container,
        theme: 'light',
      });
      
      await ui.init();
      
      expect(container.getAttribute('data-theme')).toBe('light');
    });

    it('应该应用暗色主题', async () => {
      ui = new ChatExportUI({
        container,
        theme: 'dark',
      });
      
      await ui.init();
      
      expect(container.getAttribute('data-theme')).toBe('dark');
    });

    it('应该自动检测主题', async () => {
      ui = new ChatExportUI({
        container,
        theme: 'auto',
      });
      
      await ui.init();
      
      const theme = container.getAttribute('data-theme');
      expect(['light', 'dark']).toContain(theme);
    });
  });

  describe('销毁', () => {
    it('应该清理所有资源', async () => {
      await ui.init();
      
      // 显示 Toast
      ui.showToast({
        type: 'info',
        title: '测试',
        message: '测试消息',
        duration: 10000,
      });
      
      // 销毁
      ui.destroy();
      
      // 验证容器被移除
      const uiContainer = document.getElementById('cet-ui-container');
      expect(uiContainer).toBeNull();
    });
  });
});
