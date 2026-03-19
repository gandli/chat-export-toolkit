# DeepSeek Fixtures

此目录包含深度求索（DeepSeek）平台的示例数据和测试文件。

> **样本包规范**: 参见 [`docs/DEEPSEEK_SAMPLE_PACK.md`](../docs/DEEPSEEK_SAMPLE_PACK.md)  
> **采集清单**: 参见 [`CHECKLIST.md`](./CHECKLIST.md)  
> **初始化脚本**: `bun run scripts/prepare-deepseek-sample-pack.ts`

## 状态

📋 **Fixture 模板阶段**

当前仅提供 fixture 模板，用于定义预期的数据结构。真实样本需要从 DeepSeek 平台采集后替换。

## 文件结构

```
fixtures/deepseek/
├── README.md                          # 本说明文件
├── template-conversation.json         # 标准化对话模板（旧，保留向后兼容）
├── raw/                               # 原始 API 响应模板
│   ├── README.md
│   ├── template-detail-001.json       # 对话详情响应模板
│   └── template-edge-001.json         # 边界情况模板
├── normalized/                        # 标准化后数据模板
│   ├── README.md
│   ├── template-normalized-001.json   # 标准化对话模板
│   └── template-normalized-edge-001.json  # 边界情况标准化模板
└── samples/                           # 真实样本目录（待填充）
    └── .gitkeep
```

## 快速开始

```bash
# 1. 生成样本包目录结构和模板
bun run scripts/prepare-deepseek-sample-pack.ts

# 2. 阅读采集清单
cat fixtures/deepseek/CHECKLIST.md

# 3. 访问 https://chat.deepseek.com 并登录，按清单采集样本

# 4. 采集完成后脱敏
bash fixtures/deepseek/sanitize.sh

# 5. 验证样本
jq '.' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ JSON 格式正确"
```

## 使用方法

### 1. 使用模板进行测试开发

**标准化对话模板**（推荐）：

```typescript
import deepseekFixture from '../fixtures/deepseek/template-conversation.json';
// 或
import { readFileSync } from 'fs';
const fixture = JSON.parse(readFileSync('fixtures/deepseek/normalized/template-normalized-001.json', 'utf-8'));

// 在测试中使用
const conversation = fixture as Conversation;
```

**原始 API 响应模板**：

```typescript
import { readFileSync } from 'fs';
const rawFixture = JSON.parse(readFileSync('fixtures/deepseek/raw/template-detail-001.json', 'utf-8'));

// 用于测试 normalizer
const result = await normalizer.normalizeConversation(rawFixture);
```

### 2. 采集真实样本

**详细采集步骤请参见:**
- [`CHECKLIST.md`](./CHECKLIST.md) - 采集检查清单
- [`docs/DEEPSEEK_SAMPLE_PACK.md`](../docs/DEEPSEEK_SAMPLE_PACK.md) - 样本包提交规范
- [`docs/SAMPLE_CAPTURE_GUIDE.md`](../docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南

**快速参考：**

| 样本类型 | 保存位置 | 优先级 |
|---------|---------|--------|
| 对话详情 API 响应 | `raw/detail-sample-001.json` | 🔴 高 |
| 对话列表 API 响应 | `raw/list-sample-001.json` | 🔴 高 |
| 对话页面 HTML | `raw/page-sample-001.html` | 🔴 高 |
| 包含 think 块的对话 | `raw/think-sample-001.json` | 🟡 中 |
| 包含代码块的对话 | `raw/code-sample-001.json` | 🟡 中 |
| 包含数学公式的对话 | `raw/math-sample-001.json` | 🟡 中 |
| 包含附件的对话 | `raw/attachment-sample-001.json` | 🟡 中 |
| 长对话样本（>20 条消息） | `raw/long-sample-001.json` | 🟢 低 |
| 边界情况样本 | `raw/edge-sample-001.json` | 🟢 低 |

### 3. 编写 Normalizer

采集真实样本后，需要编写 DeepSeek 平台的 Normalizer：

```typescript
// src/normalizers/deepseek-normalizer.ts
import type { RawConversation, Conversation } from '../types';

export class DeepSeekNormalizer {
  normalize(rawData: unknown): Conversation {
    // TODO: 实现 DeepSeek 平台特定的标准化逻辑
    // 将 DeepSeek API 响应转换为标准 Conversation schema
    // 注意处理 DeepSeek 特有的 think 块格式
  }
}
```

### 4. 替换模板为真实样本

将 `template-conversation.json` 复制为真实样本：

```bash
cp fixtures/deepseek/template-conversation.json fixtures/deepseek/samples/deepseek-sample-001.json
# 然后编辑为真实数据
```

## 模板说明

### template-conversation.json

标准化后的对话模板，遵循统一的 `Conversation` schema：

```json
{
  "id": "deepseek-example-001",
  "title": "DeepSeek 示例对话",
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": {
        "text": "用户消息内容",
        "attachments": []
      },
      "timestamp": 1710840000000,
      "metadata": {
        "platform": "deepseek",
        "originalId": "原始消息 ID"
      }
    }
  ],
  "createdAt": 1710840000000,
  "updatedAt": 1710840015000,
  "metadata": {
    "platform": "deepseek",
    "messageCount": 2
  }
}
```

### template-raw-response.json

DeepSeek API 原始响应模板（待采集真实数据后填充）。

预计结构（根据实际 API 调整）：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "conversationId": "xxx",
    "title": "对话标题",
    "messages": [
      {
        "id": "xxx",
        "role": "user|assistant",
        "content": "消息内容",
        "thinkContent": "思考过程内容（可选）",
        "createTime": 1710840000000
      }
    ]
  }
}
```

## DeepSeek 平台特点

DeepSeek 平台的特殊功能需要在 Normalizer 中特别处理：

### Think 块处理

DeepSeek 的思考过程可能以独立字段或特殊标记返回：

```
<think>思考内容</think>
```

或

```json
{
  "role": "assistant",
  "content": "最终回答",
  "thinkContent": "思考过程"
}
```

### 代码块处理

DeepSeek 在代码生成方面表现优秀，测试时应包含：

- 多语言代码块
- 带语法高亮的代码
- 代码解释和运行说明

### 数学公式

DeepSeek 支持 LaTeX 数学公式：

- 行内公式：`$E = mc^2$`
- 块级公式：`$$\\int_0^\\infty e^{-x^2} dx$$`

## 测试覆盖目标

- [ ] JSON 导出验证
- [ ] Markdown 导出验证（V1/V2 格式）
- [ ] DOCX 导出验证（需要真实环境）
- [ ] ZIP 批量导出验证（需要真实环境）
- [ ] Think 块处理验证（DeepSeek 特色）
- [ ] 代码块处理验证
- [ ] 数学公式处理验证
- [ ] 特殊字符处理验证
- [ ] 空对话边界情况
- [ ] 长对话性能测试

## 注意事项

- ⚠️ 提交前请移除 Cookie、Authorization 等敏感信息
- ⚠️ 使用脱敏数据，不要包含真实用户对话内容
- ⚠️ 标注采集时间和 DeepSeek 版本/API 版本

## 相关文档

- [Exporter Contract Tests](../../tests/contracts/exporter-contract.test.ts)
- [Fixtures README](../README.md)
- [标准化类型定义](../../src/types/index.ts)

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19  
**状态**: 模板阶段，等待真实样本采集
