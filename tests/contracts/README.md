# Contract Tests

合同测试确保所有 Exporter 遵循统一的接口和行为约定。

## 运行测试

```bash
# 运行所有合同测试
bun test tests/contracts/

# 运行特定测试文件
bun test tests/contracts/exporter-contract.test.ts
```

## 测试覆盖

### Exporter 覆盖

| Exporter | 格式 | 测试状态 | 说明 |
|----------|------|----------|------|
| JSONExporter | JSON | ✅ 完整 | 所有测试通过 |
| MarkdownExporter | Markdown | ✅ 完整 | 所有测试通过，包括 V1/V2 格式 |
| DocxExporter | DOCX | ⚠️ 接口合同 | Node.js 环境中 JSZip 不可用，仅验证接口 |
| ZIPExporter | ZIP | ⚠️ 接口合同 | Node.js 环境中 JSZip 不可用，仅验证接口 |

### 验证点

1. **输出存在**：Exporter 必须返回有效的 `ExportResult`
2. **基本结构合法**：返回结果必须包含 `success`、`stats` 等字段
3. **错误输入安全降级**：对空对话、特殊字符等边界情况应优雅处理

### 测试场景

- ✅ 基本导出功能
- ✅ 空对话处理
- ✅ 特殊字符处理
- ✅ Think 块处理
- ✅ V1/V2 格式版本
- ✅ 元数据选项
- ✅ 错误输入处理
- ✅ 接口合同验证

## 测试结果

```
29 pass
0 fail
95 expect() calls
```

## 限制说明

### DOCX/ZIP 测试

DOCX 和 ZIP Exporter 的测试当前仅提供**接口合同验证**，不声称已完全通过真实环境验证。

**原因**：
- DOCX 生成依赖 JSZip，在 Node.js 测试环境中不可用
- ZIP 导出需要浏览器环境触发下载
- 真实二进制格式验证需要额外的解析工具

**后续验证计划**：
1. 在真实浏览器环境中运行导出功能
2. 使用工具验证生成的 DOCX/ZIP 文件合法性
3. 与 UI 组件集成后进行端到端测试

## Fixture 使用

测试使用动态创建的测试数据，不依赖外部 fixture 文件。

平台特定 fixture 位于：
- `fixtures/qwen/` - Qwen 平台（模板阶段）
- `fixtures/deepseek/` - DeepSeek 平台（模板阶段）

## 添加新测试

1. 在 `exporter-contract.test.ts` 中添加新的测试用例
2. 使用 `createTestConversation()` 等辅助函数创建测试数据
3. 验证 `ExportResult` 结构和行为

## 相关文档

- [Exporter Testing Guide](../../docs/EXPORTER_TESTING.md)
- [Fixtures README](../../fixtures/README.md)
- [Exporter 实现](../../src/exporters/)

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19
