# Chat Export Toolkit V2 - 架构文档

## 1. 产品定位

Chat Export Toolkit 是一个**多站点 AI 对话导出平台**，以浏览器插件（Tampermonkey Userscript）形式运行，提供：

- **零配置导出**：一键导出当前或全部对话
- **多格式支持**：Markdown、JSON、DOCX
- **批量导出**：ZIP 打包全部历史对话
- **无感缓存**：后台静默预加载对话数据

**V2 核心目标**：从单一站点（腾讯元宝）扩展为多站点平台，支持任意 AI 对话网站的导出能力。

---

## 2. 能力分级（L1/L2/L3）

### L1 - 基础导出（必须）

- 拦截当前页面的对话 API 请求
- 解析对话数据结构
- 导出为 Markdown 格式
- 单会话导出

**适用场景**：快速备份单次对话

### L2 - 完整导出（推荐）

- L1 全部能力
- 支持 JSON、DOCX 格式
- 批量导出（ZIP 打包）
- 后台预加载全部历史对话
- 对话列表自动发现

**适用场景**：知识库构建、本地归档

### L3 - 高级导出（可选）

- L2 全部能力
- 自定义导出模板
- 图片/附件处理
- 多站点并发导出
- 导出任务队列管理
- 增量导出（仅新增对话）

**适用场景**：企业级归档、多账号管理

---

## 3. 统一数据模型

所有站点的对话数据必须转换为以下统一模型：

```typescript
// 核心数据类型
interface Conversation {
  id: string;           // 会话唯一标识
  title: string;        // 会话标题
  createdAt?: number;   // 创建时间戳（毫秒）
  updatedAt?: number;   // 更新时间戳（毫秒）
  messages: Message[];  // 消息列表
  metadata?: Record<string, any>; // 站点特定元数据
}

interface Message {
  id?: string;          // 消息 ID（可选）
  role: 'user' | 'assistant' | 'system'; // 角色
  content: string;      // 消息内容（纯文本或 Markdown）
  createdAt?: number;   // 消息时间戳
  metadata?: {          // 站点特定元数据
    think?: string;     // 思考过程（如元宝的 Think 块）
    attachments?: Attachment[];
    [key: string]: any;
  };
}

interface Attachment {
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  filename?: string;
  size?: number;
}

// 导出结果
interface ExportResult {
  conversationId: string;
  format: 'md' | 'json' | 'docx';
  content: string | Blob;
  filename: string;
  exportedAt: string;   // ISO 8601 时间戳
}
```

---

## 4. 目录结构

```
chat-export-toolkit/
├── docs/                      # 文档
│   ├── ARCHITECTURE.md        # 架构文档（本文件）
│   ├── MIGRATION.md           # 迁移指南
│   ├── ADAPTERS.md            # 适配器开发指南
│   └── PRD.md                 # 产品需求文档
├── src/                       # 源代码（V2 新增）
│   ├── core/                  # 核心引擎
│   │   ├── interceptor.ts     # 请求拦截器
│   │   ├── parser.ts          # 数据解析器
│   │   ├── exporter.ts        # 导出引擎
│   │   └── storage.ts         # 本地缓存
│   ├── adapters/              # 站点适配器
│   │   ├── yuanbao/           # 腾讯元宝
│   │   │   ├── adapter.ts     # 适配器实现
│   │   │   ├── parser.ts      # 数据结构解析
│   │   │   └── api.ts         # API 端点定义
│   │   ├── kimi/              # Kimi（待实现）
│   │   └── ...                # 其他站点
│   ├── exporters/             # 格式导出器
│   │   ├── markdown.ts        # Markdown 导出
│   │   ├── json.ts            # JSON 导出
│   │   └── docx.ts            # DOCX 导出
│   └── types/                 # 类型定义
│       └── index.ts
├── userscripts/               # 构建输出（Userscript 入口）
│   └── chat-export.user.js    # 由 src 构建生成
├── package.json               # 项目配置（V2 新增）
├── tsconfig.json              # TypeScript 配置（V2 新增）
├── vite.config.ts             # 构建配置（V2 新增）
├── README.md
├── CHANGELOG.md
└── .gitignore
```

---

## 5. 核心模块设计

### 5.1 请求拦截器（Interceptor）

**职责**：拦截 XHR/Fetch 请求，捕获对话 API 响应

**接口**：
```typescript
interface Interceptor {
  install(): void;
  uninstall(): void;
  onMatch(pattern: RegExp, handler: (response: any, url: string) => void): void;
}
```

**实现要点**：
- 支持 XHR 和 Fetch 两种拦截方式
- 正则匹配 API URL 模式
- 自动解析 JSON 响应
- 错误处理与降级

### 5.2 数据解析器（Parser）

**职责**：将站点特定数据结构转换为统一模型

**接口**：
```typescript
interface Parser<T = any> {
  parse(raw: T): Conversation;
  parseList(raw: any): ConversationMeta[];
}

interface ConversationMeta {
  id: string;
  title: string;
  createdAt?: number;
}
```

### 5.3 适配器（Adapter）

**职责**：封装站点特定逻辑，提供统一接口

**接口**：
```typescript
interface Adapter {
  name: string;              // 站点名称
  domain: string | string[]; // 匹配的域名
  capabilities: Capability[]; // 支持的能力（L1/L2/L3）
  
  // 生命周期
  init(): Promise<void>;
  destroy(): void;
  
  // 数据获取
  getCurrentConversation(): Promise<Conversation | null>;
  getAllConversations(): Promise<ConversationMeta[]>;
  getConversationDetail(id: string): Promise<Conversation>;
  
  // 导出
  export(conv: Conversation, format: 'md' | 'json' | 'docx'): Promise<ExportResult>;
}

type Capability = 'L1' | 'L2' | 'L3';
```

### 5.4 导出器（Exporter）

**职责**：将统一模型转换为特定格式

**接口**：
```typescript
interface Exporter {
  format: 'md' | 'json' | 'docx';
  export(conv: Conversation): Promise<string | Blob>;
}
```

### 5.5 存储（Storage）

**职责**：本地缓存对话数据

**接口**：
```typescript
interface Storage {
  get(id: string): Promise<Conversation | null>;
  set(id: string, conv: Conversation): Promise<void>;
  delete(id: string): Promise<void>;
  getAll(): Promise<Conversation[]>;
  clear(): Promise<void>;
}
```

**实现**：V1 使用 `Map` 内存缓存，V2 可选 IndexedDB 持久化

---

## 6. 适配器/导出器接口边界

### 适配器负责：

- 站点特定的 API 端点发现
- 站点特定的数据结构解析
- 站点特定的认证/会话管理
- 调用统一导出器进行格式转换

### 导出器负责：

- 格式特定的内容生成（Markdown/JSON/DOCX）
- 不关心数据来源（适配器已转换为统一模型）
- 不关心站点特定逻辑

### 边界原则：

1. **适配器不直接生成导出内容**：只负责数据转换
2. **导出器不访问网络**：只处理已解析的数据
3. **统一模型是唯一数据交换格式**：适配器和导出器通过统一模型通信

---

## 7. 运行流程

### 7.1 单会话导出流程

```
用户点击导出
    ↓
Adapter.getCurrentConversation()
    ↓
  [拦截器捕获 API 响应]
    ↓
  Parser.parse(rawData) → Conversation
    ↓
Exporter.export(conv, format) → content
    ↓
下载文件
```

### 7.2 批量导出流程

```
用户点击批量导出
    ↓
Adapter.getAllConversations() → ConversationMeta[]
    ↓
[并行] 对每个 meta:
  Adapter.getConversationDetail(meta.id) → Conversation
    ↓
  存入 Storage
    ↓
Exporter.export(conv, format)
    ↓
JSZip 打包
    ↓
下载 ZIP
```

---

## 8. 技术栈

| 组件 | V1 | V2 |
|------|----|----|
| 语言 | Vanilla JS (ES6+) | TypeScript |
| 构建 | 无（直接编写） | Vite |
| 样式 | CSS Variables | CSS Variables |
| 依赖 | JSZip | JSZip + 可选依赖 |
| 运行环境 | Tampermonkey | Tampermonkey / 浏览器扩展 |

---

## 9. 扩展新站点的步骤

1. **创建适配器目录**：`src/adapters/<site-name>/`
2. **实现 Adapter 接口**：定义 `adapter.ts`
3. **实现 Parser**：将站点数据转换为统一模型
4. **定义 API 端点**：记录对话列表和详情 API
5. **注册适配器**：在入口文件中添加站点匹配规则
6. **测试**：在目标站点验证导出功能
7. **文档**：在 `ADAPTERS.md` 中记录站点特定信息

详见 `ADAPTERS.md`。

---

## 10. 风险与限制

### 已知风险

1. **API 变更**：站点可能随时更改 API 结构，需保持适配器更新
2. **CORS 限制**：部分 API 可能无法直接访问
3. **反爬机制**：高频请求可能触发风控
4. **认证过期**：长期运行的脚本需处理会话过期

### 缓解措施

- 实现 API 端点动态发现机制
- 添加请求速率限制
- 实现认证状态检测与刷新
- 提供降级方案（DOM 解析）

---

## 11. 测试策略

### 单元测试

- Parser 解析逻辑（使用真实 API 响应快照）
- Exporter 格式生成（验证输出结构）
- Storage 读写操作

### 集成测试

- 完整导出流程（拦截 → 解析 → 导出）
- 多站点并发导出
- 批量导出 ZIP 验证

### E2E 测试

- 真实站点手动验证（每个适配器）
- 导出文件内容校验

### 测试数据

- 保存各站点的典型 API 响应快照
- 包含边界情况（空对话、长对话、特殊字符）

---

## 12. 版本规划

| 版本 | 目标 | 预计时间 |
|------|------|----------|
| V1（当前） | 腾讯元宝单站点 | 已完成 |
| V2.0 | 架构重构，支持多站点 | 第 1-2 周 |
| V2.1 | 新增 Kimi 适配器 | 第 3 周 |
| V2.2 | 新增 智谱清言 适配器 | 第 4 周 |
| V3.0 | 浏览器扩展版本 | 后续 |
