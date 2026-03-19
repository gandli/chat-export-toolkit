# Browser Extension MVP

`extension/` 是浏览器扩展子项目，当前以 `WXT + Manifest V3` 为主线，优先支持 Chrome / Edge。

## 当前状态

- 已有 `manifest`
- 已有 `popup`
- 已有 `content script`
- 已有 `background`
- 已建立统一消息协议和导出模型引用
- 已有 `provider` 抽象
- 已接入 `ChatGPT` 当前对话导出骨架

## MVP 范围

- 浏览器：Chrome / Edge
- 导出对象：当前页面中的 AI 聊天记录
- 导出格式：`JSON`、`Markdown`
- 当前真实接入：`ChatGPT`
- 计划支持：Claude、Kimi、元宝、豆包、DeepSeek、Qwen

## 架构

```text
popup
  -> chrome.tabs.sendMessage()
content script
  -> provider detection
  -> provider.collectCurrentConversation()
  -> root exporters
  -> browser download
background
  -> MV3 service worker bootstrap
```

## 复用策略

扩展不是从零重写导出能力，而是尽量复用仓库根目录已有 userscript 演进出来的核心模块：

- `src/types/*`：统一 `Conversation / Message` 模型
- `src/adapters/*`：平台原始数据抓取
- `src/normalizers/*`：平台数据标准化
- `src/exporters/*`：Markdown / JSON 导出
- `extension/src/content/providers/*`：扩展侧站点适配和 DOM fallback

## 开发与构建

在仓库根目录执行：

```bash
bun run typecheck:extension
bun run build:extension
```

构建产物默认在 `extension/.output/` 或 WXT 输出目录，可用 Chrome / Edge 的“加载已解压的扩展程序”加载。

## 下一步

- 补强 ChatGPT API 捕获链路，降低 DOM 依赖
- 追加 Claude / Kimi / 元宝 provider
- 增加“导出全部对话”和导出偏好设置
- 做 popup -> content -> exporter 的端到端验证
