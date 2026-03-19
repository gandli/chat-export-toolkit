/**
 * DOCX Exporter
 * 将标准化的对话导出为 Microsoft Word 文档格式
 * 
 * 格式对齐说明：
 * - 支持 V1 兼容模式（formatVersion: 'v1'）和 V2 模式（formatVersion: 'v2'）
 * - V1 格式：简洁风格，标题使用英文角色标签
 * - V2 格式：增强风格，包含元数据部分和中文角色标签
 */

import type { Conversation, Message, ExportOptions, ExportResult } from '../types';
import { BaseExporter } from './base';

/**
 * 导出选项扩展：支持格式版本选择
 * @internal 保留供未来使用
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DocxExportOptions extends ExportOptions {
  /**
   * 格式版本
   * - 'v1': V1 兼容模式（简洁风格）
   * - 'v2': V2 增强模式（包含元数据）
   * @default 'v2'
   */
  formatVersion?: 'v1' | 'v2';
}

/**
 * DOCX 格式导出器
 * 
 * DOCX 本质是 ZIP 压缩包，包含多个 XML 文件
 * 主要文件：
 * - [Content_Types].xml - 内容类型定义
 * - _rels/.rels - 关系定义
 * - word/document.xml - 主文档内容
 * - word/styles.xml - 样式定义
 * - word/_rels/document.xml.rels - 文档关系
 */
export class DocxExporter extends BaseExporter {
  readonly format = 'docx';

  /**
   * 导出单个对话为 DOCX
   */
  async exportConversation(
    conversation: Conversation,
    options: DocxExportOptions
  ): Promise<ExportResult> {
    try {
      // 检查 JSZip 是否可用（在 userscript 环境中通过 @require 加载）
      const JSZip = (globalThis as any).JSZip;
      if (!JSZip) {
        // Node.js 环境或 JSZip 未加载：返回降级结果
        console.log('[DocxExporter] JSZip not available, skipping DOCX generation');
        const filename = options.filename || this.generateFilename(conversation, 'docx');
        return {
          success: false,
          error: 'JSZip not available. DOCX export requires browser environment with JSZip loaded.',
          outputPath: filename,
          stats: {
            messageCount: conversation.messages.length,
            conversationCount: 1,
          },
        };
      }

      // 生成 DOCX 二进制数据
      const docxBlob = await this.generateDocx(conversation, options);

      // 生成文件名
      const filename = options.filename || this.generateFilename(conversation, 'docx');

      // 在浏览器环境中触发下载
      this.triggerDownload(docxBlob, filename);

      return {
        success: true,
        outputPath: filename,
        stats: {
          messageCount: conversation.messages.length,
          conversationCount: 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stats: {
          messageCount: 0,
          conversationCount: 0,
        },
      };
    }
  }

  /**
   * 生成 DOCX 文件
   * 
   * TODO: 从 V1 迁移 buildDocxBlob() 的完整逻辑
   * TODO: 确保输出的 DOCX 结构与 V1 一致
   */
  private async generateDocx(conversation: Conversation, options: ExportOptions): Promise<Blob> {
    // 检查 JSZip 是否可用（在 userscript 环境中通过 @require 加载）
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      throw new Error('JSZip not available. Make sure to include JSZip via @require in userscript.');
    }

    const zip = new JSZip();

    // 1. 添加 [Content_Types].xml
    zip.file('[Content_Types].xml', this.generateContentTypesXml());

    // 2. 添加 _rels/.rels
    zip.folder('_rels')!.file('.rels', this.generateRelsXml());

    // 3. 添加 word/document.xml（主文档内容）
    const documentXml = this.generateDocumentXml(conversation, options);
    zip.folder('word')!.file('document.xml', documentXml);

    // 4. 添加 word/styles.xml（样式定义）
    const stylesXml = this.generateStylesXml();
    zip.folder('word')!.file('styles.xml', stylesXml);

    // 5. 添加 word/_rels/document.xml.rels
    zip.folder('word')!.folder('_rels')!.file('document.xml.rels', this.generateDocumentRelsXml());

    // 6. 生成 ZIP 文件（DOCX 本质是 ZIP）
    const blob = await zip.generateAsync({ 
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
    });

    return blob;
  }

  /**
   * 生成 [Content_Types].xml
   * 
   * TODO: 从 V1 迁移，确保与 V1 一致
   */
  private generateContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
  }

  /**
   * 生成 _rels/.rels
   * 
   * TODO: 从 V1 迁移，确保与 V1 一致
   */
  private generateRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  }

  /**
   * 生成 word/document.xml（主文档内容）
   * 
   * 支持两种格式：
   * - V1: 简洁风格，无元数据部分
   * - V2: 增强风格，包含元数据
   */
  private generateDocumentXml(conversation: Conversation, options: DocxExportOptions): string {
    const formatVersion = options.formatVersion || 'v2';
    const paragraphs: string[] = [];

    // 1. 文档标题
    paragraphs.push(this.createTitleParagraph(conversation.title || '对话导出'));

    if (formatVersion === 'v2') {
      // V2 格式：包含元数据
      if (options.includeMetadata) {
        paragraphs.push(...this.createMetadataParagraphs(conversation));
      }

      // 消息内容
      for (let i = 0; i < conversation.messages.length; i++) {
        const message = conversation.messages[i];
        const messageParagraphs = this.createMessageParagraphs(message, i + 1, options);
        paragraphs.push(...messageParagraphs);
      }

      // 导出信息
      if (options.includeMetadata) {
        paragraphs.push(this.createFooterParagraph());
      }
    } else {
      // V1 格式：简洁风格
      for (let i = 0; i < conversation.messages.length; i++) {
        const message = conversation.messages[i];
        const messageParagraphs = this.createMessageParagraphsV1(message, i, options);
        paragraphs.push(...messageParagraphs);
      }
    }

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${paragraphs.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="11900" w:h="16840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  }

  /**
   * 创建标题段落
   * 
   * TODO: 从 V1 迁移标题样式
   */
  private createTitleParagraph(title: string): string {
    return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(title)}</w:t>
      </w:r>
    </w:p>`;
  }

  /**
   * 创建元数据段落
   * 
   * TODO: 从 V1 迁移元数据格式
   */
  private createMetadataParagraphs(conversation: Conversation): string[] {
    const paragraphs: string[] = [];

    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Subtitle"/>
      </w:pPr>
      <w:r>
        <w:t>对话 ID: ${this.escapeXml(conversation.id)}</w:t>
      </w:r>
    </w:p>`);

    paragraphs.push(`
    <w:p>
      <w:r>
        <w:t>创建时间：${this.escapeXml(this.formatTimestamp(conversation.createdAt))}</w:t>
      </w:r>
    </w:p>`);

    paragraphs.push(`
    <w:p>
      <w:r>
        <w:t>更新时间：${this.escapeXml(this.formatTimestamp(conversation.updatedAt))}</w:t>
      </w:r>
    </w:p>`);

    paragraphs.push(`
    <w:p>
      <w:r>
        <w:t>消息数：${conversation.messages.length}</w:t>
      </w:r>
    </w:p>`);

    if (conversation.metadata?.platform) {
      paragraphs.push(`
    <w:p>
      <w:r>
        <w:t>平台：${this.escapeXml(conversation.metadata.platform)}</w:t>
      </w:r>
    </w:p>`);
    }

    // 添加分隔线
    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="HorizontalLine"/>
      </w:pPr>
    </w:p>`);

    return paragraphs;
  }

  /**
   * 创建消息段落（V2 格式）
   * 
   * V2 格式：
   * - 轮次：`第 N 轮 - 角色`（中文）
   * - 时间戳：`时间：时间戳`
   * - think 块：`思考过程:`
   */
  private createMessageParagraphs(message: Message, index: number, options: ExportOptions): string[] {
    const paragraphs: string[] = [];
    const roleLabel = this.getRoleLabel(message.role);

    // 1. 消息头部（轮次 + 角色）
    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading3"/>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:t>第 ${index} 轮 - ${this.escapeXml(roleLabel)}</w:t>
      </w:r>
    </w:p>`);

    // 2. 时间戳
    const timestamp = this.formatTimestamp(message.timestamp);
    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>时间：${this.escapeXml(timestamp)}</w:t>
      </w:r>
    </w:p>`);

    // 3. 消息内容
    const content = message.content.text;
    
    // 3.1 处理 think 块
    if (content.includes('<think>') || content.includes('```think')) {
      const thinkParagraphs = this.createThinkBlockParagraphs(content);
      paragraphs.push(...thinkParagraphs);
    } else {
      // 3.2 普通内容
      paragraphs.push(...this.createContentParagraphs(content));
    }

    // 4. 附件（如果包含）
    if (options.includeAttachments && message.content.attachments?.length) {
      paragraphs.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>附件:</w:t>
      </w:r>
    </w:p>`);

      for (const attachment of message.content.attachments) {
        paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
      </w:pPr>
      <w:r>
        <w:t>• ${this.escapeXml(attachment.name || '附件')}: ${this.escapeXml(attachment.url || '')}</w:t>
      </w:r>
    </w:p>`);
      }
    }

    // 5. 分隔线
    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="HorizontalLine"/>
      </w:pPr>
    </w:p>`);

    return paragraphs;
  }

  /**
   * 创建消息段落（V1 格式）
   * 
   * V1 格式：
   * - 轮次：`Role (Turn N)`（英文）
   * - 时间戳：斜体
   * - think 块：`[Think]`
   */
  private createMessageParagraphsV1(message: Message, index: number, options: ExportOptions): string[] {
    const paragraphs: string[] = [];
    const roleLabel = this.getRoleLabelV1(message.role);

    // 1. 消息头部（角色 + 轮次）
    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:spacing w:before="200" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(roleLabel)} (Turn ${index})</w:t>
      </w:r>
    </w:p>`);

    // 2. 时间戳（斜体）
    const timestamp = this.formatTimestampV1(message.timestamp);
    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(timestamp)}</w:t>
      </w:r>
    </w:p>`);

    // 3. 消息内容
    const content = message.content.text;
    
    // 3.1 处理 think 块（V1 格式）
    if (content.includes('<think>') || content.includes('```think')) {
      const thinkParagraphs = this.createThinkBlockParagraphsV1(content);
      paragraphs.push(...thinkParagraphs);
    } else {
      // 3.2 普通内容
      paragraphs.push(...this.createContentParagraphs(content));
    }

    // 4. 附件（如果包含）
    if (options.includeAttachments && message.content.attachments?.length) {
      paragraphs.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Attachments:</w:t>
      </w:r>
    </w:p>`);

      for (const attachment of message.content.attachments) {
        paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
      </w:pPr>
      <w:r>
        <w:t>• ${this.escapeXml(attachment.name || 'Attachment')}: ${this.escapeXml(attachment.url || '')}</w:t>
      </w:r>
    </w:p>`);
      }
    }

    // 5. 分隔线
    paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="HorizontalLine"/>
      </w:pPr>
    </w:p>`);

    return paragraphs;
  }

  /**
   * 创建 think 块段落（V2 格式）
   * 
   * V2 格式：`思考过程:`
   */
  private createThinkBlockParagraphs(content: string): string[] {
    const paragraphs: string[] = [];

    // 检测 think 块格式
    const thinkRegex = /<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = thinkRegex.exec(content)) !== null) {
      // 添加 think 块前的普通文本
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index).trim();
        if (beforeText) {
          paragraphs.push(...this.createContentParagraphs(beforeText));
        }
      }

      // 添加 think 块（V2 格式）
      const thinkContent = (match[1] || match[2] || '').trim();
      
      paragraphs.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>思考过程:</w:t>
      </w:r>
    </w:p>`);

      // think 块内容（每行一个段落）
      for (const line of thinkContent.split('\n')) {
        if (line.trim()) {
          paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(line)}</w:t>
      </w:r>
    </w:p>`);
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex).trim();
      if (remainingText) {
        paragraphs.push(...this.createContentParagraphs(remainingText));
      }
    }

    return paragraphs;
  }

  /**
   * 创建 think 块段落（V1 格式）
   * 
   * V1 格式：`[Think]`
   */
  private createThinkBlockParagraphsV1(content: string): string[] {
    const paragraphs: string[] = [];

    // 检测 think 块格式
    const thinkRegex = /<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = thinkRegex.exec(content)) !== null) {
      // 添加 think 块前的普通文本
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index).trim();
        if (beforeText) {
          paragraphs.push(...this.createContentParagraphs(beforeText));
        }
      }

      // 添加 think 块（V1 格式）
      const thinkContent = (match[1] || match[2] || '').trim();
      
      paragraphs.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>[Think]</w:t>
      </w:r>
    </w:p>`);

      // think 块内容（每行一个段落）
      for (const line of thinkContent.split('\n')) {
        if (line.trim()) {
          paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(line)}</w:t>
      </w:r>
    </w:p>`);
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex).trim();
      if (remainingText) {
        paragraphs.push(...this.createContentParagraphs(remainingText));
      }
    }

    return paragraphs;
  }

  /**
   * 创建普通内容段落
   * 
   * TODO: 处理长文本自动换行、代码块等特殊格式
   */
  private createContentParagraphs(content: string): string[] {
    const paragraphs: string[] = [];

    // 按空行分割为多个段落
    const lines = content.split('\n\n');
    
    for (const line of lines) {
      if (line.trim()) {
        // 替换换行符为空格（Word 中段落内换行需要特殊处理）
        const text = line.replace(/\n/g, ' ');
        
        paragraphs.push(`
    <w:p>
      <w:pPr>
        <w:spacing w:after="120"/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(text)}</w:t>
      </w:r>
    </w:p>`);
      }
    }

    return paragraphs;
  }

  /**
   * 创建页脚段落
   */
  private createFooterParagraph(): string {
    const timestamp = this.formatTimestamp(Date.now());
    
    return `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>导出时间：${this.escapeXml(timestamp)} | 由 Chat Export Toolkit V2 生成</w:t>
      </w:r>
    </w:p>`;
  }

  /**
   * 生成 word/styles.xml（样式定义）
   * 
   * TODO: 从 V1 迁移样式定义，确保与 V1 一致
   */
  private generateStylesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <!-- 默认样式 -->
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>

  <!-- 标题样式 -->
  <w:style w:type="paragraph" w:styleId="Title" w:default="1">
    <w:name w:val="Title"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="36"/>
      <w:szCs w:val="36"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:rPr>
      <w:i/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
      <w:color w:val="2E74B5"/>
    </w:rPr>
  </w:style>

  <!-- 分隔线样式 -->
  <w:style w:type="paragraph" w:styleId="HorizontalLine">
    <w:name w:val="Horizontal Line"/>
    <w:pPr>
      <w:spacing w:before="120" w:after="120"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="4"/>
    </w:rPr>
  </w:style>
</w:styles>`;
  }

  /**
   * 生成 word/_rels/document.xml.rels
   */
  private generateDocumentRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
  }

  /**
   * XML 转义
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 格式化时间戳（V2 格式）
   * 
   * 格式：YYYY-MM-DD HH:mm:ss
   */
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 格式化时间戳（V1 格式）
   * 
   * V1 使用 toLocaleString() 默认格式（与 yuanbaoToMarkdown 一致）
   * 格式示例：3/19/2024, 5:20:00 PM
   */
  private formatTimestampV1(timestamp: number): string {
    const date = new Date(timestamp);
    // 使用默认 toLocaleString() 格式（与 V1 yuanbaoToMarkdown 一致）
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  /**
   * 获取角色标签（V2 格式）
   * 
   * V2 使用中文标签
   */
  private getRoleLabel(role: string): string {
    const roleMap: Record<string, string> = {
      'user': '用户',
      'assistant': '助手',
      'system': '系统',
      'tool': '工具',
      'unknown': '未知',
    };
    return roleMap[role] || role;
  }

  /**
   * 获取角色标签（V1 格式）
   * 
   * V1 使用英文标签
   */
  private getRoleLabelV1(role: string): string {
    const roleMap: Record<string, string> = {
      'user': 'User',
      'assistant': 'Assistant',
      'system': 'System',
      'tool': 'Tool',
      'unknown': 'Unknown',
    };
    return roleMap[role] || role;
  }

  /**
   * 重写文件名生成逻辑
   * 
   * V1/V2 使用相同的文件名格式
   */
  override generateFilename(conversation: Conversation, extension: string): string {
    const title = conversation.title || 'conversation';
    const safeTitle = title
      .replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')  // 保留中文
      .substring(0, 50);
    
    const timestamp = new Date(conversation.updatedAt).toISOString().split('T')[0];
    
    return `${safeTitle}_${timestamp}.${extension}`;
  }
}
