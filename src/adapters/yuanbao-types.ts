/**
 * Yuanbao (腾讯元宝) 特定类型定义
 * 
 * 这些类型用于描述 Yuanbao 平台的原始数据结构
 * 基于 V1 代码中的实际 API 响应结构
 */

// ============================================================================
// Yuanbao API 响应类型
// ============================================================================

/**
 * Yuanbao 消息块类型
 */
export interface YuanbaoContentBlock {
  type: 'text' | 'think' | 'image' | 'file' | 'link' | string;
  msg?: string;
  content?: YuanbaoContentBlock[];
  title?: string;
  [key: string]: unknown;
}

/**
 * Yuanbao 语音/消息单元
 */
export interface YuanbaoSpeech {
  speechesV2?: Array<{
    content?: YuanbaoContentBlock[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Yuanbao 对话轮次
 */
export interface YuanbaoTurn {
  index?: number;
  speaker?: 'user' | 'ai' | 'human' | string;
  createTime?: number | string;
  speechesV2?: YuanbaoSpeech[];
  [key: string]: unknown;
}

/**
 * Yuanbao 对话详情响应结构
 * 
 * 注意：Yuanbao API 可能返回多种嵌套结构，例如：
 * - { convs, sessionTitle, title }
 * - { data: { convs, sessionTitle } }
 * - { result: { convs, title } }
 * - { response: { convs } }
 * - { payload: { convs } }
 */
export interface YuanbaoConversationDetail {
  convs?: YuanbaoTurn[];
  sessionTitle?: string;
  title?: string;
  conversationId?: string;
  conversation_id?: string;
  convId?: string;
  conversationUuid?: string;
  sessionId?: string;
  chatId?: string;
  id?: string;
  data?: YuanbaoConversationDetail;
  result?: YuanbaoConversationDetail;
  response?: YuanbaoConversationDetail;
  payload?: YuanbaoConversationDetail;
  [key: string]: unknown;
}

/**
 * Yuanbao 对话列表项
 */
export interface YuanbaoConversationListItem {
  conversationId?: string;
  conversation_id?: string;
  convId?: string;
  conversationUuid?: string;
  sessionId?: string;
  chatId?: string;
  id?: string;
  title?: string;
  sessionTitle?: string;
  name?: string;
  conversationTitle?: string;
  summary?: string;
  createTime?: number | string;
  updateTime?: number | string;
  [key: string]: unknown;
}

/**
 * Yuanbao 对话列表响应结构
 * 
 * 注意：列表响应也可能有多种嵌套结构
 */
export interface YuanbaoConversationList {
  conversations?: YuanbaoConversationListItem[];
  data?: YuanbaoConversationList | YuanbaoConversationListItem[];
  result?: YuanbaoConversationList | YuanbaoConversationListItem[];
  response?: YuanbaoConversationList | YuanbaoConversationListItem[];
  payload?: YuanbaoConversationList | YuanbaoConversationListItem[];
  [key: string]: unknown;
}

// ============================================================================
// Yuanbao API 端点类型
// ============================================================================

/**
 * Yuanbao API 端点信息
 */
export interface YuanbaoApiEndpoints {
  detail: string | null;
  list: string | null;
  discovered: boolean;
}

/**
 * Yuanbao 对话元数据（用于列表视图）
 */
export interface YuanbaoConversationMeta {
  id: string;
  title: string;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * Yuanbao 消息块标准化前的中间表示
 */
export interface YuanbaoMessageBlock {
  type: 'text' | 'think' | 'unsupported';
  text: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Yuanbao 轮次标准化前的中间表示
 */
export interface YuanbaoTurnNormalized {
  index: number;
  role: 'user' | 'assistant' | 'unknown';
  timestamp: number;
  blocks: YuanbaoMessageBlock[];
}
