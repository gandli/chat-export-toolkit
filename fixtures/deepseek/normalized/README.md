# DeepSeek Normalized Fixtures

此目录包含 DeepSeek 平台的**标准化后**对话数据。

## 状态

📋 **模板阶段**

当前文件为**模板/占位符**，用于定义预期的标准化输出结构。

## 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `template-normalized-001.json` | 📋 模板 | 标准化对话模板 |
| `template-normalized-edge-001.json` | 📋 模板 | 边界情况标准化模板 |

## 标准化 Schema

所有 normalized fixture 遵循统一的 `Conversation` schema：

```typescript
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata: {
    platform: PlatformType;
    participantCount?: number;
    messageCount?: number;
    originalData?: unknown;
    model?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'unknown';
  content: {
    text: string;
    attachments?: Attachment[];
    metadata?: Record<string, unknown>;
  };
  timestamp: number;
  metadata?: {
    platform: PlatformType;
    originalId?: string;
    originalRole?: string;
    model?: string;
    blockTypes?: string[];
    hasReasoning?: boolean;
  };
}
```

## 使用方法

### 在测试中使用

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const normalizedFixture = JSON.parse(
  readFileSync(join(__dirname, '../../fixtures/deepseek/normalized/template-normalized-001.json'), 'utf-8')
) as Conversation;
```

### 与 Golden Test 配合

```typescript
import { DeepSeekNormalizer } from '../../../src/normalizers/deepseek';

describe('DeepSeek Normalizer', () => {
  it('应该正确标准化对话', async () => {
    const normalizer = new DeepSeekNormalizer();
    const rawFixture = loadRawFixture();
    const expected = loadNormalizedFixture();
    
    const result = await normalizer.normalizeConversation(rawFixture);
    
    expect(result.id).toBe(expected.id);
    expect(result.title).toBe(expected.title);
    expect(result.messages).toHaveLength(expected.messages.length);
  });
});
```

## DeepSeek 特有处理

### Think/Reasoning 块

DeepSeek 的推理过程应转换为 Markdown 引用格式：

```markdown
> [Reasoning]
> 思考过程内容...
```

### 代码块

保持原始代码块格式：

````markdown
```python
def quick_sort(arr):
    ...
```
````

### 数学公式

保持 LaTeX 格式不变：

- 行内公式：`$E = mc^2$`
- 块级公式：`$$\int_0^\infty e^{-x^2} dx$$`

## 相关文档

- [DEEPSEEK_ADAPTER_NOTES.md](../../../docs/DEEPSEEK_ADAPTER_NOTES.md)
- [DEEPSEEK_TEST_PLAN.md](../../../docs/DEEPSEEK_TEST_PLAN.md)
- [标准化类型定义](../../../src/types/index.ts)

---

**最后更新**: 2026-03-19  
**状态**: 模板阶段
