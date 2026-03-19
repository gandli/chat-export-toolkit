# Chat Export Toolkit V2 - UI 组件文档

## 概述

V2 UI 组件提供了完整的用户界面，包括：

- **FAB 浮动按钮** - 快速访问导出功能
- **导出面板** - 选择导出范围和格式
- **Toast 通知** - 实时反馈操作结果
- **进度条** - 显示导出进度

## 快速开始

### 基本使用

```typescript
import { createUI, type UIConfig } from '../ui';

// 创建 UI 实例
const ui = createUI({
  theme: 'auto', // 'light' | 'dark' | 'auto'
  locale: 'zh-CN',
  callbacks: {
    onExportStart: (options) => {
      console.log('导出开始:', options);
      // options.scope: 'current' | 'all'
      // options.format: 'json' | 'markdown' | ...
    },
    onExportProgress: (progress, message) => {
      console.log(`进度：${progress}% - ${message}`);
    },
    onExportComplete: (result) => {
      console.log('导出完成:', result);
    },
    onExportError: (error) => {
      console.error('导出失败:', error);
    },
  },
});

// 初始化 UI
await ui.init();
```

### 与 Store 集成

```typescript
import { createUI, createStore } from '../index';

const store = createStore();
const ui = createUI({
  callbacks: {
    onExportStart: async (options) => {
      // 保存导出状态到 Store
      await store.set('settings:export-options', options);
    },
    onExportComplete: async (result) => {
      // 保存导出历史
      const history = await store.get('cache:export-history') || [];
      history.push({
        timestamp: Date.now(),
        ...result,
      });
      await store.set('cache:export-history', history);
    },
  },
});

await ui.init();
```

## 组件 API

### ChatExportUI 类

#### 构造函数参数

```typescript
interface UIConfig {
  container?: HTMLElement | string;  // 容器元素或选择器
  theme?: 'light' | 'dark' | 'auto'; // 主题
  locale?: string;                    // 语言
  callbacks?: UIEventCallbacks;       // 事件回调
}
```

#### 方法

##### `init(): Promise<void>`

初始化 UI，注入样式和创建 DOM 元素。

```typescript
await ui.init();
```

##### `showToast(options: ToastOptions): number`

显示 Toast 通知。

```typescript
ui.showToast({
  type: 'success', // 'success' | 'error' | 'warning' | 'info'
  title: '导出完成',
  message: '文件已下载到您的设备',
  duration: 3000, // 毫秒，0 表示不自动关闭
});
```

##### `updateProgress(progress: ProgressOptions | null): void`

更新进度条。

```typescript
ui.updateProgress({
  current: 5,
  total: 10,
  message: '正在导出第 5 个会话...',
});

// 清除进度
ui.updateProgress(null);
```

##### `exportComplete(result: any): void`

标记导出完成。

```typescript
ui.exportComplete({
  success: true,
  outputPath: '/path/to/file.json',
  stats: {
    messageCount: 100,
    conversationCount: 5,
  },
});
```

##### `exportError(error: Error): void`

标记导出失败。

```typescript
ui.exportError(new Error('网络错误'));
```

##### `getState(): UIState`

获取当前 UI 状态。

```typescript
const state = ui.getState();
console.log(state);
// {
//   panelVisible: true,
//   exportScope: 'current',
//   exportFormat: 'json',
//   isExporting: false,
//   progress: null
// }
```

##### `setState(state: Partial<UIState>): void`

更新 UI 状态。

```typescript
ui.setState({
  panelVisible: true,
  exportScope: 'all',
});
```

##### `destroy(): void`

销毁 UI，清理资源。

```typescript
ui.destroy();
```

### 类型定义

#### ToastOptions

```typescript
interface ToastOptions {
  type: ToastType;           // 'success' | 'error' | 'warning' | 'info'
  title: string;             // 标题
  message: string;           // 消息内容
  duration?: number;         // 自动关闭时间（毫秒），0 表示不自动关闭
}
```

#### ProgressOptions

```typescript
interface ProgressOptions {
  current: number;           // 当前进度
  total: number;             // 总量
  message?: string;          // 进度描述
}
```

#### UIState

```typescript
interface UIState {
  panelVisible: boolean;     // 面板是否可见
  exportScope: 'current' | 'all'; // 导出范围
  exportFormat: ExportFormat;     // 导出格式
  isExporting: boolean;      // 是否正在导出
  progress: ProgressOptions | null; // 进度信息
}
```

#### UIEventCallbacks

```typescript
interface UIEventCallbacks {
  onExportStart?: (options: { 
    scope: 'current' | 'all'; 
    format: ExportFormat;
  }) => void;
  onExportProgress?: (progress: number, message: string) => void;
  onExportComplete?: (result: any) => void;
  onExportError?: (error: Error) => void;
  onConversationSelect?: (conversation: Conversation) => void;
}
```

## 样式定制

### CSS 变量

UI 组件使用 CSS 变量进行主题定制：

```css
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
```

### 暗黑模式

暗黑模式自动根据系统偏好切换，也可以手动设置：

```typescript
const ui = createUI({
  theme: 'dark', // 强制暗黑模式
});
```

## 与 V1 的差异

### V1 UI 特点

- 直接操作 DOM，无组件化
- 样式内联在 Userscript 中
- 状态管理分散
- 无 Toast 系统，使用简单的 alert/confirm

### V2 UI 优势

1. **组件化架构** - 独立的 UI 组件类，易于维护和测试
2. **状态管理** - 统一的状态管理，支持订阅模式
3. **主题系统** - 支持亮色/暗色主题，CSS 变量定制
4. **Toast 通知** - 优雅的通知系统，支持多种类型
5. **进度反馈** - 实时进度显示，支持单条/批量导出
6. **类型安全** - 完整的 TypeScript 类型定义

## 测试建议

### 单元测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ChatExportUI } from '../ui/components';

describe('ChatExportUI', () => {
  let ui: ChatExportUI;

  beforeEach(() => {
    ui = new ChatExportUI();
  });

  it('should initialize successfully', async () => {
    await ui.init();
    expect(ui.getState().panelVisible).toBe(false);
  });

  it('should toggle panel visibility', async () => {
    await ui.init();
    ui.setState({ panelVisible: true });
    expect(ui.getState().panelVisible).toBe(true);
    ui.setState({ panelVisible: false });
    expect(ui.getState().panelVisible).toBe(false);
  });

  it('should show toast', async () => {
    await ui.init();
    const toastId = ui.showToast({
      type: 'info',
      title: 'Test',
      message: 'Test message',
      duration: 1000,
    });
    expect(toastId).toBeGreaterThan(0);
  });
});
```

### 集成测试

在真实浏览器环境中测试：

```typescript
// 在 Userscript 中
import { ChatExportToolkit, createUI } from '../index';

const toolkit = new ChatExportToolkit();
await toolkit.init({
  ui: {
    container: document.body,
    theme: 'auto',
    callbacks: {
      onExportStart: (options) => {
        console.log('Export started:', options);
      },
      onExportComplete: (result) => {
        console.log('Export completed:', result);
      },
    },
  },
});
```

### 手动测试清单

- [ ] FAB 按钮点击展开/收起面板
- [ ] 面板选项切换（当前会话/全部会话）
- [ ] 格式选择（JSON/Markdown）
- [ ] 导出按钮点击触发回调
- [ ] Toast 通知显示和自动关闭
- [ ] 进度条更新
- [ ] 主题切换（亮色/暗色）
- [ ] 响应式布局（移动端适配）

## 迁移指南

### 从 V1 迁移到 V2

**V1 代码：**

```javascript
// V1: 直接操作 DOM
function ensureUi() {
  const panel = document.createElement('div');
  panel.id = 'cet-panel';
  panel.innerHTML = '...';
  document.body.appendChild(panel);
}
```

**V2 代码：**

```typescript
// V2: 使用组件
import { createUI } from '../ui';

const ui = createUI({
  container: document.body,
  callbacks: {
    onExportStart: (options) => {
      // 处理导出
    },
  },
});

await ui.init();
```

## 常见问题

### Q: 如何自定义 Toast 样式？

A: 通过 CSS 变量或覆盖样式：

```css
.cet-toast-success {
  border-left-color: #your-color;
}
```

### Q: 如何禁用自动关闭？

A: 设置 `duration: 0`：

```typescript
ui.showToast({
  type: 'info',
  title: '重要提示',
  message: '此消息不会自动关闭',
  duration: 0,
});
```

### Q: 如何手动关闭 Toast？

A: 使用 `hideToast` 方法：

```typescript
const toastId = ui.showToast({...});
ui.hideToast(toastId);
```

### Q: 进度条如何更新？

A: 调用 `updateProgress` 方法：

```typescript
for (let i = 0; i < total; i++) {
  // 处理...
  ui.updateProgress({
    current: i + 1,
    total: total,
    message: `处理中 ${i + 1}/${total}`,
  });
}
```

## 下一步计划

- [ ] 添加对话列表组件
- [ ] 添加设置面板组件
- [ ] 添加搜索功能
- [ ] 添加批量选择功能
- [ ] 支持自定义导出模板
- [ ] 支持拖拽排序

---

**最后更新**: 2026-03-19
**版本**: V2.0.0-alpha
