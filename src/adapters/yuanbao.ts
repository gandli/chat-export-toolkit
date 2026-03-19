/**
 * Yuanbao (腾讯元宝) PlatformAdapter 实现
 * 
 * 负责从 Yuanbao 网页版提取原始对话数据
 * 基于 V1 代码中的 API 探测和拦截逻辑
 */

import { BasePlatformAdapter } from './base';
import type {
  YuanbaoConversationDetail,
  YuanbaoConversationList,
  YuanbaoConversationMeta,
  YuanbaoApiEndpoints,
  YuanbaoConversationListItem,
} from './yuanbao-types';
import type { PlatformType, RawConversation, RawMessage } from '../types';

/**
 * 常见的 Yuanbao API 端点候选列表（用于回退探测）
 */
const DETAIL_ENDPOINT_CANDIDATES = [
  '/api/user/agent/conversation/v2/detail',
  '/api/user/agent/conversation/v1/detail',
  '/api/conversation/v2/detail',
  '/api/conversation/v1/detail',
  '/api/user/agent/conversation/detail',
  '/api/conversation/detail',
  '/api/v1/user/agent/conversation/detail',
  '/api/v2/user/agent/conversation/detail',
  '/api/conversation/detail/v1',
  '/api/conversation/detail/v2',
];

const LIST_ENDPOINT_CANDIDATES = [
  '/api/user/agent/conversation/v2/list',
  '/api/user/agent/conversation/v1/list',
  '/api/conversation/v2/list',
  '/api/conversation/v1/list',
  '/api/user/agent/conversation/list',
  '/api/conversation/list',
  '/api/user/agent/conversation/page',
  '/api/conversation/page',
  '/api/conversation/list_page',
];

/**
 * Yuanbao PlatformAdapter
 * 
 * 主要职责：
 * 1. 检测当前页面是否为 Yuanbao
 * 2. 通过拦截 API 响应或主动探测获取对话数据
 * 3. 支持多结构兼容（API 响应可能有多种嵌套格式）
 */
export class YuanbaoAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType = 'yuanbao';

  private apiEndpoints: YuanbaoApiEndpoints = {
    detail: null,
    list: null,
    discovered: false,
  };

  private capturedConversations = new Map<string, YuanbaoConversationDetail>();
  private conversationMetas = new Map<string, string>(); // id -> title

  /**
   * 检测当前页面是否属于 Yuanbao 平台
   */
  detect(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const hostname = window.location.hostname;
    return (
      hostname === 'yuanbao.tencent.com' ||
      hostname.endsWith('.yuanbao.tencent.com')
    );
  }

  /**
   * 获取单个对话的原始数据
   * 
   * 策略：
   * 1. 优先从已捕获的缓存中获取
   * 2. 如果未缓存，尝试通过 API 端点主动获取
   * 3. 支持从 URL 中提取 conversationId
   */
  async getConversation(conversationId?: string): Promise<RawConversation | null> {
    console.log('[YuanbaoAdapter] getConversation called', { conversationId });

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
      console.warn('[YuanbaoAdapter] No conversation ID available');
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
      console.error('[YuanbaoAdapter] Failed to fetch conversation:', error);
    }

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
    console.log('[YuanbaoAdapter] listConversations called');

    const metas: YuanbaoConversationMeta[] = [];

    // 1. 从已捕获的对话中提取元数据
    for (const [id, detail] of this.capturedConversations.entries()) {
      const title = detail.sessionTitle || detail.title || 'Yuanbao Chat';
      metas.push({ id, title });
    }

    // 2. 尝试通过 API 获取列表
    try {
      const listData = await this.fetchConversationList();
      if (listData && Array.isArray(listData)) {
        for (const item of listData) {
          const id = this.extractConversationId(item);
          const title = this.extractConversationTitle(item);
          if (id && !metas.some((m) => m.id === id)) {
            metas.push({ id, title });
          }
        }
      }
    } catch (error) {
      console.warn('[YuanbaoAdapter] Failed to fetch conversation list:', error);
    }

    // 3. 回退到 DOM 提取
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
      },
    }));
  }

  /**
   * 提取消息列表
   * 
   * 将 Yuanbao 的 convs 数组转换为 RawMessage 数组
   */
  extractMessages(rawConversation: RawConversation): RawMessage[] {
    console.log('[YuanbaoAdapter] extractMessages called');

    // 防御性检查：处理 null/undefined 输入
    if (!rawConversation || !rawConversation.data) {
      console.warn('[YuanbaoAdapter] Invalid input to extractMessages');
      return [];
    }

    const data = rawConversation.data as YuanbaoConversationDetail;
    const convs = data?.convs || [];

    // 按 index 排序
    const sortedConvs = [...convs].sort((a, b) => (a?.index || 0) - (b?.index || 0));

    return sortedConvs.map((turn) => ({
      platform: this.platform,
      data: turn,
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
  async discoverApiEndpoints(): Promise<YuanbaoApiEndpoints> {
    if (this.apiEndpoints.discovered) {
      return this.apiEndpoints;
    }

    const endpoints: YuanbaoApiEndpoints = {
      detail: null,
      list: null,
      discovered: false,
    };

    // TODO: 实现从已拦截请求中选择端点
    // TODO: 实现从页面 JS 资源中提取端点
    // 目前先使用回退探测

    if (!endpoints.detail) {
      console.log('[YuanbaoAdapter] Using fallback probe for detail API');
      endpoints.detail = await this.probeDetailApi();
    }

    if (!endpoints.list) {
      console.log('[YuanbaoAdapter] Using fallback probe for list API');
      endpoints.list = await this.probeListApi();
    }

    console.log('[YuanbaoAdapter] Discovered API endpoints:', endpoints);
    this.apiEndpoints = { ...endpoints, discovered: true };
    return this.apiEndpoints;
  }

  /**
   * 探测 detail API 端点
   */
  private async probeDetailApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点
    // TODO: 使用 YUANBAO_DETAIL_RE 进行端点验证
    return DETAIL_ENDPOINT_CANDIDATES[0];
  }

  /**
   * 探测 list API 端点
   */
  private async probeListApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点
    // TODO: 使用 YUANBAO_LIST_RE 进行端点验证
    return LIST_ENDPOINT_CANDIDATES[0];
  }

  // ============================================================================
  // 内部方法：数据获取
  // ============================================================================

  /**
   * 获取对话详情
   */
  private async fetchConversationDetail(
    _conversationId: string
  ): Promise<YuanbaoConversationDetail | null> {
    const endpoints = await this.discoverApiEndpoints();
    if (!endpoints.detail) {
      throw new Error('Detail API endpoint not available');
    }

    // TODO: 实现实际的 fetch 逻辑
    // 目前返回 null，等待后续实现
    console.warn('[YuanbaoAdapter] fetchConversationDetail not fully implemented');
    return null;
  }

  /**
   * 获取对话列表
   */
  private async fetchConversationList(): Promise<YuanbaoConversationListItem[] | null> {
    const endpoints = await this.discoverApiEndpoints();
    if (!endpoints.list) {
      throw new Error('List API endpoint not available');
    }

    // TODO: 实现实际的 fetch 逻辑
    // 目前返回 null，等待后续实现
    console.warn('[YuanbaoAdapter] fetchConversationList not fully implemented');
    return null;
  }

  // ============================================================================
  // 内部方法：数据提取辅助
  // ============================================================================

  /**
   * 从 URL 中提取 conversationId
   */
  private extractConversationIdFromUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      const url = new URL(window.location.href);
      return (
        url.searchParams.get('conversationId') ||
        url.searchParams.get('conversation_id') ||
        url.searchParams.get('id') ||
        this.extractIdFromPath()
      );
    } catch {
      return this.extractIdFromPath();
    }
  }

  /**
   * 从路径中提取 conversationId
   */
  private extractIdFromPath(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const match = window.location.pathname.match(/\/chat\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  /**
   * 从对话项中提取 ID
   */
  private extractConversationId(item: Record<string, unknown>): string {
    return (
      (item.conversationId as string) ||
      (item.conversation_id as string) ||
      (item.convId as string) ||
      (item.conversationUuid as string) ||
      (item.sessionId as string) ||
      (item.chatId as string) ||
      (item.id as string) ||
      ''
    );
  }

  /**
   * 从对话项中提取标题
   */
  private extractConversationTitle(item: Record<string, unknown>): string {
    return (
      (item.title as string) ||
      (item.sessionTitle as string) ||
      (item.name as string) ||
      (item.conversationTitle as string) ||
      (item.summary as string) ||
      'Yuanbao Chat'
    );
  }

  /**
   * 从 DOM 中提取对话元数据
   */
  private extractConversationMetasFromDom(): YuanbaoConversationMeta[] {
    if (typeof document === 'undefined') {
      return [];
    }

    const metas: YuanbaoConversationMeta[] = [];
    const seen = new Set<string>();

    const links = document.querySelectorAll('a[href*="/chat/"]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const match = href.match(/\/chat\/([^/?#]+)/);
      if (!match) continue;

      const id = decodeURIComponent(match[1]);
      if (!id || seen.has(id)) continue;

      seen.add(id);
      const text = (a.textContent || '').trim();
      metas.push({
        id,
        title: text || 'Yuanbao Chat',
      });
    }

    return metas;
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
    console.log('[YuanbaoAdapter] installInterceptors not fully implemented');
  }

  /**
   * 处理 Yuanbao 详情响应
   */
  handleYuanbaoResponse(text: string, _url: string): void {
    try {
      const json = JSON.parse(text) as YuanbaoConversationDetail;

      // 检查多种可能的响应结构
      let convsData: YuanbaoConversationDetail | null = null;
      if (Array.isArray(json.convs)) {
        convsData = json;
      } else if (Array.isArray(json?.data?.convs)) {
        convsData = json.data;
      } else if (Array.isArray(json?.result?.convs)) {
        convsData = json.result;
      } else if (Array.isArray(json?.response?.convs)) {
        convsData = json.response;
      } else if (Array.isArray(json?.payload?.convs)) {
        convsData = json.payload;
      } else if (Array.isArray(json?.data?.data?.convs)) {
        convsData = json.data.data;
      } else if (Array.isArray(json?.result?.result?.convs)) {
        convsData = json.result.result;
      }

      if (!convsData) return;

      const idFromUrl = this.extractConversationIdFromUrl();
      const title =
        convsData.sessionTitle ||
        convsData.title ||
        json.sessionTitle ||
        json.title ||
        'Yuanbao Chat';
      const id = idFromUrl || `${this.sanitizeFilename(title)}_${Date.now()}`;

      this.conversationMetas.set(id, title);
      this.capturedConversations.set(id, convsData);

      console.log('[YuanbaoAdapter] Captured conversation:', id);
    } catch (error) {
      console.error('[YuanbaoAdapter] Failed to handle response:', error);
    }
  }

  /**
   * 处理 Yuanbao 列表响应
   */
  handleConversationListResponse(text: string): void {
    try {
      const json = JSON.parse(text) as YuanbaoConversationList;

      // 尝试多种可能的数据结构
      const conversations =
        this.pickArray(json, ['conversations', 'data', 'result', 'response', 'payload']) ||
        this.pickArray((json.data as Record<string, unknown>) || {}, [
          'conversations',
          'result',
          'response',
          'payload',
        ]) ||
        this.pickArray((json.result as Record<string, unknown>) || {}, [
          'conversations',
          'data',
          'response',
          'payload',
        ]) ||
        [];

      if (conversations.length > 0) {
        for (const item of conversations) {
          const id = this.extractConversationId(item as Record<string, unknown>);
          const title = this.extractConversationTitle(item as Record<string, unknown>);
          if (id) {
            this.conversationMetas.set(id, title);
          }
        }
      }
    } catch (error) {
      console.error('[YuanbaoAdapter] Failed to handle list response:', error);
    }
  }

  /**
   * 从对象中 pick 第一个匹配的数组
   */
  private pickArray(obj: Record<string, unknown>, candidates: string[]): unknown[] {
    for (const key of candidates) {
      const val = obj?.[key];
      if (Array.isArray(val)) return val;
    }
    return [];
  }

  /**
   * 清理文件名
   */
  private sanitizeFilename(name: string): string {
    return String(name || 'export').replace(/[\/\\?%*:|"<>]/g, '-').trim();
  }
}

// 导出单例实例
export const yuanbaoAdapter = new YuanbaoAdapter();
