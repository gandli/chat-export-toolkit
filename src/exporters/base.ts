/**
 * Exporter 基类
 * 提供通用的导出实现框架
 */

import type { IExporter } from '../core';
import type { Conversation, ExportOptions, ExportResult } from '../types';

/**
 * Exporter 抽象基类
 */
export abstract class BaseExporter implements IExporter {
  abstract readonly format: string;

  /**
   * 导出单个对话
   * 子类必须实现
   */
  abstract exportConversation(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<ExportResult>;

  /**
   * 批量导出
   * 默认实现：逐个导出
   */
  async exportAll(conversations: Conversation[], options: ExportOptions): Promise<ExportResult> {
    console.log(`[${this.format}] Exporting ${conversations.length} conversations`);

    let successCount = 0;
    let totalMessages = 0;
    let lastError: string | undefined;

    for (const conv of conversations) {
      try {
        const result = await this.exportConversation(conv, options);
        if (result.success) {
          successCount++;
          totalMessages += result.stats?.messageCount || 0;
        } else {
          lastError = result.error;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`[${this.format}] Failed to export conversation:`, error);
      }
    }

    return {
      success: successCount === conversations.length,
      stats: {
        messageCount: totalMessages,
        conversationCount: successCount,
      },
      error: lastError,
    };
  }

  /**
   * 生成文件名
   * 默认实现：使用对话 ID 和时间戳
   */
  generateFilename(conversation: Conversation, extension: string): string {
    const title = conversation.title || 'conversation';
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const timestamp = new Date(conversation.updatedAt).toISOString().split('T')[0];
    return `${safeTitle}_${timestamp}.${extension}`;
  }

  /**
   * 辅助方法：将数据转换为 Blob
   * 在 Node.js 环境中返回 null
   */
  protected createBlob(data: string, mimeType: string = 'text/plain'): Blob | null {
    if (typeof Blob === 'undefined') {
      // Node.js 环境：Blob 不可用
      return null;
    }
    return new Blob([data], { type: mimeType });
  }

  /**
   * 辅助方法：触发下载
   * 在 Node.js 环境中安全跳过
   */
  protected triggerDownload(blob: Blob | null, filename: string): void {
    if (!blob || typeof URL === 'undefined' || typeof document === 'undefined') {
      // Node.js 环境：跳过下载
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 辅助方法：确保目录存在（浏览器环境有限支持）
   */
  protected async ensureDir(dirPath: string): Promise<void> {
    // TODO: 在 Node.js 环境中实现真实的目录创建
    console.log(`[Exporter] ensureDir (stub): ${dirPath}`);
  }

  /**
   * 辅助方法：写入文件
   */
  protected async writeFile(_path: string): Promise<void> {
    // TODO: 在 Node.js 环境中实现真实的文件写入
    console.log('[Exporter] writeFile (stub)');
  }
}
