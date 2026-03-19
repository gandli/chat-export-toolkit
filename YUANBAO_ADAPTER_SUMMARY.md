# Yuanbao PlatformAdapter 实现总结

## 实现概览

已完成 Yuanbao (腾讯元宝) PlatformAdapter 的 V2 实现，这是 V2 架构的第一个具体站点适配器。

## 新增文件

### 1. `src/adapters/yuanbao-types.ts` (3.4 KB)
Yuanbao 特定类型定义，包括：
- `YuanbaoConversationDetail` - 对话详情响应结构
- `YuanbaoConversationList` - 对话列表响应结构
- `YuanbaoTurn` - 对话轮次
- `YuanbaoSpeech` - 语音/消息单元
- `YuanbaoContentBlock` - 消息块类型
- `YuanbaoApiEndpoints` - API 端点信息
- `YuanbaoConversationMeta` - 对话元数据
- `YuanbaoMessageBlock` - 标准化前的中间表示

### 2. `src/adapters/yuanbao.ts` (14.2 KB)
Yuanbao PlatformAdapter 实现，包含：
- `YuanbaoAdapter` 类 - 实现 `IPlatformAdapter` 接口
- `yuanbaoAdapter` 单例实例

### 3. `src/normalizers/yuanbao.ts` (10.2 KB)
Yuanbao Normalizer 实现，包含：
- `YuanbaoNormalizer` 类 - 实现 `INormalizer` 接口
- `yuanbaoNormalizer` 单例实例
- `yuanbaoToMarkdown()` 辅助函数 - V1 逻辑的现代化重构

## 修改文件

### 1. `src/types/index.ts`
- 添加 `'yuanbao'` 到 `PlatformType` 联合类型

### 2. `src/adapters/index.ts`
- 导出 `YuanbaoAdapter` 和 `yuanbaoAdapter`
- 导出所有 Yuanbao 类型
- 注册 Yuanbao 适配器到 `adapterRegistry`

### 3. `src/normalizers/index.ts`
- 导出 `YuanbaoNormalizer`、`yuanbaoNormalizer` 和 `yuanbaoToMarkdown`
- 注册 Yuanbao 标准化器到 `normalizerRegistry`

## 实现的功能

### PlatformAdapter 接口方法

| 方法 | 状态 | 说明 |
|------|------|------|
| `detect()` | ✅ 已实现 | 检测当前页面是否为 yuanbao.tencent.com |
| `getConversation()` | ✅ 已实现 | 获取单个对话（支持缓存和 URL 提取） |
| `listConversations()` | ✅ 已实现 | 获取对话列表（支持多源合并） |
| `extractMessages()` | ✅ 已实现 | 从原始对话中提取消息列表 |
| `getMetadata()` | ✅ 已实现 | 获取平台元数据 |

### Normalizer 接口方法

| 方法 | 状态 | 说明 |
|------|------|------|
| `normalizeConversation()` | ✅ 已实现 | 标准化整个对话 |
| `normalizeMessage()` | ✅ 已实现 | 标准化单条消息 |
| `normalizeAll()` | ✅ 已实现 | 批量标准化 |

### V1 迁移的核心能力

1. **多结构兼容**
   - 支持多种 API 响应嵌套结构（data/result/response/payload）
   - 支持多种 conversationId 字段名
   - 支持多种 title 字段名

2. **API 端点探测框架**
   - 正则表达式模式匹配（`YUANBAO_DETAIL_RE`, `YUANBAO_LIST_RE`）
   - 候选端点列表（`DETAIL_ENDPOINT_CANDIDATES`, `LIST_ENDPOINT_CANDIDATES`）
   - 回退探测机制

3. **数据解析逻辑**
   - `extractConversationId()` - 从多种字段提取 ID
   - `extractConversationTitle()` - 从多种字段提取标题
   - `extractMessageBlocks()` - 处理 speechesV2 和 content 块
   - `mapYuanbaoRole()` - 角色映射（ai→assistant, user/human→user）

4. **消息块处理**
   - `text` 类型 - 普通文本
   - `think` 类型 - 思考过程（使用引用格式）
   - `unsupported` 类型 - 其他类型的占位处理

5. **Markdown 导出**
   - `yuanbaoToMarkdown()` 函数完整保留 V1 逻辑
   - 支持标题级别调整（避免与对话标题冲突）
   - 支持思考块的引用格式

## TODO 注释标记的后续优化点

### 高优先级

1. **API 端点探测实现** (`src/adapters/yuanbao.ts:198-220`)
   ```typescript
   // TODO: 实现从已拦截请求中选择端点
   // TODO: 实现从页面 JS 资源中提取端点
   ```

2. **实际 fetch 逻辑** (`src/adapters/yuanbao.ts:228-250`)
   ```typescript
   // TODO: 实现实际的 fetch 逻辑
   ```

3. **API 响应拦截器** (`src/adapters/yuanbao.ts:420-430`)
   ```typescript
   // TODO: 实现 XHR 拦截
   // TODO: 实现 fetch 拦截
   ```

### 中优先级

4. **使用正则表达式验证端点** (`src/adapters/yuanbao.ts:206, 215`)
   ```typescript
   // TODO: 使用 YUANBAO_DETAIL_RE 进行端点验证
   // TODO: 使用 YUANBAO_LIST_RE 进行端点验证
   ```

5. **从捕获的对话中推断 API 端点** (V1 逻辑)
   - 反向推断 API 端点模式

## 测试建议

### 单元测试

1. **类型解析测试**
   ```typescript
   // 测试多结构兼容
   test('should extract conversation ID from various structures', () => {
     // 测试 conversationId, conversation_id, convId 等
   });
   ```

2. **角色映射测试**
   ```typescript
   test('should map yuanbao roles correctly', () => {
     expect(mapYuanbaoRole('ai')).toBe('assistant');
     expect(mapYuanbaoRole('user')).toBe('user');
     expect(mapYuanbaoRole('human')).toBe('user');
   });
   ```

3. **消息块提取测试**
   ```typescript
   test('should extract text and think blocks', () => {
     // 测试 speechesV2 中的不同块类型
   });
   ```

4. **Markdown 导出测试**
   ```typescript
   test('should convert yuanbao data to markdown', () => {
     const md = yuanbaoToMarkdown(mockData);
     expect(md).toContain('# Title');
     expect(md).toContain('## Assistant');
   });
   ```

### 集成测试

1. **实际页面测试**
   - 在 yuanbao.tencent.com 上运行 userscript
   - 验证 API 拦截是否工作
   - 验证对话数据是否正确捕获

2. **端到端测试**
   - 获取对话 → 标准化 → 导出为 Markdown/JSON
   - 验证输出格式正确

### 手动测试步骤

1. 安装 userscript (`userscripts/chat-export.v2.user.js`)
2. 访问 https://yuanbao.tencent.com
3. 打开开发者工具控制台
4. 查看日志：
   ```
   [YuanbaoAdapter] detect called
   [YuanbaoAdapter] getConversation called
   [YuanbaoNormalizer] normalizeConversation called
   ```
5. 验证对话数据是否正确提取和标准化

## 建议 Commit Message

```
feat(adapter): 实现 Yuanbao PlatformAdapter 和 Normalizer

- 新增 src/adapters/yuanbao-types.ts - Yuanbao 特定类型定义
- 新增 src/adapters/yuanbao.ts - PlatformAdapter 实现
- 新增 src/normalizers/yuanbao.ts - Normalizer 实现
- 更新 src/types/index.ts - 添加 'yuanbao' 到 PlatformType
- 更新 src/adapters/index.ts - 导出并注册 YuanbaoAdapter
- 更新 src/normalizers/index.ts - 导出并注册 YuanbaoNormalizer

核心能力：
- 实现 IPlatformAdapter 和 INormalizer 接口
- 支持多结构兼容（API 响应嵌套、字段名变体）
- 保留 V1 的 API 端点探测框架
- 保留 V1 的消息块解析逻辑（text/think）
- 提供 yuanbaoToMarkdown() 辅助函数

TODO:
- 实现实际的 API 端点探测逻辑
- 实现 fetch/XHR 拦截器
- 添加单元测试

这是 V2 架构的第一个具体站点适配器。
```

## 架构说明

### 数据流

```
Yuanbao 网页
    ↓ (API 拦截/DOM 提取)
RawConversation (platform: 'yuanbao', data: YuanbaoConversationDetail)
    ↓ (YuanbaoAdapter.extractMessages)
RawMessage[] (platform: 'yuanbao', data: YuanbaoTurn)
    ↓ (YuanbaoNormalizer.normalizeConversation)
Conversation (统一格式)
    ↓ (Exporter)
Markdown / JSON / DOCX
```

### 关键设计决策

1. **类型安全**：使用 TypeScript 严格类型定义 Yuanbao 数据结构
2. **多结构兼容**：在运行时尝试多种可能的 JSON 路径
3. **渐进式实现**：先搭建框架，后续填充实际逻辑
4. **V1 兼容性**：保留 V1 的核心解析逻辑，按新架构重组
5. **可测试性**：将纯逻辑（如 yuanbaoToMarkdown）抽离为独立函数

## 后续工作

1. 实现 API 端点探测的实际逻辑
2. 实现 fetch/XHR 拦截器
3. 添加单元测试
4. 实现主动获取对话的功能
5. 添加错误处理和重试机制
6. 优化性能（批量请求、缓存策略）
