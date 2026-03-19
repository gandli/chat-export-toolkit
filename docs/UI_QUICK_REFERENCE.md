# Chat Export Toolkit V2 - UI 快速参考

## 快速开始

```typescript
import { createUI } from 'chat-export-toolkit';

const ui = createUI({
  theme: 'auto',
  callbacks: {
    onExportStart: (options) => console.log('开始:', options),
    onExportProgress: (p, m) => console.log(`${p}%: ${m}`),
    onExportComplete: (result) => console.log('完成:', result),
    onExportError: (error) => console.error('错误:', error),
  },
});

await ui.init();
```

## API 速查

### 创建 UI

| 方法 | 说明 |
|------|------|
| `createUI(config)` | 创建 UI 实例 |
| `ui.init()` | 初始化 UI |
| `ui.destroy()` | 销毁 UI |

### 显示通知

```typescript
ui.showToast({
  type: 'success',  // 'success' | 'error' | 'warning' | 'info'
  title: '标题',
  message: '消息内容',
  duration: 3000,   // 毫秒，0 不自动关闭
});
```

### 更新进度

```typescript
ui.updateProgress({
  current: 5,
  total: 10,
  message: '处理中...',
});

// 清除进度
ui.updateProgress(null);
```

### 导出完成/失败

```typescript
ui.exportComplete(result);
ui.exportError(new Error('错误消息'));
```

### 状态管理

```typescript
const state = ui.getState();
ui.setState({ panelVisible: true });
```

## 配置选项

### UIConfig

```typescript
interface UIConfig {
  container?: HTMLElement | string;  // 容器
  theme?: 'light' | 'dark' | 'auto'; // 主题
  locale?: string;                    // 语言
  callbacks?: UIEventCallbacks;       // 回调
}
```

### UIEventCallbacks

```typescript
interface UIEventCallbacks {
  onExportStart?: (options) => void;
  onExportProgress?: (progress, message) => void;
  onExportComplete?: (result) => void;
  onExportError?: (error) => void;
}
```

## CSS 变量

```css
:root {
  --cet-primary-color: #007bff;
  --cet-success-color: #28a745;
  --cet-warning-color: #ffc107;
  --cet-danger-color: #dc3545;
  --cet-info-color: #17a2b8;
  --cet-bg-color: #ffffff;
  --cet-text-color: #212529;
  --cet-z-index: 999999;
}
```

## 组件类名

| 组件 | 类名 |
|------|------|
| FAB 按钮 | `.cet-fab` |
| 导出面板 | `.cet-panel` |
| Toast 容器 | `.cet-toast-container` |
| Toast | `.cet-toast` `.cet-toast-success` 等 |
| 进度条 | `.cet-progress` |
| 按钮 | `.cet-btn` `.cet-btn-primary` |

## 常用模式

### 完整导出流程

```typescript
try {
  ui.updateProgress({ current: 0, total: 10, message: '开始导出' });
  
  for (let i = 0; i <= 10; i++) {
    await doExport(i);
    ui.updateProgress({
      current: i,
      total: 10,
      message: `导出 ${i}/10`,
    });
  }
  
  ui.exportComplete({ success: true });
} catch (error) {
  ui.exportError(error as Error);
}
```

### 保存设置

```typescript
const ui = createUI({
  callbacks: {
    onExportStart: async (options) => {
      await store.set('settings:export', options);
    },
  },
});
```

### 链式 Toast

```typescript
ui.showToast({ type: 'info', title: '准备中', message: '请稍候', duration: 1000 });

setTimeout(() => {
  ui.showToast({ type: 'success', title: '完成', message: '导出成功', duration: 2000 });
}, 1000);
```

## 文件位置

```
src/ui/
├── components.ts      # 组件实现
├── styles.ts          # CSS 样式
├── index.ts           # 导出
├── example.ts         # 使用示例
└── components.test.ts # 测试
```

## 文档链接

- [完整 API 文档](UI_COMPONENTS.md)
- [实现总结](IMPLEMENTATION_SUMMARY.md)
- [架构文档](ARCHITECTURE.md)

---

**版本**: V2.0.0-alpha  
**更新**: 2026-03-19
