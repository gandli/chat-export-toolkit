# Claude 平台适配器开发笔记

> 本文档记录 Claude（Anthropic）平台适配器的开发信息、风险点和待办事项。

## 概述

Claude 是由 Anthropic 开发的 AI 助手平台。

- **官方网站**: https://claude.ai/
- **适配器状态**: 🟡 骨架实现（L1 能力）
- **最后更新**: 2026-03-19

## 能力级别

当前实现：**L1 骨架**

| 级别 | 描述 | 状态 |
|------|------|------|
| L1 | 从当前页面 DOM 提取可见消息 | 🟡 骨架（需要真实 DOM 结构） |
| L2 | 通过 API 拦截获取完整对话历史 | ⚪ 未实现 |
| L3 | 主动调用 API 获取对话列表和详情 | ⚪ 未实现 |

## 已知信息

### 域名检测

适配器通过以下域名识别 Claude 平台：

- `claude.ai`（主要）
- `www.claude.ai`
- `*.claude.ai`（子域名）

### 推测的 URL 结构

```
https://claude.ai/chat/{chat-id}
https://claude.ai/c/{chat-id}
https://claude.ai/shared/{chat-id}  (共享对话)
```

⚠️ **注意**: 这些 URL 模式是基于常见模式的推测，需要实际访问验证。

### 推测的 API 端点

#### Detail API（获取单个对话）

Claude 的 API 结构可能涉及组织和项目层级：

```
/api/organizations/:organizationId/projects/:projectId/chats/:chatId
/api/shared_chats/:chatId
/api/chats/:chatId
/api/conversations/:conversationId
```

⚠️ **注意**: Claude 可能使用 RESTful API，需要实际网络请求分析确认。

#### List API（获取对话列表）

```
/api/organizations/:organizationId/chats
/api/organizations/:organizationId/projects/:projectId/chats
/api/chats
```

### 推测的数据结构

#### 对话详情响应

```typescript
interface ClaudeConversationDetail {
  id?: string;
  uuid?: string;
  conversation_id?: string;
  chat_id?: string;
  title?: string;
  created_at?: number | string;
  updated_at?: number | string;
  messages?: ClaudeMessage[];
  turns?: ClaudeMessage[];
  chat_history?: ClaudeMessage[];
  metadata?: { 
    model?: string; 
    title?: string;
    project_uuid?: string;
    organization_uuid?: string;
  };
  project_uuid?: string;
  organization_uuid?: string;
}
```

#### 消息结构

```typescript
interface ClaudeMessage {
  id?: string;
  uuid?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string | ClaudeContentPart[];
  created_at?: number | string;
  updated_at?: number | string;
  sender?: {
    role?: string;
    name?: string;
    user_uuid?: string;
  };
  attachments?: ClaudeAttachment[];
  metadata?: Record<string, unknown>;
}
```

#### 内容块类型

Claude 可能支持以下内容块类型：

- `text`: 普通文本
- `code`: 代码块
- `image`: 图片（base64 或 URL）
- `file`: 文件附件
- `tool_use`: 工具调用（Claude 特有）
- `tool_result`: 工具执行结果（Claude 特有）

### Claude 特有功能

1. **项目/组织层级**
   - Claude 支持将对话组织到项目中
   - 项目属于组织
   - 需要记录 `project_uuid` 和 `organization_uuid`

2. **工具使用（Tool Use）**
   - Claude 可以调用外部工具
   - 工具调用和结果需要特殊处理

3. **共享对话**
   - Claude 支持共享对话链接
   - URL 模式可能是 `/shared/{chat-id}`

4. **附件支持**
   - 图片上传
   - 文件上传（PDF、TXT 等）

## 风险点

### 🔴 高风险

1. **无真实样本数据**
   - 所有类型定义基于推测
   - DOM 选择器未经验证
   - API 端点未经验证
   - **影响**: 适配器可能完全无法工作

2. **认证机制未知**
   - 不清楚 Claude 使用何种认证方式（Cookie / Token / Session）
   - 不清楚 API 请求是否需要特殊 header
   - 组织/项目层级的权限验证机制不明
   - **影响**: 主动 API 调用可能失败

3. **可能的反爬措施**
   - Anthropic 可能有速率限制
   - 可能有请求签名或验证
   - **影响**: 频繁请求可能被封禁

4. **API 层级结构复杂**
   - 可能需要先获取 organizationId 和 projectId
   - 不同用户的对话可能分布在不同的组织/项目下
   - **影响**: 列表获取逻辑复杂

### 🟡 中风险

1. **DOM 结构频繁变化**
   - 前端框架更新可能导致选择器失效
   - **缓解**: 使用多重选择器，定期验证

2. **API 响应结构变化**
   - 字段名可能变化
   - 嵌套结构可能调整
   - **缓解**: 支持多结构兼容

3. **Claude 特有功能处理**
   - 工具调用/结果的标准化
   - 项目/组织元数据的保留
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
1. 访问 Claude 网页版
2. 分析对话页面的 HTML 结构
3. 识别消息容器、角色标识、内容区域
4. 实现 DOM 选择器提取消息
5. 验证提取结果
```

**需要**:
- [ ] 真实 Claude 对话页面截图或 HTML
- [ ] 消息元素的 CSS 选择器
- [ ] 角色（user/assistant）的标识方式
- [ ] 侧边栏对话列表的结构

### 阶段 2: API 拦截（L2）

```
1. 监听页面网络请求
2. 识别 Claude API 请求模式
3. 拦截响应并解析数据
4. 缓存原始数据供后续使用
```

**需要**:
- [ ] Claude API 请求的 URL 模式
- [ ] API 响应的真实结构
- [ ] 认证 token 的获取方式
- [ ] 组织/项目 ID 的获取方式

### 阶段 3: 主动调用（L3）

```
1. 发现 API 端点
2. 构造合法请求（包括组织/项目层级）
3. 处理分页和增量获取
4. 批量导出对话
```

**需要**:
- [ ] 完整的 API 文档或逆向分析结果
- [ ] 认证机制详解
- [ ] 组织/项目层级关系
- [ ] 速率限制信息

## 需要的真实样本

### 必需样本

| 样本类型 | 用途 | 优先级 |
|---------|------|--------|
| 对话页面 HTML | 分析 DOM 结构 | 🔴 高 |
| API 响应 JSON | 验证类型定义 | 🔴 高 |
| 网络请求列表 | 识别 API 端点 | 🔴 高 |
| 对话列表页面 | 分析列表结构 | 🔴 高 |
| 组织/项目结构 | 理解层级关系 | 🔴 高 |

### 理想样本

| 样本类型 | 用途 |
|---------|------|
| 多种对话类型（纯文本、代码、图片、文件） | 验证内容块处理 |
| 带工具调用的对话 | 验证 tool_use/tool_result 处理 |
| 长对话（多轮次） | 验证分页/加载逻辑 |
| 不同时间创建对话 | 验证时间戳处理 |
| 共享对话 | 验证共享链接处理 |
| 多项目对话 | 验证项目元数据保留 |

### 样本获取方式

1. **浏览器开发者工具**
   - Network 面板捕获 API 请求
   - Elements 面板查看 DOM 结构
   - Console 执行提取脚本

2. **页面截图**
   - 完整对话页面
   - 对话列表侧边栏
   - 消息气泡特写
   - 项目/组织选择器

3. **HTML 导出**
   - 使用「另存为」保存完整 HTML
   - 或使用 `document.documentElement.outerHTML`

4. **HAR 导出**
   - 从 Network 面板导出 HAR 文件
   - 包含完整的请求/响应信息

## 待办事项

### 紧急（阻塞开发）

- [ ] **获取真实 Claude 对话页面样本**
  - 至少 1 个完整对话的 HTML
  - 至少 1 个 API 响应 JSON
  - 至少 1 个对话列表响应 JSON
  
- [ ] **验证域名检测**
  - 确认 claude.ai 是否正确
  - 确认是否有其他域名变体

- [ ] **验证 URL 结构**
  - 确认对话页面的 URL 模式
  - 确认 chatId 的位置和格式
  - 确认共享对话的 URL 模式

- [ ] **验证组织/项目层级**
  - 确认是否需要 organizationId 和 projectId
  - 确认如何获取这些 ID

### 重要（核心功能）

- [ ] **实现 DOM 消息提取**
  - 找到消息容器的选择器
  - 找到角色标识的选择器
  - 找到内容区域的选择器
  - 找到附件/图片的处理方式

- [ ] **识别 API 端点**
  - 通过 Network 面板分析
  - 确认 detail 和 list 端点
  - 确认组织/项目相关的端点

- [ ] **实现 API 响应拦截**
  - 拦截 XHR 请求
  - 拦截 fetch 请求
  - 解析并缓存响应

- [ ] **实现对话列表获取**
  - 处理组织/项目层级
  - 支持分页
  - 处理多个项目的对话

### 次要（增强功能）

- [ ] **支持 Claude 特有功能**
  - 工具调用/结果显示
  - 项目/组织元数据保留
  - 共享对话处理

- [ ] **附件处理**
  - 图片下载/保存
  - 文件下载/保存
  - 附件元数据保留

- [ ] **错误处理和重试**
  - 网络错误处理
  - 解析错误处理
  - 重试机制

- [ ] **性能优化**
  - 增量加载
  - 缓存策略
  - 批量处理

## 测试计划

### 单元测试

```typescript
// 待实现
describe('ClaudeAdapter', () => {
  describe('detect()', () => {
    it('should return true for claude.ai');
    it('should return false for other domains');
  });
  
  describe('extractConversationIdFromUrl()', () => {
    it('should extract ID from /chat/{id}');
    it('should extract ID from /shared/{id}');
    it('should extract ID from query params');
  });
});
```

### 集成测试

```typescript
// 待实现
describe('ClaudeNormalizer', () => {
  it('should normalize a real Claude conversation');
  it('should handle missing fields gracefully');
  it('should preserve Claude-specific metadata (project/organization)');
  it('should handle tool_use and tool_result blocks');
});
```

### 手动测试

1. 访问 Claude 网页版
2. 创建或打开一个对话
3. 运行适配器检测
4. 验证消息提取
5. 验证标准化结果
6. 验证导出格式

## 与其他适配器的差异

### vs ChatGPT

- Claude 使用组织/项目层级，ChatGPT 更扁平
- Claude 的工具使用功能更成熟
- 两者的 DOM 结构完全不同

### vs Kimi

- 两者都可能使用 RESTful API
- Claude 的项目/组织概念是独特的
- Kimi 的搜索引用功能是独特的

## 参考资料

- [Anthropic 官网](https://www.anthropic.com/)
- [Claude 智能助手](https://claude.ai/)
- [Claude API 文档](https://docs.anthropic.com/claude/reference) (注意：这是官方 API，不是网页版)
- [Chat Export Toolkit V2 架构文档](../README.md)

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-19 | v0.1.0 | 初始骨架实现 |

---

**最后提醒**: 本适配器当前为骨架状态，**无法直接使用**。需要真实样本数据验证和完善。

**关键阻塞**: 
1. 需要真实的 Claude 对话页面 HTML/DOM 结构
2. 需要真实的 API 响应 JSON 样本
3. 需要确认组织/项目层级的处理方式
