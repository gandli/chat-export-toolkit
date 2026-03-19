# ChatGPT 适配器实现总结

## 完成情况

### 已创建文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/adapters/chatgpt-types.ts` | ✅ 完成 | ChatGPT 特定类型定义 |
| `src/adapters/chatgpt.ts` | ✅ 完成 | ChatGPT 适配器实现（骨架） |
| `src/normalizers/chatgpt.ts` | ✅ 完成 | ChatGPT 标准化器实现（骨架） |
| `docs/CHATGPT_ADAPTER_NOTES.md` | ✅ 完成 | 设计说明文档 |
| `src/adapters/index.ts` | ✅ 已更新 | 注册 ChatGPT 适配器 |
| `src/normalizers/index.ts` | ✅ 已更新 | 注册 ChatGPT 标准化器 |
| `src/types/index.ts` | ✅ 无需修改 | 已包含 'chatgpt' 平台类型 |

### 代码统计

- **新增代码行数**: ~800 行
- **类型定义**: 20+ 接口/类型
- **TODO 标记**: 15+ 处（待实际样本验证）

---

## 实现内容

### 1. 类型定义 (`chatgpt-types.ts`)

```typescript
// 核心类型
- ChatGPTContentPart       // 内容块
- ChatGPTMessage           // 消息/轮次
- ChatGPTConversationDetail // 对话详情
- ChatGPTMessageNode       // mapping 节点
- ChatGPTConversationListItem // 列表项
- ChatGPTConversationList  // 列表响应

// 辅助类型
- ChatGPTApiEndpoints      // API 端点
- ChatGPTConversationMeta  // 对话元数据
- ChatGPTMessageBlock      // 消息块（标准化前）
- ChatGPTMessageNormalized // 标准化消息

// 常量
- CHATGPT_DOMAINS          // 域名列表
- CHATGPT_DETAIL_ENDPOINT_CANDIDATES
- CHATGPT_LIST_ENDPOINT_CANDIDATES
- CHATGPT_URL_PATTERNS     // URL 模式
```

### 2. 适配器实现 (`chatgpt.ts`)

**核心方法**:
- `detect()`: 域名检测（chat.openai.com 等）
- `getConversation()`: 获取单个对话
- `listConversations()`: 获取对话列表
- `extractMessages()`: 提取消息列表
- `getMetadata()`: 获取元数据

**内部方法**（TODO）:
- `discoverApiEndpoints()`: API 端点探测
- `fetchConversationDetail()`: 获取对话详情
- `fetchConversationList()`: 获取对话列表
- `extractConversationIdFromUrl()`: 从 URL 提取 ID
- `extractConversationMetasFromDom()`: DOM 提取
- `handleChatGPTResponse()`: 响应拦截处理

**能力级别**:
- L1: DOM 提取（框架已就绪，待实现具体选择器）
- L2: API 拦截（框架已就绪，待验证端点）
- L3: 主动调用（框架已就绪，待处理认证）

### 3. 标准化器实现 (`chatgpt.ts`)

**核心方法**:
- `normalizeConversation()`: 标准化对话
- `normalizeMessage()`: 标准化消息
- `normalizeAll()`: 批量标准化

**内部方法**:
- `normalizeChatGPTMessage()`: 标准化单个消息
- `mapChatGPTRole()`: 角色映射
- `extractMessageBlocks()`: 提取内容块
- `extractBlockContent()`: 提取单个内容块
- `extractMessagesFromData()`: 从数据中提取消息
- `extractMessagesFromMapping()`: 从 mapping 提取

**辅助函数**:
- `chatgptToMarkdown()`: 直接输出 Markdown

**支持的消息类型**:
- ✅ text: 普通文本
- ✅ code: 代码块（带语言标识）
- ✅ image: 图片（占位符）
- ✅ file: 文件附件（占位符）
- ✅ unsupported: 不支持的类型

---

## 设计决策

### 1. 为什么使用多结构兼容？

ChatGPT 的 API 响应可能有多种嵌套格式：
```typescript
// 可能的结构变体
{ messages: [...] }
{ mapping: {...} }
{ data: { messages: [...] } }
{ result: { mapping: {...} } }
```

**对策**: 在提取方法中按优先级尝试多种结构。

### 2. 为什么使用 TODO + 接口占位？

- ChatGPT 的真实数据结构需要实际样本验证
- 盲目实现可能导致错误假设
- 骨架代码定义了清晰的边界和接口

### 3. 为什么优先支持文本？

- 文本是最基本、最稳定的消息类型
- 多模态内容（图片、文件）处理复杂
- 可以分阶段实现：L1 文本 → L2 代码 → L3 多模态

---

## 风险点

### 1. 数据结构变化 ⚠️ 高
- ChatGPT 频繁更新前端
- **缓解**: 多结构兼容 + 容错逻辑

### 2. API 端点变化 ⚠️ 中
- `/backend-api/conversation` 可能变化
- **缓解**: 端点探测 + 候选列表

### 3. 认证问题 ⚠️ 中
- API 调用需要有效 Token
- **缓解**: 优先使用拦截方式

### 4. DOM 结构变化 ⚠️ 低
- DOM 选择器可能失效
- **缓解**: 使用稳定的属性选择器

---

## 后续工作

### 阶段 1: 验证数据结构（P0）

**需要什么**:
- [ ] ChatGPT 对话详情 API 响应样本
- [ ] ChatGPT 对话列表 API 响应样本
- [ ] 典型对话的 DOM 结构（HTML 或截图）

**如何获取**:
1. 在浏览器中打开 ChatGPT 对话
2. 打开开发者工具 → Network
3. 刷新页面，找到相关 API 请求
4. 复制响应 JSON
5. 保存为 `fixtures/chatgpt/*.json`

### 阶段 2: 实现 L1 能力（P0）

**任务**:
- [ ] 实现 `extractConversationMetasFromDom()`
- [ ] 实现从 DOM 提取当前对话消息
- [ ] 测试真实对话数据

**验收标准**:
- 能检测 ChatGPT 页面
- 能从当前页面提取可见消息
- 能导出为 Markdown/JSON

### 阶段 3: 实现 L2 能力（P1）

**任务**:
- [ ] 实现 API 拦截逻辑
- [ ] 验证 API 端点
- [ ] 处理认证/Token

**验收标准**:
- 能拦截 API 响应
- 能获取完整对话历史
- 支持分页/加载更多

### 阶段 4: 实现 L3 能力（P2）

**任务**:
- [ ] 实现主动 API 调用
- [ ] 实现对话列表获取
- [ ] 处理速率限制

**验收标准**:
- 能获取所有对话列表
- 能批量导出对话
- 稳定的错误处理

---

## 建议 Commit Message

```
feat(adapter): add ChatGPT adapter skeleton

- Add ChatGPT adapter implementation (src/adapters/chatgpt.ts)
- Add ChatGPT type definitions (src/adapters/chatgpt-types.ts)
- Add ChatGPT normalizer implementation (src/normalizers/chatgpt.ts)
- Add design notes documentation (docs/CHATGPT_ADAPTER_NOTES.md)
- Update adapter registry to include ChatGPT
- Update normalizer registry to include ChatGPT

Notes:
- This is a minimal skeleton implementation
- Real scraping logic needs actual ChatGPT samples to verify
- Marked with TODOs where actual data structures need validation
- Capability levels defined: L1 (DOM), L2 (API intercept), L3 (active fetch)

Next steps:
1. Collect actual ChatGPT API response samples
2. Verify type definitions against real data
3. Implement L1 DOM extraction logic
4. Test with real conversations
```

---

## 测试建议

### 单元测试（待实现）

```typescript
// src/adapters/chatgpt.test.ts
describe('ChatGPTAdapter', () => {
  describe('detect()', () => {
    it('should return true for chat.openai.com', () => {
      // TODO: mock window.location
    });
  });
  
  describe('extractConversationIdFromUrl()', () => {
    it('should extract ID from /c/{id}', () => {
      // TODO: test URL patterns
    });
  });
});

// src/normalizers/chatgpt.test.ts
describe('ChatGPTRNormalizer', () => {
  describe('normalizeConversation()', () => {
    it('should normalize a ChatGPT conversation', async () => {
      // TODO: use fixture data
    });
  });
});
```

### 测试数据（待收集）

```
fixtures/chatgpt/
├── conversation-detail-sample.json
├── conversation-list-sample.json
├── dom-structure.html
└── README.md (说明数据来源)
```

---

## 总结

当前实现完成了**"像样的最小骨架"**：

✅ 完整的类型定义（基于推测，待验证）
✅ 完整的适配器框架（方法签名齐全）
✅ 完整的标准化器框架（支持多种消息类型）
✅ 清晰的文档说明（设计决策、风险点、后续工作）
✅ Registry 已更新（可直接使用）

❌ 未实现真实抓取逻辑（需要实际样本）
❌ 未实现 DOM 提取具体选择器（需要页面结构）
❌ 未实现 API 拦截（需要端点验证）

**当前程度**: 骨架完成，等待实际样本验证
**后续需要**: ChatGPT API 响应样本、DOM 结构、测试账号
