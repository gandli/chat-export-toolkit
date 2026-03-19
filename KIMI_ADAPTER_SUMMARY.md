# Kimi 平台适配器实现总结

## 完成情况

✅ 已完成以下文件创建和更新：

### 新增文件

| 文件 | 说明 | 行数 |
|------|------|------|
| `src/adapters/kimi-types.ts` | Kimi 平台特定类型定义 | ~270 行 |
| `src/adapters/kimi.ts` | Kimi 平台适配器实现 | ~450 行 |
| `src/normalizers/kimi.ts` | Kimi 标准化器实现 | ~450 行 |
| `docs/KIMI_ADAPTER_NOTES.md` | Kimi 适配器开发笔记 | ~200 行 |

### 更新文件

| 文件 | 变更 |
|------|------|
| `src/adapters/index.ts` | 导出 KimiAdapter、kimiAdapter，注册到 adapterRegistry |
| `src/normalizers/index.ts` | 导出 KimiNormalizer、kimiNormalizer、kimiToMarkdown，注册到 normalizerRegistry |
| `src/types/index.ts` | PlatformType 添加 `'kimi'` |

## 实现状态

### 能力级别：L1 骨架

当前实现为**最小可用骨架**，定义了完整的接口和边界，但缺少真实数据验证。

| 功能 | 状态 | 说明 |
|------|------|------|
| 域名检测 (`detect()`) | ✅ 已实现 | 基于 kimi.moonshot.cn 和 kimi.ai |
| URL 解析 | ✅ 已实现 | 支持多种 URL 模式（待验证） |
| DOM 消息提取 | ⚠️ 骨架 | 选择器需要真实 DOM 验证 |
| API 端点探测 | ⚠️ 骨架 | 端点列表基于推测 |
| API 响应拦截 | ⚠️ 骨架 | 需要实现 XHR/fetch 拦截 |
| 消息标准化 | ✅ 已实现 | 支持多结构兼容 |
| Markdown 导出 | ✅ 已实现 | 支持 Kimi 特有内容类型 |

### 数据结构支持

适配器支持以下 Kimi 可能的数据结构：

- **消息来源**: `messages` / `chats` / `turns` / `mapping`
- **对话 ID**: `conversation_id` / `chat_id` / `session_id` / `id`
- **内容类型**: `text` / `code` / `image` / `file` / `link` / `search`
- **特有字段**: `search_info` (搜索引用), `file_info` (文件信息)

## 关键设计决策

### 1. 多结构兼容

Kimi 的 API 响应结构未知，适配器支持多种可能的字段名和嵌套结构：

```typescript
// 对话详情
data.messages || data.chats || data.turns || data.mapping

// 响应嵌套
json.data || json.result || json.response || json.payload
```

### 2. 能力级别分级

明确标注当前实现为 L1（DOM 提取），为后续 L2/L3 实现预留接口：

- **L1**: DOM 提取（当前）
- **L2**: API 拦截（预留 `installInterceptors()`）
- **L3**: 主动调用（预留 `fetchConversationDetail()` / `fetchConversationList()`）

### 3. Kimi 特有功能

预留了对 Kimi 可能特有功能的支持：

- **搜索引用**: `search_info` 字段，`search` 内容块类型
- **文件附件**: `file_info` 字段，`file` 内容块类型
- **多模态**: `image` / `link` 内容块类型

## 风险点

### 🔴 高风险（阻塞）

1. **无真实样本数据**
   - 所有类型定义基于对常见模式的推测
   - DOM 选择器未经验证
   - API 端点未经验证
   - **影响**: 适配器可能完全无法工作

2. **认证机制未知**
   - 不清楚 Kimi 使用 Cookie / Token / Session
   - 不清楚 API 请求的认证方式
   - **影响**: 主动 API 调用无法实现

### 🟡 中风险

1. **DOM 结构可能变化**
   - 前端框架更新导致选择器失效
   - 缓解：支持多重选择器

2. **API 响应结构变化**
   - 字段名或嵌套结构调整
   - 缓解：已实现多结构兼容

### 🟢 低风险

1. **URL 结构变化**
   - 缓解：支持多种 URL 模式匹配

2. **时间戳格式**
   - 缓解：已实现秒级/毫秒级自动检测

## 后续工作

### 第一阶段：获取真实样本（必需）

需要以下样本才能继续开发：

| 样本 | 用途 | 获取方式 |
|------|------|---------|
| Kimi 对话页面 HTML | 分析 DOM 结构 | 浏览器「另存为」或 `document.documentElement.outerHTML` |
| Kimi API 响应 JSON | 验证类型定义 | 浏览器 Network 面板 |
| 网络请求列表 | 识别 API 端点 | 浏览器 Network 面板 |
| 对话列表页面 | 分析列表结构 | 截图或 HTML |

### 第二阶段：实现 DOM 提取（L1）

- [ ] 分析真实 HTML，确定消息容器选择器
- [ ] 确定角色（user/assistant）标识方式
- [ ] 确定内容区域选择器
- [ ] 实现并测试 `extractMessagesFromDom()`
- [ ] 验证 `detect()` 逻辑

### 第三阶段：实现 API 拦截（L2）

- [ ] 通过 Network 面板识别 Kimi API 端点
- [ ] 确定认证方式（Cookie / Token）
- [ ] 实现 XHR 拦截
- [ ] 实现 fetch 拦截
- [ ] 实现响应解析和缓存

### 第四阶段：实现主动调用（L3）

- [ ] 实现 `fetchConversationDetail()`
- [ ] 实现 `fetchConversationList()`
- [ ] 处理分页和增量获取
- [ ] 实现速率限制和重试

## 测试建议

### 手动测试流程

1. 访问 https://kimi.moonshot.cn/
2. 登录账号
3. 打开浏览器开发者工具（F12）
4. 切换到 Network 面板
5. 打开或创建一个对话
6. 观察网络请求，记录 API 端点
7. 复制 API 响应 JSON
8. 切换到 Elements 面板
9. 检查消息元素的 HTML 结构
10. 记录 CSS 选择器

### 样本提交格式

```
kimi-samples/
├── conversation-page.html    # 对话页面 HTML
├── conversation-api.json     # 对话详情 API 响应
├── list-api.json             # 对话列表 API 响应
├── network-requests.txt      # Network 面板请求列表
└── screenshots/              # 页面截图
    ├── conversation.png
    └── sidebar.png
```

## 建议 Commit Message

```
feat: add Kimi platform adapter skeleton

- Add KimiAdapter with L1 capability (DOM extraction skeleton)
- Add KimiNormalizer for standardizing Kimi conversation data
- Add comprehensive type definitions for Kimi-specific structures
- Support multiple data structures (messages/chats/turns/mapping)
- Support Kimi-specific features (search references, file attachments)
- Add documentation with risk analysis and sample requirements
- Register adapter and normalizer in module indexes
- Add 'kimi' to PlatformType

Note: This is a skeleton implementation requiring real Kimi samples
for validation. All API endpoints and DOM selectors are based on
educated guesses and need verification.

Files:
  src/adapters/kimi-types.ts (new)
  src/adapters/kimi.ts (new)
  src/normalizers/kimi.ts (new)
  docs/KIMI_ADAPTER_NOTES.md (new)
  src/adapters/index.ts (updated)
  src/normalizers/index.ts (updated)
  src/types/index.ts (updated)
```

## 快速参考

### 导入适配器

```typescript
import { KimiAdapter, kimiAdapter } from './adapters/kimi';
import { KimiNormalizer, kimiNormalizer } from './normalizers/kimi';
```

### 使用适配器

```typescript
const adapter = new KimiAdapter();

if (adapter.detect()) {
  console.log('Kimi platform detected');
  
  // 获取当前对话
  const conversation = await adapter.getConversation();
  
  // 获取对话列表
  const conversations = await adapter.listConversations();
  
  // 提取消息
  const messages = adapter.extractMessages(conversation);
}
```

### 使用标准化器

```typescript
const normalizer = new KimiNormalizer();

// 标准化单个对话
const normalized = await normalizer.normalizeConversation(rawConversation);

// 标准化多个对话
const all = await normalizer.normalizeAll(rawConversations);

// 直接输出 Markdown
const markdown = kimiToMarkdown(kimiData);
```

---

**状态**: 🟡 骨架实现，等待真实样本验证

**下一步**: 获取 Kimi 网页版的真实 HTML 和 API 响应样本
