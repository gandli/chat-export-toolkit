# Chat Export Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.7.0--alpha.1-01B259.svg)](CHANGELOG.md)

**多站点 AI 对话导出工具包** — 基于 Tampermonkey Userscript 的可扩展多平台架构

> 项目已从 Yuanbao 专用脚本重构为 V2 架构，支持通过适配器扩展多个 AI 平台。当前 **Yuanbao** 支持完整（L1），**ChatGPT** 已实现骨架（L2，待实际页面验证），其他平台规划中。
>
> **状态**: Alpha — 核心架构完成，主要功能可用，部分特性仍在开发中。**当前产品形态为 Tampermonkey Userscript**。
>
> **Alpha 发布就绪**: Yuanbao 已达到 Alpha 发布标准（55 个 Golden 测试通过，文档和工具链完整）。详见 [docs/YUANBAO_ALPHA_READINESS.md](docs/YUANBAO_ALPHA_READINESS.md)

---

🌐 **在线介绍页**: [gandli.github.io/chat-export-toolkit](https://gandli.github.io/chat-export-toolkit/)

---

## ✨ 核心特性

- **🔌 可扩展架构** — 基于适配器模式，支持为不同 AI 平台添加导出支持
- **📦 多格式导出** — Markdown / JSON / DOCX，满足不同使用场景
- **⚡ 零配置导出** — 自动拦截 API 请求，无需手动复制粘贴
- **🗂️ 批量导出** — 支持导出全部历史对话（ZIP 打包）
- **🎨 原生 UI** — 与各平台设计风格融合的界面

---

## 📊 平台支持状态

| 平台 | 适配器 | 标准化器 | 导出器 | 状态 |
|------|--------|----------|--------|------|
| **腾讯元宝 (Yuanbao)** | ✅ | ✅ | ✅ | **L1 - 完整支持** |
| **ChatGPT** | ✅ | ✅ | ⚠️ | **L2 - 骨架完成** |
| **Kimi** | ✅ | ✅ | ⚠️ | **L2 - 骨架完成** |
| **豆包** | ✅ | ✅ | ⚠️ | **L2 - 骨架完成** |
| **Claude** | ✅ | ✅ | ⚠️ | **L2 - 骨架完成** |
| **通义千问** | — | — | — | L3 - 规划中 |
| **DeepSeek** | — | — | — | L3 - 规划中 |
| **文心一言** | — | — | — | L3 - 规划中（待定） |

### 能力分级说明

- **L1 (完整支持)** — 适配器、标准化器、导出器全部实现，可在实际页面使用
- **L2 (骨架完成)** — 核心代码已实现，但未经过实际页面验证，可能需要调整
- **L3 (规划中)** — 已列入路线图，等待实现

当前 **Yuanbao** 为唯一 L1 支持平台。**ChatGPT、Kimi、豆包、Claude** 为 L2 状态（骨架完成，待验证）。其他平台详见 [docs/CN_PLATFORM_MATRIX.md](docs/CN_PLATFORM_MATRIX.md) 和 [docs/ALPHA_STATUS.md](docs/ALPHA_STATUS.md)。

---

## 🛠️ 安装与使用

### 前置要求

- [Bun](https://bun.sh/) 1.2+（推荐）或 Node.js 18+（仅开发/构建时需要）
- [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展

### 快速开始

#### 直接使用（推荐）

1. 确保浏览器已安装 Tampermonkey 扩展
2. 从源码构建脚本：`bun install && bun run build`，产物为 `userscripts/chat-export.v2.user.js`
3. 在 Tampermonkey 中新建脚本，粘贴构建产物内容并保存
4. 访问对应平台网站（如 [腾讯元宝](https://yuanbao.tencent.com/)），页面右下角会出现导出按钮

> 也可以加载 `extension/` 目录的 Chrome MV3 扩展版本（`extension/.output/chrome-mv3/`）。

#### 开发/构建

```bash
# 克隆仓库
cd chat-export-toolkit

# 安装依赖
bun install

# 开发模式（监听构建）
bun run dev

# 生产构建
bun run build

# 类型检查
bun run typecheck
```

构建产物位于 `userscripts/chat-export.v2.user.js`。

---

## 📂 目录结构

```text
chat-export-toolkit/
├── src/
│   ├── index.ts              # 主入口 (ChatExportToolkit 类)
│   ├── types/                # 统一类型定义 (Conversation, Message 等)
│   ├── core/                 # 核心接口与实现
│   │   ├── interfaces.ts     # IPlatformAdapter, INormalizer, IExporter 等
│   │   ├── store.ts          # 存储层 (BrowserStore, MemoryStore)
│   │   ├── runtime.ts        # 运行时桥接 (跨 browser/node/userscript)
│   │   └── interceptor.ts    # API 请求拦截器
│   ├── adapters/             # 平台适配器层
│   │   ├── base.ts           # BasePlatformAdapter 基类
│   │   ├── yuanbao.ts        # 元宝适配器 (L1)
│   │   └── chatgpt.ts        # ChatGPT 适配器 (L2)
│   ├── normalizers/          # 标准化层
│   │   ├── base.ts           # BaseNormalizer 基类
│   │   ├── yuanbao.ts        # 元宝标准化器 (L1)
│   │   └── chatgpt.ts        # ChatGPT 标准化器 (L2)
│   ├── exporters/            # 导出层
│   │   ├── base.ts           # BaseExporter 基类
│   │   ├── json.ts           # JSON 导出器
│   │   ├── markdown.ts       # Markdown 导出器
│   │   └── docx.ts           # DOCX 导出器
│   ├── ui/                   # UI 组件层
│   │   ├── base.ts           # BaseUI 基类
│   │   └── components.ts     # FAB 按钮、导出面板等
│   └── utils/                # 通用工具函数
├── fixtures/                 # 示例数据与测试文件
├── userscripts/              # 构建产物 (Tampermonkey Userscript)
├── docs/                     # 技术文档
│   ├── PRD.md                # 产品需求文档
│   ├── ARCHITECTURE.md       # 架构说明
│   ├── ADAPTERS.md           # 适配器开发指南
│   └── ...
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🏗️ V2 架构说明

### 数据流

```text
页面加载
   ↓
RuntimeBridge 初始化 (环境检测)
   ↓
Store 初始化 (localStorage)
   ↓
平台检测 (detectPlatform)
   ↓
Adapter → Normalizer → Exporter 初始化
   ↓
Interceptor 安装 (捕获 API 请求)
   ↓
UI 初始化 (FAB + Panel)
   ↓
等待用户操作
```

### 核心接口

```typescript
// 平台适配器
interface IPlatformAdapter {
  detect(): boolean;
  getConversation(id?: string): Promise<RawConversation>;
  listConversations(): Promise<RawConversation[]>;
}

// 标准化器
interface INormalizer {
  normalizeConversation(raw: RawConversation): Promise<Conversation>;
  normalizeMessage(raw: RawMessage): Promise<Message>;
}

// 导出器
interface IExporter {
  exportConversation(conv: Conversation, options: ExportOptions): Promise<ExportResult>;
}
```

详细架构文档见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

---

## ⚠️ 当前限制与风险

### 技术限制

1. **实际数据捕获待验证** — Interceptor 依赖各平台的 API 请求格式，需要在真实页面上测试验证
2. **批量导出未完成** — `exportAllConversations()` 当前返回 stub 错误，ZIP 打包逻辑待实现
3. **API 端点探测** — 当前使用硬编码候选端点，自动探测逻辑待完善
4. **ChatGPT 支持** — 适配器已实现但未经过实际页面验证，可能需要根据实际 API 调整

### 使用风险

- **API 变更风险** — 各平台 API 可能随时变更，导致拦截器失效
- **CORS 限制** — 部分平台可能有严格的 CORS 策略，影响请求拦截
- **DOM 回退** — 当 API 拦截失败时，DOM 解析可能无法获取完整内容
- **浏览器兼容性** — 主要在 Chrome/Firefox 上测试，Safari 兼容性待验证

### 安全提示

- 本脚本仅在浏览器本地运行，不向任何外部服务器发送数据
- 导出的文件存储在本地，请妥善保管
- 不要在不信任的网站上安装此脚本

---

## 📖 文档索引

### 核心文档
- [产品需求文档 (PRD)](docs/PRD.md) — 产品背景与功能规划
- [架构说明](docs/ARCHITECTURE.md) — V2 架构详解
- [适配器开发指南](docs/ADAPTERS.md) — 如何为新平台添加支持
- [Tampermonkey 定位说明](docs/TAMPERMONKEY_POSITIONING.md) — 当前产品形态说明
- [变更日志](CHANGELOG.md) — 版本历史

### 发布相关
- [Alpha 状态说明](docs/ALPHA_STATUS.md) — 当前状态、已知限制、路线图
- [发布检查清单](docs/RELEASE_CHECKLIST.md) — 发布前验证步骤
- [测试策略](docs/TESTING_STRATEGY.md) — 测试层级与验证方式

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

**当前优先任务**（v0.7.x - v0.8.x）：

1. 在 ChatGPT 实际页面上验证 L2 适配器
2. 实现批量导出（ZIP 打包）功能
3. 添加更多平台适配器（Kimi, 豆包，Claude 等）
4. 完善 E2E 测试覆盖

详见 [docs/ALPHA_STATUS.md](docs/ALPHA_STATUS.md) 了解完整路线图。

---

## 📄 许可证

MIT License

---

## 📝 关于本项目

本项目起源于腾讯元宝的对话导出脚本 (V1)，于 2026 年 3 月重构为 V2 架构。V2 的核心目标是：

- **可扩展** — 通过适配器模式支持多平台
- **可维护** — 清晰的模块划分和类型定义
- **可测试** — 统一的接口便于单元测试和集成测试

**当前版本**: v0.7.0-alpha.1  
**产品形态**: Tampermonkey Userscript (`userscripts/chat-export.v2.user.js`)

目前处于 **Alpha 阶段** — 核心架构已完成，主要功能可用，但部分特性（如批量导出、更多平台支持）仍在开发中。欢迎试用和反馈，但请勿在生产环境中依赖。

详见 [docs/ALPHA_STATUS.md](docs/ALPHA_STATUS.md) 了解当前状态和已知限制。
