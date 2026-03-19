# Kimi 平台适配器开发笔记

> 本文档记录 Kimi（月之暗面）平台适配器的开发信息、风险点和待办事项。

## 概述

Kimi 是由月之暗面（Moonshot AI）开发的 AI 助手平台。

- **官方网站**: https://kimi.moonshot.cn/
- **备用域名**: https://kimi.ai/
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

适配器通过以下域名识别 Kimi 平台：

- `kimi.moonshot.cn`（主要）
- `kimi.ai`（备用）
- `*.moonshot.cn`（子域名）
- `*.kimi.ai`（子域名）

### 推测的 URL 结构

```
https://kimi.moonshot.cn/chat/{conversation-id}
https://kimi.moonshot.cn/conversation/{conversation-id}
https://kimi.moonshot.cn/c/{conversation-id}
```

⚠️ **注意**: 这些 URL 模式是基于常见模式的推测，需要实际访问验证。

### 推测的 API 端点

#### Detail API（获取单个对话）
```
/api/chat/detail
/api/conversation/detail
/api/session/detail
/api/v1/chat/detail
/graphql
```

#### List API（获取对话列表）
```
/api/chat/list
/api/conversation/list
/api/session/list
/api/v1/chat/list
/graphql
```

⚠️ **注意**: Kimi 可能使用 GraphQL 而非 RESTful API，需要实际网络请求分析确认。

### 推测的数据结构

#### 对话详情响应
```typescript
interface KimiConversationDetail {
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  messages?: KimiMessage[];
  chats?: KimiMessage[];
  turns?: KimiMessage[];
  mapping?: Record<string, KimiMessageNode>;
  metadata?: { model?: string; title?: string; };
  search_enabled?: boolean;
  files?: KimiFileInfo[];
}
```

#### 消息结构
```typescript
interface KimiMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string | KimiContentPart[];
  create_time?: number;
  search_info?: KimiSearchInfo;  // 搜索引用信息
  file_info?: KimiFileInfo;      // 文件信息
}
```

## 风险点

### 🔴 高风险

1. **无真实样本数据**
   - 所有类型定义基于推测
   - DOM 选择器未经验证
   - API 端点未经验证
   - **影响**: 适配器可能完全无法工作

2. **认证机制未知**
   - 不清楚 Kimi 使用何种认证方式（Cookie / Token / Session）
   - 不清楚 API 请求是否需要特殊 header
   - **影响**: 主动 API 调用可能失败

3. **可能的反爬措施**
   - Kimi 可能有速率限制
   - 可能有请求签名或验证
   - **影响**: 频繁请求可能被封禁

### 🟡 中风险

1. **DOM 结构频繁变化**
   - 前端框架更新可能导致选择器失效
   - **缓解**: 使用多重选择器，定期验证

2. **API 响应结构变化**
   - 字段名可能变化
   - 嵌套结构可能调整
   - **缓解**: 支持多结构兼容

3. **Kimi 特有功能**
   - 搜索引用（联网搜索）
   - 文件上传/解析
   - 多模态内容
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
1. 访问 Kimi 网页版
2. 分析对话页面的 HTML 结构
3. 识别消息容器、角色标识、内容区域
4. 实现 DOM 选择器提取消息
5. 验证提取结果
```

**需要**:
- [ ] 真实 Kimi 对话页面截图或 HTML
- [ ] 消息元素的 CSS 选择器
- [ ] 角色（user/assistant）的标识方式

### 阶段 2: API 拦截（L2）

```
1. 监听页面网络请求
2. 识别 Kimi API 请求模式
3. 拦截响应并解析数据
4. 缓存原始数据供后续使用
```

**需要**:
- [ ] Kimi API 请求的 URL 模式
- [ ] API 响应的真实结构
- [ ] 认证 token 的获取方式

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

## 需要的真实样本

### 必需样本

| 样本类型 | 用途 | 优先级 |
|---------|------|--------|
| 对话页面 HTML | 分析 DOM 结构 | 🔴 高 |
| API 响应 JSON | 验证类型定义 | 🔴 高 |
| 网络请求列表 | 识别 API 端点 | 🔴 高 |
| 对话列表页面 | 分析列表结构 | 🟡 中 |

### 理想样本

| 样本类型 | 用途 |
|---------|------|
| 多种对话类型（纯文本、代码、图片、文件） | 验证内容块处理 |
| 带搜索引用的对话 | 验证搜索信息处理 |
| 长对话（多轮次） | 验证分页/加载逻辑 |
| 不同时间创建对话 | 验证时间戳处理 |

### 样本获取方式

1. **浏览器开发者工具**
   - Network 面板捕获 API 请求
   - Elements 面板查看 DOM 结构
   - Console 执行提取脚本

2. **页面截图**
   - 完整对话页面
   - 对话列表侧边栏
   - 消息气泡特写

3. **HTML 导出**
   - 使用「另存为」保存完整 HTML
   - 或使用 `document.documentElement.outerHTML`

## 待办事项

### 紧急（阻塞开发）

- [ ] **获取真实 Kimi 对话页面样本**
  - 至少 1 个完整对话的 HTML
  - 至少 1 个 API 响应 JSON
  
- [ ] **验证域名检测**
  - 确认 kimi.moonshot.cn 是否正确
  - 确认是否有其他域名

- [ ] **验证 URL 结构**
  - 确认对话页面的 URL 模式
  - 确认 conversationId 的位置

### 重要（核心功能）

- [ ] **实现 DOM 消息提取**
  - 找到消息容器的选择器
  - 找到角色标识的选择器
  - 找到内容区域的选择器

- [ ] **识别 API 端点**
  - 通过 Network 面板分析
  - 确认 detail 和 list 端点

- [ ] **实现 API 响应拦截**
  - 拦截 XHR 请求
  - 拦截 fetch 请求
  - 解析并缓存响应

### 次要（增强功能）

- [ ] **支持 Kimi 特有功能**
  - 搜索引用显示
  - 文件附件处理
  - 多模态内容

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
describe('KimiAdapter', () => {
  describe('detect()', () => {
    it('should return true for kimi.moonshot.cn');
    it('should return false for other domains');
  });
  
  describe('extractConversationIdFromUrl()', () => {
    it('should extract ID from /chat/{id}');
    it('should extract ID from query params');
  });
});
```

### 集成测试

```typescript
// 待实现
describe('KimiNormalizer', () => {
  it('should normalize a real Kimi conversation');
  it('should handle missing fields gracefully');
  it('should preserve Kimi-specific metadata');
});
```

### 手动测试

1. 访问 Kimi 网页版
2. 创建或打开一个对话
3. 运行适配器检测
4. 验证消息提取
5. 验证标准化结果

## 参考资料

- [月之暗面官网](https://www.moonshot.cn/)
- [Kimi 智能助手](https://kimi.moonshot.cn/)
- [Chat Export Toolkit V2 架构文档](../README.md)

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-19 | v0.1.0 | 初始骨架实现 |

---

**最后提醒**: 本适配器当前为骨架状态，**无法直接使用**。需要真实样本数据验证和完善。
