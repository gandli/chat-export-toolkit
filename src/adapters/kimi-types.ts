/**
 * Kimi 特定类型定义
 * 
 * 这些类型用于描述 Kimi 平台（月之暗面）的原始数据结构
 * 
 * ⚠️ 重要说明：
 * - 这是一个骨架实现，基于对 Kimi 网页版的合理推测
 * - 真实的数据结构需要实际样本验证
 * - Kimi 的 DOM 结构和 API 响应可能频繁变化
 * 
 * @see https://kimi.moonshot.cn/
 */

// ============================================================================
// Kimi API 响应类型（基于推测，需要验证）
// ============================================================================

/**
 * Kimi 消息内容块
 * 
 * 注意：Kimi 可能支持多种内容类型
 * 需要实际样本验证具体结构
 */
export interface KimiContentPart {
  type?: 'text' | 'image' | 'code' | 'file' | 'link' | string;
  text?: string;
  content?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Kimi 消息/轮次
 * 
 * 基于 Kimi 可能的数据结构（需要验证）
 */
export interface KimiMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system' | string;
  content?: string | KimiContentPart[] | unknown;
  create_time?: number | string;
  timestamp?: number | string;
  author?: {
    role?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  // Kimi 可能特有的字段
  search_info?: KimiSearchInfo;
  file_info?: KimiFileInfo;
  [key: string]: unknown;
}

/**
 * Kimi 搜索信息（如果 Kimi 使用了联网搜索）
 * 
 * TODO: 需要实际样本验证
 */
export interface KimiSearchInfo {
  query?: string;
  results?: KimiSearchResult[];
  enabled?: boolean;
  [key: string]: unknown;
}

/**
 * Kimi 搜索结果项
 * 
 * TODO: 需要实际样本验证
 */
export interface KimiSearchResult {
  title?: string;
  url?: string;
  snippet?: string;
  source?: string;
  [key: string]: unknown;
}

/**
 * Kimi 文件信息（如果用户上传了文件）
 * 
 * TODO: 需要实际样本验证
 */
export interface KimiFileInfo {
  name?: string;
  size?: number;
  type?: string;
  url?: string;
  id?: string;
  [key: string]: unknown;
}

/**
 * Kimi 对话详情响应结构
 * 
 * 注意：Kimi 的 API 响应结构可能有多种变体
 * 以下是基于常见模式的推测，需要实际样本验证
 */
export interface KimiConversationDetail {
  // 可能的顶层字段
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  
  // 消息列表（可能的字段名）
  messages?: KimiMessage[];
  chats?: KimiMessage[];
  turns?: KimiMessage[];
  mapping?: Record<string, KimiMessageNode>;
  
  // 可能的嵌套结构
  conversation?: KimiConversationDetail;
  data?: KimiConversationDetail;
  result?: KimiConversationDetail;
  response?: KimiConversationDetail;
  
  // 元数据
  metadata?: {
    title?: string;
    model?: string;
    mode?: string;
    [key: string]: unknown;
  };
  
  // Kimi 可能特有的字段
  search_enabled?: boolean;
  files?: KimiFileInfo[];
  
  [key: string]: unknown;
}

/**
 * Kimi 消息节点（用于 mapping 结构）
 */
export interface KimiMessageNode {
  id?: string;
  message?: KimiMessage;
  parent?: string | null;
  children?: string[];
  [key: string]: unknown;
}

/**
 * Kimi 对话列表项
 */
export interface KimiConversationListItem {
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
 * Kimi 对话列表响应结构
 */
export interface KimiConversationList {
  items?: KimiConversationListItem[];
  conversation_items?: KimiConversationListItem[];
  chats?: KimiConversationListItem[];
  sessions?: KimiConversationListItem[];
  data?: KimiConversationList | KimiConversationListItem[];
  result?: KimiConversationList | KimiConversationListItem[];
  total?: number;
  limit?: number;
  offset?: string | number;
  has_more?: boolean;
  [key: string]: unknown;
}

// ============================================================================
// Kimi API 端点类型
// ============================================================================

/**
 * Kimi API 端点信息
 */
export interface KimiApiEndpoints {
  detail: string | null;
  list: string | null;
  discovered: boolean;
}

/**
 * Kimi 对话元数据（用于列表视图）
 */
export interface KimiConversationMeta {
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
 * Kimi 消息块标准化前的中间表示
 */
export interface KimiMessageBlock {
  type: 'text' | 'code' | 'image' | 'file' | 'link' | 'search' | 'unsupported';
  text: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Kimi 轮次标准化前的中间表示
 */
export interface KimiMessageNormalized {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'unknown';
  timestamp: number;
  blocks: KimiMessageBlock[];
}

// ============================================================================
// Kimi 平台特定常量
// ============================================================================

/**
 * Kimi 域名列表（用于 detect 检测）
 */
export const KIMI_DOMAINS = [
  'kimi.moonshot.cn',
  'kimi.ai',
];

/**
 * Kimi API 端点候选列表（用于回退探测）
 * 
 * 注意：这些端点基于常见模式推测，可能需要根据实际 API 调整
 * Kimi 可能使用 GraphQL 或 RESTful API
 */
export const KIMI_DETAIL_ENDPOINT_CANDIDATES = [
  '/api/chat/detail',
  '/api/conversation/detail',
  '/api/session/detail',
  '/api/v1/chat/detail',
  '/api/v1/conversation/detail',
  '/chat/detail',
  '/conversation/detail',
  '/graphql', // Kimi 可能使用 GraphQL
];

export const KIMI_LIST_ENDPOINT_CANDIDATES = [
  '/api/chat/list',
  '/api/conversation/list',
  '/api/session/list',
  '/api/v1/chat/list',
  '/api/v1/conversation/list',
  '/chat/list',
  '/conversation/list',
  '/graphql', // Kimi 可能使用 GraphQL
];

/**
 * Kimi URL 模式（用于从 URL 中提取 conversationId）
 * 
 * TODO: 需要实际访问 Kimi 网页版验证 URL 结构
 */
export const KIMI_URL_PATTERNS = [
  /^\/chat\/([a-zA-Z0-9-]+)$/i, // /chat/{id}
  /^\/conversation\/([a-zA-Z0-9-]+)$/i, // /conversation/{id}
  /^\/session\/([a-zA-Z0-9-]+)$/i, // /session/{id}
  /^\/c\/([a-zA-Z0-9-]+)$/i, // /c/{id}
];

// ============================================================================
// Kimi 能力级别定义
// ============================================================================

/**
 * Kimi 适配器能力级别
 * 
 * L1: 基础 - 从当前页面 DOM 提取可见消息
 * L2: 中等 - 通过 API 拦截获取完整对话历史
 * L3: 完整 - 主动调用 API 获取对话列表和详情
 * 
 * 当前实现状态：L1 骨架（需要真实样本验证）
 */
export type KimiCapabilityLevel = 'L1' | 'L2' | 'L3';

export const KIMI_CAPABILITY_LEVELS: Record<KimiCapabilityLevel, string> = {
  L1: '从当前页面 DOM 提取可见消息（基础）',
  L2: '通过 API 拦截获取完整对话历史（中等）',
  L3: '主动调用 API 获取对话列表和详情（完整）',
};
