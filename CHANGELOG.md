# Changelog

All notable changes to this project will be documented in this file.

The project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned

- ZIP 打包批量导出功能
- Kimi / 豆包 / Claude 平台适配器
- 自动 API 端点探测
- 更多 E2E 测试覆盖

---

## [0.7.0-alpha.1] - 2026-03-19

> **V2 架构首次 Alpha 发布** — Yuanbao 平台完整支持，核心功能可用

### Added

#### 架构重构
- **适配器模式架构** — 基于 `IPlatformAdapter` / `INormalizer` / `IExporter` 接口的可扩展设计
- **多平台骨架** — 支持通过适配器扩展多个 AI 平台
- **运行时桥接** — `RuntimeBridge` 支持 browser / node / userscript 多环境
- **存储层抽象** — `BrowserStore` / `MemoryStore` 统一存储接口

#### 平台支持
- **Yuanbao 适配器 (L1)** — 完整实现：适配器、标准化器、导出器
- **ChatGPT 适配器 (L2)** — 骨架完成，待实际页面验证
- **Kimi / 豆包 / DeepSeek** — 适配器设计文档完成，待实现

#### 导出器
- **Markdown 导出器** — 支持对话转 Markdown 格式
- **JSON 导出器** — 支持原始数据结构导出
- **DOCX 导出器** — 支持 Word 文档格式导出

#### UI 组件
- **FAB 按钮** — 悬浮操作按钮，与各平台设计风格融合
- **导出面板** — 支持选择导出格式、范围（当前/全部）
- **Toast 通知** — 带毛玻璃效果的反馈提示
- **动画效果** — scale-up (`pop-in`) 动画、微交互优化

#### 测试与验证
- **Yuanbao Golden Tests** — 55 个边界情况测试全部通过
- **Alpha 就绪检查脚本** — `scripts/check-alpha-ready.ts` 自动汇总发布状态
- **真实环境验证准备检查** — `scripts/validate-live-ready.ts` 20/20 通过

#### 文档
- **架构文档** — `docs/ARCHITECTURE.md` / `docs/ADAPTERS.md`
- **适配器笔记** — ChatGPT / Kimi / 豆包 / DeepSeek 适配器设计文档
- **Alpha 就绪评估** — `docs/YUANBAO_ALPHA_READINESS.md` 完整评估报告
- **发布检查清单** — `docs/RELEASE_CHECKLIST.md` / `docs/RELEASE_COMMANDS.md`

### Changed

- 从单站点脚本演进为多平台架构
- 重构类型系统 — 统一 `Conversation` / `Message` 等核心类型
- 优化 CSS 变量系统 — 使用品牌色板（绿/黑/灰/白）
- 改进拦截器设计 — 支持多 API 端点候选

### Known Limitations

- **批量导出未完成** — `exportAllConversations()` 返回 stub 错误，ZIP 打包逻辑待实现（预计 v0.8.0）
- **实际数据捕获待验证** — Interceptor 需要在真实页面上测试
- **ChatGPT 支持** — 适配器已实现但未经过实际页面验证（L2 状态）
- **API 端点探测** — 当前使用硬编码候选端点（预计 v0.7.1 改进）

### Test Status

- **总测试**: 315/359 通过 (87.7%)
- **Yuanbao Golden 测试**: 55/55 通过 (100%)
- **失败测试**: 44 个（UI 测试和适配器契约测试，需要浏览器环境）

### Release Readiness

**Yuanbao 平台**: ✅ **已就绪**

- 构建与类型检查：100% ✅
- 本地自动测试：87.7% ✅
- Golden 测试：100% ✅
- 文档完整性：100% ✅
- 真实页面验证：⚠️ 需要人工登录态（工具已就绪）

---

## [0.6.0-alpha] - 2026-03-03

### Added

- **Multi-format Export** — Markdown / JSON / DOCX 导出支持
- **Batch Export** — 历史对话批量获取框架
- **Quick Copy** — 一键复制当前对话
- **Background Acceleration** — 页面加载时自动缓存对话列表
- **Cross-platform Compatibility** — 适配多种 API 响应格式

---

## [0.5.1] - 2026-03-04

### Optimized

#### UI/UX 升级
- 新品牌色板（绿/黑/灰/白）
- CSS 变量重构，提升可维护性
- 主面板 scale-up 动画 (`pop-in`)
- Toast 通知毛玻璃效果
- 分段控制器和按钮微交互优化

#### 文档改进
- 新增 `CHANGELOG.md`
- 新增 `docs/PRD.md`
- 优化 `README.md`

---

## [0.5.0] - 2026-03-03

### Added

- **多格式导出** — Markdown / JSON / DOCX
- **批量导出** — 完整历史对话获取 + ZIP 打包
- **快速复制** — 一键复制当前对话
- **后台加速** — 页面加载时自动获取对话列表
- **跨平台兼容** — 适配多种元宝 API 响应格式和 DOM 回退

---

## [0.1.0] - 2026-02-xx

### Initial

- 核心逻辑：抓包 + 对话转 Markdown
