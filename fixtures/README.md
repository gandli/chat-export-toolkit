# Fixtures

此目录包含示例数据和测试文件，用于测试和验证导出格式。

## 文件说明

### 标准化对话样本

#### sample-conversation.json

展示统一的 `Conversation` schema 格式，包含：

- 对话基本信息（id, title, timestamps）
- 消息列表（每条消息包含 id, role, content, timestamp, metadata）
- 元数据（platform, participantCount, messageCount）

**用途**: 通用测试、文档示例

#### v2-normalized-conversation.json

V2 标准化后的 Yuanbao 对话样本，包含：

- 4 条消息（2 轮用户/助手对话）
- 包含 think 块内容
- 完整的 metadata 信息

**用途**: Exporter 测试、格式验证

### V1 格式参考

#### v1-yuanbao-sample.json

V1 Yuanbao 原始 API 响应样本，包含：

- conversationId, sessionTitle
- convs 数组（包含 speechesV2）
- 多种消息块类型（text, think）

**用途**: Normalizer 测试、V1 格式对比

#### v1-markdown-output.md

V1 yuanbaoToMarkdown() 预期输出格式，包含：

- 简洁的标题和导出时间
- `## 角色 (Turn N)` 格式
- `*时间戳*` 斜体格式
- `> [Think]` think 块格式

**用途**: V1 格式基准、diff 对比

#### v2-markdown-output.md

V2 MarkdownExporter 输出示例（V2 模式），包含：

- 元数据部分
- `### 第 N 轮 - 角色` 格式
- `> 时间：时间戳` 引用格式
- `> **思考过程:**` think 块格式

**用途**: V2 格式参考、文档示例

## 用途

- 开发时参考标准数据格式
- 测试标准化器和导出器
- V1/V2 格式对比验证
- 文档示例

## 添加更多示例

欢迎添加更多平台特定的原始数据示例，用于测试适配器：

- `raw-chatgpt-conversation.json`
- `raw-claude-conversation.json`
- `raw-gemini-conversation.json`
- etc.

## Yuanbao Golden Tests

### yuanbao/

Yuanbao 平台的 golden tests 和基准输出，用于验证 normalizer + exporters 的输出稳定性。

**目录结构**:

```
fixtures/yuanbao/
├── raw/                        # 原始 API 响应样本（RawConversation 格式）
│   ├── detail-001.json         # 标准对话（4 条消息，含 think 块）
│   └── edge-case-001.json      # 边界情况（空消息、特殊字符）
└── normalized/                 # 标准化后的 Conversation
    ├── normalized-001.json     # detail-001 的标准化输出
    └── normalized-edge-001.json # edge-case-001 的标准化输出
```

**测试运行**:

```bash
bun test tests/golden/yuanbao/yuanbao-golden.test.ts
```

**覆盖场景**:

- ✅ 基本文本消息
- ✅ think 块（带标题/空标题）
- ✅ 空消息处理（`_No content_`）
- ✅ 特殊字符和 emoji
- ✅ 时间戳格式（毫秒级 Unix 时间戳）
- ✅ 角色映射（user/ai → user/assistant）

详见 `docs/YUANBAO_GOLDEN_TESTS.md`。

## 真实页面样本

### yuanbao-live/

从腾讯元宝真实页面采集的 API 请求和响应样本。

**采集方法**:

```bash
# 1. 访问 https://yuanbao.tencent.com 并打开开发者工具
# 2. 运行采集脚本
bun run scripts/capture-yuanbao-samples.ts
# 3. 按提示执行控制台代码并保存样本
```

**文件结构**:

```
fixtures/yuanbao-live/
├── README.md                    # 样本说明
├── detail-request.curl          # 详情请求 cURL
├── detail-response.json         # 详情响应样本
├── list-request.curl            # 列表请求 cURL
├── list-response.json           # 列表响应样本
└── yuanbao-samples-*.json       # 自动采集的综合样本
```

**注意事项**:

- ⚠️  提交前请移除 Cookie、Authorization 等敏感信息
- ⚠️  使用脱敏数据，不要包含真实对话内容
- ⚠️  标注采集时间，API 可能随时间变化

详见 `fixtures/yuanbao-live/README.md`。

## 边界情况测试

`edge-cases/` 目录已包含以下边界情况测试数据：

| 文件 | 描述 | 测试重点 |
|------|------|----------|
| `empty-conversation.json` | 空对话（无消息） | 空数组处理、零计数 |
| `single-message.json` | 单条消息 | 最小有效对话 |
| `multiple-think-blocks.json` | 多个 think 块 | think 块解析和渲染 |
| `special-characters.json` | 特殊字符 | HTML 实体、Markdown 符号、Emoji |
| `code-blocks.json` | 代码块 | 代码高亮、语法标记 |
| `with-attachments.json` | 附件引用 | 文件/图片附件处理 |

详见 `edge-cases/README.md`。

## 格式验证流程

1. 使用 `v1-yuanbao-sample.json` 作为输入
2. 通过 YuanbaoNormalizer 标准化为 `v2-normalized-conversation.json` 格式
3. 使用 MarkdownExporter 分别导出 V1 和 V2 格式
4. 对比 V1 导出结果与 `v1-markdown-output.md`
5. 记录差异并修复

## 验证脚本

```bash
# 验证所有 fixture 数据
bun run scripts/load-fixtures.ts

# 验证构建产物
bun run scripts/verify-build.ts

# 格式对齐验证
bun run scripts/verify-format-parity.ts
```

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19
