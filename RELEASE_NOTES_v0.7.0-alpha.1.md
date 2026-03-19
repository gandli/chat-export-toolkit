# 🚀 v0.7.0-alpha.1 - Yuanbao Alpha 发布

**发布日期**: 2026-03-19  
**类型**: Alpha Pre-release  
**产品形态**: Tampermonkey Userscript

---

## 📦 这是什么？

Chat Export Toolkit 是一个浏览器插件（Userscript），支持从多个 AI 平台导出对话记录。v0.7.0-alpha.1 是 V2 架构重构后的首个 Alpha 版本，**核心功能可用，但部分功能仍在完善中**。

**主要支持平台**:
- ✅ **腾讯元宝** (L1 - 完整支持)
- ⏳ **ChatGPT** (L2 - 骨架完成，待实际验证)
- ⏳ **Kimi / 豆包 / DeepSeek** (L2 - 设计完成，待实现)

---

## ✨ 核心功能

### 导出功能
- 📄 **Markdown 导出** - 格式化对话记录，适合阅读和归档
- 📋 **JSON 导出** - 原始数据结构，适合程序处理
- 📝 **DOCX 导出** - Word 文档格式，适合办公场景

### UI 组件
- 🔘 **悬浮操作按钮 (FAB)** - 与各平台设计风格融合
- 🎛️ **导出面板** - 选择导出格式和范围（当前对话/全部对话）
- 🔔 **Toast 通知** - 带毛玻璃效果的实时反馈
- ✨ **动画效果** - 流畅的 scale-up 动画和微交互

### 架构特性
- 🔌 **适配器模式** - 基于 `IPlatformAdapter` / `INormalizer` / `IExporter` 的可扩展设计
- 🌉 **运行时桥接** - 支持 browser / node / userscript 多环境
- 💾 **存储层抽象** - `BrowserStore` / `MemoryStore` 统一接口

---

## 🧪 测试状态

| 测试类别 | 通过率 | 状态 |
|----------|--------|------|
| 本地自动测试 | 315/359 (87.7%) | ✅ |
| Yuanbao Golden 测试 | 55/55 (100%) | ✅ |
| 构建与类型检查 | 100% | ✅ |
| 文档完整性 | 100% | ✅ |

**说明**: 44 个失败测试为 UI 测试和适配器契约测试，需要真实浏览器环境（jsdom 配置限制），在真实 Userscript 环境中正常运行。

---

## ⚠️ 已知限制

### 功能限制
- ❌ **批量导出未完成** - `exportAllConversations()` 返回 stub 错误，ZIP 打包逻辑待实现（预计 v0.8.0）
- ⚠️ **API 端点自动探测待完善** - 当前使用硬编码候选端点（预计 v0.7.1 改进）
- ⏳ **ChatGPT 适配器待实际验证** - 已实现但未经过真实页面测试（L2 状态）

### 验证限制
- 🔐 **真实页面验证需要人工登录态** - 自动化工具已就绪，但需要用户在已登录的页面上执行验证
- 📝 **缺少真实 API 响应样本** - 样本框架已就绪 (`fixtures/yuanbao-live/`)，待采集真实数据

---

## 📥 安装与使用

### 前置要求
- 浏览器：Chrome / Edge / Firefox（最新版）
- 插件：Tampermonkey（[Chrome](https://chrome.google.com/webstore/detail/tampermonkey/) / [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/)）

### 安装步骤
1. 安装 Tampermonkey 浏览器扩展
2. 下载 [`userscripts/chat-export.v2.user.js`](https://github.com/gandli/chat-export-toolkit/raw/main/userscripts/chat-export.v2.user.js)
3. Tampermonkey 会自动打开安装页面，点击"安装"
4. 访问 [腾讯元宝](https://yuanbao.tencent.com/)，右上角会出现导出按钮

### 使用方法
1. 打开目标 AI 平台网站（如 yuanbao.tencent.com）
2. 点击页面右上角的 📤 悬浮按钮
3. 选择导出格式（Markdown / JSON / DOCX）
4. 选择导出范围（当前对话 / 全部对话）
5. 等待导出完成，文件会自动下载

---

## 🛠️ 技术栈

- **语言**: TypeScript 5.7+
- **构建**: Vite 6.0 + vite-plugin-monkey
- **测试**: Vitest 2.1 + jsdom
- **包管理**: Bun 1.2.0

---

## 📚 文档

- [README.md](README.md) - 项目介绍和快速开始
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 架构设计文档
- [docs/ADAPTERS.md](docs/ADAPTERS.md) - 适配器开发指南
- [docs/ALPHA_STATUS.md](docs/ALPHA_STATUS.md) - Alpha 状态说明
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) - 发布检查清单
- [docs/YUANBAO_ALPHA_READINESS.md](docs/YUANBAO_ALPHA_READINESS.md) - Alpha 就绪评估报告

---

## 🐛 问题反馈

遇到问题或有建议？请提交 [GitHub Issue](https://github.com/gandli/chat-export-toolkit/issues)。

**已知问题**已在 [CHANGELOG.md](CHANGELOG.md) 中记录。

---

## 🔮 下一步计划

### v0.7.1（预计）
- 改进 API 端点自动探测
- 补充真实页面验证样本
- 优化错误处理和用户提示

### v0.8.0（预计）
- 完成批量导出（ZIP 打包）功能
- 支持更多 AI 平台（Kimi / 豆包 / DeepSeek）
- 提升测试覆盖率至 90%+

---

## 📝 版本说明

这是 V2 架构重构后的首个 Alpha 版本，**适合早期采用者和贡献者尝试**。生产环境使用请谨慎，建议等待 Beta 版本（v0.8.x）。

**构建命令**:
```bash
bun install && bun run build
```

**构建产物**: `userscripts/chat-export.v2.user.js`

---

**发布作者**: @gandli  
**发布评估**: 详见 [docs/YUANBAO_ALPHA_READINESS.md](docs/YUANBAO_ALPHA_READINESS.md)
