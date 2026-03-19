# ZIP 批量导出功能文档

## 概述

ZIP 导出器支持将多个对话批量导出为 ZIP 压缩包，每个对话保存为独立文件。

**版本**: V2.0.0-alpha (MVP)  
**状态**: ✅ 最小可用版本已完成

---

## 支持范围

### ✅ 已支持

- **JSON 格式**: 每个对话保存为独立的 `.json` 文件
- **Markdown 格式**: 每个对话保存为独立的 `.md` 文件
- **批量导出**: 支持导出任意数量的对话
- **元数据文件**: 可选包含 `metadata.json` 汇总文件
- **自动命名**: 智能文件名生成（序号_标题_日期）
- **ZIP 压缩**: 使用 DEFLATE 压缩算法（级别 6）

### ⏳ TODO / 限制

- **DOCX 格式**: 暂不支持（需要额外处理二进制数据）
- **单文件导出**: ZIP 导出器仅支持批量导出（`exportAll`）
- **增量导出**: 不支持仅导出新增对话
- **并发优化**: 当前为顺序处理，大量对话时可能较慢

---

## 使用方式

### 1. 通过 ChatExportToolkit API

```typescript
import { initToolkit } from './index';

// 初始化
const toolkit = await initToolkit({
  platform: 'yuanbao',
  autoDetect: true,
});

// 批量导出为 ZIP（JSON 格式）
const result = await toolkit.exportAllConversations('zip');

console.log(result);
// {
//   success: true,
//   outputPath: 'chat-export-json-20240319T163000.zip',
//   stats: {
//     messageCount: 150,
//     conversationCount: 10
//   }
// }
```

### 2. 直接使用 ZIPExporter

```typescript
import { ZIPExporter } from './exporters/zip';
import type { Conversation } from './types';

const exporter = new ZIPExporter();

const conversations: Conversation[] = [...]; // 你的对话数据

const result = await exporter.exportAll(conversations, {
  format: 'json',  // 内部文件格式
  includeMetadata: true,  // 包含 metadata.json
  zipFilename: 'my-export',  // 自定义 ZIP 文件名（可选）
});
```

---

## 导出结构

生成的 ZIP 文件结构如下：

```
chat-export-json-20240319T163000.zip
├── 001_你好_2024-03-19.json
├── 002_编程学习_2024-03-18.json
├── 003_数据分析_2024-03-17.json
├── ...
└── metadata.json
```

### metadata.json 格式

```json
{
  "exportedAt": "2024-03-19T16:30:00.000Z",
  "format": "json",
  "conversationCount": 10,
  "totalMessages": 150,
  "conversations": [
    {
      "id": "conv_001",
      "title": "你好",
      "messageCount": 15,
      "createdAt": 1710835200000,
      "updatedAt": 1710921600000,
      "filename": "001_你好_2024-03-19.json"
    },
    ...
  ]
}
```

---

## 文件命名规则

### 对话文件

格式：`序号_标题_日期。扩展名`

- **序号**: 3 位数字，自动补零（001, 002, 003...）
- **标题**: 对话标题，特殊字符替换为下划线，保留中文，最长 50 字符
- **日期**: 对话最后更新时间（YYYY-MM-DD）
- **扩展名**: json / md / docx

示例：
- `001_你好_2024-03-19.json`
- `002_编程学习_2024-03-18.md`
- `010_数据分析项目讨论_2024-03-15.json`

### ZIP 文件

格式：`chat-export-格式 -YYYYMMDDTHHMMSS.zip`

示例：
- `chat-export-json-20240319T163000.zip`
- `chat-export-markdown-20240319T164500.zip`

---

## 手动验证

### 1. 构建项目

```bash
cd /Users/user/.openclaw/workspace/chat-export-toolkit
bun run build
```

### 2. 在浏览器中测试

在 Yuanbao 页面加载构建后的 userscript：

```javascript
// 在浏览器控制台运行
const toolkit = window.getToolkit();
await toolkit.init({ platform: 'yuanbao' });

// 导出所有对话为 ZIP
const result = await toolkit.exportAllConversations('zip');
console.log('Export result:', result);
```

### 3. 验证 ZIP 内容

下载 ZIP 文件后：

```bash
# 查看 ZIP 内容
unzip -l chat-export-json-*.zip

# 解压并检查
unzip chat-export-json-*.zip -o
cat metadata.json
```

### 4. 使用 Demo 数据测试

如果没有缓存数据，系统会自动使用 Demo 数据：

```typescript
// 会自动创建 2 个测试对话
const result = await toolkit.exportAllConversations('zip');
// 应该生成包含 2 个对话的 ZIP 文件
```

---

## 技术实现

### 依赖

- **JSZip**: 通过 @require 加载（CDN）
  ```javascript
  // ==UserScript==
  // @require https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
  // ==/UserScript==
  ```

### 核心流程

1. 检查 JSZip 可用性
2. 创建 ZIP 实例
3. 遍历对话列表
4. 对每个对话：
   - 使用对应格式导出器生成内容
   - 添加到 ZIP
5. 生成 metadata.json
6. 压缩并下载 ZIP

### 代码位置

- **导出器**: `src/exporters/zip.ts`
- **注册**: `src/exporters/index.ts`
- **集成**: `src/index.ts` (exportAllConversations 方法)

---

## 性能考虑

### 当前实现

- **顺序处理**: 逐个导出对话，避免内存峰值
- **压缩级别**: 6（平衡速度和压缩率）
- **内存使用**: 与对话数量成正比

### 优化建议（未来）

- **并发处理**: 使用 Promise.all 并行导出（注意内存）
- **流式压缩**: 对于超大数量对话（1000+）
- **进度回调**: 添加导出进度通知

---

## 常见问题

### Q: JSZip not available 错误

**原因**: JSZip 库未加载

**解决**: 确保 userscript header 包含：
```javascript
// @require https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
```

### Q: 导出失败但无错误信息

**原因**: 可能是对话数据为空或格式不正确

**调试**:
```javascript
const conversations = await store.query('cache:conversation:*');
console.log('Found conversations:', conversations.length);
```

### Q: 文件名乱码

**原因**: 标题包含特殊字符

**解决**: 自动处理，特殊字符会被替换为下划线

---

## 建议 Commit Message

```
feat: 实现 ZIP 批量导出功能 (MVP)

- 新增 ZIPExporter 支持多会话批量导出
- 支持 JSON 和 Markdown 格式
- 自动生成 metadata.json 汇总文件
- 智能文件命名（序号_标题_日期）
- 更新 types 添加 'zip' 格式支持
- 完善 exportAllConversations 实现
- 新增 docs/ZIP_EXPORT.md 文档

当前支持范围：
✅ JSON 格式批量导出
✅ Markdown 格式批量导出  
✅ 元数据文件生成
⏳ DOCX 格式（TODO）

手动验证：
1. bun run build
2. 在 Yuanbao 页面加载 userscript
3. 运行：await getToolkit().exportAllConversations('zip')
4. 检查下载的 ZIP 文件内容
```

---

## 后续改进

1. **DOCX 支持**: 实现 DOCX 格式的 ZIP 导出
2. **增量导出**: 仅导出新增或修改的对话
3. **并发优化**: 支持并发处理提升速度
4. **进度通知**: 添加导出进度回调
5. **过滤选项**: 支持按日期/关键词过滤
6. **自定义模板**: 支持自定义文件命名模板

---

## 相关文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 整体架构
- [MIGRATION.md](./MIGRATION.md) - V1 到 V2 迁移指南
- [FORMAT_PARITY.md](./FORMAT_PARITY.md) - 格式对齐说明
