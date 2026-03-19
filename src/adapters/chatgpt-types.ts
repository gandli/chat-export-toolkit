/**
 * ChatGPT 特定类型定义
 * 
 * 这些类型用于描述 ChatGPT 平台的原始数据结构
 * 基于 ChatGPT 网页版的已知 API 响应结构（需要实际样本验证）
 */

// ============================================================================
// ChatGPT API 响应类型（基于公开资料和推测）
// ============================================================================

/**
 * ChatGPT 消息内容块
 * 
 * 注意：ChatGPT 的消息内容可能是纯文本或复杂对象
 * 需要实际样本验证具体结构
 */
export interface ChatGPTContentPart {
  type?: 'text' | 'image' | 'code' | 'file' | string;
  text?: string;
  content?: string;
  [key: string]: unknown;
}

/**
 * ChatGPT 消息/轮次
 * 
 * 基于 ChatGPT 可能的数据结构（需要验证）
 */
export interface ChatGPTMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system' | string;
  content?: string | ChatGPTContentPart[] | unknown;
  createTime?: number | string;
  timestamp?: number | string;
  author?: {
    role?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * ChatGPT 对话详情响应结构
 * 
 * 注意：ChatGPT 的 API 响应结构可能有多种变体
 * 以下是基于公开资料的推测，需要实际样本验证
 */
export interface ChatGPTConversationDetail {
  // 可能的顶层字段
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  
  // 消息列表（可能的字段名）
  messages?: ChatGPTMessage[];
  mapping?: Record<string, ChatGPTMessageNode>;
  
  // 可能的嵌套结构
  conversation?: ChatGPTConversationDetail;
  data?: ChatGPTConversationDetail;
  result?: ChatGPTConversationDetail;
  
  // 元数据
  metadata?: {
    title?: string;
    model?: string;
    [key: string]: unknown;
  };
  
  [key: string]: unknown;
}

/**
 * ChatGPT 消息节点（用于 mapping 结构）
 */
export interface ChatGPTMessageNode {
  id?: string;
  message?: ChatGPTMessage;
  parent?: string | null;
  children?: string[];
  [key: string]: unknown;
}

/**
 * ChatGPT 对话列表项
 */
export interface ChatGPTConversationListItem {
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  model?: string;
  is_archived?: boolean;
  [key: string]: unknown;
}

/**
 * ChatGPT 对话列表响应结构
 */
export interface ChatGPTConversationList {
  items?: ChatGPTConversationListItem[];
  conversation_items?: ChatGPTConversationListItem[];
  data?: ChatGPTConversationList | ChatGPTConversationListItem[];
  result?: ChatGPTConversationList | ChatGPTConversationListItem[];
  total?: number;
  limit?: number;
  offset?: string;
  has_more?: boolean;
  [key: string]: unknown;
}

// ============================================================================
// ChatGPT API 端点类型
// ============================================================================

/**
 * ChatGPT API 端点信息
 */
export interface ChatGPTApiEndpoints {
  detail: string | null;
  list: string | null;
  discovered: boolean;
}

/**
 * ChatGPT 对话元数据（用于列表视图）
 */
export interface ChatGPTConversationMeta {
  id: string;
  title: string;
  createTime?: number;
  updateTime?: number;
  model?: string;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * ChatGPT 消息块标准化前的中间表示
 */
export interface ChatGPTMessageBlock {
  type: 'text' | 'code' | 'image' | 'file' | 'unsupported';
  text: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * ChatGPT 轮次标准化前的中间表示
 */
export interface ChatGPTMessageNormalized {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'unknown';
  timestamp: number;
  blocks: ChatGPTMessageBlock[];
}

// ============================================================================
// ChatGPT 平台特定常量
// ============================================================================

/**
 * ChatGPT 域名列表（用于 detect 检测）
 */
export const CHATGPT_DOMAINS = [
  'chat.openai.com',
  'chat.com',
  'platform.openai.com',
];

/**
 * ChatGPT API 端点候选列表（用于回退探测）
 * 
 * 注意：这些端点基于公开资料，可能需要根据实际 API 调整
 */
export const CHATGPT_DETAIL_ENDPOINT_CANDIDATES = [
  '/backend-api/conversation',
  '/backend-api/conversations',
  '/api/conversation',
  '/conversations',
  '/backend-api/conversation/[id]',
];

export const CHATGPT_LIST_ENDPOINT_CANDIDATES = [
  '/backend-api/conversations',
  '/backend-api/conversations?offset=0&limit=20',
  '/api/conversations',
  '/conversations',
];

/**
 * ChatGPT URL 模式（用于从 URL 中提取 conversationId）
 */
export const CHATGPT_URL_PATTERNS = [
  /^\/c\/([a-f0-9-]+)$/i, // /c/{conversation-id}
  /^\/chat\/([a-f0-9-]+)$/i, // /chat/{conversation-id}
  /^\/conversation\/([a-f0-9-]+)$/i, // /conversation/{conversation-id}
];
