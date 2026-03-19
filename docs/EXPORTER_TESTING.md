# Exporter Testing Guide

本文档说明如何测试和维护 Chat Export Toolkit 的 Exporter 组件。

## 测试架构

```
tests/
└── contracts/
    └── exporter-contract.test.ts    # 合同测试（本指南重点）
```

## 合同测试说明

### 测试文件

`tests/contracts/exporter-contract.test.ts` 包含所有 Exporter 的合同测试。

### 测试覆盖的 Exporter

| Exporter | 格式 | 测试状态 |
|----------|------|----------|
| JSONExporter | JSON | ✅ 完整测试 |
| MarkdownExporter | Markdown | ✅ 完整测试 |
| DocxExporter | DOCX | ⚠️ 结构验证（需真实环境） |
| ZIPExporter | ZIP | ⚠️ 结构验证（需真实环境） |

### 验证点

1. **输出存在**：Exporter 必须返回有效的 `ExportResult`
2. **基本结构合法**：返回结果必须包含 `success`、`stats` 等字段
3. **错误输入安全降级**：对空对话、特殊字符等边界情况应优雅处理

### 运行测试

```bash
# 使用 Bun 运行测试
bun test tests/contracts/exporter-contract.test.ts

# 运行所有测试
bun test
```

## Fixture 使用

### 标准化 Fixture

位于 `fixtures/` 目录，提供标准化的测试数据：

```
fixtures/
├── sample-conversation.json         # 通用示例
├── edge-cases/                      # 边界情况
│   ├── empty-conversation.json
│   ├── single-message.json
│   ├── special-characters.json
│   ├── code-blocks.json
│   ├── multiple-think-blocks.json
│   └── with-attachments.json
├── qwen/                            # Qwen 平台（模板阶段）
│   ├── README.md
│   └── template-conversation.json
└── deepseek/                        # DeepSeek 平台（模板阶段）
    ├── README.md
    └── template-conversation.json
```

### 平台特定 Fixture

Qwen 和 DeepSeek 目录当前处于**模板阶段**，提供了：

- `README.md`：采集说明和使用指南
- `template-conversation.json`：标准化对话模板

**后续工作**：采集真实 API 响应后替换模板为真实样本。

## 测试场景

### 1. 基本导出测试

```typescript
import { JSONExporter } from '../src/exporters';
import sampleConversation from '../fixtures/sample-conversation.json';

const exporter = new JSONExporter();
const result = await exporter.exportConversation(sampleConversation, {
  format: 'json',
});

expect(result.success).toBe(true);
expect(result.stats?.messageCount).toBeGreaterThan(0);
```

### 2. 边界情况测试

```typescript
import emptyConversation from '../fixtures/edge-cases/empty-conversation.json';

const result = await exporter.exportConversation(emptyConversation, {
  format: 'json',
});

// 应该成功导出空对话，消息数为 0
expect(result.success).toBe(true);
expect(result.stats?.messageCount).toBe(0);
```

### 3. 特殊字符测试

```typescript
import specialChars from '../fixtures/edge-cases/special-characters.json';

const result = await exporter.exportConversation(specialChars, {
  format: 'json',
});

// JSON 应正确处理特殊字符
expect(result.success).toBe(true);
```

### 4. Think 块测试

```typescript
import thinkBlocks from '../fixtures/edge-cases/multiple-think-blocks.json';

const markdownExporter = new MarkdownExporter();
const result = await markdownExporter.exportConversation(thinkBlocks, {
  format: 'markdown',
});

expect(result.success).toBe(true);
```

## 平台特定测试

### Qwen 平台

```typescript
import qwenFixture from '../fixtures/qwen/template-conversation.json';

// 当前使用模板测试
const result = await exporter.exportConversation(qwenFixture, {
  format: 'json',
});

// 采集真实样本后：
// import qwenSample from '../fixtures/qwen/samples/qwen-sample-001.json';
```

### DeepSeek 平台

```typescript
import deepseekFixture from '../fixtures/deepseek/template-conversation.json';

// 当前使用模板测试
const result = await exporter.exportConversation(deepseekFixture, {
  format: 'json',
});

// 采集真实样本后：
// import deepseekSample from '../fixtures/deepseek/samples/deepseek-sample-001.json';
```

## DOCX/ZIP 真实环境验证

### 当前限制

DOCX 和 ZIP Exporter 的测试当前仅提供**结构验证**，不声称已完全通过真实环境验证。

原因：
- DOCX 生成依赖 JSZip，在 Node.js 测试环境中可能不可用
- ZIP 导出需要浏览器环境触发下载
- 真实二进制格式验证需要额外的解析工具

### 后续验证计划

1. **浏览器环境测试**：在真实浏览器中运行导出功能
2. **文件验证**：使用工具验证生成的 DOCX/ZIP 文件合法性
3. **集成测试**：与 UI 组件集成后进行端到端测试

```typescript
// 当前测试仅验证接口合同
it('should generate valid DOCX structure (structure check only)', async () => {
  const result = await exporter.exportConversation(conversation, options);
  
  // 仅验证返回结构符合 ExportResult 合同
  expect(result).toBeDefined();
  expect(typeof result.success).toBe('boolean');
  
  // 不声称已完全通过真实环境验证
});
```

## 添加新测试

### 1. 添加新的边界情况 Fixture

在 `fixtures/edge-cases/` 添加新文件：

```json
{
  "_comment": "描述此边界情况",
  "id": "edge-case-001",
  "title": "边界情况测试",
  "messages": [],
  "createdAt": 1710840000000,
  "updatedAt": 1710840000000
}
```

### 2. 在合同测试中添加测试用例

```typescript
it('should handle new edge case', async () => {
  const conversation = await import('../fixtures/edge-cases/new-case.json');
  const result = await exporter.exportConversation(conversation, options);
  
  expect(result.success).toBe(true);
  // 添加特定验证
});
```

## 测试清单

### 当前已完成

- [x] JSON Exporter 完整测试
- [x] Markdown Exporter 完整测试
- [x] DOCX Exporter 接口合同测试
- [x] ZIP Exporter 接口合同测试
- [x] 边界情况测试（空对话、单消息、特殊字符、think 块、代码块、附件）
- [x] Qwen/DeepSeek fixture 模板
- [x] 测试文档

### 待完成（需要真实样本）

- [ ] Qwen 真实样本采集和测试
- [ ] DeepSeek 真实样本采集和测试
- [ ] DOCX 真实环境验证
- [ ] ZIP 真实环境验证
- [ ] 平台特定 Normalizer 测试
- [ ] 性能测试（长对话、大批量导出）

## 故障排查

### 测试失败

1. **检查 Fixture 格式**：确保符合 `Conversation` schema
2. **检查 Exporter 实现**：确保正确处理边界情况
3. **查看错误信息**：测试输出应包含详细错误信息

### 环境问题

- **JSZip not available**：在浏览器环境中测试 DOCX/ZIP
- **DOM not available**：某些 Exporter 需要浏览器环境

## 相关文档

- [Fixtures README](../fixtures/README.md)
- [Exporter 实现](../src/exporters/)
- [类型定义](../src/types/index.ts)

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19
