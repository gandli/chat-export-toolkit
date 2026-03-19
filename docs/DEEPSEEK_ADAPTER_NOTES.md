# DeepSeek 平台适配器开发笔记

> 本文档记录 DeepSeek 平台适配器的开发信息、风险点和待办事项。

## 概述

DeepSeek（深度求索）是一家中国 AI 公司，提供多种大语言模型服务。

- **官方网站**: https://chat.deepseek.com/
- **公司官网**: https://www.deepseek.com/
- **适配器状态**: 🟡 骨架实现（L1 能力）
- **最后更新**: 2026-03-19

## 能力级别

当前实现：**L1 骨架**

| 级别 | 描述 | 状态 |
|------|------|------|
| L1 | 从当前页面 DOM 提取可见消息 | 🟡 骨架（需要真实 DOM 结构） |
| L2 | 通过 API 拦截获取完整对话历史 | ⚪ 未实现 |
| L3 | 主动调用 API 获取对话列表和详情 | ⚪ 未实现 |

## 测试状态

### 已有测试 ✅

| 测试类型 | 文件 | 状态 |
|---------|------|------|
| Contract Tests | `tests/contracts/deepseek-contract.test.ts` | ✅ 31 测试通过 |
| Golden Tests | `tests/golden/deepseek/deepseek-golden.test.ts` | ✅ 13 测试通过 |
| Fixtures | `fixtures/deepseek/raw/*.json` | 📋 模板阶段 |
| Normalized Fixtures | `fixtures/deepseek/normalized/*.json` | 📋 模板阶段 |

### 运行测试

```bash
# 运行 DeepSeek contract tests
bun test tests/contracts/deepseek-contract.test.ts

# 运行 DeepSeek golden tests
bun test tests/golden/deepseek/deepseek-golden.test.ts

# 运行所有 DeepSeek 相关测试
bun test tests/contracts/deepseek-contract.test.ts tests/golden/deepseek/
```

### 测试覆盖

- ✅ Adapter 接口契约（detect, extractMessages, getConversation, listConversations）
- ✅ Normalizer 输出符合 Conversation schema
- ✅ Think/Reasoning 块处理
- ✅ 代码块处理
- ✅ 边界情况（空消息、特殊字符、emoji、LaTeX 公式）
- ✅ 时间戳转换
- ✅ Metadata 保留
- 📋 真实样本验证（需要采集）

### 测试计划

详细测试计划见：[DEEPSEEK_TEST_PLAN.md](./DEEPSEEK_TEST_PLAN.md)

## 已知信息

### 域名检测

适配器通过以下域名识别 DeepSeek 平台：

- `chat.deepseek.com`（主要聊天界面）
- `www.deepseek.com`（官网）
- `deepseek.com`（根域名）
- `chat.deepseek.ai`（备用）
- `*.deepseek.com`（子域名）
- `*.deepseek.ai`（子域名）

### 推测的 URL 结构

```
https://chat.deepseek.com/chat/{conversation-id}
https://chat.deepseek.com/conversation/{conversation-id}
https://chat.deepseek.com/c/{conversation-id}
https://chat.deepseek.com/s/{conversation-id}
```

⚠️ **注意**: 这些 URL 模式是基于常见模式的推测，需要实际访问验证。

### 推测的 API 端点

#### Detail API（获取单个对话）
```
/api/chat/detail
/api/conversation/detail
/api/session/detail
/api/v1/chat/detail
/api/v1/conversation/detail
/graphql
```

#### List API（获取对话列表）
```
/api/chat/list
/api/conversation/list
/api/session/list
/api/v1/chat/list
/api/v1/conversation/list
/graphql
```

⚠️ **注意**: DeepSeek 可能使用 GraphQL 或 RESTful API，需要实际网络请求分析确认。

### 推测的数据结构

#### 对话详情响应
```typescript
interface DeepSeekConversationDetail {
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  created_at?: number;
  updated_at?: number;
  messages?: DeepSeekMessage[];
  chats?: DeepSeekMessage[];
  turns?: DeepSeekMessage[];
  mapping?: Record<string, DeepSeekMessageNode>;
  metadata?: { model?: string; title?: string; };
  model?: string;  // 使用的模型版本
}
```

#### 消息结构
```typescript
interface DeepSeekMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string | DeepSeekContentPart[];
  created_at?: number;
  reasoning_content?: string;  // 推理过程（如果支持）
  citations?: DeepSeekCitation[];  // 引用来源
  attachments?: DeepSeekAttachment[];  // 附件
}
```

### DeepSeek 特有功能（待验证）

| 功能 | 描述 | 状态 |
|------|------|------|
| 推理过程 | 类似"思考过程"的展示 | ⚪ 未知 |
| 联网搜索 | 搜索引用和来源 | ⚪ 未知 |
| 文件上传 | 支持上传文件进行分析 | ⚪ 未知 |
| 代码解释器 | 代码执行和可视化 | ⚪ 未知 |
| 多模态 | 图片理解/生成 | ⚪ 未知 |

## 风险点

### 🔴 高风险

1. **无真实样本数据**
   - 所有类型定义基于推测
   - DOM 选择器未经验证
   - API 端点未经验证
   - **影响**: 适配器可能完全无法工作

2. **认证机制未知**
   - 不清楚 DeepSeek 使用何种认证方式（Cookie / Token / Session）
   - 不清楚 API 请求是否需要特殊 header
   - 不清楚是否有登录墙
   - **影响**: 主动 API 调用可能失败

3. **可能的反爬措施**
   - DeepSeek 可能有速率限制
   - 可能有请求签名或验证
   - 可能有验证码
   - **影响**: 频繁请求可能被封禁

4. **DeepSeek 服务可用性**
   - 作为较新的平台，API 稳定性未知
   - 可能频繁更新导致适配器失效
   - **影响**: 维护成本较高

### 🟡 中风险

1. **DOM 结构频繁变化**
   - 前端框架更新可能导致选择器失效
   - **缓解**: 使用多重选择器，定期验证

2. **API 响应结构变化**
   - 字段名可能变化
   - 嵌套结构可能调整
   - **缓解**: 支持多结构兼容

3. **DeepSeek 特有功能**
   - 推理过程展示
   - 搜索引用
   - 文件附件
   - **影响**: 需要特殊处理逻辑

### 🟢 低风险

1. **URL 结构变化**
   - 路径模式可能调整
   - **缓解**: 支持多种模式匹配

2. **时间戳格式**
   - 可能是秒级或毫秒级
   - **缓解**: 已实现自动检测转换

## 预期抓取策略

### 阶段 1: DOM 提取（L1）

```
1. 访问 DeepSeek 网页版
2. 分析对话页面的 HTML 结构
3. 识别消息容器、角色标识、内容区域
4. 实现 DOM 选择器提取消息
5. 验证提取结果
```

**需要**:
- [ ] 真实 DeepSeek 对话页面截图或 HTML
- [ ] 消息元素的 CSS 选择器
- [ ] 角色（user/assistant）的标识方式
- [ ] 对话列表侧边栏结构

### 阶段 2: API 拦截（L2）

```
1. 监听页面网络请求
2. 识别 DeepSeek API 请求模式
3. 拦截响应并解析数据
4. 缓存原始数据供后续使用
```

**需要**:
- [ ] DeepSeek API 请求的 URL 模式
- [ ] API 响应的真实结构
- [ ] 认证 token 的获取方式
- [ ] 请求头信息（Content-Type, Authorization 等）

### 阶段 3: 主动调用（L3）

```
1. 发现 API 端点
2. 构造合法请求
3. 处理分页和增量获取
4. 批量导出对话
```

**需要**:
- [ ] 完整的 API 文档或逆向分析结果
- [ ] 认证机制详解
- [ ] 速率限制信息
- [ ] 错误处理机制

## 需要的真实样本

### 必需样本

| 样本类型 | 用途 | 优先级 |
|---------|------|--------|
| 对话页面 HTML | 分析 DOM 结构 | 🔴 高 |
| API 响应 JSON | 验证类型定义 | 🔴 高 |
| 网络请求列表 | 识别 API 端点 | 🔴 高 |
| 对话列表页面 | 分析列表结构 | 🔴 高 |
| 登录流程 | 了解认证机制 | 🔴 高 |

### 理想样本

| 样本类型 | 用途 |
|---------|------|
| 多种对话类型（纯文本、代码、图片、文件） | 验证内容块处理 |
| 带推理过程的对话 | 验证 reasoning_content 处理 |
| 带搜索引用的对话 | 验证引用信息处理 |
| 长对话（多轮次） | 验证分页/加载逻辑 |
| 不同时间创建对话 | 验证时间戳处理 |
| 不同模型版本对话 | 验证 model 字段处理 |

### 样本获取方式

1. **浏览器开发者工具**
   - Network 面板捕获 API 请求
   - Elements 面板查看 DOM 结构
   - Console 执行提取脚本
   - Application 面板查看 Cookie/LocalStorage

2. **页面截图**
   - 完整对话页面
   - 对话列表侧边栏
   - 消息气泡特写
   - 设置/模型选择界面

3. **HTML 导出**
   - 使用「另存为」保存完整 HTML
   - 或使用 `document.documentElement.outerHTML`

4. **HAR 导出**
   - 从 Network 面板导出 HAR 文件
   - 包含完整的请求/响应信息

## 待办事项

### 紧急（阻塞开发）

- [ ] **获取真实 DeepSeek 对话页面样本**
  - 至少 1 个完整对话的 HTML
  - 至少 1 个 API 响应 JSON
  - 至少 1 个对话列表页面 HTML
  
- [ ] **验证域名检测**
  - 确认 chat.deepseek.com 是否正确
  - 确认是否有其他域名需要支持
  - 确认是否需要登录才能访问

- [ ] **验证 URL 结构**
  - 确认对话页面的 URL 模式
  - 确认 conversationId 的位置和格式
  - 确认是否有查询参数

### 重要（核心功能）

- [ ] **实现 DOM 消息提取**
  - 找到消息容器的选择器
  - 找到角色标识的选择器
  - 找到内容区域的选择器
  - 找到时间戳的选择器

- [ ] **识别 API 端点**
  - 通过 Network 面板分析
  - 确认 detail 和 list 端点
  - 确认请求方法（GET/POST）
  - 确认请求体格式

- [ ] **实现 API 响应拦截**
  - 拦截 XHR 请求
  - 拦截 fetch 请求
  - 解析并缓存响应
  - 处理错误情况

- [ ] **实现认证处理**
  - 分析登录流程
  - 提取认证 token
  - 实现 token 刷新机制

### 次要（增强功能）

- [ ] **支持 DeepSeek 特有功能**
  - 推理过程显示
  - 搜索引用处理
  - 文件附件处理
  - 多模态内容

- [ ] **错误处理和重试**
  - 网络错误处理
  - 解析错误处理
  - 重试机制
  - 降级策略

- [ ] **性能优化**
  - 增量加载
  - 缓存策略
  - 批量处理
  - 并发控制

## 测试计划

### 已有测试 ✅

详细测试计划和覆盖见：[DEEPSEEK_TEST_PLAN.md](./DEEPSEEK_TEST_PLAN.md)

**Contract Tests** (`tests/contracts/deepseek-contract.test.ts`):
- ✅ detect() 存在且可调用
- ✅ extractMessages() 返回数组或安全降级
- ✅ getConversation() 不崩溃
- ✅ listConversations() 不崩溃
- ✅ Normalizer 输出符合 schema
- ✅ 边界情况处理

**Golden Tests** (`tests/golden/deepseek/deepseek-golden.test.ts`):
- ✅ Normalizer 标准化验证
- ✅ Think/Reasoning 块处理
- ✅ 代码块处理
- ✅ 边界情况（空消息、特殊字符、emoji、LaTeX）
- ✅ Markdown 导出格式验证
- ✅ JSON 导出格式验证
- ✅ Metadata 保留验证

### 待完成测试 📋

- [ ] 使用真实样本运行 golden tests
- [ ] L1 DOM 提取功能验证
- [ ] 真实 DeepSeek 页面手动测试
- [ ] 性能测试（长对话）

## 与现有适配器对比

| 特性 | DeepSeek | Kimi | 豆包 | 元宝 |
|------|----------|------|------|------|
| 域名 | chat.deepseek.com | kimi.moonshot.cn | doubao.com | yuanbao.tencent.com |
| 推理过程 | 待验证 | 待验证 | 待验证 | ✅ 支持 |
| 搜索引用 | 待验证 | ✅ 支持 | 待验证 | ✅ 支持 |
| 文件上传 | 待验证 | ✅ 支持 | 待验证 | ✅ 支持 |
| 实现状态 | L1 骨架 | L1 骨架 | L1 骨架 | L2 |

## 参考资料

- [DeepSeek 官网](https://www.deepseek.com/)
- [DeepSeek 聊天](https://chat.deepseek.com/)
- [DeepSeek API 文档](https://platform.deepseek.com/) (需要确认)
- [Chat Export Toolkit V2 架构文档](../README.md)

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-19 | v0.1.0 | 初始骨架实现，包含类型定义、适配器、标准化器 |

---

**最后提醒**: 本适配器当前为骨架状态，**无法直接使用**。需要真实样本数据验证和完善。

**下一步建议**:
1. 访问 DeepSeek 网页版，使用开发者工具分析页面结构
2. 捕获至少一个完整对话的 API 响应
3. 根据真实数据更新类型定义和选择器
4. 实现 L1 DOM 提取功能进行验证
