/**
 * DeepSeek 特定类型定义
 * 
 * 这些类型用于描述 DeepSeek 平台的原始数据结构
 * 
 * ⚠️ 重要说明：
 * - 这是一个骨架实现，基于对 DeepSeek 网页版的合理推测
 * - 真实的数据结构需要实际样本验证
 * - DeepSeek 的 DOM 结构和 API 响应可能频繁变化
 * 
 * @see https://chat.deepseek.com/
 */

// ============================================================================
// DeepSeek API 响应类型（基于推测，需要验证）
// ============================================================================

/**
 * DeepSeek 消息内容块
 * 
 * 注意：DeepSeek 可能支持多种内容类型
 * 需要实际样本验证具体结构
 */
export interface DeepSeekContentPart {
  type?: 'text' | 'image' | 'code' | 'file' | 'link' | string;
  text?: string;
  content?: string;
  url?: string;
  data?: string;
  alt?: string;
  title?: string;
  name?: string;
  language?: string;
  href?: string;
  snippet?: string;
  description?: string;
  mime_type?: string;
}

/**
 * DeepSeek 消息/轮次
 * 
 * 基于 DeepSeek 可能的数据结构（需要验证）
 */
export interface DeepSeekMessage {
  id?: string;
  role?: 'user' | 'assistant' | 'system' | string;
  content?: string | DeepSeekContentPart[] | unknown;
  created_at?: number | string;
  timestamp?: number | string;
  author?: {
    role?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  // DeepSeek 可能特有的字段
  reasoning_content?: string;  // 推理过程（如果 DeepSeek 有类似功能）
  citations?: DeepSeekCitation[];  // 引用来源
  attachments?: DeepSeekAttachment[];  // 附件
}

/**
 * DeepSeek 引用信息（如果 DeepSeek 支持联网搜索或引用）
 * 
 * TODO: 需要实际样本验证
 */
export interface DeepSeekCitation {
  title?: string;
  url?: string;
  snippet?: string;
  source?: string;
  index?: number;
}

/**
 * DeepSeek 附件信息（如果用户上传了文件）
 * 
 * TODO: 需要实际样本验证
 */
export interface DeepSeekAttachment {
  id?: string;
  name?: string;
  filename?: string;
  size?: number;
  type?: string;
  url?: string;
  download_url?: string;
  mime_type?: string;
}

/**
 * DeepSeek 对话详情响应结构
 * 
 * 注意：DeepSeek 的 API 响应结构可能有多种变体
 * 以下是基于常见模式的推测，需要实际样本验证
 */
export interface DeepSeekConversationDetail {
  // 可能的顶层字段
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  created_at?: number;
  updated_at?: number;
  
  // 消息列表（可能的字段名）
  messages?: DeepSeekMessage[];
  chats?: DeepSeekMessage[];
  turns?: DeepSeekMessage[];
  mapping?: Record<string, DeepSeekMessageNode>;
  
  // 可能的嵌套结构
  conversation?: DeepSeekConversationDetail;
  data?: DeepSeekConversationDetail;
  result?: DeepSeekConversationDetail;
  response?: DeepSeekConversationDetail;
  
  // 元数据
  metadata?: {
    title?: string;
    model?: string;
    mode?: string;
  };
  
  // DeepSeek 可能特有的字段
  model?: string;  // 使用的模型版本
  temperature?: number;
  max_tokens?: number;
}

/**
 * DeepSeek 消息节点（用于 mapping 结构）
 */
export interface DeepSeekMessageNode {
  id?: string;
  message?: DeepSeekMessage;
  parent?: string | null;
  children?: string[];
}

/**
 * DeepSeek 对话列表项
 */
export interface DeepSeekConversationListItem {
  id?: string;
  conversation_id?: string;
  chat_id?: string;
  session_id?: string;
  title?: string;
  created_at?: number;
  updated_at?: number;
  model?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
  message_count?: number;
  preview?: string;  // 对话预览
}

/**
 * DeepSeek 对话列表响应结构
 */
export interface DeepSeekConversationList {
  items?: DeepSeekConversationListItem[];
  conversation_items?: DeepSeekConversationListItem[];
  chats?: DeepSeekConversationListItem[];
  sessions?: DeepSeekConversationListItem[];
  data?: DeepSeekConversationList | DeepSeekConversationListItem[];
  result?: DeepSeekConversationList | DeepSeekConversationListItem[];
  total?: number;
  limit?: number;
  offset?: string | number;
  has_more?: boolean;
  next_cursor?: string;
}

// ============================================================================
// DeepSeek API 端点类型
// ============================================================================

/**
 * DeepSeek API 端点信息
 */
export interface DeepSeekApiEndpoints {
  detail: string | null;
  list: string | null;
  send?: string | null;  // 发送消息的端点（可选）
  discovered: boolean;
}

/**
 * DeepSeek 对话元数据（用于列表视图）
 */
export interface DeepSeekConversationMeta {
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
 * DeepSeek 消息块标准化前的中间表示
 */
export interface DeepSeekMessageBlock {
  type: 'text' | 'code' | 'image' | 'file' | 'link' | 'reasoning' | 'unsupported';
  text: string;
  title?: string;
  url?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

/**
 * DeepSeek 轮次标准化前的中间表示
 */
export interface DeepSeekMessageNormalized {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'unknown';
  timestamp: number;
  blocks: DeepSeekMessageBlock[];
}

// ============================================================================
// DeepSeek 平台特定常量
// ============================================================================

/**
 * DeepSeek 域名列表（用于 detect 检测）
 */
export const DEEPSEEK_DOMAINS = [
  'chat.deepseek.com',
  'www.deepseek.com',
  'deepseek.com',
  'chat.deepseek.ai',
];

/**
 * DeepSeek API 端点候选列表（用于回退探测）
 * 
 * 注意：这些端点基于常见模式推测，可能需要根据实际 API 调整
 */
export const DEEPSEEK_DETAIL_ENDPOINT_CANDIDATES = [
  '/api/chat/detail',
  '/api/conversation/detail',
  '/api/session/detail',
  '/api/v1/chat/detail',
  '/api/v1/conversation/detail',
  '/chat/detail',
  '/conversation/detail',
  '/graphql',  // DeepSeek 可能使用 GraphQL
];

export const DEEPSEEK_LIST_ENDPOINT_CANDIDATES = [
  '/api/chat/list',
  '/api/conversation/list',
  '/api/session/list',
  '/api/v1/chat/list',
  '/api/v1/conversation/list',
  '/chat/list',
  '/conversation/list',
  '/graphql',  // DeepSeek 可能使用 GraphQL
];

/**
 * DeepSeek URL 模式（用于从 URL 中提取 conversationId）
 * 
 * TODO: 需要实际访问 DeepSeek 网页版验证 URL 结构
 */
export const DEEPSEEK_URL_PATTERNS = [
  /^\/chat\/([a-zA-Z0-9-]+)$/i,  // /chat/{id}
  /^\/conversation\/([a-zA-Z0-9-]+)$/i,  // /conversation/{id}
  /^\/session\/([a-zA-Z0-9-]+)$/i,  // /session/{id}
  /^\/c\/([a-zA-Z0-9-]+)$/i,  // /c/{id}
  /^\/s\/([a-zA-Z0-9-]+)$/i,  // /s/{id}
];

// ============================================================================
// DeepSeek 能力级别定义
// ============================================================================

/**
 * DeepSeek 适配器能力级别
 * 
 * L1: 基础 - 从当前页面 DOM 提取可见消息
 * L2: 中等 - 通过 API 拦截获取完整对话历史
 * L3: 完整 - 主动调用 API 获取对话列表和详情
 * 
 * 当前实现状态：L1 骨架（需要真实样本验证）
 */
export type DeepSeekCapabilityLevel = 'L1' | 'L2' | 'L3';

export const DEEPSEEK_CAPABILITY_LEVELS: Record<DeepSeekCapabilityLevel, string> = {
  L1: '从当前页面 DOM 提取可见消息（基础）',
  L2: '通过 API 拦截获取完整对话历史（中等）',
  L3: '主动调用 API 获取对话列表和详情（完整）',
};

/**
 * DeepSeek 平台检测选项
 */
export interface DeepSeekDetectionOptions {
  /** 是否检查 hostname */
  checkHostname?: boolean;
  /** 是否检查页面特征元素 */
  checkDomFeatures?: boolean;
  /** 自定义 hostname 列表 */
  hostnames?: string[];
}

/**
 * DeepSeek 平台特征
 */
export interface DeepSeekPlatformFeatures {
  /** 检测到的 hostname */
  hostname?: string;
  /** 是否存在特征 DOM 元素 */
  hasFeatureElements?: boolean;
  /** 特征元素选择器 */
  featureSelectors?: string[];
  /** 是否存在全局对象 */
  hasGlobalObject?: boolean;
  /** 全局对象名称 */
  globalObjectName?: string;
}
