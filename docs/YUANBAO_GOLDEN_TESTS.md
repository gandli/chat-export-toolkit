# Yuanbao Golden Tests 文档

本文档说明 Yuanbao 平台的 golden tests 和基准输出。

**最后更新**: 2026-03-19 - TDD 式加固完成

## 目录结构

```
chat-export-toolkit/
├── fixtures/yuanbao/
│   ├── raw/                    # 原始 API 响应样本
│   │   ├── detail-001.json     # 标准对话样本（4 条消息）
│   │   └── edge-case-001.json  # 边界情况样本
│   └── normalized/             # 标准化后的 Conversation
│       ├── normalized-001.json
│       └── normalized-edge-001.json
├── tests/golden/yuanbao/       # Golden test 预期输出
│   ├── expected-markdown-v1.md       # V1 格式 Markdown
│   ├── expected-markdown-v2.md       # V2 格式 Markdown
│   ├── expected-markdown-edge-001.md # 边界情况 Markdown
│   ├── expected-json.json            # JSON 导出
│   └── expected-zip-manifest.json    # ZIP 文件清单
└── docs/YUANBAO_GOLDEN_TESTS.md      # 本文档
```

## 测试覆盖（2026-03-19 加固后）

### 新增测试文件

- `tests/golden/yuanbao/yuanbao-edge-cases.test.ts` - 44 个边界情况和安全测试

### 测试覆盖矩阵

| 类别 | 测试项 | 状态 |
|------|--------|------|
| **空内容处理** | 空 speechesV2 数组 | ✅ |
| | undefined speechesV2 | ✅ |
| | 空 content 数组 | ✅ |
| | null content | ✅ |
| | 空对话（无消息） | ✅ |
| **Think 块处理** | 带标题的 think 块 | ✅ |
| | 空标题的 think 块 | ✅ |
| | undefined 标题的 think 块 | ✅ |
| | 嵌套 content 数组的 think 块 | ✅ |
| | 多个 think 块 | ✅ |
| **特殊字符** | Emoji | ✅ |
| | HTML 特殊字符 | ✅ |
| | 中文字符 | ✅ |
| | 引号和撇号 | ✅ |
| | 换行符和制表符 | ✅ |
| **Metadata** | platform 字段 | ✅ |
| | originalIndex 字段 | ✅ |
| | blockCount 字段 | ✅ |
| | participantCount 字段 | ✅ |
| | originalData 保留 | ✅ |
| **命名规则** | sessionTitle 优先级 | ✅ |
| | title 回退 | ✅ |
| | 默认标题 | ✅ |
| | 超长标题 | ✅ |
| | 多种 ID 字段变体 | ✅ |
| **时间戳** | 毫秒级时间戳 | ✅ |
| | 秒级时间戳转换 | ✅ |
| | 字符串时间戳 | ✅ |
| | 无效时间戳降级 | ✅ |
| | 缺失时间戳降级 | ✅ |
| | createdAt/updatedAt 计算 | ✅ |
| **错误处理** | null 输入 | ✅ |
| | undefined 输入 | ✅ |
| | 空对象输入 | ✅ |
| | 损坏的 convs 数据 | ✅ |
| | 未知 speaker 类型 | ✅ |
| | 未知块类型 | ✅ |

## 测试样本说明

### 样本 1: detail-001 (标准对话)

**文件**: `fixtures/yuanbao/raw/detail-001.json`

**场景**: 包含 4 条消息的完整对话
- User: 问候
- Assistant: 带 think 块的自我介绍
- User: 请求代码帮助
- Assistant: 带 think 块的代码示例

**覆盖内容**:
- ✅ 基本文本消息
- ✅ think 块（带标题）
- ✅ think 块（空标题）
- ✅ 多轮对话
- ✅ 时间戳处理
- ✅ 角色映射 (user/ai → user/assistant)

### 样本 2: edge-case-001 (边界情况)

**文件**: `fixtures/yuanbao/raw/edge-case-001.json`

**场景**: 测试边界情况
- User: 空消息（speechesV2.content 为空数组）
- Assistant: 回应空消息
- User: 特殊字符和 emoji
- Assistant: 特殊字符确认

**覆盖内容**:
- ✅ 空消息处理（输出 `_No content_`）
- ✅ 空 think 标题
- ✅ 特殊字符 (@#$%^&*())
- ✅ Emoji (🎉🚀)
- ✅ Unicode 支持

## 导出格式说明

### Markdown V1 格式

**文件**: `tests/golden/yuanbao/expected-markdown-v1.md`

**特点**:
- 简洁风格，无元数据部分
- 消息标题：`## 角色 (Turn N)`
- 时间戳：`*MM/DD/YYYY, H:MM:SS AM/PM*`
- think 块：`> [Think] 标题` + 引用内容
- 分隔符：`---`

**适用场景**: 快速阅读、打印、与 V1 输出对齐

### Markdown V2 格式

**文件**: `tests/golden/yuanbao/expected-markdown-v2.md`

**特点**:
- 包含元数据部分（ID、时间、消息数、平台）
- 消息标题：`### 第 N 轮 - 角色`（中文）
- 时间戳：`> 时间：YYYY-MM-DD HH:mm:ss`
- think 块：`> **思考过程:**` + 引用内容
- 导出信息：底部包含导出时间和生成器信息

**适用场景**: 正式归档、需要元数据的场景

### JSON 格式

**文件**: `tests/golden/yuanbao/expected-json.json`

**特点**:
- 完整保留标准化后的 Conversation 结构
- 包含所有 metadata 字段
- 2 空格缩进
- UTF-8 编码

**适用场景**: 程序化处理、数据交换、备份

### ZIP 格式

**文件**: `tests/golden/yuanbao/expected-zip-manifest.json`

**验证内容**（不要求 bit-perfect）:
- ✅ 文件清单正确
- ✅ metadata.json 存在
- ✅ 命名规则：`{index}_{title}_{date}.{ext}`
- ✅ 索引 padding（3 位数字）
- ✅ 标题安全字符处理（保留中文）
- ✅ 日期格式：YYYY-MM-DD

**不验证**:
- ❌ 二进制内容完全一致
- ❌ 压缩级别
- ❌ 文件顺序

## 如何使用 Golden Tests

### 手动比对

```bash
# 比对 Markdown 输出
diff tests/golden/yuanbao/expected-markdown-v1.md output/generated.md

# 比对 JSON 输出（忽略时间戳）
jq --sort-keys '.messages' tests/golden/yuanbao/expected-json.json > expected.json
jq --sort-keys '.messages' output/generated.json > generated.json
diff expected.json generated.json
```

### 自动化测试（TODO）

未来可添加：
```bash
bun test tests/golden/yuanbao.test.ts
```

测试用例应包括：
1. Normalizer 输出与 normalized/*.json 一致
2. MarkdownExporter V1 输出与 expected-markdown-v1.md 一致
3. MarkdownExporter V2 输出与 expected-markdown-v2.md 一致
4. JSONExporter 输出与 expected-json.json 一致
5. ZIPExporter 文件清单与 expected-zip-manifest.json 一致

## 2026-03-19 TDD 加固说明

### 修复的问题

1. **`src/normalizers/base.ts` - `parseTimestamp` 方法**
   - 修复：添加对字符串时间戳的正确处理
   - 修复：添加 null/undefined 输入的降级处理
   - 现在支持：数字（秒/毫秒）、数字字符串、日期字符串、null/undefined

2. **`src/normalizers/yuanbao.ts` - `normalizeConversation` 方法**
   - 修复：添加 null/undefined 输入的防御性检查
   - 修复：添加对损坏 turn 数据的跳过逻辑
   - 修复：blockCount 现在同时添加到 message.metadata 和 content.metadata

3. **测试修复**
   - 修复：exporter-contract.test.ts 中的测试现在正确处理 Node.js 环境（无 Blob）
   - 新增：44 个边界情况和安全测试

### 仍缺少的真实样本

以下场景需要真实 Yuanbao 站点采集的样本：

1. **实际 API 响应**: 当前样本为手工构造，需替换为真实 API 响应
2. **最新字段**: Yuanbao 可能新增字段（如 speechesV3、新块类型）
3. **多媒体内容**: 图片、文件附件的真实响应格式
4. **错误响应**: API 错误响应的真实格式
5. **长对话**: 50+ 消息的真实对话样本
6. **并发消息**: 同一时间戳的多条真实消息

## 已知限制

### 当前未覆盖的场景

1. **多媒体内容**: 图片、文件附件
2. **代码块高亮**: 带语言标记的代码块
3. **表格**: Markdown 表格
4. **长对话**: 50+ 消息的对话
5. **并发消息**: 同一时间戳的多条消息
6. **系统消息**: role=system 的消息
7. **工具调用**: role=tool 的消息
8. **嵌套 think**: think 块中包含 think 块

### 需要真实站点样本补齐

以下场景需要真实 Yuanbao 站点采集的样本：

1. **实际 API 响应**: 当前样本为手工构造，需替换为真实 API 响应
2. **最新字段**: Yuanbao 可能新增字段（如 speechesV3、新块类型）
3. **错误处理**: API 错误响应格式
4. **分页**: list 接口的分页行为
5. **认证**: 认证失败、token 过期场景

建议运行 `bun run scripts/capture-yuanbao-samples.ts` 采集真实样本。

## 维护指南

### 何时更新 Golden Tests

- ✅ Yuanbao API 格式变更
- ✅ Normalizer/Exporter 逻辑修复
- ✅ 新增支持的消息类型
- ✅ 格式版本升级（V1→V2）

### 更新流程

1. 更新 `fixtures/yuanbao/raw/*.json`（如需要）
2. 运行 normalizer 生成新的 normalized 输出
3. 运行 exporters 生成新的导出文件
4. 人工审查输出是否符合预期
5. 更新 `tests/golden/yuanbao/expected-*.*`
6. 更新本文档的说明

### 版本控制

Golden test 文件应纳入版本控制：
- ✅ 提交到 Git
- ✅ 变更时写清楚 commit message
- ✅ 大变更时更新本文档

## 建议 Commit Message

### 初始 Golden Tests (已完成)

```
test: add Yuanbao golden tests for normalizer + exporters

- Add fixtures/yuanbao/raw/detail-001.json (standard 4-message conversation)
- Add fixtures/yuanbao/raw/edge-case-001.json (empty message, special chars)
- Add fixtures/yuanbao/normalized/*.json (normalized Conversation outputs)
- Add tests/golden/yuanbao/expected-markdown-v1.md
- Add tests/golden/yuanbao/expected-markdown-v2.md
- Add tests/golden/yuanbao/expected-json.json
- Add tests/golden/yuanbao/expected-zip-manifest.json
- Add docs/YUANBAO_GOLDEN_TESTS.md

Coverage:
- Basic text messages
- Think blocks (with/without title)
- Empty messages (_No content_)
- Special characters and emoji
- Timestamp formatting (V1/V2)
- Role mapping (user/ai → user/assistant)
- ZIP file naming conventions
```

### TDD 加固 (2026-03-19)

```
test(yuanbao): TDD hardening - add 44 edge case tests + fix robustness issues

Tests added:
- tests/golden/yuanbao/yuanbao-edge-cases.test.ts (44 tests)
  - Empty content handling (5 tests)
  - Think block variations (5 tests)
  - Special characters & Unicode (5 tests)
  - Metadata integrity (5 tests)
  - Naming rules (6 tests)
  - Timestamp handling (6 tests)
  - Error handling & safe degradation (6 tests)
  - Markdown exporter integration (3 tests)
  - yuanbaoToMarkdown function (3 tests)

Fixes:
- src/normalizers/base.ts: parseTimestamp now handles string timestamps and null/undefined
- src/normalizers/yuanbao.ts: add defensive checks for null/undefined input
- src/normalizers/yuanbao.ts: skip null/undefined turns gracefully
- src/normalizers/yuanbao.ts: add blockCount to message.metadata
- tests/contracts/exporter-contract.test.ts: handle Node.js environment (no Blob)

Docs:
- docs/YUANBAO_GOLDEN_TESTS.md: add test coverage matrix and fix notes

All 55 Yuanbao tests passing ✅
```

## 参考资料

- [Yuanbao Adapter Summary](./YUANBAO_ADAPTER_SUMMARY.md)
- [Yuanbao Live Validation](./YUANBAO_LIVE_VALIDATION.md)
- [Format Parity](./FORMAT_PARITY.md)
- [Exporters Implementation](../EXPORTERS_IMPLEMENTATION.md)
