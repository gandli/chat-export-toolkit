/**
 * Doubao (豆包) PlatformAdapter 实现
 * 
 * 负责从 Doubao 网页版提取原始对话数据
 * 
 * @see https://doubao.com
 * 
 * 注意：此适配器为骨架实现，待真实数据样本补充
 * 当前基于常见 AI 对话平台的 API 模式进行推测
 */

import { BasePlatformAdapter } from './base';
import type {
  DoubaoConversationDetail,
  DoubaoConversationList,
  DoubaoConversationMeta,
  DoubaoApiEndpoints,
  DoubaoConversationListItem,
  DoubaoDetectionOptions,
  DoubaoPlatformFeatures,
} from './doubao-types';
import type { PlatformType, RawConversation, RawMessage } from '../types';

/**
 * Doubao 常见的域名
 */
const DOUBAO_HOSTNAMES = [
  'doubao.com',
  'www.doubao.com',
  'chat.doubao.com',
  '*.doubao.com',
];

/**
 * Doubao 常见的 API 端点候选列表（用于回退探测）
 * 
 * 注意：以下为推测，需要根据实际网络请求验证
 */
const DETAIL_ENDPOINT_CANDIDATES = [
  '/api/conversation/detail',
  '/api/v1/conversation/detail',
  '/api/v2/conversation/detail',
  '/api/chat/detail',
  '/api/conversation/get',
  '/api/conversation/query',
  '/conversation/detail',
  '/conversation/get',
  '/v1/conversation/detail',
  '/v2/conversation/detail',
];

const LIST_ENDPOINT_CANDIDATES = [
  '/api/conversation/list',
  '/api/v1/conversation/list',
  '/api/v2/conversation/list',
  '/api/chat/list',
  '/api/conversations',
  '/api/conversation/page',
  '/conversation/list',
  '/conversations',
  '/v1/conversation/list',
  '/v2/conversation/list',
];

/**
 * Doubao 平台特征 DOM 选择器（待验证）
 */
const DOUBAO_FEATURE_SELECTORS = [
  '[data-platform="doubao"]',
  '.doubao-chat',
  '.doubao-conversation',
  '#doubao-app',
  '[class*="doubao"]',
];

/**
 * Doubao PlatformAdapter
 * 
 * 主要职责：
 * 1. 检测当前页面是否为 Doubao
 * 2. 通过拦截 API 响应或主动探测获取对话数据
 * 3. 支持多结构兼容（API 响应可能有多种嵌套格式）
 * 
 * 能力级别说明：
 * - L1: 基础导出（从当前页面提取可见内容）
 * - L2: API 探测（主动调用 API 获取数据）
 * - L3: 实时拦截（拦截 XHR/fetch 请求）
 * 
 * 建议优先级：先实现 L1，再逐步完善 L2/L3
 */
export class DoubaoAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType = 'doubao';

  private apiEndpoints: DoubaoApiEndpoints = {
    detail: null,
    list: null,
    send: null,
    discovered: false,
  };

  private capturedConversations = new Map<string, DoubaoConversationDetail>();
  private conversationMetas = new Map<string, DoubaoConversationMeta>();

  /**
   * 检测当前页面是否属于 Doubao 平台
   * 
   * 检测策略：
   * 1. 检查 hostname
   * 2. 检查页面特征 DOM 元素
   * 3. 检查全局对象（如果有）
   */
  detect(options?: DoubaoDetectionOptions): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const opts: DoubaoDetectionOptions = {
      checkHostname: true,
      checkDomFeatures: true,
      hostnames: DOUBAO_HOSTNAMES,
      ...options,
    };

    // 1. 检查 hostname
    if (opts.checkHostname) {
      const hostname = window.location.hostname;
      const matchesHostname = opts.hostnames?.some((pattern) => {
        if (pattern.startsWith('*.')) {
          return hostname.endsWith(pattern.slice(1));
        }
        return hostname === pattern;
      });

      if (matchesHostname) {
        console.log('[DoubaoAdapter] Detected by hostname:', hostname);
        return true;
      }
    }

    // 2. 检查 DOM 特征元素
    if (opts.checkDomFeatures) {
      const features = this.detectPlatformFeatures();
      if (features.hasFeatureElements || features.hasGlobalObject) {
        console.log('[DoubaoAdapter] Detected by platform features:', features);
        return true;
      }
    }

    return false;
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
    console.log('[DoubaoAdapter] getConversation called', { conversationId });

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
      console.warn('[DoubaoAdapter] No conversation ID available');
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
      console.error('[DoubaoAdapter] Failed to fetch conversation:', error);
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
    console.log('[DoubaoAdapter] listConversations called');

    const metas: DoubaoConversationMeta[] = [];

    // 1. 从已捕获的对话中提取元数据
    for (const [id, detail] of this.capturedConversations.entries()) {
      const title = detail.title || detail.sessionTitle || 'Doubao Chat';
      const createTime = this.parseTimestamp(detail.createTime);
      metas.push({ id, title, createTime });
    }

    // 2. 尝试通过 API 获取列表
    try {
      const listData = await this.fetchConversationList();
      if (listData && Array.isArray(listData)) {
        for (const item of listData) {
          const id = this.extractConversationId(item);
          const title = this.extractConversationTitle(item);
          const createTime = this.parseTimestamp(item.createTime);
          if (id && !metas.some((m) => m.id === id)) {
            metas.push({ id, title, createTime });
          }
        }
      }
    } catch (error) {
      console.warn('[DoubaoAdapter] Failed to fetch conversation list:', error);
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
        createTime: meta.createTime,
      },
    }));
  }

  /**
   * 提取消息列表
   * 
   * 将 Doubao 的 turns/messages/convs 数组转换为 RawMessage 数组
   */
  extractMessages(rawConversation: RawConversation): RawMessage[] {
    console.log('[DoubaoAdapter] extractMessages called');

    // 防御性检查：处理 null/undefined 输入
    if (!rawConversation || !rawConversation.data) {
      console.warn('[DoubaoAdapter] Invalid input to extractMessages');
      return [];
    }

    const data = rawConversation.data as DoubaoConversationDetail;
    
    // 尝试多种可能的数据字段
    const turns =
      data.data ||
      data.messages ||
      data.turns ||
      data.convs ||
      [];

    // 按 index 或时间戳排序
    const sortedTurns = [...turns].sort((a, b) => {
      const indexA = a.index ?? 0;
      const indexB = b.index ?? 0;
      if (indexA !== indexB) return indexA - indexB;
      
      const timeA = this.parseTimestamp(a.createTime || a.timestamp) || 0;
      const timeB = this.parseTimestamp(b.createTime || b.timestamp) || 0;
      return timeA - timeB;
    });

    return sortedTurns.map((turn) => ({
      platform: this.platform,
      data: turn,
    }));
  }

  /**
   * 获取平台元数据
   */
  async getMetadata?(): Promise<Record<string, unknown>> {
    const features = this.detectPlatformFeatures();
    return {
      platform: this.platform,
      detected: this.detect(),
      endpointsDiscovered: this.apiEndpoints.discovered,
      capturedCount: this.capturedConversations.size,
      platformFeatures: features,
    };
  }

  // ============================================================================
  // 内部方法：平台特征检测
  // ============================================================================

  /**
   * 检测平台特征
   */
  private detectPlatformFeatures(): DoubaoPlatformFeatures {
    if (typeof document === 'undefined') {
      return {};
    }

    const features: DoubaoPlatformFeatures = {
      hostname: window.location.hostname,
      hasFeatureElements: false,
      featureSelectors: [],
      hasGlobalObject: false,
    };

    // 检查特征 DOM 元素
    for (const selector of DOUBAO_FEATURE_SELECTORS) {
      const element = document.querySelector(selector);
      if (element) {
        features.hasFeatureElements = true;
        features.featureSelectors?.push(selector);
      }
    }

    // 检查全局对象（如果有已知的 Doubao 全局对象）
    // TODO: 需要实际调研 Doubao 页面的全局对象
    const possibleGlobals = ['doubao', 'DoubaoApp', '__DOUBAO__'];
    for (const name of possibleGlobals) {
      if (name in window) {
        features.hasGlobalObject = true;
        features.globalObjectName = name;
        break;
      }
    }

    return features;
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
  async discoverApiEndpoints(): Promise<DoubaoApiEndpoints> {
    if (this.apiEndpoints.discovered) {
      return this.apiEndpoints;
    }

    const endpoints: DoubaoApiEndpoints = {
      detail: null,
      list: null,
      send: null,
      discovered: false,
    };

    // TODO: 实现从已拦截请求中选择端点
    // TODO: 实现从页面 JS 资源中提取端点
    // 目前先使用回退探测

    if (!endpoints.detail) {
      console.log('[DoubaoAdapter] Using fallback probe for detail API');
      endpoints.detail = await this.probeDetailApi();
    }

    if (!endpoints.list) {
      console.log('[DoubaoAdapter] Using fallback probe for list API');
      endpoints.list = await this.probeListApi();
    }

    console.log('[DoubaoAdapter] Discovered API endpoints:', endpoints);
    this.apiEndpoints = { ...endpoints, discovered: true };
    return this.apiEndpoints;
  }

  /**
   * 探测 detail API 端点
   */
  private async probeDetailApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点
    // TODO: 使用实际的网络请求验证端点
    console.warn('[DoubaoAdapter] probeDetailApi not fully implemented');
    return DETAIL_ENDPOINT_CANDIDATES[0];
  }

  /**
   * 探测 list API 端点
   */
  private async probeListApi(): Promise<string | null> {
    // TODO: 实现实际的探测逻辑
    // 目前返回第一个候选端点
    // TODO: 使用实际的网络请求验证端点
    console.warn('[DoubaoAdapter] probeListApi not fully implemented');
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
  ): Promise<DoubaoConversationDetail | null> {
    const endpoints = await this.discoverApiEndpoints();
    if (!endpoints.detail) {
      throw new Error('Detail API endpoint not available');
    }

    // TODO: 实现实际的 fetch 逻辑
    // 需要：
    // 1. 构建请求 URL
    // 2. 添加必要的认证头
    // 3. 处理响应
    // 4. 验证响应结构
    console.warn('[DoubaoAdapter] fetchConversationDetail not fully implemented');
    return null;
  }

  /**
   * 获取对话列表
   */
  private async fetchConversationList(): Promise<DoubaoConversationListItem[] | null> {
    const endpoints = await this.discoverApiEndpoints();
    if (!endpoints.list) {
      throw new Error('List API endpoint not available');
    }

    // TODO: 实现实际的 fetch 逻辑
    // 需要：
    // 1. 构建请求 URL
    // 2. 添加必要的认证头
    // 3. 处理响应
    // 4. 验证响应结构
    console.warn('[DoubaoAdapter] fetchConversationList not fully implemented');
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
        url.searchParams.get('chatId') ||
        url.searchParams.get('session_id') ||
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

    // 尝试多种可能的路径模式
    const patterns = [
      /\/chat\/([^/?#]+)/,
      /\/conversation\/([^/?#]+)/,
      /\/c\/([^/?#]+)/,
      /\/d\/([^/?#]+)/,
      /\/s\/([^/?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = window.location.pathname.match(pattern);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    return '';
  }

  /**
   * 从对话项中提取 ID
   */
  private extractConversationId(item: Record<string, unknown>): string {
    return (
      (item.conversationId as string) ||
      (item.conversation_id as string) ||
      (item.convId as string) ||
      (item.id as string) ||
      (item.sessionId as string) ||
      (item.chatId as string) ||
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
      (item.summary as string) ||
      (item.firstMessage as string) ||
      'Doubao Chat'
    );
  }

  /**
   * 解析时间戳
   */
  private parseTimestamp(timestamp: string | number | undefined): number | undefined {
    if (!timestamp) return undefined;
    if (typeof timestamp === 'number') {
      return timestamp < 1e12 ? timestamp * 1000 : timestamp;
    }
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * 从 DOM 中提取对话元数据
   */
  private extractConversationMetasFromDom(): DoubaoConversationMeta[] {
    if (typeof document === 'undefined') {
      return [];
    }

    const metas: DoubaoConversationMeta[] = [];
    const seen = new Set<string>();

    // 尝试多种可能的对话链接选择器
    const selectors = [
      'a[href*="/chat/"]',
      'a[href*="/conversation/"]',
      'a[href*="/c/"]',
      '[data-conversation-id]',
      '[data-chat-id]',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const a = el as HTMLAnchorElement;
        const href = a.getAttribute('href') || '';
        
        // 尝试从 href 中提取 ID
        const patterns = [
          /\/chat\/([^/?#]+)/,
          /\/conversation\/([^/?#]+)/,
          /\/c\/([^/?#]+)/,
        ];

        let id = '';
        for (const pattern of patterns) {
          const match = href.match(pattern);
          if (match) {
            id = decodeURIComponent(match[1]);
            break;
          }
        }

        // 或者从 data 属性中提取
        if (!id) {
          id = a.getAttribute('data-conversation-id') || 
               a.getAttribute('data-chat-id') || 
               '';
        }

        if (!id || seen.has(id)) continue;

        seen.add(id);
        const text = (a.textContent || '').trim();
        metas.push({
          id,
          title: text || 'Doubao Chat',
        });
      }
    }

    return metas;
  }

  // ============================================================================
  // 内部方法：API 响应拦截（可选，L3 能力）
  // ============================================================================

  /**
   * 安装 API 响应拦截器
   * 
   * TODO: 此方法需要在合适的时机调用（如 userscript 初始化时）
   * 用于拦截 XMLHttpRequest 和 fetch 请求
   * 
   * 这是 L3 能力，建议在 L1/L2 稳定后再实现
   */
  installInterceptors(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // TODO: 实现 XHR 拦截
    // TODO: 实现 fetch 拦截
    console.log('[DoubaoAdapter] installInterceptors not fully implemented');
  }

  /**
   * 处理 Doubao 详情响应
   * 
   * TODO: 需要根据真实 API 响应结构调整
   */
  handleDoubaoResponse(text: string, _url: string): void {
    try {
      const json = JSON.parse(text) as DoubaoConversationDetail;

      // 检查多种可能的响应结构
      let convsData: DoubaoConversationDetail | null = null;
      const jsonObj = json as Record<string, unknown>;
      
      // 直接包含数据
      if (Array.isArray(jsonObj.data) || Array.isArray(jsonObj.messages) || 
          Array.isArray(jsonObj.turns) || Array.isArray(jsonObj.convs)) {
        convsData = json;
      } 
      // 嵌套在 data 中
      else if (Array.isArray((jsonObj.data as Record<string, unknown>)?.data) || 
               Array.isArray((jsonObj.data as Record<string, unknown>)?.messages)) {
        convsData = jsonObj.data as DoubaoConversationDetail;
      } 
      // 嵌套在 result 中
      else if (Array.isArray((jsonObj.result as Record<string, unknown>)?.data) || 
               Array.isArray((jsonObj.result as Record<string, unknown>)?.messages)) {
        convsData = jsonObj.result as DoubaoConversationDetail;
      } 
      // 嵌套在 response 中
      else if (Array.isArray((jsonObj.response as Record<string, unknown>)?.data)) {
        convsData = jsonObj.response as DoubaoConversationDetail;
      }

      if (!convsData) {
        console.warn('[DoubaoAdapter] Could not extract conversation data from response');
        return;
      }

      const idFromUrl = this.extractConversationIdFromUrl();
      const title = (convsData as DoubaoConversationDetail).title || 
                    (convsData as DoubaoConversationDetail).sessionTitle || 
                    json.title || 
                    'Doubao Chat';
      const id = idFromUrl || this.generateConversationId(title);

      this.conversationMetas.set(id, { id, title });
      this.capturedConversations.set(id, convsData);

      console.log('[DoubaoAdapter] Captured conversation:', id);
    } catch (error) {
      console.error('[DoubaoAdapter] Failed to handle response:', error);
    }
  }

  /**
   * 处理 Doubao 列表响应
   */
  handleConversationListResponse(text: string): void {
    try {
      const json = JSON.parse(text) as DoubaoConversationList;

      // 尝试多种可能的数据结构
      const conversations =
        this.pickArray(json, ['conversations', 'data', 'result', 'response', 'payload']) ||
        this.pickArray((json.data as Record<string, unknown>) || {}, [
          'conversations',
          'result',
          'response',
          'payload',
        ]) ||
        [];

      if (conversations.length > 0) {
        for (const item of conversations) {
          const id = this.extractConversationId(item as Record<string, unknown>);
          const title = this.extractConversationTitle(item as Record<string, unknown>);
          if (id) {
            this.conversationMetas.set(id, { id, title });
          }
        }
      }
    } catch (error) {
      console.error('[DoubaoAdapter] Failed to handle list response:', error);
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
   * 生成对话 ID（当无法从响应中获取时）
   */
  private generateConversationId(title: string): string {
    const sanitized = String(title || 'export').replace(/[\/\\?%*:|"<>]/g, '-').trim();
    return `${sanitized}_${Date.now()}`;
  }
}

// 导出单例实例
export const doubaoAdapter = new DoubaoAdapter();
