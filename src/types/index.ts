/**
 * Chat Export Toolkit V2 - Core Type Definitions
 * 统一的类型定义，作为整个系统的基础
 */

// ============================================================================
// 核心 Conversation Schema
// ============================================================================

/**
 * 统一的消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'unknown';

/**
 * 统一的消息附件类型
 */
export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'link';
  url?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

/**
 * 统一的消息内容类型
 */
export interface MessageContent {
  text: string;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
}

/**
 * 统一的消息 Schema
 * 所有平台的消息都必须转换为这个格式
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
  timestamp: number; // Unix timestamp (ms)
  metadata?: {
    platform?: string;
    originalId?: string;
    [key: string]: unknown;
  };
}

/**
 * 统一的对话 Schema
 */
export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    platform?: string;
    participantCount?: number;
    messageCount?: number;
    [key: string]: unknown;
  };
}

// ============================================================================
// 平台相关类型
// ============================================================================

/**
 * 支持的平台类型
 */
export type PlatformType = 
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'poe'
  | 'discord'
  | 'slack'
  | 'wechat'
  | 'telegram'
  | 'yuanbao'
  | 'doubao'
  | 'kimi'
  | 'deepseek'
  | 'qwen'
  | 'custom';

/**
 * 平台原始消息（未标准化前）
 */
export interface RawMessage {
  platform: PlatformType;
  data: unknown;
}

/**
 * 平台原始对话（未标准化前）
 */
export interface RawConversation {
  platform: PlatformType;
  data: unknown;
}

// ============================================================================
// 导出相关类型
// ============================================================================

/**
 * 支持的导出格式
 */
export type ExportFormat = 
  | 'json'
  | 'markdown'
  | 'html'
  | 'pdf'
  | 'txt'
  | 'csv'
  | 'zip';

/**
 * 导出选项
 */
export interface ExportOptions {
  format: ExportFormat;
  outputDir?: string;
  filename?: string;
  includeMetadata?: boolean;
  includeAttachments?: boolean;
  dateRange?: {
    start?: number;
    end?: number;
  };
  filters?: {
    roles?: MessageRole[];
    keywords?: string[];
  };
}

/**
 * 导出结果
 */
export interface ExportResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  stats?: {
    messageCount: number;
    conversationCount: number;
    attachmentCount?: number;
  };
}

// ============================================================================
// 存储相关类型
// ============================================================================

/**
 * 存储键类型
 */
export type StoreKey = `conversation:${string}` | `settings:${string}` | `cache:${string}`;

/**
 * 存储值类型
 */
export type StoreValue = Conversation | unknown;

/**
 * 存储查询选项
 */
export interface StoreQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// 运行时环境类型（移到这里以便 interfaces.ts 引用）
// ============================================================================

/**
 * 运行时环境
 */
export type RuntimeEnvironment = 'browser' | 'node' | 'userscript';

/**
 * 运行时能力
 */
export interface RuntimeCapabilities {
  environment: RuntimeEnvironment;
  canAccessDOM: boolean;
  canAccessFileSystem: boolean;
  canMakeNetworkRequests: boolean;
  canStoreData: boolean;
}

/**
 * 运行时桥接配置
 */
export interface RuntimeBridgeConfig {
  environment?: RuntimeEnvironment;
  capabilities?: Partial<RuntimeCapabilities>;
}

// ============================================================================
// UI 相关类型
// ============================================================================

/**
 * UI 组件属性
 */
export interface UIComponentProps {
  container?: HTMLElement | string;
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
}

/**
 * UI 事件
 */
export interface UIEvents {
  onExportStart?: (options: ExportOptions) => void;
  onExportProgress?: (progress: number, message: string) => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: Error) => void;
  onConversationSelect?: (conversation: Conversation) => void;
}

/**
 * UI 配置
 */
export interface UIConfig extends UIComponentProps, UIEvents {}


