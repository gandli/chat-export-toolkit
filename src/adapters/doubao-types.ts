/**
 * Doubao (豆包) 特定类型定义
 * 
 * 这些类型用于描述 Doubao 平台的原始数据结构
 * 基于对豆包网页版的初步分析和推测
 * 
 * @see https://doubao.com
 * 
 * 注意：以下类型基于常见 AI 对话平台的 API 模式推测
 * 实际结构需要根据真实 API 响应进行调整
 */

// ============================================================================
// Doubao API 响应类型（待验证）
// ============================================================================

/**
 * Doubao 消息块类型
 * 
 * 豆包可能支持的内容块类型：
 * - text: 普通文本
 * - think: 思考过程（类似元宝）
 * - image: 图片
 * - file: 文件
 * - code: 代码块
 */
export interface DoubaoContentBlock {
  type: 'text' | 'think' | 'image' | 'file' | 'code' | string;
  content?: string | DoubaoContentBlock[];
  text?: string;
  data?: string;
  url?: string;
  title?: string;
  language?: string; // 代码块的语言
  [key: string]: unknown;
}

/**
 * Doubao 消息单元
 * 
 * 类似元宝的 speechesV2 结构，但具体字段可能不同
 */
export interface DoubaoMessageUnit {
  content?: DoubaoContentBlock[];
  text?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Doubao 对话轮次
 * 
 * 代表一轮对话（用户或 AI 的一次发言）
 */
export interface DoubaoTurn {
  id?: string;
  index?: number;
  role?: 'user' | 'assistant' | 'ai' | 'human' | string;
  speaker?: string;
  createTime?: number | string;
  timestamp?: number | string;
  content?: string;
  messages?: DoubaoMessageUnit[];
  blocks?: DoubaoContentBlock[];
  [key: string]: unknown;
}

/**
 * Doubao 对话详情响应结构
 * 
 * 注意：Doubao API 可能返回多种嵌套结构，需要根据实际情况验证
 * 可能的结构：
 * - { data, title, conversationId }
 * - { result: { data, title } }
 * - { response: { data } }
 */
export interface DoubaoConversationDetail {
  // 对话标识
  conversationId?: string;
  conversation_id?: string;
  convId?: string;
  id?: string;
  sessionId?: string;
  chatId?: string;
  
  // 对话元数据
  title?: string;
  sessionTitle?: string;
  name?: string;
  
  // 对话内容
  data?: DoubaoTurn[];
  messages?: DoubaoTurn[];
  turns?: DoubaoTurn[];
  convs?: DoubaoTurn[];
  
  // 可能的嵌套结构
  result?: DoubaoConversationDetail;
  response?: DoubaoConversationDetail;
  payload?: DoubaoConversationDetail;
  
  // 时间信息
  createTime?: number | string;
  updateTime?: number | string;
  createdAt?: number | string;
  updatedAt?: number | string;
  
  [key: string]: unknown;
}

/**
 * Doubao 对话列表项
 */
export interface DoubaoConversationListItem {
  // 对话标识
  conversationId?: string;
  conversation_id?: string;
  convId?: string;
  id?: string;
  sessionId?: string;
  chatId?: string;
  
  // 对话标题
  title?: string;
  sessionTitle?: string;
  name?: string;
  summary?: string;
  firstMessage?: string;
  
  // 时间信息
  createTime?: number | string;
  updateTime?: number | string;
  createdAt?: number | string;
  updatedAt?: number | string;
  lastActiveTime?: number | string;
  
  // 其他元数据
  messageCount?: number;
  participantCount?: number;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  
  [key: string]: unknown;
}

/**
 * Doubao 对话列表响应结构
 */
export interface DoubaoConversationList {
  conversations?: DoubaoConversationListItem[];
  data?: DoubaoConversationList | DoubaoConversationListItem[];
  result?: DoubaoConversationList | DoubaoConversationListItem[];
  response?: DoubaoConversationList | DoubaoConversationListItem[];
  payload?: DoubaoConversationList | DoubaoConversationListItem[];
  
  // 分页信息（如果有）
  total?: number;
  count?: number;
  hasMore?: boolean;
  cursor?: string;
  nextCursor?: string;
  page?: number;
  pageSize?: number;
  
  [key: string]: unknown;
}

// ============================================================================
// Doubao API 端点类型
// ============================================================================

/**
 * Doubao API 端点信息
 */
export interface DoubaoApiEndpoints {
  detail: string | null;
  list: string | null;
  send?: string | null; // 发送消息的端点（可选）
  discovered: boolean;
}

/**
 * Doubao 对话元数据（用于列表视图）
 */
export interface DoubaoConversationMeta {
  id: string;
  title: string;
  createTime?: number;
  updateTime?: number;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * Doubao 消息块标准化前的中间表示
 */
export interface DoubaoMessageBlock {
  type: 'text' | 'think' | 'image' | 'file' | 'code' | 'unsupported';
  text: string;
  title?: string;
  url?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Doubao 轮次标准化前的中间表示
 */
export interface DoubaoTurnNormalized {
  index: number;
  role: 'user' | 'assistant' | 'unknown';
  timestamp: number;
  blocks: DoubaoMessageBlock[];
}

// ============================================================================
// 平台检测相关类型
// ============================================================================

/**
 * Doubao 平台检测选项
 */
export interface DoubaoDetectionOptions {
  /** 是否检查 hostname */
  checkHostname?: boolean;
  /** 是否检查页面特征元素 */
  checkDomFeatures?: boolean;
  /** 自定义 hostname 列表 */
  hostnames?: string[];
}

/**
 * Doubao 平台特征
 */
export interface DoubaoPlatformFeatures {
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
