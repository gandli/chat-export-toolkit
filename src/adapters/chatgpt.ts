/**
 * ChatGPT PlatformAdapter 实现
 * 
 * 负责从 ChatGPT 网页版提取原始对话数据
 * 
 * 重要说明：
 * - 这是一个最小骨架实现，用于定义边界和接口
 * - 真实的抓取逻辑需要实际的 ChatGPT 样本数据验证
 * - ChatGPT 的 DOM 结构和 API 响应可能频繁变化
 */

import { BasePlatformAdapter } from './base';
import type {
  ChatGPTConversationDetail,
  ChatGPTConversationList,
  ChatGPTConversationMeta,
  ChatGPTApiEndpoints,
  ChatGPTConversationListItem,
  ChatGPTMessage,
} from './chatgpt-types';
import {
  CHATGPT_DETAIL_ENDPOINT_CANDIDATES,
  CHATGPT_LIST_ENDPOINT_CANDIDATES,
  CHATGPT_URL_PATTERNS,
} from './chatgpt-types';
import type { PlatformType, RawConversation, RawMessage } from '../types';

/**
 * ChatGPT PlatformAdapter
 * 
 * 主要职责：
 * 1. 检测当前页面是否为 ChatGPT
 * 2. 通过拦截 API 响应或主动探测获取对话数据
 * 3. 支持多结构兼容（API 响应可能有多种嵌套格式）
 * 
 * 能力级别目标：
 * - L1: 从当前页面 DOM 提取可见消息（基础）
 * - L2: 通过 API 拦截获取完整对话历史（中等）
 * - L3: 主动调用 API 获取对话列表和详情（完整）
 */
export class ChatGPTAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType = 'chatgpt';

  private apiEndpoints: ChatGPTApiEndpoints = {
    detail: null,
    list: null,
    discovered: false,
  };

  private capturedConversations = new Map<string, ChatGPTConversationDetail>();
  private conversationMetas = new Map<string, ChatGPTConversationMeta>();

  /**
   * 检测当前页面是否属于 ChatGPT 平台
   * 
   * 检测逻辑：
   * 1. 检查域名是否为 chat.openai.com 或相关域名
   * 2. 检查页面特征（可选）
   */
  detect(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const hostname = window.location.hostname;
    
    // 主要域名检测
    if (hostname === 'chat.openai.com' || hostname === 'chatgpt.com') {
      return true;
    }
    
    // 备用域名检测
    if (hostname.endsWith('.openai.com')) {
      return true;
    }
    
    // TODO: 可以添加页面特征检测作为二次验证
    // 例如检查特定的 DOM 元素或全局变量
    
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
   */
  async getConversation(conversationId?: string): Promise<RawConversation | null> {
    console.log('[ChatGPTAdapter] getConversation called', { conversationId });

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
      console.warn('[ChatGPTAdapter] No conversation ID available');
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
      console.error('[ChatGPTAdapter] Failed to fetch conversation:', error);
    }

    // 4. 回退到 DOM 提取（L1 能力）
    // TODO: 实现从 DOM 中提取当前对话的逻辑
    console.warn('[ChatGPTAdapter] Falling back to DOM extraction (not implemented)');
    
    return null;
  }

  /**
   * 获取对话列表的原始数据
   * 
   * 策略：
   * 1. 优先从已拦截的 API 响应中获取
   * 2. 尝试通过 API 端点主动获取
   * 3. 回退到从 DOM 中提取对话元数据
   */
  async listConversations(): Promise<RawConversation[]> {
    console.log('[ChatGPTAdapter] listConversations called');

    const metas: ChatGPTConversationMeta[] = [];

    // 1. 从已捕获的对话中提取元数据
    for (const [id, detail] of this.capturedConversations.entries()) {
      const title = detail.title || detail.metadata?.title || 'ChatGPT Chat';
      metas.push({
        id,
        title,
        createTime: detail.create_time,
        updateTime: detail.update_time,
        model: detail.metadata?.model,
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
            });
          }
        }
      }
    } catch (error) {
      console.warn('[ChatGPTAdapter] Failed to fetch conversation list:', error);
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
      },
    }));
  }

  /**
   * 提取消息列表
   * 
   * 将 ChatGPT 的 messages/mapping 数组转换为 RawMessage 数组
   * 
   * @param rawConversation 原始对话数据
   */
  extractMessages(rawConversation: RawConversation): RawMessage[] {
    console.log('[ChatGPTAdapter] extractMessages called');

    // 防御性检查：处理 null/undefined 输入
    if (!rawConversation || !rawConversation.data) {
      console.warn('[ChatGPTAdapter] Invalid input to extractMessages');
      return [];
    }

    const data = rawConversation.data as ChatGPTConversationDetail;
    
    // 尝试从不同结构中提取消息
    let messages: ChatGPTMessage[] = [];
    
    if (Array.isArray(data.messages)) {
      messages = data.messages;
    } else if (data.mapping) {
      // 从 mapping 结构中提取消息（ChatGPT 可能使用这种结构）
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
   */
  async getMetadata?(): Promise<Record<string, unknown>> {
    return {
      platform: this.platform,
      detected: this.detect(),
      endpointsDiscovered: this.apiEndpoints.discovered,
      capturedCount: this.capturedConversations.size,
      metaCount: this.conversationMetas.size,
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
   */
  async discoverApiEndpoints(): Promise<ChatGPTApiEndpoints> {
    if (this.apiEndpoints.discovered) {
      return this.apiEndpoints;
    }

    const endpoints: ChatGPTApiEndpoints = {
      detail: null,
      list: null,
      discovered: false,
    };

    // TODO: 实现从已拦截请求中选择端点
    // TODO: 实现从页面 JS 资源中提取端点
    // 目前先使用回退探测

    if (!endpoints.detail) {
      console.log('[ChatGPTAdapter] Using fallback probe for detail API');
      endpoints.detail = await this.probeDetailApi();
    }

    if (!endpoints.list) {
      console.log('[ChatGPTAdapter] Using fallback probe for list API');
      endpoints.list = await this.probeListApi();
    }

    console.log('[ChatGPTAdapter] Discovered API endpoints:', endpoints);
    this.apiEndpoints = { ...endpoints, discovered: true };
    return this.apiEndpoints;
  }

  /**
   * 探测 detail API 端点
   * 
   * TODO: 需要实现实际的探测逻辑
   */
  private async probeDetailApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点作为占位
    console.warn('[ChatGPTAdapter] probeDetailApi not fully implemented');
    return '/backend-api/conversation';
  }

  /**
   * 探测 list API 端点
   * 
   * TODO: 需要实现实际的探测逻辑
   */
  private async probeListApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点作为占位
    console.warn('[ChatGPTAdapter] probeListApi not fully implemented');
    return '/backend-api/conversations';
  }

  // ============================================================================
  // 内部方法：数据获取
  // ============================================================================

  /**
   * 获取对话详情
   * 
   * TODO: 需要实现实际的 fetch 逻辑
   */
  private async fetchConversationDetail(
    conversationId: string
  ): Promise<ChatGPTConversationDetail | null> {
    const endpoints = await this.discoverApiEndpoints();
    const endpointCandidates = this.buildDetailEndpointCandidates(
      conversationId,
      endpoints.detail
    );

    for (const endpoint of endpointCandidates) {
      const detail = await this.fetchJson(endpoint);
      const conversation = this.unwrapConversationDetail(detail, conversationId);

      if (conversation) {
        return conversation;
      }
    }

    return null;
  }

  /**
   * 获取对话列表
   * 
   * TODO: 需要实现实际的 fetch 逻辑
   */
  private async fetchConversationList(): Promise<ChatGPTConversationListItem[] | null> {
    const endpoints = await this.discoverApiEndpoints();
    const endpointCandidates = this.buildListEndpointCandidates(endpoints.list);

    for (const endpoint of endpointCandidates) {
      const payload = await this.fetchJson(endpoint);
      const items = this.unwrapConversationList(payload);

      if (items.length > 0) {
        return items;
      }
    }

    return null;
  }

  // ============================================================================
  // 内部方法：数据提取辅助
  // ============================================================================

  /**
   * 从 URL 中提取 conversationId
   * 
   * ChatGPT 的 URL 模式通常是：
   * - https://chat.openai.com/c/{conversation-id}
   */
  private extractConversationIdFromUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      const url = new URL(window.location.href);
      const pathname = url.pathname;

      // 尝试匹配已知的 URL 模式
      for (const pattern of CHATGPT_URL_PATTERNS) {
        const match = pathname.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      // 从查询参数中提取
      return (
        url.searchParams.get('conversationId') ||
        url.searchParams.get('conversation_id') ||
        url.searchParams.get('id') ||
        ''
      );
    } catch {
      return '';
    }
  }

  /**
   * 从对话项中提取 ID
   */
  private extractConversationId(item: Record<string, unknown>): string {
    return (
      (item.conversation_id as string) ||
      (item.id as string) ||
      (item.conversationId as string) ||
      (item.chatId as string) ||
      (item.sessionId as string) ||
      ''
    );
  }

  /**
   * 从对话项中提取标题
   */
  private extractConversationTitle(item: Record<string, unknown>): string {
    return (
      (item.title as string) ||
      (item.conversationTitle as string) ||
      (item.name as string) ||
      (item.summary as string) ||
      'ChatGPT Chat'
    );
  }

  /**
   * 从 DOM 中提取对话元数据
   * 
   * TODO: 需要根据 ChatGPT 的实际 DOM 结构实现
   */
  private extractConversationMetasFromDom(): ChatGPTConversationMeta[] {
    if (typeof document === 'undefined') {
      return [];
    }

    const metas: ChatGPTConversationMeta[] = [];
    const seen = new Set<string>();

    // TODO: 需要根据 ChatGPT 的实际 DOM 结构调整选择器
    // 这里只是示例代码
    const links = document.querySelectorAll('a[href*="/c/"]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      
      // 尝试从 href 中提取 conversationId
      for (const pattern of CHATGPT_URL_PATTERNS) {
        const match = href.match(pattern);
        if (!match || !match[1]) continue;

        const id = match[1];
        if (!id || seen.has(id)) continue;

        seen.add(id);
        const text = (a.textContent || '').trim();
        metas.push({
          id,
          title: text || 'ChatGPT Chat',
        });
        break;
      }
    }

    return metas;
  }

  /**
   * 从 mapping 结构中提取消息
   * 
   * ChatGPT 可能使用树状 mapping 结构来组织消息
   */
  private extractMessagesFromMapping(
    mapping: Record<string, any>
  ): ChatGPTMessage[] {
    const messages: ChatGPTMessage[] = [];

    const visited = new Set<string>();
    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);

      const node = mapping[nodeId];
      if (!node) {
        return;
      }

      if (node.message) {
        messages.push(node.message as ChatGPTMessage);
      }

      const children = Array.isArray(node.children) ? node.children : [];
      for (const childId of children) {
        if (typeof childId === 'string') {
          visit(childId);
        }
      }
    };

    for (const [nodeId, node] of Object.entries(mapping)) {
      if (!node?.parent || !mapping[node.parent]) {
        visit(nodeId);
      }
    }

    for (const nodeId of Object.keys(mapping)) {
      visit(nodeId);
    }

    return messages;
  }

  private buildDetailEndpointCandidates(
    conversationId: string,
    discoveredEndpoint: string | null
  ): string[] {
    const candidates = [
      discoveredEndpoint,
      ...CHATGPT_DETAIL_ENDPOINT_CANDIDATES,
    ].filter((candidate): candidate is string => Boolean(candidate));

    return Array.from(
      new Set(
        candidates.map((candidate) => {
          if (candidate.includes('[id]')) {
            return candidate.replace('[id]', conversationId);
          }

          return candidate.endsWith(`/${conversationId}`)
            ? candidate
            : `${candidate.replace(/\/$/, '')}/${conversationId}`;
        })
      )
    );
  }

  private buildListEndpointCandidates(discoveredEndpoint: string | null): string[] {
    return Array.from(
      new Set(
        [discoveredEndpoint, ...CHATGPT_LIST_ENDPOINT_CANDIDATES].filter(
          (candidate): candidate is string => Boolean(candidate)
        )
      )
    );
  }

  private async fetchJson(endpoint: string): Promise<unknown> {
    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('[ChatGPTAdapter] Failed to fetch endpoint:', endpoint, error);
      return null;
    }
  }

  private unwrapConversationDetail(
    payload: unknown,
    conversationId: string
  ): ChatGPTConversationDetail | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const queue: unknown[] = [payload];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || typeof current !== 'object') {
        continue;
      }

      const candidate = current as ChatGPTConversationDetail;
      if (Array.isArray(candidate.messages) || candidate.mapping) {
        return {
          ...candidate,
          conversation_id: candidate.conversation_id || candidate.id || conversationId,
        };
      }

      if ('conversation' in candidate) {
        queue.push(candidate.conversation);
      }
      if ('data' in candidate) {
        queue.push(candidate.data);
      }
      if ('result' in candidate) {
        queue.push(candidate.result);
      }
    }

    return null;
  }

  private unwrapConversationList(payload: unknown): ChatGPTConversationListItem[] {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload as ChatGPTConversationListItem[];
    }

    if (typeof payload !== 'object') {
      return [];
    }

    const list = payload as ChatGPTConversationList;
    if (Array.isArray(list.items)) {
      return list.items;
    }
    if (Array.isArray(list.conversation_items)) {
      return list.conversation_items;
    }
    if (Array.isArray(list.data)) {
      return list.data as ChatGPTConversationListItem[];
    }
    if (Array.isArray(list.result)) {
      return list.result as ChatGPTConversationListItem[];
    }

    return [];
  }

  // ============================================================================
  // 内部方法：API 响应拦截（可选）
  // ============================================================================

  /**
   * 安装 API 响应拦截器
   * 
   * TODO: 此方法需要在合适的时机调用（如 userscript 初始化时）
   * 用于拦截 XMLHttpRequest 和 fetch 请求
   */
  installInterceptors(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // TODO: 实现 XHR 拦截
    // TODO: 实现 fetch 拦截
    console.log('[ChatGPTAdapter] installInterceptors not fully implemented');
  }

  /**
   * 处理 ChatGPT 详情响应
   * 
   * TODO: 需要根据实际响应结构调整
   */
  handleChatGPTResponse(text: string, _url: string): void {
    try {
      const json = JSON.parse(text) as ChatGPTConversationDetail;

      // 检查多种可能的响应结构
      let convData: ChatGPTConversationDetail | null = null;
      
      if (Array.isArray(json.messages)) {
        convData = json;
      } else if (json.mapping) {
        convData = json;
      } else if (Array.isArray(json?.data?.messages)) {
        convData = json.data;
      } else if (json?.result?.messages) {
        convData = json.result;
      }

      if (!convData) return;

      const idFromUrl = this.extractConversationIdFromUrl();
      const id = idFromUrl || json.id || json.conversation_id || `${Date.now()}`;
      const title = json.title || json.metadata?.title || 'ChatGPT Chat';

      this.conversationMetas.set(id, { id, title });
      this.capturedConversations.set(id, convData);

      console.log('[ChatGPTAdapter] Captured conversation:', id);
    } catch (error) {
      console.error('[ChatGPTAdapter] Failed to handle response:', error);
    }
  }

  /**
   * 处理 ChatGPT 列表响应
   * 
   * TODO: 需要根据实际响应结构调整
   */
  handleConversationListResponse(text: string): void {
    try {
      const json = JSON.parse(text) as ChatGPTConversationList;

      // 尝试多种可能的数据结构
      const items =
        json.items ||
        json.conversation_items ||
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
            });
          }
        }
      }
    } catch (error) {
      console.error('[ChatGPTAdapter] Failed to handle list response:', error);
    }
  }
}

// 导出单例实例
export const chatgptAdapter = new ChatGPTAdapter();
