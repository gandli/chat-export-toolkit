# DeepSeek Golden Tests

验证 DeepSeek normalizer + exporters 的输出与 golden 文件一致。

## 状态

📋 **模板阶段**

当前测试使用模板数据。真实样本采集后需要更新 golden 文件。

## Golden 文件清单

| 文件 | 说明 |
|------|------|
| `expected-markdown-v1.md` | V1 格式 Markdown 预期输出 |
| `expected-markdown-v2.md` | V2 格式 Markdown 预期输出 |
| `expected-json.json` | JSON 格式预期输出 |
| `expected-zip-manifest.json` | ZIP 导出 manifest |

## 测试覆盖

### Normalizer 测试

- [ ] 基本对话标准化
- [ ] Think/Reasoning 块处理
- [ ] 代码块处理
- [ ] 特殊字符和 emoji
- [ ] 空消息处理
- [ ] 时间戳转换
- [ ] Metadata 保留

### Exporter 测试

- [ ] Markdown V1 导出
- [ ] Markdown V2 导出
- [ ] JSON 导出
- [ ] ZIP 批量导出

## 使用方法

```bash
# 运行 DeepSeek golden tests
bun test tests/golden/deepseek/deepseek-golden.test.ts

# 运行所有 golden tests
bun test tests/golden/
```

## 更新 Golden 文件

当 normalizer 或 exporter 逻辑变更时：

1. 运行测试确认失败
2. 检查输出差异是否预期
3. 如果预期，更新 golden 文件
4. 重新运行测试确认通过

## 相关文档

- [DEEPSEEK_ADAPTER_NOTES.md](../../../docs/DEEPSEEK_ADAPTER_NOTES.md)
- [DEEPSEEK_TEST_PLAN.md](../../../docs/DEEPSEEK_TEST_PLAN.md)
- [EXPORTER_TESTING.md](../../../docs/EXPORTER_TESTING.md)

---

**最后更新**: 2026-03-19  
**状态**: 模板阶段
