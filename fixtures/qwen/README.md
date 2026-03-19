# Qwen Fixtures

此目录包含通义千问（Qwen）平台的示例数据和测试文件。

## 状态

📋 **Fixture 模板阶段**

当前仅提供 fixture 模板，用于定义预期的数据结构。真实样本需要从 Qwen 平台采集后替换。

## 文件结构

```
fixtures/qwen/
├── README.md                      # 本说明文件
├── template-conversation.json     # 标准化对话模板
├── template-raw-response.json     # 原始 API 响应模板（待采集）
└── samples/                       # 真实样本目录（待填充）
    └── .gitkeep
```

## 使用方法

### 1. 使用模板进行测试开发

模板文件提供了符合标准化 `Conversation` schema 的示例数据：

```typescript
import qwenFixture from '../fixtures/qwen/template-conversation.json';

// 在测试中使用
const conversation = qwenFixture as Conversation;
```

### 2. 采集真实样本

**从 Qwen 平台采集 API 响应：**

1. 访问 https://tongyi.aliyun.com/qianwen 并登录
2. 打开开发者工具（F12）→ Network 标签
3. 进行对话或查看历史对话
4. 找到对话相关的 API 请求（通常是 `/conversation/detail` 或类似端点）
5. 复制响应内容并保存为 `samples/qwen-sample-001.json`

**采集清单：**

- [ ] 对话列表 API 响应
- [ ] 对话详情 API 响应
- [ ] 包含 think 块的对话
- [ ] 包含代码块的对话
- [ ] 包含附件的对话
- [ ] 长对话样本（>20 条消息）
- [ ] 特殊字符测试样本

### 3. 编写 Normalizer

采集真实样本后，需要编写 Qwen 平台的 Normalizer：

```typescript
// src/normalizers/qwen-normalizer.ts
import type { RawConversation, Conversation } from '../types';

export class QwenNormalizer {
  normalize(rawData: unknown): Conversation {
    // TODO: 实现 Qwen 平台特定的标准化逻辑
    // 将 Qwen API 响应转换为标准 Conversation schema
  }
}
```

### 4. 替换模板为真实样本

将 `template-conversation.json` 复制为真实样本：

```bash
cp fixtures/qwen/template-conversation.json fixtures/qwen/samples/qwen-sample-001.json
# 然后编辑为真实数据
```

## 模板说明

### template-conversation.json

标准化后的对话模板，遵循统一的 `Conversation` schema：

```json
{
  "id": "qwen-example-001",
  "title": "Qwen 示例对话",
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
        "platform": "qwen",
        "originalId": "原始消息 ID"
      }
    }
  ],
  "createdAt": 1710840000000,
  "updatedAt": 1710840015000,
  "metadata": {
    "platform": "qwen",
    "messageCount": 2
  }
}
```

### template-raw-response.json

Qwen API 原始响应模板（待采集真实数据后填充）。

预计结构（根据实际 API 调整）：

```json
{
  "code": 200,
  "data": {
    "conversationId": "xxx",
    "title": "对话标题",
    "messages": [
      {
        "id": "xxx",
        "role": "user|assistant",
        "content": "消息内容",
        "createTime": 1710840000000
      }
    ]
  }
}
```

## 测试覆盖目标

- [ ] JSON 导出验证
- [ ] Markdown 导出验证（V1/V2 格式）
- [ ] DOCX 导出验证（需要真实环境）
- [ ] ZIP 批量导出验证（需要真实环境）
- [ ] Think 块处理验证
- [ ] 代码块处理验证
- [ ] 特殊字符处理验证
- [ ] 空对话边界情况
- [ ] 长对话性能测试

## 注意事项

- ⚠️ 提交前请移除 Cookie、Authorization 等敏感信息
- ⚠️ 使用脱敏数据，不要包含真实用户对话内容
- ⚠️ 标注采集时间和 Qwen 版本/API 版本

## 相关文档

- [Exporter Contract Tests](../../tests/contracts/exporter-contract.test.ts)
- [Fixtures README](../README.md)
- [标准化类型定义](../../src/types/index.ts)

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19  
**状态**: 模板阶段，等待真实样本采集
