# ChatGPT Adapter 设计说明

## 为什么选择 ChatGPT 作为第二个适配器？

### 1. 代表性强
- ChatGPT 是最主流的 AI 对话平台之一
- 其数据结构具有代表性（消息轮次、角色分离、多模态内容）
- 验证 ChatGPT 适配器可以覆盖大部分 AI 对话平台的共性需求

### 2. 数据结构清晰
- 消息角色明确：user / assistant / system
- 时间戳完整：支持按时间排序
- 支持多模态：文本、代码、图片、文件等
- 对话树结构：支持分支对话（mapping 结构）

### 3. 技术挑战适中
- 比 Yuanbao 更复杂（支持更多消息类型）
- 比 Discord/Slack 更简单（纯对话场景）
- 作为第二个适配器，复杂度递增合理

### 4. 用户需求高
- ChatGPT 用户基数大
- 导出对话历史是常见需求
- 有助于验证工具的实际价值

---

## 适配器架构

### 文件结构
```
src/adapters/
├── base.ts              # 基类（已有）
├── chatgpt.ts           # ChatGPT 适配器实现
└── chatgpt-types.ts     # ChatGPT 特定类型定义

src/normalizers/
├── base.ts              # 基类（已有）
└── chatgpt.ts           # ChatGPT 标准化器实现
```

### 能力级别目标

| 级别 | 能力描述 | 优先级 |
|------|----------|--------|
| L1 | 从当前页面 DOM 提取可见消息 | P0 |
| L2 | 通过 API 拦截获取完整对话历史 | P1 |
| L3 | 主动调用 API 获取对话列表和详情 | P2 |

---

## Detect 逻辑

### 域名检测
```typescript
detect(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === 'chat.openai.com' ||
    hostname.endsWith('.openai.com') ||
    hostname === 'chat.com'
  );
}
```

### 可选的二次验证（TODO）
- 检查页面特征元素（如特定的 DOM 结构）
- 检查全局变量（如 `window.__NEXT_DATA__`）

---

## 潜在数据源

### 1. DOM 提取（L1）
- 对话容器：`main` 或 `[data-testid="conversation"]`
- 消息元素：`[data-message-id]` 或类似属性
- 侧边栏对话列表：`nav` 中的链接

**风险**：
- DOM 结构可能频繁变化
- 只能获取当前加载的内容
- 无法获取历史对话列表

### 2. API 拦截（L2）
- 拦截 `/backend-api/conversation` 请求
- 拦截 `/backend-api/conversations` 请求
- 从响应中提取完整数据

**风险**：
- 需要正确的拦截时机
- API 端点可能变化
- 需要处理认证/Token

### 3. 主动调用 API（L3）
- 使用已发现的端点主动 fetch
- 需要处理认证和速率限制

**风险**：
- 可能违反服务条款
- Token 管理复杂
- 可能触发反爬虫机制

---

## 数据结构推测

### 对话详情响应（需要验证）
```typescript
interface ChatGPTConversationDetail {
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  
  // 可能的消息结构
  messages?: ChatGPTMessage[];
  
  // 或树状 mapping 结构
  mapping?: Record<string, {
    id?: string;
    message?: ChatGPTMessage;
    parent?: string | null;
    children?: string[];
  }>;
  
  metadata?: {
    title?: string;
    model?: string;
  };
}
```

### 消息结构（需要验证）
```typescript
interface ChatGPTMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string | ContentPart[];
  createTime?: number;
  author?: {
    role?: string;
    name?: string;
  };
}
```

### 内容块类型（需要验证）
```typescript
interface ContentPart {
  type?: 'text' | 'code' | 'image' | 'file';
  text?: string;
  content?: string;
  url?: string;
  language?: string;
}
```

---

## 风险点

### 1. 数据结构变化
- ChatGPT 频繁更新前端
- API 响应结构可能随时变化
- **对策**：使用多结构兼容，添加容错逻辑

### 2. 认证问题
- API 调用需要有效 Token
- Token 可能过期或失效
- **对策**：优先使用拦截方式，避免主动调用

### 3. 速率限制
- 频繁请求可能触发限制
- **对策**：添加请求间隔和重试逻辑

### 4. 服务条款
- 自动化抓取可能违反 ToS
- **对策**：
  - 明确告知用户风险
  - 仅提供浏览器内提取能力
  - 不提供批量爬取功能

### 5. 多模态内容
- 图片、文件等附件处理复杂
- **对策**：
  - L1 阶段仅处理文本
  - 后续版本逐步支持附件

---

## 实现状态

### 已完成
- [x] `src/adapters/chatgpt-types.ts` - 类型定义
- [x] `src/adapters/chatgpt.ts` - 适配器骨架
- [x] `src/normalizers/chatgpt.ts` - 标准化器骨架
- [x] 更新 registry 文件

### 待完成（需要实际样本）
- [ ] 验证实际 API 响应结构
- [ ] 实现 DOM 提取逻辑
- [ ] 实现 API 拦截逻辑
- [ ] 测试真实对话数据

---

## 后续需要什么

### 1. 实际样本数据
需要以下样本验证类型定义：
- 完整的对话详情 API 响应
- 对话列表 API 响应
- 典型 DOM 结构截图/HTML

### 2. 测试环境
- ChatGPT Plus 账号（访问完整功能）
- 包含多种消息类型的对话（文本、代码、图片）

### 3. 优先级决策
- 先实现 L1（DOM 提取）还是 L2（API 拦截）？
- 是否需要支持对话列表导出？

---

## 参考资源

- [ChatGPT 网页版](https://chat.openai.com)
- [OpenAI API 文档](https://platform.openai.com/docs)
- 相关开源项目（用于参考数据结构）

---

## 版本历史

- **v0.1.0** (2026-03-19): 初始骨架完成
  - 定义类型和接口
  - 实现最小可用骨架
  - 待实际样本验证
