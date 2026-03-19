# Edge Cases - 边界情况测试数据

此目录包含各种边界情况的测试数据，用于验证 Exporter 和 Normalizer 的健壮性。

## 文件列表

| 文件 | 描述 | 测试重点 |
|------|------|----------|
| `empty-conversation.json` | 空对话（无消息） | 空数组处理、零计数 |
| `single-message.json` | 单条消息 | 最小有效对话 |
| `multiple-think-blocks.json` | 多个 think 块 | think 块解析和渲染 |
| `special-characters.json` | 特殊字符 | HTML 实体、Markdown 符号、Emoji |
| `code-blocks.json` | 代码块 | 代码高亮、语法标记 |
| `with-attachments.json` | 附件引用 | 文件/图片附件处理 |

## 使用方法

### Node.js 脚本加载

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const fixture = JSON.parse(
  readFileSync(join(__dirname, 'edge-cases/empty-conversation.json'), 'utf-8')
);
```

### 测试页选择

在 `test-integration.html` 中添加 fixture 选择器，动态加载不同测试数据。

## 预期行为

### empty-conversation.json
- ✅ 导出成功（空文件或有提示）
- ✅ 消息计数为 0
- ✅ 无错误抛出

### single-message.json
- ✅ 正常导出
- ✅ 单轮对话格式正确

### multiple-think-blocks.json
- ✅ 所有 think 块正确解析
- ✅ Markdown 中 think 块清晰区分

### special-characters.json
- ✅ 特殊字符正确转义
- ✅ Markdown 渲染不破坏格式
- ✅ Emoji 正常显示

### code-blocks.json
- ✅ 代码块语法高亮
- ✅ 反引号正确转义
- ✅ 语言标记保留

### with-attachments.json
- ✅ 附件信息保留
- ✅ 链接可点击
- ✅ 元数据完整

## 添加新的边界情况

当发现新的边界情况时，请添加对应的测试文件：

1. 在 `edge-cases/` 目录创建新文件
2. 遵循现有文件的 JSON schema
3. 更新此 README 说明测试重点
4. 在验证脚本中添加测试用例

## Schema 参考

```json
{
  "_comment": "测试描述",
  "id": "edge-xxx-001",
  "title": "测试名称",
  "messages": [
    {
      "id": "msg-001",
      "role": "user|assistant",
      "content": {
        "text": "消息内容",
        "attachments": []
      },
      "timestamp": 1710840000000,
      "metadata": {}
    }
  ],
  "createdAt": 1710840000000,
  "updatedAt": 1710840000000,
  "metadata": {
    "platform": "yuanbao",
    "participantCount": 2,
    "messageCount": 2
  }
}
```

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19
