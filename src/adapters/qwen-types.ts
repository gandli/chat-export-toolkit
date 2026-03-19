/**
 * 通义千问 (Qwen Chat) 特定类型定义
 * 
 * 这些类型用于描述通义千问平台的原始数据结构
 * 
 * ⚠️ 重要说明：
 * - 这是一个骨架实现，基于对通义千问网页版的合理推测
 * - 真实的数据结构需要实际样本验证
 * - 通义千问的 DOM 结构和 API 响应可能频繁变化
 * 
 * @see https://tongyi.aliyun.com/qianwen/
 */

// ============================================================================
// 通义千问 API 响应类型（基于推测，需要验证）
// ============================================================================

/**
 * 通义千问消息内容块
 * 
 * 注意：通义千问可能支持多种内容类型
 * 需要实际样本验证具体结构
 */
export interface QwenContentPart {
  type?: 'text' | 'image' | 'code' | 'file' | 'link' | string;
  text?: string;
  content?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * 通义千问消息/轮次
 * 
 * 基于通义千问可能的数据结构（需要验证）
 */
export interface QwenMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system' | string;
  content?: string | QwenContentPart[] | unknown;
  create_time?: number | string;
  timestamp?: number | string;
  author?: {
    role?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  // 通义千问可能特有的字段
  plugin_info?: QwenPluginInfo;      // 插件信息（如联网搜索、代码解释器）
  file_info?: QwenFileInfo;          // 文件信息
  image_info?: QwenImageInfo;        // 图片信息
  [key: string]: unknown;
}

/**
 * 通义千问插件信息（如果使用了插件功能）
 * 
 * TODO: 需要实际样本验证
 */
export interface QwenPluginInfo {
  plugin_name?: string;
  plugin_type?: 'search' | 'code_interpreter' | 'image_gen' | string;
  enabled?: boolean;
  result?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 通义千问文件信息（如果用户上传了文件）
 * 
 * TODO: 需要实际样本验证
 */
export interface QwenFileInfo {
  name?: string;
  size?: number;
  type?: string;
  url?: string;
  id?: string;
  [key: string]: unknown;
}

/**
 * 通义千问图片信息（如果涉及图片）
 * 
 * TODO: 需要实际样本验证
 */
export interface QwenImageInfo {
  url?: string;
  width?: number;
  height?: number;
  id?: string;
  [key: string]: unknown;
}

/**
 * 通义千问对话详情响应结构
 * 
 * 注意：通义千问的 API 响应结构可能有多种变体
 * 以下是基于常见模式的推测，需要实际样本验证
 */
export interface QwenConversationDetail {
  // 可能的顶层字段
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  
  // 消息列表（可能的字段名）
  messages?: QwenMessage[];
  chats?: QwenMessage[];
  turns?: QwenMessage[];
  history?: QwenMessage[];
  mapping?: Record<string, QwenMessageNode>;
  
  // 可能的嵌套结构
  conversation?: QwenConversationDetail;
  data?: QwenConversationDetail;
  result?: QwenConversationDetail;
  response?: QwenConversationDetail;
  
  // 元数据
  metadata?: {
    title?: string;
    model?: string;
    mode?: string;
    [key: string]: unknown;
  };
  
  // 通义千问可能特有的字段
  plugin_enabled?: boolean;
  files?: QwenFileInfo[];
  images?: QwenImageInfo[];
  
  [key: string]: unknown;
}

/**
 * 通义千问消息节点（用于 mapping 结构）
 */
export interface QwenMessageNode {
  id?: string;
  message?: QwenMessage;
  parent?: string | null;
  children?: string[];
  [key: string]: unknown;
}

/**
 * 通义千问对话列表项
 */
export interface QwenConversationListItem {
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  model?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
  message_count?: number;
  [key: string]: unknown;
}

/**
 * 通义千问对话列表响应结构
 */
export interface QwenConversationList {
  items?: QwenConversationListItem[];
  conversation_items?: QwenConversationListItem[];
  chats?: QwenConversationListItem[];
  sessions?: QwenConversationListItem[];
  data?: QwenConversationList | QwenConversationListItem[];
  result?: QwenConversationList | QwenConversationListItem[];
  total?: number;
  limit?: number;
  offset?: string | number;
  has_more?: boolean;
  [key: string]: unknown;
}

// ============================================================================
// 通义千问 API 端点类型
// ============================================================================

/**
 * 通义千问 API 端点信息
 */
export interface QwenApiEndpoints {
  detail: string | null;
  list: string | null;
  discovered: boolean;
}

/**
 * 通义千问对话元数据（用于列表视图）
 */
export interface QwenConversationMeta {
  id: string;
  title: string;
  createTime?: number;
  updateTime?: number;
  model?: string;
  messageCount?: number;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 通义千问消息块标准化前的中间表示
 */
export interface QwenMessageBlock {
  type: 'text' | 'code' | 'image' | 'file' | 'link' | 'plugin' | 'unsupported';
  text: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 通义千问轮次标准化前的中间表示
 */
export interface QwenMessageNormalized {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'unknown';
  timestamp: number;
  blocks: QwenMessageBlock[];
}

// ============================================================================
// 通义千问平台特定常量
// ============================================================================

/**
 * 通义千问域名列表（用于 detect 检测）
 */
export const QWEN_DOMAINS = [
  'tongyi.aliyun.com',
  'tongyi.aliyun.com',
];

/**
 * 通义千问 API 端点候选列表（用于回退探测）
 * 
 * 注意：这些端点基于常见模式推测，可能需要根据实际 API 调整
 * 通义千问可能使用 GraphQL 或 RESTful API
 */
export const QWEN_DETAIL_ENDPOINT_CANDIDATES = [
  '/api/chat/detail',
  '/api/conversation/detail',
  '/api/session/detail',
  '/api/v1/chat/detail',
  '/api/v1/conversation/detail',
  '/chat/detail',
  '/conversation/detail',
  '/qwen/api/chat/detail',
  '/tongyi/api/chat/detail',
  '/graphql', // 通义千问可能使用 GraphQL
];

export const QWEN_LIST_ENDPOINT_CANDIDATES = [
  '/api/chat/list',
  '/api/conversation/list',
  '/api/session/list',
  '/api/v1/chat/list',
  '/api/v1/conversation/list',
  '/chat/list',
  '/conversation/list',
  '/qwen/api/chat/list',
  '/tongyi/api/chat/list',
  '/graphql', // 通义千问可能使用 GraphQL
];

/**
 * 通义千问 URL 模式（用于从 URL 中提取 conversationId）
 * 
 * TODO: 需要实际访问通义千问网页版验证 URL 结构
 */
export const QWEN_URL_PATTERNS = [
  /^\/qianwen\/chat\/([a-zA-Z0-9-]+)$/i, // /qianwen/chat/{id}
  /^\/chat\/([a-zA-Z0-9-]+)$/i, // /chat/{id}
  /^\/conversation\/([a-zA-Z0-9-]+)$/i, // /conversation/{id}
  /^\/session\/([a-zA-Z0-9-]+)$/i, // /session/{id}
  /^\/c\/([a-zA-Z0-9-]+)$/i, // /c/{id}
];

// ============================================================================
// 通义千问能力级别定义
// ============================================================================

/**
 * 通义千问适配器能力级别
 * 
 * L1: 基础 - 从当前页面 DOM 提取可见消息
 * L2: 中等 - 通过 API 拦截获取完整对话历史
 * L3: 完整 - 主动调用 API 获取对话列表和详情
 * 
 * 当前实现状态：L1 骨架（需要真实样本验证）
 */
export type QwenCapabilityLevel = 'L1' | 'L2' | 'L3';

export const QWEN_CAPABILITY_LEVELS: Record<QwenCapabilityLevel, string> = {
  L1: '从当前页面 DOM 提取可见消息（基础）',
  L2: '通过 API 拦截获取完整对话历史（中等）',
  L3: '主动调用 API 获取对话列表和详情（完整）',
};
