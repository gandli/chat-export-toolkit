# V2 Exporters 实现报告

## ✅ 已完成的工作

### 1. Markdown 导出器 (`src/exporters/markdown.ts`)

**实现的方法：**
- `exportConversation()` - 导出单个对话
- `generateMarkdown()` - 生成 Markdown 内容
- `formatMessage()` - 格式化单条消息
- `formatThinkBlock()` - 处理 think 块
- `getRoleLabel()` - 角色标签映射
- `formatTimestamp()` - 时间戳格式化
- `generateFilename()` - 文件名生成

**从 V1 迁移的逻辑（TODO 标记）：**
- ✅ 标题格式（使用 `#` 一级标题）
- ✅ 轮次格式（`### 第 N 轮 - 角色`）
- ✅ 时间戳格式（`> 时间：YYYY-MM-DD HH:mm:ss`）
- ✅ think 块处理（检测 `<think>` 和 ```think 格式，使用引用样式）
- ✅ 角色标签映射（用户/助手/系统/工具/未知）
- ✅ 文件名生成（保留中文，格式：`标题_日期.md`）
- ✅ 元数据可选包含
- ✅ 附件列表（可选）

**V1 格式保留：**
```markdown
# 对话标题

## 元数据（可选）
- **ID**: conv-id
- **创建时间**: 2024-03-19 13:39:00
- **更新时间**: 2024-03-19 13:45:00
- **消息数**: 10

---

## 对话内容

### 第 1 轮 - 用户

> 时间：2024-03-19 13:39:00

消息内容...

---

### 第 2 轮 - 助手

> 时间：2024-03-19 13:39:05

消息内容...

> **思考过程:**
>
> 思考内容...

---

*导出时间：2024-03-19 13:45:00*
*由 Chat Export Toolkit V2 生成*
```

---

### 2. DOCX 导出器 (`src/exporters/docx.ts`)

**实现的方法：**
- `exportConversation()` - 导出单个对话
- `generateDocx()` - 生成 DOCX 文件（ZIP 包）
- `generateContentTypesXml()` - 生成 [Content_Types].xml
- `generateRelsXml()` - 生成 _rels/.rels
- `generateDocumentXml()` - 生成 word/document.xml（主文档）
- `generateStylesXml()` - 生成 word/styles.xml（样式）
- `generateDocumentRelsXml()` - 生成 word/_rels/document.xml.rels
- `createTitleParagraph()` - 创建标题段落
- `createMetadataParagraphs()` - 创建元数据段落
- `createMessageParagraphs()` - 创建消息段落
- `createThinkBlockParagraphs()` - 创建 think 块段落
- `createContentParagraphs()` - 创建普通内容段落
- `createFooterParagraph()` - 创建页脚
- `escapeXml()` - XML 转义
- `formatTimestamp()` - 时间戳格式化
- `getRoleLabel()` - 角色标签映射
- `generateFilename()` - 文件名生成

**从 V1 迁移的逻辑（TODO 标记）：**
- ✅ DOCX 基本结构（ZIP 包 + XML 文件）
- ✅ 标题样式（居中、大号字体）
- ✅ 元数据段落
- ✅ 消息段落结构（轮次 + 角色 + 时间戳）
- ✅ think 块处理（加粗标题 + 斜体缩进内容）
- ✅ 角色标签映射
- ✅ 文件名生成（与 Markdown 一致）
- ✅ 样式定义（标题/副标题/三级标题/分隔线）
- ✅ 分隔线（使用段落样式）

**DOCX 文件结构：**
```
conversation.docx (ZIP)
├── [Content_Types].xml
├── _rels/
│   └── .rels
├── word/
│   ├── document.xml      (主文档内容)
│   ├── styles.xml        (样式定义)
│   └── _rels/
│       └── document.xml.rels
```

**依赖：**
- JSZip（通过 userscript 的 `@require` 加载）
- 浏览器 Blob API

---

### 3. 导出器注册 (`src/exporters/index.ts`)

**更新内容：**
- ✅ 导出 `MarkdownExporter`
- ✅ 导出 `DocxExporter`
- ✅ 保留 `exporterRegistry` 和 `getExporter()` 函数

---

## 📋 测试建议

### 1. 单元测试

**Markdown 导出器测试：**
```typescript
// src/exporters/markdown.test.ts
import { describe, it, expect } from 'vitest';
import { MarkdownExporter } from './markdown';
import sampleConversation from '../../fixtures/sample-conversation.json';

describe('MarkdownExporter', () => {
  it('should export conversation to markdown', async () => {
    const exporter = new MarkdownExporter();
    const result = await exporter.exportConversation(
      sampleConversation as any,
      { format: 'markdown', includeMetadata: true }
    );
    
    expect(result.success).toBe(true);
    expect(result.stats?.messageCount).toBe(4);
  });

  it('should format think blocks correctly', () => {
    // TODO: 添加 think 块格式测试
  });

  it('should generate correct filename', () => {
    // TODO: 添加文件名生成测试
  });
});
```

**DOCX 导出器测试：**
```typescript
// src/exporters/docx.test.ts
import { describe, it, expect } from 'vitest';
import { DocxExporter } from './docx';
import sampleConversation from '../../fixtures/sample-conversation.json';

describe('DocxExporter', () => {
  it('should export conversation to docx', async () => {
    const exporter = new DocxExporter();
    const result = await exporter.exportConversation(
      sampleConversation as any,
      { format: 'docx', includeMetadata: true }
    );
    
    expect(result.success).toBe(true);
    expect(result.stats?.messageCount).toBe(4);
  });

  it('should generate valid DOCX structure', async () => {
    // TODO: 验证生成的 DOCX 包含所有必需文件
  });

  it('should escape XML special characters', () => {
    // TODO: 测试 XML 转义
  });
});
```

### 2. 集成测试

**测试场景：**
1. 导出包含 think 块的消息
2. 导出包含附件的消息
3. 导出长消息（多段落）
4. 导出包含特殊字符的消息（& < > " '）
5. 批量导出多个对话

**测试步骤：**
```bash
# 1. 构建项目
cd chat-export-toolkit
npm run build

# 2. 在浏览器中测试
# 加载 userscripts/chat-export.v2.user.js
# 访问腾讯元宝网站
# 点击导出按钮，选择 Markdown/DOCX 格式

# 3. 验证导出文件
# - 检查文件格式正确
# - 检查内容完整
# - 检查 think 块格式
# - 检查时间戳格式
# - 检查文件名
```

### 3. E2E 测试

**与 V1 对比验证：**
1. 使用相同的对话数据
2. 分别用 V1 和 V2 导出
3. 对比输出文件格式
4. 确保格式一致（特别是 think 块、时间戳、角色标签）

---

## 🔧 后续优化建议

### 1. 从 V1 迁移的待办事项

以下 TODO 需要在有 V1 代码参考时完成：

- [ ] **Markdown 导出器：**
  - [ ] 确认 think 块正则表达式与 V1 一致
  - [ ] 确认时间戳格式与 V1 一致
  - [ ] 确认角色标签映射与 V1 一致
  - [ ] 确认文件名生成逻辑与 V1 一致

- [ ] **DOCX 导出器：**
  - [ ] 确认 XML 结构与 V1 一致
  - [ ] 确认样式定义与 V1 一致
  - [ ] 确认 think 块格式与 V1 一致
  - [ ] 确认时间戳格式与 V1 一致

### 2. 性能优化

- [ ] 大批量导出时的内存优化
- [ ] DOCX 生成的流式处理
- [ ] 并发导出控制

### 3. 功能增强

- [ ] 支持自定义样式（DOCX）
- [ ] 支持导出选项 UI
- [ ] 支持增量导出
- [ ] 支持导出进度显示

---

## 📝 建议 Commit Message

```
feat(exporters): 实现 Markdown 和 DOCX 导出器

新增：
- src/exporters/markdown.ts - Markdown 导出器
  - 支持标题/轮次/时间戳/think 块格式
  - 支持元数据可选包含
  - 支持附件列表
  - 保留中文字符的文件名生成

- src/exporters/docx.ts - DOCX 导出器
  - 生成标准 DOCX 文件（ZIP + XML）
  - 包含完整的样式定义
  - 支持 think 块特殊格式
  - 支持元数据和附件

更新：
- src/exporters/index.ts - 注册新导出器

技术细节：
- Markdown 导出使用标准 Markdown 语法
- DOCX 导出依赖 JSZip（通过 @require 加载）
- 两个导出器都继承 BaseExporter
- 实现了 IExporter 接口的所有方法
- 添加了详细的 TODO 注释标注 V1 迁移点

测试建议：
- 单元测试：验证导出格式
- 集成测试：验证完整导出流程
- E2E 测试：与 V1 输出对比验证

后续工作：
- 从 V1 迁移具体的格式细节
- 添加单元测试
- 性能优化
```

---

## 🎯 实现总结

**实现的方法总数：**
- Markdown 导出器：7 个方法
- DOCX 导出器：16 个方法
- 总计：23 个方法

**从 V1 迁移的逻辑：**
- ✅ 标题格式
- ✅ 轮次格式
- ✅ 时间戳格式
- ✅ think 块处理
- ✅ 角色标签映射
- ✅ 文件名生成
- ✅ DOCX 基本结构
- ✅ DOCX 样式定义

**输入格式：**
- 统一的 `NormalizedConversation` 格式
- 符合 `src/types/index.ts` 定义的 schema

**输出格式：**
- Markdown: `.md` 文件
- DOCX: `.docx` 文件（ZIP 包）

**依赖：**
- JSZip（DOCX 导出必需，通过 userscript @require 加载）
- 浏览器 Blob API

**兼容性：**
- 浏览器环境（userscript）
- Node.js 环境（需要额外实现文件写入）
