# Adapter Testing Guide

适配器合同测试指南 - 确保各平台适配器遵守统一的基本契约

## 概述

合同测试（Contract Tests）用于验证适配器是否实现了必需的接口，并在各种输入条件下表现合理。这些测试**不验证具体的业务逻辑**，只验证接口的存在性和基本的健壮性。

## 测试文件位置

```
tests/contracts/
├── adapter-contract.test.ts    # 主要合同测试
└── helpers.ts                   # 测试辅助函数和 fixtures
```

## 运行测试

### 使用 Vitest

```bash
# 安装测试依赖（如果还没有）
bun add -d vitest @vitest/ui

# 运行所有合同测试
bun vitest run tests/contracts/

# 运行特定测试文件
bun vitest run tests/contracts/adapter-contract.test.ts

# 监听模式（开发时使用）
bun vitest tests/contracts/
```

### 在 CI 中运行

```bash
# 添加 package.json scripts
{
  "scripts": {
    "test": "vitest run",
    "test:contracts": "vitest run tests/contracts/",
    "test:watch": "vitest"
  }
}
```

## 测试覆盖的契约

### 1. detect() 方法

每个适配器必须：
- ✅ 有 `detect` 方法
- ✅ 返回 boolean 值
- ✅ 不抛出异常

```typescript
adapter.detect() // => boolean
```

### 2. extractMessages() 方法

每个适配器必须：
- ✅ 有 `extractMessages` 方法
- ✅ 对有效输入返回数组
- ✅ 对空输入返回数组（安全降级）
- ✅ 对无效输入不崩溃
- ✅ 对未知结构不崩溃

```typescript
adapter.extractMessages(rawConversation) // => RawMessage[]
```

### 3. getConversation() 方法

每个适配器必须：
- ✅ 有 `getConversation` 方法
- ✅ 返回 Promise
- ✅ 无参数调用不崩溃
- ✅ 带参数调用不崩溃
- ✅ 返回 null 或对象

```typescript
await adapter.getConversation(conversationId?) // => Promise<RawConversation | null>
```

### 4. listConversations() 方法

每个适配器必须：
- ✅ 有 `listConversations` 方法
- ✅ 返回 Promise
- ✅ 返回数组

```typescript
await adapter.listConversations() // => Promise<RawConversation[]>
```

### 5. 接口一致性

所有适配器必须：
- ✅ 有 `platform` 属性（字符串）
- ✅ 实现所有必需的方法

### 6. 边界情况处理

所有适配器必须：
- ✅ 处理 null 输入不崩溃
- ✅ 处理 undefined 输入不崩溃
- ✅ 处理空对象输入不崩溃
- ✅ 处理深度嵌套的无效数据不崩溃

## 测试平台

当前测试覆盖以下平台：

| 平台 | 适配器类 | 状态 | 测试通过 |
|------|---------|------|----------|
| Yuanbao (腾讯元宝) | `YuanbaoAdapter` | ✅ 已测试 | ✅ 25/25 |
| ChatGPT | `ChatGPTAdapter` | ✅ 已测试 | ✅ 25/25 |
| Kimi | `KimiAdapter` | ✅ 已测试 | ✅ 25/25 |
| Doubao (豆包) | `DoubaoAdapter` | ✅ 已测试 | ✅ 25/25 |
| Claude | `ClaudeAdapter` | ✅ 已测试 | ✅ 25/25 |
| Qwen (通义千问) | `QwenAdapter` | ✅ 已测试 | ✅ 25/25 |
| DeepSeek (深度求索) | `DeepSeekAdapter` | ✅ 已测试 | ✅ 25/25 |

**总计：177 个测试全部通过 ✅**

### 测试发现的问题及修复

在创建合同测试过程中发现并修复了以下问题：

1. **所有适配器的 `extractMessages` 方法缺少对 null/undefined 输入的防御性检查**
   - 问题：当传入 `null`、`undefined` 或 `data: null` 的 conversation 时，适配器会抛出 `TypeError`
   - 修复：在所有 7 个适配器的 `extractMessages` 方法开头添加了防御性检查
   - 修复后行为：返回空数组 `[]` 并记录警告日志

```typescript
// 修复示例
extractMessages(rawConversation: RawConversation): RawMessage[] {
  // 防御性检查：处理 null/undefined 输入
  if (!rawConversation || !rawConversation.data) {
    console.warn('[Adapter] Invalid input to extractMessages');
    return [];
  }
  // ... 原有逻辑
}
```

### 各平台测试详情

#### ✅ Yuanbao Adapter
- detect: 4/4 通过
- extractMessages: 6/6 通过
- getConversation: 5/5 通过
- listConversations: 4/4 通过
- Edge Cases: 6/6 通过

#### ✅ ChatGPT Adapter
- detect: 4/4 通过
- extractMessages: 6/6 通过
- getConversation: 5/5 通过
- listConversations: 4/4 通过
- Edge Cases: 6/6 通过

#### ✅ Kimi Adapter
- detect: 4/4 通过
- extractMessages: 6/6 通过
- getConversation: 5/5 通过
- listConversations: 4/4 通过
- Edge Cases: 6/6 通过

#### ✅ Doubao Adapter
- detect: 4/4 通过
- extractMessages: 6/6 通过
- getConversation: 5/5 通过
- listConversations: 4/4 通过
- Edge Cases: 6/6 通过

#### ✅ Claude Adapter
- detect: 4/4 通过
- extractMessages: 6/6 通过
- getConversation: 5/5 通过
- listConversations: 4/4 通过
- Edge Cases: 6/6 通过

#### ✅ Qwen Adapter
- detect: 4/4 通过
- extractMessages: 6/6 通过
- getConversation: 5/5 通过
- listConversations: 4/4 通过
- Edge Cases: 6/6 通过

#### ✅ DeepSeek Adapter
- detect: 4/4 通过
- extractMessages: 6/6 通过
- getConversation: 5/5 通过
- listConversations: 4/4 通过
- Edge Cases: 6/6 通过

## 添加新适配器的测试

当添加新的平台适配器时：

1. **在 `ADAPTERS_TO_TEST` 数组中添加新条目**：

```typescript
const ADAPTERS_TO_TEST = [
  // ... 现有适配器
  { 
    name: 'NewPlatform', 
    AdapterClass: NewPlatformAdapter, 
    platform: 'newplatform' 
  },
];
```

2. **确保适配器类导出正确**：

```typescript
// src/adapters/index.ts
export { NewPlatformAdapter, newPlatformAdapter } from './newplatform';
```

3. **运行测试验证**：

```bash
bun vitest run tests/contracts/
```

## 测试辅助函数

`helpers.ts` 提供了以下辅助函数：

### Fixtures

```typescript
// 创建最小的 fake conversation
createFakeRawConversation(platform, overrides?)

// 创建空的 conversation（测试边界情况）
createEmptyRawConversation(platform)

// 创建无效的 conversation（测试容错）
createInvalidRawConversation(platform)

// 创建未知结构的 conversation（测试兼容性）
createUnknownStructureRawConversation(platform)
```

### 验证函数

```typescript
// 检查是否为有效数组
isValidArray(value)

// 检查是否为有效对象
isValidObject(value)

// 检查 normalize 输出是否合法
isValidNormalizedConversation(value)

// 检查 normalizeMessage 输出是否合法
isValidNormalizedMessage(value)
```

### 安全调用

```typescript
// 安全地调用可能失败的函数
await safeCall(fn, defaultValue)
```

## 常见问题

### Q: 为什么测试不使用真实 DOM？

A: 合同测试的目的是验证接口契约，而不是具体的 DOM 操作逻辑。使用 fake input 可以：
- 更快（不需要浏览器环境）
- 更可靠（不依赖外部条件）
- 更容易调试

### Q: 如何测试具体的 DOM 提取逻辑？

A: 使用集成测试或 E2E 测试。合同测试只验证接口存在性和基本健壮性。

### Q: 如果某个平台的 API 有特殊要求怎么办？

A: 可以在合同测试之外添加平台特定的测试文件：

```
tests/contracts/
├── adapter-contract.test.ts      # 通用合同测试
├── yuanbao-specific.test.ts      # Yuanbao 特定测试
├── chatgpt-specific.test.ts      # ChatGPT 特定测试
└── ...
```

### Q: 测试失败了怎么办？

A: 检查：
1. 适配器是否正确实现了所有必需的方法
2. 方法签名是否正确
3. 是否正确处理了边界情况（null/undefined/空对象）
4. 是否有未处理的异常

## 最佳实践

1. **保持测试轻量**：合同测试应该快速运行，不依赖外部资源
2. **使用 fake input**：避免依赖真实的 DOM 或网络请求
3. **测试边界情况**：确保适配器在异常输入下不崩溃
4. **持续集成**：在 CI 中运行合同测试，确保新代码不破坏契约
5. **文档化**：当添加新的测试用例时，更新本文档

## 下一步

- [ ] 添加 normalizer 的合同测试
- [ ] 添加 exporter 的合同测试
- [ ] 添加集成测试（使用真实 DOM）
- [ ] 添加 E2E 测试（完整的用户流程）

## 参考

- [Vitest 文档](https://vitest.dev/)
- [测试金字塔](https://martinfowler.com/bliki/TestPyramid.html)
- [Contract Testing](https://martinfowler.com/bliki/ContractTest.html)
