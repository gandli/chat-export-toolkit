# 豆包 (Doubao) 适配器开发笔记

> **状态**: 骨架实现 (Skeleton)  
> **最后更新**: 2026-03-19  
> **能力级别**: L1 (基础导出) - 待实现

---

## 概述

本文档描述 Chat Export Toolkit V2 中豆包 (Doubao) 平台适配器的实现状态、设计决策和后续开发需求。

**豆包平台**: https://doubao.com

---

## 能力级别定义

### L1 - 基础导出 (Basic Export)
- ✅ 从当前页面提取可见内容
- ✅ 基础 DOM 解析
- ⚠️ 需要真实数据样本验证类型定义

### L2 - API 探测 (API Probing)
- ❌ 主动调用 API 获取对话列表
- ❌ 主动调用 API 获取对话详情
- ❌ API 端点动态发现

### L3 - 实时拦截 (Real-time Interception)
- ❌ 拦截 XHR 请求
- ❌ 拦截 fetch 请求
- ❌ 自动捕获 API 响应

---

## 当前实现状态

### ✅ 已完成

1. **类型定义** (`src/adapters/doubao-types.ts`)
   - DoubaoTurn: 对话轮次类型
   - DoubaoContentBlock: 内容块类型（text, think, image, code, file）
   - DoubaoConversationDetail: 对话详情响应类型
   - DoubaoConversationList: 对话列表响应类型
   - DoubaoApiEndpoints: API 端点类型
   - 辅助类型：DoubaoMessageBlock, DoubaoTurnNormalized 等

2. **适配器骨架** (`src/adapters/doubao.ts`)
   - `detect()`: 平台检测逻辑（基于 hostname 和 DOM 特征）
   - `getConversation()`: 获取单个对话（骨架）
   - `listConversations()`: 获取对话列表（骨架）
   - `extractMessages()`: 提取消息列表
   - `getMetadata()`: 获取平台元数据
   - API 端点探测框架（待实现）
   - DOM 提取回退逻辑

3. **标准化器骨架** (`src/normalizers/doubao.ts`)
   - `normalizeConversation()`: 标准化对话
   - `normalizeMessage()`: 标准化单条消息
   - `normalizeAll()`: 批量标准化
   - 角色映射：user/assistant/system/tool/unknown
   - 内容块处理：text/think/code/image/file
   - `doubaoToMarkdown()`: 导出为 Markdown

4. **注册表更新**
   - ✅ `src/adapters/index.ts`: 导出 DoubaoAdapter 和类型
   - ✅ `src/normalizers/index.ts`: 导出 DoubaoNormalizer
   - ✅ `src/types/index.ts`: 添加 'doubao' 到 PlatformType

---

## 待实现功能

### 🔴 高优先级 (需要真实数据样本)

1. **API 端点验证**
   ```typescript
   // 当前使用推测的端点列表，需要验证
   const DETAIL_ENDPOINT_CANDIDATES = [
     '/api/conversation/detail',
     '/api/v1/conversation/detail',
     // ...
   ];
   ```
   
   **需要**: 
   - 豆包网页版实际使用的 API 端点
   - 请求方法（GET/POST）
   - 请求头要求（认证、Content-Type 等）
   - 请求参数格式

2. **API 响应结构验证**
   ```typescript
   interface DoubaoConversationDetail {
     // 以下字段均为推测，需要真实响应验证
     conversationId?: string;
     title?: string;
     data?: DoubaoTurn[];
     messages?: DoubaoTurn[];
     // ...
   }
   ```
   
   **需要**:
   - 真实 API 响应的 JSON 样本
   - 字段命名规范（camelCase vs snake_case）
   - 嵌套结构（是否有 data/result/response 包装）

3. **消息块类型验证**
   ```typescript
   interface DoubaoContentBlock {
     type: 'text' | 'think' | 'image' | 'file' | 'code' | string;
     content?: string | DoubaoContentBlock[];
     // ...
   }
   ```
   
   **需要**:
   - 豆包实际支持的内容块类型
   - 每种类型的字段结构
   - 是否有其他特殊类型（如引用、卡片等）

### 🟡 中优先级

4. **平台特征检测优化**
   ```typescript
   const DOUBAO_FEATURE_SELECTORS = [
     '[data-platform="doubao"]',
     '.doubao-chat',
     // ... 待验证
   ];
   ```
   
   **需要**:
   - 豆包页面的特征 DOM 元素
   - 是否有全局 JavaScript 对象
   - 更可靠的检测方式

5. **URL 模式验证**
   ```typescript
   const patterns = [
     /\/chat\/([^/?#]+)/,
     /\/conversation\/([^/?#]+)/,
     // ...
   ];
   ```
   
   **需要**:
   - 豆包对话页面的实际 URL 格式
   - conversationId 在 URL 中的位置

### 🟢 低优先级

6. **API 拦截器** (L3 能力)
   - 在 L1/L2 稳定后实现
   - 参考 yuanbao.ts 的拦截逻辑

7. **错误处理优化**
   - 更具体的错误消息
   - 重试机制
   - 降级策略

---

## 需要的真实数据样本

### 样本 1: 对话列表 API 响应

```json
// 期望获取的真实响应示例
{
  "conversations": [
    {
      "conversationId": "...",
      "title": "...",
      "createTime": 1234567890
    }
  ],
  "total": 10
}
```

**用途**: 验证 `DoubaoConversationList` 类型定义

### 样本 2: 对话详情 API 响应

```json
// 期望获取的真实响应示例
{
  "conversationId": "...",
  "title": "...",
  "data": [
    {
      "index": 0,
      "role": "user",
      "content": "..."
    },
    {
      "index": 1,
      "role": "assistant",
      "messages": [...]
    }
  ]
}
```

**用途**: 验证 `DoubaoConversationDetail` 和 `DoubaoTurn` 类型定义

### 样本 3: 消息块结构

```json
// 期望获取的真实响应示例
{
  "type": "text",
  "content": "..."
}
```

**用途**: 验证 `DoubaoContentBlock` 类型定义

### 样本 4: 页面 DOM 结构

**需要**:
- 对话列表页面的 HTML 结构
- 对话详情页面的 HTML 结构
- 特征元素的选择器

**获取方式**: 
```bash
# 在豆包页面执行
document.documentElement.outerHTML
```

---

## 开发建议

### 第一阶段：L1 基础导出

1. **收集真实数据样本**
   - 在豆包页面打开开发者工具
   - 观察 Network 面板中的 API 请求
   - 记录请求 URL、方法、请求头、响应体

2. **验证类型定义**
   - 对比真实响应和类型定义
   - 调整字段名称和结构
   - 添加缺失的字段

3. **测试 DOM 提取**
   - 验证 `detect()` 方法的准确性
   - 优化特征选择器
   - 测试 URL 解析逻辑

### 第二阶段：L2 API 探测

1. **实现 API 端点发现**
   - 从页面 JS 资源中提取端点
   - 实现端点探测逻辑
   - 验证端点可用性

2. **实现数据获取**
   - `fetchConversationDetail()`: 获取单个对话
   - `fetchConversationList()`: 获取对话列表
   - 处理认证和错误

### 第三阶段：L3 实时拦截

1. **实现请求拦截**
   - 拦截 XMLHttpRequest
   - 拦截 fetch
   - 自动捕获 API 响应

2. **优化性能**
   - 去重逻辑
   - 缓存策略
   - 增量更新

---

## 风险点

### 🔴 高风险

1. **API 结构变化**
   - 豆包可能随时更改 API 响应格式
   - 需要保持类型定义的灵活性
   - 建议使用宽松的类型检查

2. **认证机制**
   - API 可能需要特殊的认证头
   - Cookie 可能有时效性
   - 可能需要处理 CSRF token

3. **跨域限制**
   - 浏览器可能阻止跨域请求
   - 可能需要在 userscript 环境中运行
   - 考虑使用代理

### 🟡 中风险

4. **反爬虫机制**
   - 频繁请求可能触发限流
   - 可能需要处理验证码
   - 建议添加请求间隔

5. **数据结构多样性**
   - 不同版本的 API 可能返回不同结构
   - 需要支持多版本兼容
   - 建议使用容错解析

### 🟢 低风险

6. **性能问题**
   - 大量对话可能导致内存压力
   - 建议实现分页和懒加载

---

## 测试建议

### 单元测试

```typescript
// 示例测试用例
describe('DoubaoAdapter', () => {
  describe('detect()', () => {
    it('should detect doubao.com hostname', () => {
      // TODO: 实现测试
    });
  });
  
  describe('extractMessages()', () => {
    it('should extract messages from raw conversation', () => {
      // TODO: 实现测试
    });
  });
});
```

### 集成测试

1. **手动测试**
   - 在豆包页面运行 userscript
   - 验证对话导出功能
   - 检查导出文件内容

2. **自动化测试**
   - 使用 Puppeteer/Playwright
   - 模拟用户操作
   - 验证导出结果

---

## 参考资源

- [豆包官网](https://doubao.com)
- [腾讯元宝适配器实现](./YUANBAO_ADAPTER_SUMMARY.md)
- [ChatGPT 适配器实现](./CHATGPT_ADAPTER_IMPLEMENTATION.md)
- [适配器开发指南](./ADAPTERS.md)

---

## 更新日志

### 2026-03-19
- ✅ 创建类型定义 (`doubao-types.ts`)
- ✅ 创建适配器骨架 (`doubao.ts`)
- ✅ 创建标准化器骨架 (`doubao.ts` in normalizers)
- ✅ 更新注册表（adapters/index.ts, normalizers/index.ts, types/index.ts）
- ✅ 创建本文档

---

## 联系与反馈

如有真实数据样本或发现类型定义错误，请提交 Issue 或 PR。

**下一步**: 收集真实 API 响应样本，验证类型定义准确性。
