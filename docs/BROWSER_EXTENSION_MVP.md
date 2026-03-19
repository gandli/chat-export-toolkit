# Browser Extension MVP

## 目标

围绕“导出 AI chat 聊天记录”交付一个真实可运行的浏览器扩展 MVP，优先服务 Chrome / Edge，而不是继续把所有能力都塞进 userscript。

## 为什么独立出 `extension/`

- 现有 userscript 已经沉淀出 adapter / normalizer / exporter
- 浏览器扩展需要独立的 MV3 生命周期、权限模型和 UI 入口
- 把“扩展壳层”和“核心导出引擎”拆开，后续加平台时不会污染核心逻辑

## MVP 范围

### 浏览器

- Chrome
- Edge

### 已支持的平台

- ChatGPT：当前对话导出骨架，优先走 adapter + normalizer，失败时回退 DOM 提取

### 计划支持的平台

- Claude
- Kimi
- 元宝
- 豆包
- DeepSeek
- Qwen

### 导出范围

- 当前页面对话
- 导出格式：`JSON`、`Markdown`
- 统一模型：复用根目录 `src/types/index.ts` 中的 `Conversation` / `Message`

## 扩展架构

```text
popup
  -> 读取当前标签页状态
  -> 触发导出命令

content script
  -> detectProvider(window.location)
  -> provider.collectCurrentConversation()
  -> root exporter
  -> 触发浏览器下载

background
  -> MV3 service worker 入口
  -> 保留后续下载编排、设置同步、批量任务入口
```

## 代码分层

1. `extension/entrypoints/*`
   - WXT 入口层
   - 对应 popup / content / background
2. `extension/src/shared/*`
   - 扩展消息协议
   - 导出模型别名
3. `extension/src/content/providers/*`
   - 站点适配抽象
   - 每个平台独立 provider
4. `src/adapters/*`
   - 复用现有平台抓取逻辑
5. `src/normalizers/*`
   - 复用统一标准化逻辑
6. `src/exporters/*`
   - 复用 JSON / Markdown 导出能力

## 本轮已完成

- 建立 `extension/` 浏览器扩展子项目
- 采用 `WXT + Manifest V3` 作为主工具链
- 建立 popup / content / background / shared / providers 目录
- 统一扩展消息协议，收敛到一套入口链路
- 落地 `ChatGPTExtensionProvider`
- 复用 `ChatGPTAdapter + ChatGPTRNormalizer + root exporters`
- 为 ChatGPT 保留 DOM fallback，避免 API 路径失效时完全不可用

## 已知限制

- ChatGPT DOM fallback 仅覆盖常见文本结构
- 还没有“导出全部对话”
- 还没有设置页
- 背景脚本目前只保留 MVP service worker 入口，未承担复杂任务编排
- 其他平台 provider 仍是计划项

## 下一步建议

1. 补 ChatGPT API 捕获链路，提升稳定性
2. 追加 Claude / Kimi / 元宝 provider，形成第一批跨站点 MVP
3. 用 `chrome.storage` 保存导出格式、文件名策略等偏好
4. 增加扩展级集成测试，覆盖 popup -> content -> provider -> exporter
