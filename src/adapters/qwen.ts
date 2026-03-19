/**
 * 通义千问 (Qwen Chat) PlatformAdapter 实现
 * 
 * 负责从通义千问网页版提取原始对话数据
 * 
 * ⚠️ 重要说明：
 * - 这是一个最小骨架实现，用于定义边界和接口
 * - 真实的抓取逻辑需要实际的通义千问样本数据验证
 * - 通义千问的 DOM 结构和 API 响应可能频繁变化
 * 
 * @see https://tongyi.aliyun.com/qianwen/
 */

import { BasePlatformAdapter } from './base';
import type {
  QwenConversationDetail,
  QwenConversationList,
  QwenConversationMeta,
  QwenApiEndpoints,
  QwenConversationListItem,
  QwenMessage,
} from './qwen-types';
import {
  QWEN_DOMAINS,
  QWEN_DETAIL_ENDPOINT_CANDIDATES,
  QWEN_LIST_ENDPOINT_CANDIDATES,
  QWEN_URL_PATTERNS,
  QWEN_CAPABILITY_LEVELS,
} from './qwen-types';
import type { PlatformType, RawConversation, RawMessage } from '../types';

/**
 * 通义千问 PlatformAdapter
 * 
 * 主要职责：
 * 1. 检测当前页面是否为通义千问
 * 2. 通过拦截 API 响应或主动探测获取对话数据
 * 3. 支持多结构兼容（API 响应可能有多种嵌套格式）
 * 
 * 能力级别目标：
 * - L1: 从当前页面 DOM 提取可见消息（基础）
 * - L2: 通过 API 拦截获取完整对话历史（中等）
 * - L3: 主动调用 API 获取对话列表和详情（完整）
 * 
 * 当前实现状态：L1 骨架（需要真实样本验证）
 */
export class QwenAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType = 'qwen';

  private apiEndpoints: QwenApiEndpoints = {
    detail: null,
    list: null,
    discovered: false,
  };

  private capturedConversations = new Map<string, QwenConversationDetail>();
  private conversationMetas = new Map<string, QwenConversationMeta>();

  /**
   * 检测当前页面是否属于通义千问平台
   * 
   * 检测逻辑：
   * 1. 检查域名是否为 tongyi.aliyun.com
   * 2. 检查页面特征（可选，待实现）
   * 
   * @returns 是否为通义千问平台
   */
  detect(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const hostname = window.location.hostname;
    
    // 主要域名检测
    if (QWEN_DOMAINS.includes(hostname)) {
      return true;
    }
    
    // 子域名检测
    if (hostname.endsWith('.aliyun.com') && hostname.includes('tongyi')) {
      return true;
    }
    
    // TODO: 可以添加页面特征检测作为二次验证
    // 例如检查特定的 DOM 元素或全局变量
    // 例如：document.querySelector('[data-qwen-app]') !== null
    
    return false;
  }

  /**
   * 获取单个对话的原始数据
   * 
   * 策略：
   * 1. 优先从已捕获的缓存中获取
   * 2. 如果未缓存，尝试通过 API 端点主动获取
   * 3. 支持从 URL 中提取 conversationId
   * 
   * @param conversationId 对话 ID（可选）
   * @returns 原始对话数据，失败时返回 null
   */
  async getConversation(conversationId?: string): Promise<RawConversation | null> {
    console.log('[QwenAdapter] getConversation called', { conversationId });

    // 1. 从缓存中获取
    if (conversationId && this.capturedConversations.has(conversationId)) {
      const data = this.capturedConversations.get(conversationId)!;
      return {
        platform: this.platform,
        data,
      };
    }

    // 2. 从当前 URL 提取 ID
    const idFromUrl = this.extractConversationIdFromUrl();
    const targetId = conversationId || idFromUrl;

    if (!targetId) {
      console.warn('[QwenAdapter] No conversation ID available');
      // TODO: 考虑回退到从 DOM 中提取当前对话
      return null;
    }

    // 3. 尝试通过 API 获取
    try {
      const detail = await this.fetchConversationDetail(targetId);
      if (detail) {
        this.capturedConversations.set(targetId, detail);
        return {
          platform: this.platform,
          data: detail,
        };
      }
    } catch (error) {
      console.error('[QwenAdapter] Failed to fetch conversation:', error);
    }

    // 4. 回退到 DOM 提取（L1 能力）
    // TODO: 实现从 DOM 中提取当前对话的逻辑
    console.warn('[QwenAdapter] Falling back to DOM extraction (not implemented)');
    
    return null;
  }

  /**
   * 获取对话列表的原始数据
   * 
   * 策略：
   * 1. 优先从已拦截的 API 响应中获取
   * 2. 尝试通过 API 端点主动获取
   * 3. 回退到从 DOM 中提取对话元数据
   * 
   * @returns 原始对话列表
   */
  async listConversations(): Promise<RawConversation[]> {
    console.log('[QwenAdapter] listConversations called');

    const metas: QwenConversationMeta[] = [];

    // 1. 从已捕获的对话中提取元数据
    for (const [id, detail] of this.capturedConversations.entries()) {
      const title = detail.title || detail.metadata?.title || '通义千问对话';
      metas.push({
        id,
        title,
        createTime: detail.create_time,
        updateTime: detail.update_time,
        model: detail.metadata?.model,
        messageCount: detail.messages?.length,
      });
    }

    // 2. 尝试通过 API 获取列表
    try {
      const listData = await this.fetchConversationList();
      if (listData && Array.isArray(listData)) {
        for (const item of listData) {
          const id = this.extractConversationId(item);
          const title = this.extractConversationTitle(item);
          if (id && !metas.some((m) => m.id === id)) {
            metas.push({
              id,
              title,
              createTime: item.create_time,
              updateTime: item.update_time,
              model: item.model,
              messageCount: item.message_count,
            });
          }
        }
      }
    } catch (error) {
      console.warn('[QwenAdapter] Failed to fetch conversation list:', error);
    }

    // 3. 回退到 DOM 提取（L1 能力）
    if (metas.length === 0) {
      const domMetas = this.extractConversationMetasFromDom();
      for (const meta of domMetas) {
        if (!metas.some((m) => m.id === meta.id)) {
          metas.push(meta);
        }
      }
    }

    // 转换为 RawConversation 格式
    return metas.map((meta) => ({
      platform: this.platform,
      data: {
        conversationId: meta.id,
        title: meta.title,
        create_time: meta.createTime,
        update_time: meta.updateTime,
        model: meta.model,
        message_count: meta.messageCount,
      },
    }));
  }

  /**
   * 提取消息列表
   * 
   * 将通义千问的 messages/chats/turns/history 数组转换为 RawMessage 数组
   * 
   * @param rawConversation 原始对话数据
   * @returns 原始消息列表
   */
  extractMessages(rawConversation: RawConversation): RawMessage[] {
    console.log('[QwenAdapter] extractMessages called');

    // 防御性检查：处理 null/undefined 输入
    if (!rawConversation || !rawConversation.data) {
      console.warn('[QwenAdapter] Invalid input to extractMessages');
      return [];
    }

    const data = rawConversation.data as QwenConversationDetail;
    
    // 尝试从不同结构中提取消息
    let messages: QwenMessage[] = [];
    
    // 优先从 messages 数组提取
    if (Array.isArray(data.messages)) {
      messages = data.messages;
    } 
    // 从 chats 数组提取
    else if (Array.isArray(data.chats)) {
      messages = data.chats;
    }
    // 从 turns 数组提取
    else if (Array.isArray(data.turns)) {
      messages = data.turns;
    }
    // 从 history 数组提取（通义千问可能使用这个字段）
    else if (Array.isArray(data.history)) {
      messages = data.history;
    }
    // 从 mapping 结构中提取
    else if (data.mapping) {
      messages = this.extractMessagesFromMapping(data.mapping);
    }
    
    // TODO: 支持更多可能的数据结构

    // 转换为 RawMessage 格式
    return messages.map((msg) => ({
      platform: this.platform,
      data: msg,
    }));
  }

  /**
   * 获取平台元数据
   * 
   * @returns 平台元数据
   */
  async getMetadata?(): Promise<Record<string, unknown>> {
    return {
      platform: this.platform,
      detected: this.detect(),
      endpointsDiscovered: this.apiEndpoints.discovered,
      capturedCount: this.capturedConversations.size,
      metaCount: this.conversationMetas.size,
      capabilityLevel: 'L1', // 当前实现级别
      capabilityDescription: QWEN_CAPABILITY_LEVELS.L1,
    };
  }

  // ============================================================================
  // 内部方法：API 端点探测
  // ============================================================================

  /**
   * 动态发现 API 端点
   * 
   * 策略：
   * 1. 从已拦截的请求中选择
   * 2. 从页面 JS 资源中提取
   * 3. 回退到常见端点探测
   * 
   * @returns 发现的 API 端点
   */
  async discoverApiEndpoints(): Promise<QwenApiEndpoints> {
    if (this.apiEndpoints.discovered) {
      return this.apiEndpoints;
    }

    const endpoints: QwenApiEndpoints = {
      detail: null,
      list: null,
      discovered: false,
    };

    // TODO: 实现从已拦截请求中选择端点
    // TODO: 实现从页面 JS 资源中提取端点
    // 目前先使用回退探测

    if (!endpoints.detail) {
      console.log('[QwenAdapter] Using fallback probe for detail API');
      endpoints.detail = await this.probeDetailApi();
    }

    if (!endpoints.list) {
      console.log('[QwenAdapter] Using fallback probe for list API');
      endpoints.list = await this.probeListApi();
    }

    console.log('[QwenAdapter] Discovered API endpoints:', endpoints);
    this.apiEndpoints = { ...endpoints, discovered: true };
    return this.apiEndpoints;
  }

  /**
   * 探测 detail API 端点
   * 
   * TODO: 需要实现实际的探测逻辑
   * 可能的策略：
   * 1. 发送 OPTIONS 请求探测端点
   * 2. 从页面 JS 文件中提取 API 路径
   * 3. 监听网络请求并识别模式
   */
  private async probeDetailApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点作为占位
    console.warn('[QwenAdapter] probeDetailApi not fully implemented');
    return QWEN_DETAIL_ENDPOINT_CANDIDATES[0];
  }

  /**
   * 探测 list API 端点
   * 
   * TODO: 需要实现实际的探测逻辑
   */
  private async probeListApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点作为占位
    console.warn('[QwenAdapter] probeListApi not fully implemented');
    return QWEN_LIST_ENDPOINT_CANDIDATES[0];
  }

  // ============================================================================
  // 内部方法：数据获取
  // ============================================================================

  /**
   * 获取对话详情
   * 
   * TODO: 需要实现实际的 fetch 逻辑
   * 需要：
   * 1. 确定正确的 API 端点
   * 2. 确定认证方式（Cookie / Token）
   * 3. 确定请求参数格式
   */
  private async fetchConversationDetail(
    _conversationId: string
  ): Promise<QwenConversationDetail | null> {
    const endpoints = await this.discoverApiEndpoints();
    if (!endpoints.detail) {
      throw new Error('Detail API endpoint not available');
    }

    // TODO: 实现实际的 fetch 逻辑
    // 目前返回 null，等待后续实现
    console.warn('[QwenAdapter] fetchConversationDetail not fully implemented');
    return null;
  }

  /**
   * 获取对话列表
   * 
   * TODO: 需要实现实际的 fetch 逻辑
   */
  private async fetchConversationList(): Promise<QwenConversationListItem[] | null> {
    const endpoints = await this.discoverApiEndpoints();
    if (!endpoints.list) {
      throw new Error('List API endpoint not available');
    }

    // TODO: 实现实际的 fetch 逻辑
    // 目前返回 null，等待后续实现
    console.warn('[QwenAdapter] fetchConversationList not fully implemented');
    return null;
  }

  // ============================================================================
  // 内部方法：数据提取辅助
  // ============================================================================

  /**
   * 从 URL 中提取 conversationId
   * 
   * 通义千问的 URL 模式可能是：
   * - https://tongyi.aliyun.com/qianwen/chat/{conversation-id}
   * - https://tongyi.aliyun.com/chat/{conversation-id}
   * 
   * TODO: 需要实际访问通义千问网页版验证 URL 结构
   */
  private extractConversationIdFromUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      const url = new URL(window.location.href);
      const pathname = url.pathname;

      // 尝试匹配已知的 URL 模式
      for (const pattern of QWEN_URL_PATTERNS) {
        const match = pathname.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      // 从查询参数中提取
      return (
        url.searchParams.get('conversationId') ||
        url.searchParams.get('conversation_id') ||
        url.searchParams.get('chatId') ||
        url.searchParams.get('chat_id') ||
        url.searchParams.get('sessionId') ||
        url.searchParams.get('session_id') ||
        url.searchParams.get('id') ||
        ''
      );
    } catch {
      return '';
    }
  }

  /**
   * 从对话项中提取 ID
   * 
   * 支持多种可能的字段名
   */
  private extractConversationId(item: Record<string, unknown>): string {
    return (
      (item.conversation_id as string) ||
      (item.conversationId as string) ||
      (item.chat_id as string) ||
      (item.chatId as string) ||
      (item.session_id as string) ||
      (item.sessionId as string) ||
      (item.id as string) ||
      ''
    );
  }

  /**
   * 从对话项中提取标题
   * 
   * 支持多种可能的字段名
   */
  private extractConversationTitle(item: Record<string, unknown>): string {
    return (
      (item.title as string) ||
      (item.conversationTitle as string) ||
      (item.chatTitle as string) ||
      (item.name as string) ||
      (item.summary as string) ||
      (item.topic as string) ||
      '通义千问对话'
    );
  }

  /**
   * 从 DOM 中提取对话元数据
   * 
   * TODO: 需要根据通义千问的实际 DOM 结构实现
   * 需要：
   * 1. 访问通义千问网页版
   * 2. 检查对话列表的 HTML 结构
   * 3. 确定正确的选择器
   */
  private extractConversationMetasFromDom(): QwenConversationMeta[] {
    if (typeof document === 'undefined') {
      return [];
    }

    const metas: QwenConversationMeta[] = [];
    const seen = new Set<string>();

    // TODO: 需要根据通义千问的实际 DOM 结构调整选择器
    // 这里只是示例代码，假设通义千问使用类似的链接结构
    const links = document.querySelectorAll('a[href*="/chat/"], a[href*="/conversation/"]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      
      // 尝试从 href 中提取 conversationId
      for (const pattern of QWEN_URL_PATTERNS) {
        const match = href.match(pattern);
        if (!match || !match[1]) continue;

        const id = match[1];
        if (!id || seen.has(id)) continue;

        seen.add(id);
        const text = (a.textContent || '').trim();
        metas.push({
          id,
          title: text || '通义千问对话',
        });
        break;
      }
    }

    return metas;
  }

  /**
   * 从 mapping 结构中提取消息
   * 
   * 如果通义千问使用树状 mapping 结构来组织消息
   */
  private extractMessagesFromMapping(
    mapping: Record<string, any>
  ): QwenMessage[] {
    const messages: QwenMessage[] = [];

    // 遍历 mapping 中的所有节点
    for (const key of Object.keys(mapping)) {
      const node = mapping[key];
      if (node?.message) {
        messages.push(node.message as QwenMessage);
      }
    }

    // TODO: 如果需要保持顺序，需要根据 parent/children 关系重建顺序
    return messages;
  }

  // ============================================================================
  // 内部方法：API 响应拦截（可选）
  // ============================================================================

  /**
   * 安装 API 响应拦截器
   * 
   * TODO: 此方法需要在合适的时机调用（如 userscript 初始化时）
   * 用于拦截 XMLHttpRequest 和 fetch 请求
   * 
   * 需要实现：
   * 1. 拦截 XHR 请求
   * 2. 拦截 fetch 请求
   * 3. 识别通义千问相关的 API 响应
   * 4. 解析并缓存响应数据
   */
  installInterceptors(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // TODO: 实现 XHR 拦截
    // TODO: 实现 fetch 拦截
    console.log('[QwenAdapter] installInterceptors not fully implemented');
  }

  /**
   * 处理通义千问详情响应
   * 
   * TODO: 需要根据实际响应结构调整
   */
  handleQwenResponse(text: string, _url: string): void {
    try {
      const json = JSON.parse(text) as QwenConversationDetail;

      // 检查多种可能的响应结构
      let convData: QwenConversationDetail | null = null;
      
      if (Array.isArray(json.messages)) {
        convData = json;
      } else if (Array.isArray(json.chats)) {
        convData = json;
      } else if (Array.isArray(json.turns)) {
        convData = json;
      } else if (Array.isArray(json.history)) {
        convData = json;
      } else if (json.mapping) {
        convData = json;
      } else if (Array.isArray(json?.data?.messages)) {
        convData = json.data;
      } else if (Array.isArray(json?.result?.messages)) {
        convData = json.result;
      } else if (Array.isArray(json?.response?.messages)) {
        convData = json.response;
      }

      if (!convData) return;

      const idFromUrl = this.extractConversationIdFromUrl();
      const id = idFromUrl || json.id || json.conversation_id || json.chat_id || `${Date.now()}`;
      const title = json.title || json.metadata?.title || '通义千问对话';

      this.conversationMetas.set(id, { id, title });
      this.capturedConversations.set(id, convData);

      console.log('[QwenAdapter] Captured conversation:', id);
    } catch (error) {
      console.error('[QwenAdapter] Failed to handle response:', error);
    }
  }

  /**
   * 处理通义千问列表响应
   * 
   * TODO: 需要根据实际响应结构调整
   */
  handleConversationListResponse(text: string): void {
    try {
      const json = JSON.parse(text) as QwenConversationList;

      // 尝试多种可能的数据结构
      const items =
        json.items ||
        json.conversation_items ||
        json.chats ||
        json.sessions ||
        json.history ||
        (Array.isArray(json.data) ? json.data : json.data?.items) ||
        json.result ||
        [];

      const conversations = Array.isArray(items) ? items : [];

      if (conversations.length > 0) {
        for (const item of conversations) {
          const id = this.extractConversationId(item as Record<string, unknown>);
          const title = this.extractConversationTitle(item as Record<string, unknown>);
          if (id) {
            this.conversationMetas.set(id, {
              id,
              title,
              createTime: item.create_time,
              updateTime: item.update_time,
              model: item.model,
              messageCount: item.message_count,
            });
          }
        }
      }
    } catch (error) {
      console.error('[QwenAdapter] Failed to handle list response:', error);
    }
  }
}

// 导出单例实例
export const qwenAdapter = new QwenAdapter();
