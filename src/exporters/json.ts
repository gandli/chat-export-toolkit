/**
 * JSON Exporter
 * 最基础的导出器实现示例
 */

import type { Conversation, ExportOptions, ExportResult } from '../types';
import { BaseExporter } from './base';

/**
 * JSON 格式导出器
 */
export class JSONExporter extends BaseExporter {
  readonly format = 'json';

  async exportConversation(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 准备导出数据
      const exportData = options.includeMetadata
        ? conversation
        : {
            id: conversation.id,
            title: conversation.title,
            messages: conversation.messages,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          };

      // 序列化为 JSON
      const jsonContent = JSON.stringify(exportData, null, 2);

      // 生成文件名
      const filename = options.filename || this.generateFilename(conversation, 'json');

      // 在浏览器环境中触发下载（Node.js 环境中跳过）
      const blob = this.createBlob(jsonContent, 'application/json');
      this.triggerDownload(blob, filename);
      
      // Node.js 环境：记录生成的文件信息
      if (!blob) {
        console.log(`[JSONExporter] Generated: ${filename} (${jsonContent.length} bytes)`);
      }

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
}
