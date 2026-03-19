/**
 * ZIP Exporter
 * 批量导出多个对话为 ZIP 压缩包
 * 
 * 支持格式：
 * - JSON: 每个对话一个 .json 文件
 * - Markdown: 每个对话一个 .md 文件
 * - DOCX: TODO - 基础支持
 */

import type { Conversation, ExportOptions, ExportResult } from '../types';
import { BaseExporter } from './base';
import { JSONExporter } from './json';
import { MarkdownExporter } from './markdown';
import { DocxExporter } from './docx';

/**
 * ZIP 导出选项扩展
 */
interface ZIPExportOptions extends ExportOptions {
  /**
   * ZIP 文件名（不含扩展名）
   * @default 'chat-export-YYYYMMDD-HHMMSS'
   */
  zipFilename?: string;

  /**
   * 是否包含元数据文件（metadata.json）
   * @default true
   */
  includeMetadata?: boolean;
}

/**
 * ZIP 格式导出器
 * 
 * 最小可用版本（MVP）：
 * - 支持 JSON 和 Markdown 格式
 * - 每个对话生成独立文件
 * - 可选包含 metadata.json 汇总文件
 * - DOCX 格式暂不支持（TODO）
 */
export class ZIPExporter extends BaseExporter {
  readonly format = 'zip';

  /**
   * 批量导出对话为 ZIP
   * 
   * @param conversations 对话列表
   * @param options 导出选项
   * @returns 导出结果
   */
  async exportAll(
    conversations: Conversation[],
    options: ZIPExportOptions
  ): Promise<ExportResult> {
    try {
      // 检查 JSZip 是否可用
      const JSZip = (globalThis as any).JSZip;
      if (!JSZip) {
        // Node.js 环境或 JSZip 未加载：返回降级结果
        console.log('[ZIPExporter] JSZip not available, skipping ZIP generation');
        return {
          success: false,
          error: 'JSZip not available. ZIP export requires browser environment with JSZip loaded.',
          stats: { messageCount: 0, conversationCount: 0 },
        };
      }

      if (conversations.length === 0) {
        return {
          success: false,
          error: 'No conversations to export',
          stats: { messageCount: 0, conversationCount: 0 },
        };
      }

      // 创建 ZIP 实例
      const zip = new JSZip();

      // 确定导出格式
      const format = options.format || 'json';
      
      // 选择对应的导出器
      const exporter = this.getExporterForFormat(format);
      if (!exporter) {
        return {
          success: false,
          error: `Unsupported format for ZIP export: ${format}`,
          stats: { messageCount: 0, conversationCount: 0 },
        };
      }

      // 文件扩展名映射
      const extensionMap: Record<string, string> = {
        json: 'json',
        markdown: 'md',
        docx: 'docx',
      };
      const extension = extensionMap[format] || 'txt';

      console.log(`[ZIPExporter] Exporting ${conversations.length} conversations as ${format}...`);

      // 逐个导出对话到 ZIP
      let totalMessages = 0;
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        
        try {
          // 生成文件名
          const filename = this.generateConversationFilename(
            conversation,
            extension,
            i,
            conversations.length
          );

          // 使用对应导出器生成内容
          const content = await this.generateContent(exporter, conversation, options);

          // 添加到 ZIP
          zip.file(filename, content);

          successCount++;
          totalMessages += conversation.messages.length;

          console.log(`[ZIPExporter] Added: ${filename} (${conversation.messages.length} messages)`);
        } catch (error) {
          const errorMsg = `Failed to export conversation ${conversation.id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`[ZIPExporter] ${errorMsg}`);
        }
      }

      // 可选：添加 metadata.json
      if (options.includeMetadata !== false) {
        const metadata = {
          exportedAt: new Date().toISOString(),
          format,
          conversationCount: successCount,
          totalMessages,
          conversations: conversations.map((conv, index) => ({
            id: conv.id,
            title: conv.title || `Conversation ${index + 1}`,
            messageCount: conv.messages.length,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            filename: this.generateConversationFilename(conv, extension, index, conversations.length),
          })),
        };
        zip.file('metadata.json', JSON.stringify(metadata, null, 2));
      }

      // 生成 ZIP 文件
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/zip',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // 生成 ZIP 文件名
      const zipFilename = this.generateZipFilename(format);

      // 触发下载
      this.triggerDownload(zipBlob, zipFilename);

      console.log(`[ZIPExporter] Export complete: ${zipFilename} (${successCount}/${conversations.length} conversations)`);

      return {
        success: successCount === conversations.length,
        outputPath: zipFilename,
        stats: {
          messageCount: totalMessages,
          conversationCount: successCount,
        },
        error: errors.length > 0 ? errors.join('; ') : undefined,
      };
    } catch (error) {
      console.error('[ZIPExporter] Export failed:', error);
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
   * 导出单个对话（不支持，必须批量导出）
   */
  async exportConversation(
    _conversation: Conversation,
    _options: ExportOptions
  ): Promise<ExportResult> {
    return {
      success: false,
      error: 'ZIPExporter requires multiple conversations. Use exportAll() instead.',
      stats: { messageCount: 0, conversationCount: 0 },
    };
  }

  /**
   * 根据格式获取对应的导出器
   */
  private getExporterForFormat(format: string): BaseExporter | null {
    switch (format) {
      case 'json':
        return new JSONExporter();
      case 'markdown':
        return new MarkdownExporter();
      case 'docx':
        // TODO: DOCX 支持需要额外处理
        return new DocxExporter();
      default:
        return null;
    }
  }

  /**
   * 使用导出器生成内容字符串
   */
  private async generateContent(
    exporter: BaseExporter,
    conversation: Conversation,
    options: ExportOptions
  ): Promise<string> {
    // 对于 JSON 和 Markdown，直接生成字符串
    if (exporter instanceof JSONExporter) {
      const exportData = options.includeMetadata
        ? conversation
        : {
            id: conversation.id,
            title: conversation.title,
            messages: conversation.messages,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          };
      return JSON.stringify(exportData, null, 2);
    }

    if (exporter instanceof MarkdownExporter) {
      // 复用 MarkdownExporter 的生成逻辑
      // 注意：这里需要访问 generateMarkdown 方法，但它是私有的
      // 所以我们重新实现一个简单的版本
      return this.generateSimpleMarkdown(conversation, options);
    }

    if (exporter instanceof DocxExporter) {
      // TODO: DOCX 需要生成二进制数据，暂时返回占位符
      throw new Error('DOCX format is not fully supported in ZIP export yet (TODO)');
    }

    // 默认返回 JSON
    return JSON.stringify(conversation, null, 2);
  }

  /**
   * 生成简化的 Markdown 内容
   * 
   * 这是 MarkdownExporter 的简化版本，用于 ZIP 导出
   */
  private generateSimpleMarkdown(
    conversation: Conversation,
    _options: ExportOptions
  ): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${conversation.title || '对话导出'}`);
    lines.push('');

    // 导出时间
    lines.push(`> Exported at: ${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })}`);
    lines.push('');

    // 消息内容
    const roleMap: Record<string, string> = {
      user: 'User',
      assistant: 'Assistant',
      system: 'System',
      tool: 'Tool',
      unknown: 'Unknown',
    };

    for (let i = 0; i < conversation.messages.length; i++) {
      const message = conversation.messages[i];
      const roleLabel = roleMap[message.role] || message.role;
      const timestamp = new Date(message.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      lines.push(`## ${roleLabel} (Turn ${i + 1})`);
      lines.push(`*${timestamp}*`);
      lines.push('');
      lines.push(message.content.text);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 生成对话文件名
   * 
   * 格式：序号_标题_日期.扩展名
   * 例如：001_你好_2024-03-19.json
   */
  private generateConversationFilename(
    conversation: Conversation,
    extension: string,
    index: number,
    total: number
  ): string {
    // 生成序号（3 位数字）
    const digits = Math.ceil(Math.log10(total + 1));
    const paddedIndex = String(index + 1).padStart(Math.max(3, digits), '0');

    // 处理标题
    const title = conversation.title || `conversation-${index + 1}`;
    const safeTitle = title
      .replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')  // 保留中文和下划线
      .replace(/_+/g, '_')  // 合并多个下划线
      .substring(0, 50);  // 限制长度

    // 生成日期
    const date = new Date(conversation.updatedAt);
    const dateStr = date.toISOString().split('T')[0];

    return `${paddedIndex}_${safeTitle}_${dateStr}.${extension}`;
  }

  /**
   * 生成 ZIP 文件名
   * 
   * 格式：chat-export-格式-YYYYMMDD-HHMMSS.zip
   */
  private generateZipFilename(format: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, 15); // YYYYMMDDTHHMMSS
    return `chat-export-${format}-${timestamp}.zip`;
  }
}
