# 豆包适配器快速参考

## 文件位置

```
chat-export-toolkit/
├── src/
│   ├── adapters/
│   │   ├── doubao.ts           # 适配器实现
│   │   └── doubao-types.ts     # 类型定义
│   ├── normalizers/
│   │   └── doubao.ts           # 标准化器实现
│   └── types/
│       └── index.ts            # 已添加 'doubao' 到 PlatformType
└── docs/
    └── DOUBAO_ADAPTER_NOTES.md # 详细开发笔记
```

## 使用方法

### 导入适配器

```typescript
import { DoubaoAdapter, doubaoAdapter } from './adapters';
import { DoubaoNormalizer, doubaoNormalizer } from './normalizers';
```

### 检测平台

```typescript
const adapter = new DoubaoAdapter();
if (adapter.detect()) {
  console.log('当前页面是豆包');
}
```

### 获取对话

```typescript
// 获取单个对话
const conversation = await adapter.getConversation(conversationId);

// 获取对话列表
const conversations = await adapter.listConversations();

// 提取消息
const messages = adapter.extractMessages(rawConversation);
```

### 标准化数据

```typescript
const normalizer = new DoubaoNormalizer();

// 标准化单个对话
const normalized = await normalizer.normalizeConversation(rawConversation);

// 批量标准化
const allNormalized = await normalizer.normalizeAll(rawConversations);
```

### 导出为 Markdown

```typescript
import { doubaoToMarkdown } from './normalizers/doubao';

const markdown = doubaoToMarkdown(rawData);
```

## 类型定义

### 核心类型

```typescript
// 对话轮次
interface DoubaoTurn {
  id?: string;
  index?: number;
  role?: 'user' | 'assistant' | 'ai' | 'human' | string;
  createTime?: number | string;
  content?: string;
  messages?: DoubaoMessageUnit[];
  blocks?: DoubaoContentBlock[];
}

// 内容块
interface DoubaoContentBlock {
  type: 'text' | 'think' | 'image' | 'file' | 'code' | string;
  content?: string | DoubaoContentBlock[];
  text?: string;
  url?: string;
  title?: string;
  language?: string;
}

// 对话详情
interface DoubaoConversationDetail {
  conversationId?: string;
  title?: string;
  data?: DoubaoTurn[];
  messages?: DoubaoTurn[];
  turns?: DoubaoTurn[];
  convs?: DoubaoTurn[];
  // ... 更多字段见 doubao-types.ts
}
```

## 平台检测

适配器通过以下方式检测豆包平台：

1. **Hostname 检查**
   - `doubao.com`
   - `www.doubao.com`
   - `chat.doubao.com`
   - `*.doubao.com`

2. **DOM 特征元素**
   - `[data-platform="doubao"]`
   - `.doubao-chat`
   - `.doubao-conversation`
   - `#doubao-app`

3. **全局对象**（待验证）
   - `doubao`
   - `DoubaoApp`
   - `__DOUBAO__`

## 支持的消息类型

| 类型 | 说明 | 处理方式 |
|------|------|----------|
| `text` | 普通文本 | 直接提取 |
| `think` | 思考过程 | 使用引用格式 `> ` |
| `code` | 代码块 | 使用 markdown 代码块 |
| `image` | 图片 | 使用 `![alt](url)` |
| `file` | 文件 | 使用 `[📎 name](url)` |
| 其他 | 不支持的类型 | 标记为 `[type] content` |

## 待实现功能

### L1 - 基础导出（当前级别）
- [x] 平台检测
- [ ] DOM 内容提取验证
- [ ] 类型定义验证

### L2 - API 探测
- [ ] API 端点发现
- [ ] 主动获取对话列表
- [ ] 主动获取对话详情

### L3 - 实时拦截
- [ ] XHR 拦截
- [ ] fetch 拦截
- [ ] 自动捕获响应

## 常见问题

### Q: 如何获取真实 API 响应样本？

A: 
1. 打开豆包网页版 (https://doubao.com)
2. 按 F12 打开开发者工具
3. 切换到 Network 面板
4. 刷新页面或切换对话
5. 查找 XHR/fetch 请求
6. 复制响应 JSON

### Q: 类型定义不准确怎么办？

A: 
1. 对比真实响应和 `doubao-types.ts`
2. 修改字段名称和结构
3. 提交 PR 更新类型定义

### Q: 如何测试适配器？

A: 
```typescript
// 在豆包页面控制台运行
import { DoubaoAdapter } from './adapters/doubao';

const adapter = new DoubaoAdapter();
console.log('检测平台:', adapter.detect());
console.log('元数据:', await adapter.getMetadata());
```

## 参考文档

- [详细开发笔记](./DOUBAO_ADAPTER_NOTES.md)
- [实现总结](../DOUBAO_IMPLEMENTATION_SUMMARY.md)
- [适配器架构](./ADAPTERS.md)

## 更新历史

- **2026-03-19**: 初始骨架实现 (L1)
