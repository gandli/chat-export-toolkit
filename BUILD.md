# Chat Export Toolkit V2 - 源码骨架完成报告

## ✅ 已完成的工作

### 新增目录结构

```
chat-export-toolkit/
├── src/
│   ├── index.ts              # 主入口，包含 ChatExportToolkit 类
│   ├── types/
│   │   └── index.ts          # 统一类型定义（Conversation, Message, ExportOptions 等）
│   ├── core/
│   │   ├── index.ts          # 核心模块导出
│   │   ├── interfaces.ts     # 核心接口定义（IPlatformAdapter, INormalizer, IExporter, IStore, IRuntimeBridge）
│   │   ├── store.ts          # 存储实现（BrowserStore, MemoryStore）
│   │   └── runtime.ts        # 运行时桥接实现（跨 browser/node/userscript）
│   ├── adapters/
│   │   ├── index.ts          # 适配器注册表
│   │   └── base.ts           # PlatformAdapter 基类
│   ├── normalizers/
│   │   ├── index.ts          # 标准化器注册表
│   │   └── base.ts           # Normalizer 基类
│   ├── exporters/
│   │   ├── index.ts          # 导出器注册表
│   │   ├── base.ts           # Exporter 基类
│   │   └── json.ts           # JSON 导出器（示例实现）
│   ├── ui/
│   │   ├── index.ts          # UI 模块导出
│   │   ├── base.ts           # UI 基类
│   │   └── placeholder.ts    # 占位 UI 组件
│   └── utils/
│       └── index.ts          # 通用工具函数
├── fixtures/
│   ├── README.md             # 示例数据说明
│   └── sample-conversation.json  # 统一 Conversation schema 示例
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
└── vite.config.ts            # Vite 构建配置
```

### 核心接口与类型

#### 1. 统一 Conversation Schema (`src/types/index.ts`)

```typescript
interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: { ... };
}

interface Message {
  id: string;
  role: MessageRole;  // 'user' | 'assistant' | 'system' | 'tool' | 'unknown'
  content: MessageContent;
  timestamp: number;
  metadata?: { ... };
}
```

#### 2. PlatformAdapter 接口 (`src/core/interfaces.ts`)

```typescript
interface IPlatformAdapter {
  readonly platform: PlatformType;
  detect(): boolean;
  getConversation(conversationId?: string): Promise<RawConversation | null>;
  listConversations(): Promise<RawConversation[]>;
  extractMessages(rawConversation: RawConversation): RawMessage[];
}
```

#### 3. Normalizer 接口

```typescript
interface INormalizer {
  readonly platform: PlatformType;
  normalizeConversation(rawConversation: RawConversation): Promise<Conversation>;
  normalizeMessage(rawMessage: RawMessage, conversationId: string): Promise<Message>;
  normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]>;
}
```

#### 4. Exporter 接口

```typescript
interface IExporter {
  readonly format: string;
  exportConversation(conversation: Conversation, options: ExportOptions): Promise<ExportResult>;
  exportAll(conversations: Conversation[], options: ExportOptions): Promise<ExportResult>;
}
```

#### 5. Store 骨架

```typescript
interface IStore {
  set<T>(key: StoreKey, value: T): Promise<void>;
  get<T>(key: StoreKey): Promise<T | null>;
  delete(key: StoreKey): Promise<void>;
  query<T>(pattern: string, options?: StoreQueryOptions): Promise<T[]>;
  clear(): Promise<void>;
  isAvailable(): boolean;
}
```

#### 6. Runtime Bridge

```typescript
interface IRuntimeBridge {
  readonly capabilities: RuntimeCapabilities;
  init(): Promise<void>;
  fetch(url: string, options?: RequestInit): Promise<Response>;
  downloadFile(url: string, filename: string): Promise<void>;
  readClipboard?(): Promise<string>;
  writeClipboard?(text: string): Promise<void>;
  notify?(title: string, message: string): Promise<void>;
  dispose(): void;
}
```

### 最小可运行入口

`src/index.ts` 提供了清晰的初始化日志：

```typescript
const toolkit = new ChatExportToolkit();
await toolkit.init({
  platform: 'chatgpt',  // 可选
  ui: { container: '#app' }  // 可选
});
```

初始化后会输出：

```
╔════════════════════════════════════════════════════════╗
║     Chat Export Toolkit V2                            ║
║     Version: 2.0.0-alpha                              ║
╚════════════════════════════════════════════════════════╝
[Toolkit] Initializing...
[Toolkit] Runtime bridge initialized
[Toolkit] Store initialized
[Toolkit] ✅ Initialization complete
```

## 📋 文件职责说明

| 目录/文件 | 职责 |
|-----------|------|
| `src/types/` | 统一的类型定义，整个系统的基础 |
| `src/core/` | 核心接口和实现（Store, RuntimeBridge） |
| `src/adapters/` | 平台适配器层，负责从各平台提取原始数据 |
| `src/normalizers/` | 标准化层，将平台特定数据转换为统一 schema |
| `src/exporters/` | 导出层，将标准化数据导出为不同格式 |
| `src/ui/` | UI 组件层，提供用户界面 |
| `src/utils/` | 通用工具函数 |
| `fixtures/` | 示例数据和测试文件 |

## 🚀 后续实现建议

### 优先级 1：核心功能

1. **实现具体平台适配器**
   - `src/adapters/chatgpt.ts` - ChatGPT 适配器
   - `src/adapters/claude.ts` - Claude 适配器
   - `src/adapters/gemini.ts` - Gemini 适配器

2. **实现对应标准化器**
   - `src/normalizers/chatgpt.ts`
   - `src/normalizers/claude.ts`
   - `src/normalizers/gemini.ts`

3. **完善导出器**
   - `src/exporters/markdown.ts` - Markdown 导出
   - `src/exporters/html.ts` - HTML 导出

### 优先级 2：增强功能

4. **UI 组件**
   - `src/ui/conversation-list.ts` - 对话列表
   - `src/ui/export-panel.ts` - 导出面板
   - `src/ui/settings.ts` - 设置面板

5. **Store 增强**
   - IndexedDB 实现
   - 自动备份功能

### 优先级 3：高级功能

6. **批量导出**
7. **增量导出**
8. **云同步**

## 📝 建议 Commit Message

```
feat: 建立 Chat Export Toolkit V2 源码骨架

- 添加统一的 Conversation/Message schema (src/types/)
- 定义核心接口：PlatformAdapter, Normalizer, Exporter, Store, RuntimeBridge
- 实现基础类：BasePlatformAdapter, BaseNormalizer, BaseExporter, BaseUI
- 实现存储层：BrowserStore, MemoryStore
- 实现运行时桥接：RuntimeBridge（支持 browser/node/userscript）
- 添加 JSON 导出器示例实现
- 添加最小可运行入口和初始化日志
- 添加示例数据 fixtures/sample-conversation.json

技术栈：
- TypeScript 5.3+
- Vite 5.x
- 模块化架构，支持插件式扩展

后续工作：
1. 实现具体平台适配器（ChatGPT, Claude, Gemini）
2. 实现更多导出格式（Markdown, HTML）
3. 完善 UI 组件
```

## ⚠️ 注意事项

- ✅ 未修改现有 README 和 docs/PRD.md
- ✅ 未触碰 `userscripts/chat-export.user.js` 现有逻辑
- ✅ 仅实现骨架和接口，未实现复杂业务逻辑
- ✅ TypeScript 编译通过（`npx tsc --noEmit`）
- ⚠️ package.json / tsconfig / vite.config.ts 已创建（如需要可调整）

## 🔧 快速开始

```bash
cd chat-export-toolkit

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npx tsc --noEmit
```

## 🧪 测试

### 测试目录结构

```
tests/
├── unit/              # 单元测试：测试单个函数/类的内部逻辑
├── contracts/         # 契约测试：验证接口/数据格式的兼容性
├── golden/            # Golden 测试：对比预期输出，防止回归
├── integration/       # 集成测试：测试模块间协作
└── helpers/           # 测试辅助工具（工厂函数等）
```

### 运行测试

```bash
# 运行所有测试
bun test

# 使用 vitest（推荐）
bun vitest run

# 监视模式（开发时自动重跑）
bun test:watch

# 生成覆盖率报告
bun test:coverage

# 运行特定类型测试
bun test:unit          # 单元测试
bun test:contracts     # 契约测试
bun test:integration   # 集成测试

# 运行单个测试文件
bun vitest run tests/unit/ui-components.test.ts
```

### 测试说明

- **单元测试** (`tests/unit/`): 测试单个组件的内部逻辑
- **契约测试** (`tests/contracts/`): 验证各平台适配器遵守统一接口
- **Golden 测试** (`tests/golden/`): 对比导出输出与预期文件，防止回归
- **集成测试** (`tests/integration/`): 测试完整导出流程

详见 [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md) 和 [`tests/README.md`](tests/README.md)。
