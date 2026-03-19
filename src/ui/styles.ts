/**
 * UI 样式定义
 * 复用 V1 的 CSS 样式，按新架构重组
 */

/**
 * 注入 UI 样式到页面
 */
export function injectStyles(): void {
  if (document.getElementById('cet-styles')) {
    return; // 样式已注入
  }

  const style = document.createElement('style');
  style.id = 'cet-styles';
  style.textContent = STYLES_CSS;
  document.head.appendChild(style);
}

/**
 * CSS 样式字符串
 */
const STYLES_CSS = `
/* ============================================================================
   CSS Variables - 主题配置
   ============================================================================ */
:root {
  --cet-primary-color: #007bff;
  --cet-primary-hover: #0056b3;
  --cet-success-color: #28a745;
  --cet-warning-color: #ffc107;
  --cet-danger-color: #dc3545;
  --cet-info-color: #17a2b8;
  
  --cet-bg-color: #ffffff;
  --cet-bg-secondary: #f8f9fa;
  --cet-border-color: #dee2e6;
  --cet-text-color: #212529;
  --cet-text-muted: #6c757d;
  
  --cet-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --cet-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.2);
  --cet-border-radius: 8px;
  --cet-border-radius-sm: 4px;
  
  --cet-transition: all 0.3s ease;
  --cet-z-index: 999999;
}

[data-theme="dark"] {
  --cet-bg-color: #1a1a1a;
  --cet-bg-secondary: #2d2d2d;
  --cet-border-color: #404040;
  --cet-text-color: #e0e0e0;
  --cet-text-muted: #a0a0a0;
  --cet-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  --cet-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.5);
}

/* ============================================================================
   基础样式重置
   ============================================================================ */
.cet-container * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.cet-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--cet-text-color);
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  z-index: var(--cet-z-index);
}

.cet-container > * {
  pointer-events: auto;
}

/* ============================================================================
   FAB 浮动按钮
   ============================================================================ */
.cet-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--cet-primary-color);
  color: white;
  border: none;
  box-shadow: var(--cet-shadow-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--cet-transition);
  z-index: calc(var(--cet-z-index) + 1);
}

.cet-fab:hover {
  background: var(--cet-primary-hover);
  transform: scale(1.1);
}

.cet-fab:active {
  transform: scale(0.95);
}

.cet-fab-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
  transition: var(--cet-transition);
}

.cet-fab-expanded .cet-fab-icon {
  transform: rotate(45deg);
}

/* ============================================================================
   导出面板
   ============================================================================ */
.cet-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 320px;
  background: var(--cet-bg-color);
  border-radius: var(--cet-border-radius);
  box-shadow: var(--cet-shadow-lg);
  border: 1px solid var(--cet-border-color);
  overflow: hidden;
  transition: var(--cet-transition);
  z-index: calc(var(--cet-z-index) + 1);
}

.cet-panel-hidden {
  transform: translateY(20px);
  opacity: 0;
  pointer-events: none;
}

.cet-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--cet-bg-secondary);
  border-bottom: 1px solid var(--cet-border-color);
}

.cet-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--cet-text-color);
}

.cet-panel-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--cet-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--cet-transition);
}

.cet-panel-close:hover {
  background: var(--cet-border-color);
  color: var(--cet-text-color);
}

.cet-panel-body {
  padding: 16px;
}

.cet-panel-section {
  margin-bottom: 16px;
}

.cet-panel-section:last-child {
  margin-bottom: 0;
}

.cet-panel-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--cet-text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cet-panel-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cet-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--cet-bg-secondary);
  border-radius: var(--cet-border-radius-sm);
  cursor: pointer;
  transition: var(--cet-transition);
  border: 2px solid transparent;
}

.cet-option:hover {
  background: var(--cet-border-color);
}

.cet-option-selected {
  border-color: var(--cet-primary-color);
  background: rgba(0, 123, 255, 0.1);
}

.cet-option-input {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  cursor: pointer;
}

.cet-option-text {
  flex: 1;
  font-size: 14px;
  color: var(--cet-text-color);
}

.cet-option-desc {
  font-size: 12px;
  color: var(--cet-text-muted);
  margin-top: 2px;
}

.cet-panel-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--cet-border-color);
}

.cet-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--cet-border-radius-sm);
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--cet-transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cet-btn-primary {
  background: var(--cet-primary-color);
  color: white;
}

.cet-btn-primary:hover {
  background: var(--cet-primary-hover);
}

.cet-btn-secondary {
  background: var(--cet-bg-secondary);
  color: var(--cet-text-color);
  border: 1px solid var(--cet-border-color);
}

.cet-btn-secondary:hover {
  background: var(--cet-border-color);
}

.cet-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================================================
   Toast 通知
   ============================================================================ */
.cet-toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: calc(var(--cet-z-index) + 2);
  pointer-events: none;
}

.cet-toast {
  min-width: 280px;
  max-width: 400px;
  padding: 14px 16px;
  background: var(--cet-bg-color);
  border-radius: var(--cet-border-radius);
  box-shadow: var(--cet-shadow-lg);
  border-left: 4px solid;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  pointer-events: auto;
  animation: cet-toast-slide-in 0.3s ease;
}

@keyframes cet-toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.cet-toast-hiding {
  animation: cet-toast-slide-out 0.3s ease forwards;
}

@keyframes cet-toast-slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.cet-toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.cet-toast-content {
  flex: 1;
  min-width: 0;
}

.cet-toast-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--cet-text-color);
}

.cet-toast-message {
  font-size: 13px;
  color: var(--cet-text-muted);
  word-wrap: break-word;
}

.cet-toast-close {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--cet-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--cet-transition);
}

.cet-toast-close:hover {
  background: var(--cet-border-color);
  color: var(--cet-text-color);
}

/* Toast 类型 */
.cet-toast-success {
  border-left-color: var(--cet-success-color);
}

.cet-toast-success .cet-toast-icon {
  color: var(--cet-success-color);
}

.cet-toast-error {
  border-left-color: var(--cet-danger-color);
}

.cet-toast-error .cet-toast-icon {
  color: var(--cet-danger-color);
}

.cet-toast-warning {
  border-left-color: var(--cet-warning-color);
}

.cet-toast-warning .cet-toast-icon {
  color: var(--cet-warning-color);
}

.cet-toast-info {
  border-left-color: var(--cet-info-color);
}

.cet-toast-info .cet-toast-icon {
  color: var(--cet-info-color);
}

/* ============================================================================
   进度条
   ============================================================================ */
.cet-progress {
  width: 100%;
}

.cet-progress-bar {
  height: 8px;
  background: var(--cet-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.cet-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cet-primary-color), var(--cet-info-color));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.cet-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--cet-text-muted);
}

.cet-progress-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
}

.cet-progress-percent {
  font-weight: 600;
  color: var(--cet-text-color);
  min-width: 45px;
  text-align: right;
}

/* ============================================================================
   加载状态
   ============================================================================ */
.cet-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--cet-text-muted);
}

.cet-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--cet-border-color);
  border-top-color: var(--cet-primary-color);
  border-radius: 50%;
  animation: cet-spin 0.8s linear infinite;
  margin-right: 10px;
}

@keyframes cet-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================================================
   响应式适配
   ============================================================================ */
@media (max-width: 768px) {
  .cet-fab {
    bottom: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
  }
  
  .cet-panel {
    bottom: 80px;
    right: 16px;
    left: 16px;
    width: auto;
  }
  
  .cet-toast-container {
    top: 16px;
    right: 16px;
    left: 16px;
  }
  
  .cet-toast {
    min-width: auto;
    max-width: none;
  }
}
`;
