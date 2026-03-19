/**
 * Markdown Exporter
 * 将标准化的对话导出为 Markdown 格式
 * 
 * 格式对齐说明：
 * - 支持 V1 兼容模式（formatVersion: 'v1'）和 V2 模式（formatVersion: 'v2'）
 * - V1 格式：简洁风格，与 yuanbaoToMarkdown() 输出一致
 * - V2 格式：增强风格，包含更多元数据和结构化信息
 */

import type { Conversation, Message, ExportOptions, ExportResult } from '../types';
import { BaseExporter } from './base';

/**
 * 导出选项扩展：支持格式版本选择
 */
interface MarkdownExportOptions extends ExportOptions {
  /**
   * 格式版本
   * - 'v1': V1 兼容模式（简洁风格，与 yuanbaoToMarkdown 一致）
   * - 'v2': V2 增强模式（包含元数据、结构化信息）
   * @default 'v2'
   */
  formatVersion?: 'v1' | 'v2';
}

/**
 * Markdown 格式导出器
 */
export class MarkdownExporter extends BaseExporter {
  readonly format = 'markdown';

  /**
   * 导出单个对话为 Markdown
   */
  async exportConversation(
    conversation: Conversation,
    options: MarkdownExportOptions
  ): Promise<ExportResult> {
    try {
      // 生成 Markdown 内容
      const markdownContent = this.generateMarkdown(conversation, options);

      // 生成文件名
      const filename = options.filename || this.generateFilename(conversation, 'md');
      const mimeType = 'text/markdown;charset=utf-8';

      if (options.download !== false) {
        const blob = this.createBlob(markdownContent, mimeType);
        this.triggerDownload(blob, filename);
      
        if (!blob) {
          console.log(`[MarkdownExporter] Generated: ${filename} (${markdownContent.length} bytes)`);
        }
      }

      return {
        success: true,
        outputPath: filename,
        content: markdownContent,
        mimeType,
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
   * 生成 Markdown 内容
   * 
   * 支持两种格式：
   * - V1: 简洁风格，与 yuanbaoToMarkdown() 输出一致
   * - V2: 增强风格，包含元数据和结构化信息
   */
  private generateMarkdown(conversation: Conversation, options: MarkdownExportOptions): string {
    const formatVersion = options.formatVersion || 'v2';
    
    if (formatVersion === 'v1') {
      return this.generateMarkdownV1(conversation, options);
    }
    
    return this.generateMarkdownV2(conversation, options);
  }

  /**
   * 生成 V1 格式 Markdown（与 yuanbaoToMarkdown 一致）
   * 
   * V1 格式特点：
   * - 简洁，无元数据部分
   * - 消息使用 `## 角色 (Turn N)` 格式
   * - 时间戳使用 `*时间戳*` 斜体格式
   * - think 块使用 `> [Think] 标题` 格式
   */
  private generateMarkdownV1(conversation: Conversation, options: ExportOptions): string {
    const lines: string[] = [];

    // 1. 标题
    lines.push(`# ${conversation.title || '对话导出'}`);
    lines.push('');

    // 2. 导出时间（V1 格式）
    lines.push(`> Exported at: ${this.formatTimestampV1(Date.now())}`);
    lines.push('');

    // 3. 消息内容
    for (let i = 0; i < conversation.messages.length; i++) {
      const message = conversation.messages[i];
      const messageLines = this.formatMessageV1(message, i, options);
      lines.push(...messageLines);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * 生成 V2 格式 Markdown（增强风格）
   * 
   * V2 格式特点：
   * - 包含元数据部分
   * - 消息使用 `### 第 N 轮 - 角色` 格式
   * - 时间戳使用 `> 时间：时间戳` 引用格式
   * - think 块使用 `> **思考过程:**` 格式
   */
  private generateMarkdownV2(conversation: Conversation, options: ExportOptions): string {
    const lines: string[] = [];

    // 1. 标题
    lines.push(`# ${conversation.title || '对话导出'}`);
    lines.push('');

    // 2. 元数据（如果选项包含）
    if (options.includeMetadata) {
      lines.push('## 元数据');
      lines.push('');
      lines.push(`- **ID**: ${conversation.id}`);
      lines.push(`- **创建时间**: ${this.formatTimestamp(conversation.createdAt)}`);
      lines.push(`- **更新时间**: ${this.formatTimestamp(conversation.updatedAt)}`);
      lines.push(`- **消息数**: ${conversation.messages.length}`);
      
      if (conversation.metadata?.platform) {
        lines.push(`- **平台**: ${conversation.metadata.platform}`);
      }
      
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // 3. 消息内容
    lines.push('## 对话内容');
    lines.push('');

    for (let i = 0; i < conversation.messages.length; i++) {
      const message = conversation.messages[i];
      const messageLines = this.formatMessage(message, i + 1, options);
      lines.push(...messageLines);
    }

    // 4. 导出信息（可选）
    if (options.includeMetadata) {
      lines.push('---');
      lines.push('');
      lines.push(`*导出时间：${this.formatTimestamp(Date.now())}*`);
      lines.push(`*由 Chat Export Toolkit V2 生成*`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化单条消息（V2 格式）
   * 
   * V2 格式：
   * - 轮次：`### 第 N 轮 - 角色`
   * - 时间戳：`> 时间：时间戳`
   * - think 块：`> **思考过程:**`
   */
  private formatMessage(message: Message, index: number, options: ExportOptions): string[] {
    const lines: string[] = [];

    // 1. 消息头部：轮次 + 角色 + 时间戳
    const roleLabel = this.getRoleLabel(message.role);
    const timestamp = this.formatTimestamp(message.timestamp);
    
    lines.push(`### 第 ${index} 轮 - ${roleLabel}`);
    lines.push('');
    lines.push(`> 时间：${timestamp}`);
    lines.push('');

    // 2. 消息内容
    const content = message.content.text;
    
    // 2.1 处理 think 块（V1 特殊格式）
    if (content.includes('<think>') || content.includes('```think')) {
      const thinkLines = this.formatThinkBlock(content);
      lines.push(...thinkLines);
    } else {
      // 2.2 普通内容
      lines.push(content);
    }

    lines.push('');

    // 3. 附件（如果包含）
    if (options.includeAttachments && message.content.attachments?.length) {
      lines.push('**附件:**');
      for (const attachment of message.content.attachments) {
        lines.push(`- [${attachment.name || '附件'}](${attachment.url || '#'})`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');

    return lines;
  }

  /**
   * 格式化单条消息（V1 格式）
   * 
   * V1 格式（与 yuanbaoToMarkdown 一致）：
   * - 轮次：`## 角色 (Turn N)`
   * - 时间戳：`*时间戳*`
   * - think 块：`> [Think] 标题`
   */
  private formatMessageV1(message: Message, index: number, _options: ExportOptions): string[] {
    const lines: string[] = [];

    // 1. 消息头部：角色 + 轮次
    const roleLabel = this.getRoleLabelV1(message.role);
    lines.push(`## ${roleLabel} (Turn ${index})`);
    
    // 2. 时间戳（斜体格式）
    const timestamp = this.formatTimestampV1(message.timestamp);
    lines.push(`*${timestamp}*`);
    lines.push('');

    // 3. 消息内容（包含 think 块处理）
    const content = message.content.text;
    const contentLines = this.formatContentV1(content);
    lines.push(...contentLines);

    lines.push('');
    lines.push('---');
    lines.push('');

    return lines;
  }

  /**
   * 格式化内容（V1 格式）
   * 
   * 处理 think 块，使用 V1 格式：
   * - `> [Think] 标题`
   * - `> 内容`
   */
  private formatContentV1(content: string): string[] {
    const lines: string[] = [];
    
    // 检测并处理 think 块（V1 格式：> [Think] 标题）
    const thinkRegex = /<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = thinkRegex.exec(content)) !== null) {
      // 添加 think 块前的普通文本
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index).trim();
        if (beforeText) {
          lines.push(beforeText);
          lines.push('');
        }
      }

      // 添加 think 块（V1 格式）
      const thinkContent = (match[1] || match[2] || '').trim();
      lines.push('> [Think]');
      for (const line of thinkContent.split('\n')) {
        lines.push(`> ${line}`);
      }
      lines.push('');

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex).trim();
      if (remainingText) {
        lines.push(remainingText);
      }
    }

    return lines;
  }

  /**
   * 格式化 think 块
   * 
   * TODO: 从 V1 迁移完整的 think 块处理逻辑
   * V1 中 think 块可能有特殊标记，需要保留原始格式
   */
  private formatThinkBlock(content: string): string[] {
    const lines: string[] = [];
    
    // 检测 think 块格式
    // TODO: 根据 V1 实际格式调整正则表达式
    const thinkRegex = /<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = thinkRegex.exec(content)) !== null) {
      // 添加 think 块前的普通文本
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index).trim();
        if (beforeText) {
          lines.push(beforeText);
          lines.push('');
        }
      }

      // 添加 think 块（使用引用格式）
      const thinkContent = (match[1] || match[2] || '').trim();
      lines.push('> **思考过程:**');
      lines.push('>');
      for (const line of thinkContent.split('\n')) {
        lines.push(`> ${line}`);
      }
      lines.push('');

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex).trim();
      if (remainingText) {
        lines.push(remainingText);
      }
    }

    return lines;
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
   * V1 使用英文标签（与 yuanbaoToMarkdown 一致）
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
   * 重写文件名生成逻辑
   * 
   * V1/V2 使用相同的文件名格式：
   * 标题_日期.扩展名
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
