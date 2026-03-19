# 通义千问 (Qwen Chat) 平台适配器开发笔记

> 本文档记录通义千问平台适配器的开发信息、风险点和待办事项。

## 概述

通义千问（Qwen）是由阿里巴巴通义实验室开发的 AI 助手平台。

- **官方网站**: https://tongyi.aliyun.com/qianwen/
- **主要域名**: `tongyi.aliyun.com`
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

适配器通过以下域名识别通义千问平台：

- `tongyi.aliyun.com`（主要）
- `*.aliyun.com` 且包含 `tongyi`（子域名）

### 推测的 URL 结构

```
https://tongyi.aliyun.com/qianwen/chat/{conversation-id}
https://tongyi.aliyun.com/chat/{conversation-id}
https://tongyi.aliyun.com/conversation/{conversation-id}
https://tongyi.aliyun.com/c/{conversation-id}
```

⚠️ **注意**: 这些 URL 模式是基于常见模式的推测，需要实际访问验证。

### 推测的 API 端点

#### Detail API（获取单个对话）
```
/api/chat/detail
/api/conversation/detail
/api/session/detail
/api/v1/chat/detail
/qwen/api/chat/detail
/tongyi/api/chat/detail
/graphql
```

#### List API（获取对话列表）
```
/api/chat/list
/api/conversation/list
/api/session/list
/api/v1/chat/list
/qwen/api/chat/list
/tongyi/api/chat/list
/graphql
```

⚠️ **注意**: 通义千问可能使用 GraphQL 而非 RESTful API，需要实际网络请求分析确认。

### 推测的数据结构

#### 对话详情响应
```typescript
interface QwenConversationDetail {
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  messages?: QwenMessage[];
  chats?: QwenMessage[];
  turns?: QwenMessage[];
  history?: QwenMessage[];      // 通义千问可能使用这个字段
  mapping?: Record<string, QwenMessageNode>;
  metadata?: { model?: string; title?: string; };
  plugin_enabled?: boolean;     // 插件功能开关
  files?: QwenFileInfo[];
  images?: QwenImageInfo[];
}
```

#### 消息结构
```typescript
interface QwenMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string | QwenContentPart[];
  create_time?: number;
  plugin_info?: QwenPluginInfo;  // 插件执行信息（通义千问特有）
  file_info?: QwenFileInfo;      // 文件信息
  image_info?: QwenImageInfo;    // 图片信息
}
```

### 通义千问特有功能

1. **插件系统**
   - 联网搜索
   - 代码解释器
   - 图片生成
   - 其他第三方插件

2. **多模态支持**
   - 图片理解
   - 文件解析（PDF、Word、Excel 等）
   - 长文档处理

3. **对话历史**
   - 可能使用 `history` 字段存储消息
   - 需要验证实际结构

## 风险点

### 🔴 高风险

1. **无真实样本数据**
   - 所有类型定义基于推测
   - DOM 选择器未经验证
   - API 端点未经验证
   - **影响**: 适配器可能完全无法工作

2. **认证机制未知**
   - 不清楚通义千问使用何种认证方式（Cookie / Token / Session）
   - 阿里云可能使用复杂的认证体系（STS、RAM 等）
   - 不清楚 API 请求是否需要特殊 header
   - **影响**: 主动 API 调用可能失败

3. **可能的反爬措施**
   - 阿里云可能有严格的速率限制
   - 可能有请求签名或验证
   - 可能有设备指纹检测
   - **影响**: 频繁请求可能被封禁

4. **阿里云安全策略**
   - 阿里云对自动化访问可能有严格限制
   - 可能需要登录态验证
   - **影响**: userscript 方式可能更可行

### 🟡 中风险

1. **DOM 结构频繁变化**
   - 前端框架更新可能导致选择器失效
   - **缓解**: 使用多重选择器，定期验证

2. **API 响应结构变化**
   - 字段名可能变化
   - 嵌套结构可能调整
   - **缓解**: 支持多结构兼容

3. **通义千问特有功能**
   - 插件执行结果
   - 文件上传/解析
   - 多模态内容
   - **影响**: 需要特殊处理逻辑

4. **长对话处理**
   - 通义千问支持超长上下文
   - 消息可能分页加载
   - **影响**: 需要处理增量加载

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
1. 访问通义千问网页版
2. 分析对话页面的 HTML 结构
3. 识别消息容器、角色标识、内容区域
4. 实现 DOM 选择器提取消息
5. 验证提取结果
```

**需要**:
- [ ] 真实通义千问对话页面截图或 HTML
- [ ] 消息元素的 CSS 选择器
- [ ] 角色（user/assistant）的标识方式
- [ ] 侧边栏对话列表结构

### 阶段 2: API 拦截（L2）

```
1. 监听页面网络请求
2. 识别通义千问 API 请求模式
3. 拦截响应并解析数据
4. 缓存原始数据供后续使用
```

**需要**:
- [ ] 通义千问 API 请求的 URL 模式
- [ ] API 响应的真实结构
- [ ] 认证 token 的获取方式
- [ ] 请求 header 信息

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
- [ ] 错误处理策略

## 需要的真实样本

### 必需样本

| 样本类型 | 用途 | 优先级 |
|---------|------|--------|
| 对话页面 HTML | 分析 DOM 结构 | 🔴 高 |
| API 响应 JSON | 验证类型定义 | 🔴 高 |
| 网络请求列表 | 识别 API 端点 | 🔴 高 |
| 对话列表页面 | 分析列表结构 | 🟡 中 |
| 登录态信息 | 了解认证方式 | 🔴 高 |

### 理想样本

| 样本类型 | 用途 |
|---------|------|
| 多种对话类型（纯文本、代码、图片、文件） | 验证内容块处理 |
| 带插件执行的对话 | 验证插件信息处理 |
| 长对话（多轮次） | 验证分页/加载逻辑 |
| 不同时间创建对话 | 验证时间戳处理 |
| 多模态对话（图片理解） | 验证图片处理 |

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
   - 插件执行界面

3. **HTML 导出**
   - 使用「另存为」保存完整 HTML
   - 或使用 `document.documentElement.outerHTML`

4. **HAR 导出**
   - 从 Network 面板导出 HAR 文件
   - 包含完整的请求/响应信息

## 待办事项

### 紧急（阻塞开发）

- [ ] **获取真实通义千问对话页面样本**
  - 至少 1 个完整对话的 HTML
  - 至少 1 个 API 响应 JSON
  
- [ ] **验证域名检测**
  - 确认 tongyi.aliyun.com 是否正确
  - 确认是否有其他域名（如 qwen.aliyun.com）

- [ ] **验证 URL 结构**
  - 确认对话页面的 URL 模式
  - 确认 conversationId 的位置

- [ ] **了解认证机制**
  - Cookie 名称和格式
  - Token 获取方式
  - 是否需要特殊 header

### 重要（核心功能）

- [ ] **实现 DOM 消息提取**
  - 找到消息容器的选择器
  - 找到角色标识的选择器
  - 找到内容区域的选择器

- [ ] **识别 API 端点**
  - 通过 Network 面板分析
  - 确认 detail 和 list 端点
  - 确认 GraphQL schema（如果使用）

- [ ] **实现 API 响应拦截**
  - 拦截 XHR 请求
  - 拦截 fetch 请求
  - 解析并缓存响应

- [ ] **处理通义千问特有字段**
  - `history` 字段（如果存在）
  - `plugin_info` 字段
  - `file_info` / `image_info` 字段

### 次要（增强功能）

- [ ] **支持通义千问特有功能**
  - 插件执行结果显示
  - 文件附件处理
  - 图片理解内容
  - 多模态消息

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
describe('QwenAdapter', () => {
  describe('detect()', () => {
    it('should return true for tongyi.aliyun.com');
    it('should return false for other domains');
  });
  
  describe('extractConversationIdFromUrl()', () => {
    it('should extract ID from /qianwen/chat/{id}');
    it('should extract ID from /chat/{id}');
    it('should extract ID from query params');
  });
});
```

### 集成测试

```typescript
// 待实现
describe('QwenNormalizer', () => {
  it('should normalize a real Qwen conversation');
  it('should handle missing fields gracefully');
  it('should preserve Qwen-specific metadata (plugin_info, etc.)');
  it('should handle history field if present');
});
```

### 手动测试

1. 访问通义千问网页版
2. 创建或打开一个对话
3. 运行适配器检测
4. 验证消息提取
5. 验证标准化结果
6. 测试插件功能对话

## 与其他适配器的差异

### 与 Kimi 的对比

| 特性 | Kimi | 通义千问 |
|------|------|---------|
| 消息字段 | messages/chats/turns | messages/chats/turns/**history** |
| 特有功能 | 搜索引用 | 插件系统、多模态 |
| 域名 | kimi.moonshot.cn | tongyi.aliyun.com |
| 认证 | 未知 | 阿里云统一认证（可能更复杂） |

### 与 ChatGPT 的对比

| 特性 | ChatGPT | 通义千问 |
|------|---------|---------|
| 消息组织 | mapping 结构 | 可能是数组或 history |
| 插件系统 | GPTs | 通义插件 |
| 认证 | Session token | 阿里云认证 |

## 参考资料

- [通义千问官网](https://tongyi.aliyun.com/qianwen/)
- [阿里云文档](https://help.aliyun.com/product/42154.html)
- [Chat Export Toolkit V2 架构文档](../README.md)
- [Kimi 适配器开发笔记](./KIMI_ADAPTER_NOTES.md)

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-19 | v0.1.0 | 初始骨架实现 |

---

**最后提醒**: 本适配器当前为骨架状态，**无法直接使用**。需要真实样本数据验证和完善。

**特别注意**: 通义千问作为阿里云产品，可能有更严格的安全和反爬措施。建议优先使用 userscript 方式在浏览器中运行，避免直接 API 调用。
