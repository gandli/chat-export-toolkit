# Browser Extension MVP

`extension/` 是浏览器扩展子项目，当前以 `WXT + Manifest V3` 为主线，优先支持 Chrome / Edge。

## 当前状态

- 已有 `manifest`
- 已有 `popup`
- 已有 `content script`
- 已有 `background`
- 已建立统一消息协议和导出模型引用
- 已有 `provider` 抽象
- 已接入 `ChatGPT` 当前对话导出链路

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
  -> root normalizers / exporters
  -> export payload
popup
  -> chrome.runtime.sendMessage()
background
  -> chrome.downloads.download()
background
  -> MV3 service worker bootstrap
```

## 当前可用能力

- 支持站点：`chat.openai.com`、`chatgpt.com`
- 导出对象：当前对话
- 导出格式：`JSON`、`Markdown`
- 当前链路：`popup -> content provider -> root exporter -> background download`
- ChatGPT 抓取策略：
  - 优先尝试当前站点同源 API 拉取当前会话详情
  - API 不可用时回退到 DOM 提取可见消息
  - `mapping` 结构已按树顺序重建，避免消息乱序

## 本轮落地内容

- 让根目录 `JSONExporter` / `MarkdownExporter` 在扩展场景下可返回导出文本，不再只做浏览器直接下载
- 打通 popup 到 content 的导出请求，以及 content 到 background 的下载请求
- 为 `ExportResponse` 增加下载载荷，真正把文件落到浏览器下载
- 补强 `ChatGPTAdapter`：
  - 支持 `chatgpt.com`
  - 尝试通过同源接口获取当前会话详情/列表
  - 统一解析常见响应包裹层
- 补强 `ChatGPTRNormalizer` 的 `mapping` 顺序重建

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

- 在真实 ChatGPT 页面手测 API 分支是否稳定可用，记录样本
- 追加 Claude / Kimi / 元宝 provider
- 增加“导出全部对话”和导出偏好设置
- 增加页面内提示，区分 API 导出与 DOM fallback
