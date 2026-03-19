/**
 * Claude 特定类型定义
 * 
 * 这些类型用于描述 Claude 平台（Anthropic）的原始数据结构
 * 基于 Claude 网页版的已知/推测 API 响应结构（需要实际样本验证）
 * 
 * @see https://claude.ai/
 */

// ============================================================================
// Claude API 响应类型（基于公开资料和推测）
// ============================================================================

/**
 * Claude 消息内容块
 * 
 * 注意：Claude 的消息内容可能是纯文本或复杂对象
 * 需要实际样本验证具体结构
 */
export interface ClaudeContentPart {
  type?: 'text' | 'image' | 'code' | 'file' | 'tool_use' | 'tool_result' | string;
  text?: string;
  content?: string;
  source?: {
    type?: 'base64' | 'url';
    media_type?: string;
    data?: string;
  };
  [key: string]: unknown;
}

/**
 * Claude 消息/轮次
 * 
 * 基于 Claude 可能的数据结构（需要验证）
 */
export interface ClaudeMessage {
  id?: string;
  uuid?: string;
  role?: 'user' | 'assistant' | 'system' | string;
  content?: string | ClaudeContentPart[] | unknown;
  created_at?: number | string;
  timestamp?: number | string;
  updated_at?: number | string;
  sender?: {
    role?: string;
    name?: string;
    user_uuid?: string;
  };
  metadata?: Record<string, unknown>;
  attachments?: ClaudeAttachment[];
  [key: string]: unknown;
}

/**
 * Claude 附件信息
 */
export interface ClaudeAttachment {
  id?: string;
  name?: string;
  type?: string;
  size?: number;
  url?: string;
  upload_status?: 'pending' | 'complete' | 'failed';
  [key: string]: unknown;
}

/**
 * Claude 对话详情响应结构
 * 
 * 注意：Claude 的 API 响应结构可能有多种变体
 * 以下是基于公开资料的推测，需要实际样本验证
 */
export interface ClaudeConversationDetail {
  // 可能的顶层字段
  id?: string;
  uuid?: string;
  conversation_id?: string;
  chat_id?: string;
  title?: string;
  created_at?: number | string;
  updated_at?: number | string;
  
  // 消息列表（可能的字段名）
  messages?: ClaudeMessage[];
  turns?: ClaudeMessage[];
  chat_history?: ClaudeMessage[];
  
  // 可能的嵌套结构
  conversation?: ClaudeConversationDetail;
  chat?: ClaudeConversationDetail;
  data?: ClaudeConversationDetail;
  result?: ClaudeConversationDetail;
  
  // 元数据
  metadata?: {
    title?: string;
    model?: string;
    project_uuid?: string;
    organization_uuid?: string;
    [key: string]: unknown;
  };
  
  // 项目/组织信息（Claude 特有）
  project_uuid?: string;
  organization_uuid?: string;
  
  [key: string]: unknown;
}

/**
 * Claude 对话列表项
 */
export interface ClaudeConversationListItem {
  id?: string;
  uuid?: string;
  conversation_id?: string;
  chat_id?: string;
  title?: string;
  created_at?: number | string;
  updated_at?: number | string;
  project_uuid?: string;
  organization_uuid?: string;
  is_archived?: boolean;
  [key: string]: unknown;
}

/**
 * Claude 对话列表响应结构
 */
export interface ClaudeConversationList {
  chats?: ClaudeConversationListItem[];
  conversations?: ClaudeConversationListItem[];
  items?: ClaudeConversationListItem[];
  chat_items?: ClaudeConversationListItem[];
  data?: ClaudeConversationList | ClaudeConversationListItem[];
  result?: ClaudeConversationList | ClaudeConversationListItem[];
  total?: number;
  limit?: number;
  offset?: string;
  has_more?: boolean;
  [key: string]: unknown;
}

// ============================================================================
// Claude API 端点类型
// ============================================================================

/**
 * Claude API 端点信息
 */
export interface ClaudeApiEndpoints {
  detail: string | null;
  list: string | null;
  discovered: boolean;
}

/**
 * Claude 对话元数据（用于列表视图）
 */
export interface ClaudeConversationMeta {
  id: string;
  title: string;
  createTime?: number;
  updateTime?: number;
  model?: string;
  projectUuid?: string;
  organizationUuid?: string;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * Claude 消息块标准化前的中间表示
 */
export interface ClaudeMessageBlock {
  type: 'text' | 'code' | 'image' | 'file' | 'tool_use' | 'tool_result' | 'unsupported';
  text: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Claude 轮次标准化前的中间表示
 */
export interface ClaudeMessageNormalized {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'unknown';
  timestamp: number;
  blocks: ClaudeMessageBlock[];
}

// ============================================================================
// Claude 平台特定常量
// ============================================================================

/**
 * Claude 域名列表（用于 detect 检测）
 */
export const CLAUDE_DOMAINS = [
  'claude.ai',
  'www.claude.ai',
];

/**
 * Claude API 端点候选列表（用于回退探测）
 * 
 * 注意：这些端点基于公开资料，可能需要根据实际 API 调整
 */
export const CLAUDE_DETAIL_ENDPOINT_CANDIDATES = [
  '/api/organizations',
  '/api/organizations/:organizationId/projets/:projectId/chats/:chatId',
  '/api/shared_chats/:chatId',
  '/api/chats/:chatId',
  '/api/conversations/:conversationId',
];

export const CLAUDE_LIST_ENDPOINT_CANDIDATES = [
  '/api/organizations/:organizationId/chats',
  '/api/organizations/:organizationId/projets/:projectId/chats',
  '/api/chats',
  '/api/conversations',
];

/**
 * Claude URL 模式（用于从 URL 中提取 conversationId）
 * 
 * 注意：这些模式基于推测，需要实际验证
 */
export const CLAUDE_URL_PATTERNS = [
  /^\/chat\/([a-f0-9-]+)$/i, // /chat/{chat-id}
  /^\/c\/([a-f0-9-]+)$/i, // /c/{chat-id}
  /^\/conversation\/([a-f0-9-]+)$/i, // /conversation/{chat-id}
  /^\/shared\/([a-f0-9-]+)$/i, // /shared/{chat-id} (共享对话)
];

/**
 * Claude 能力级别定义
 */
export const CLAUDE_CAPABILITY_LEVELS = {
  L1: '从当前页面 DOM 提取可见消息（基础）',
  L2: '通过 API 拦截获取完整对话历史（中等）',
  L3: '主动调用 API 获取对话列表和详情（完整）',
} as const;

/**
 * Claude 能力级别类型
 */
export type ClaudeCapabilityLevel = 'L1' | 'L2' | 'L3';
