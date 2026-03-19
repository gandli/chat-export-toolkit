/**
 * XHR/Fetch 拦截器
 * 拦截聊天平台的 API 请求，捕获对话数据
 */

import type { IStore } from './interfaces';
import type { RawConversation, RawMessage, PlatformType, StoreKey } from '../types';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 拦截器配置
 */
export interface InterceptorConfig {
  /** 平台类型 */
  platform: PlatformType;
  /** API 端点匹配模式（支持正则或字符串） */
  endpointPatterns?: Array<string | RegExp>;
  /** 是否启用 XHR 拦截 */
  enableXHR?: boolean;
  /** 是否启用 Fetch 拦截 */
  enableFetch?: boolean;
  /** 请求超时时间（ms） */
  timeout?: number;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 拦截到的请求数据
 */
export interface InterceptedRequest {
  /** 请求 URL */
  url: string;
  /** 请求方法 */
  method: string;
  /** 请求头 */
  headers: Record<string, string>;
  /** 请求体 */
  body?: unknown;
  /** 响应数据 */
  response?: unknown;
  /** 时间戳 */
  timestamp: number;
}

/**
 * API 端点信息
 */
export interface ApiEndpoint {
  /** 端点 URL */
  url: string;
  /** 端点类型 */
  type: 'conversation' | 'message' | 'list' | 'unknown';
  /** 最后访问时间 */
  lastAccessed: number;
  /** 访问次数 */
  accessCount: number;
}

/**
 * 拦截器状态
 */
export interface InterceptorState {
  /** 是否已启动 */
  isRunning: boolean;
  /** 捕获的请求数量 */
  capturedCount: number;
  /** 捕获的对话数量 */
  conversationCount: number;
  /** 最后捕获时间 */
  lastCapturedAt?: number;
  /** 已发现的 API 端点 */
  endpoints: Map<string, ApiEndpoint>;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 日志工具
 */
function log(message: string, data?: unknown, debug = false): void {
  if (debug || !debug) {
    // 始终输出错误和重要信息
    if (data !== undefined) {
      console.log(`[Interceptor] ${message}`, data);
    } else {
      console.log(`[Interceptor] ${message}`);
    }
  }
}

function logError(message: string, error?: unknown): void {
  console.error(`[Interceptor] ${message}`, error || '');
}

/**
 * 检查 URL 是否匹配模式
 */
function urlMatchesPattern(url: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }
  return url.includes(pattern);
}

/**
 * 从响应中提取对话数据（支持多种结构）
 */
function extractConversationData(response: unknown): RawConversation | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const obj = response as Record<string, unknown>;

  // 模式 1: 直接是对话对象
  if (obj.id && (obj.messages || obj.conversation)) {
    return {
      platform: 'custom',
      data: response,
    };
  }

  // 模式 2: { data: conversation }
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (data.id || data.messages) {
      return {
        platform: 'custom',
        data: response,
      };
    }
  }

  // 模式 3: { conversation: {...} }
  if (obj.conversation && typeof obj.conversation === 'object') {
    return {
      platform: 'custom',
      data: response,
    };
  }

  // 模式 4: { result: {...} }
  if (obj.result && typeof obj.result === 'object') {
    const result = obj.result as Record<string, unknown>;
    if (result.id || result.messages) {
      return {
        platform: 'custom',
        data: response,
      };
    }
  }

  // 模式 5: 数组（对话列表）
  if (Array.isArray(obj)) {
    return {
      platform: 'custom',
      data: response,
    };
  }

  // 模式 6: 检查常见字段
  const commonFields = ['conversation_id', 'chat_id', 'thread_id', 'messages', 'history'];
  for (const field of commonFields) {
    if (field in obj) {
      return {
        platform: 'custom',
        data: response,
      };
    }
  }

  return null;
}

/**
 * 从响应中提取消息列表（支持多种结构）
 */
function extractMessagesData(response: unknown): RawMessage[] {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const obj = response as Record<string, unknown>;
  const messages: RawMessage[] = [];

  // 模式 1: { messages: [...] }
  if (Array.isArray(obj.messages)) {
    for (const msg of obj.messages) {
      messages.push({
        platform: 'custom',
        data: msg,
      });
    }
    return messages;
  }

  // 模式 2: { data: { messages: [...] } }
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (Array.isArray(data.messages)) {
      for (const msg of data.messages) {
        messages.push({
          platform: 'custom',
          data: msg,
        });
      }
      return messages;
    }
  }

  // 模式 3: 直接是消息数组
  if (Array.isArray(obj)) {
    for (const msg of obj) {
      messages.push({
        platform: 'custom',
        data: msg,
      });
    }
    return messages;
  }

  // 模式 4: { result: { messages: [...] } }
  if (obj.result && typeof obj.result === 'object') {
    const result = obj.result as Record<string, unknown>;
    if (Array.isArray(result.messages)) {
      for (const msg of result.messages) {
        messages.push({
          platform: 'custom',
          data: msg,
        });
      }
      return messages;
    }
  }

  return messages;
}

// ============================================================================
// XHR 拦截器
// ============================================================================

/**
 * XHR 拦截器实现
 */
class XHRInterceptor {
  private originalOpen: typeof XMLHttpRequest.prototype.open;
  private originalSend: typeof XMLHttpRequest.prototype.send;
  private config: InterceptorConfig;
  private store: IStore | null;
  private onCapture?: (request: InterceptedRequest) => void;

  constructor(
    config: InterceptorConfig,
    store: IStore | null = null,
    onCapture?: (request: InterceptedRequest) => void
  ) {
    this.config = config;
    this.store = store;
    this.onCapture = onCapture;
    this.originalOpen = XMLHttpRequest.prototype.open;
    this.originalSend = XMLHttpRequest.prototype.send;
  }

  /**
   * 启动拦截
   */
  start(): void {
    if (typeof XMLHttpRequest === 'undefined') {
      logError('XHR not available in this environment');
      return;
    }

    log('Starting XHR interceptor', this.config, this.config.debug);

    const self = this;

    // 拦截 open 方法
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ): void {
      // 存储请求信息到 XHR 实例
      (this as any)._interceptedMethod = method;
      (this as any)._interceptedUrl = url;
      (this as any)._interceptedTimestamp = Date.now();

      // 调用原始方法
      self.originalOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };

    // 拦截 send 方法
    XMLHttpRequest.prototype.send = function (
      this: XMLHttpRequest,
      body?: Document | XMLHttpRequestBodyInit | null
    ): void {
      const xhr = this;
      const url = (xhr as any)._interceptedUrl as string;
      const method = (xhr as any)._interceptedMethod as string;
      const timestamp = (xhr as any)._interceptedTimestamp as number;

      // 检查是否匹配目标端点
      const shouldIntercept = self.shouldInterceptUrl(url);

      if (shouldIntercept) {
        log(`XHR request intercepted: ${method} ${url}`, undefined, self.config.debug);

        // 解析请求体
        let parsedBody: unknown;
        if (body && typeof body === 'string') {
          try {
            parsedBody = JSON.parse(body);
          } catch {
            parsedBody = body;
          }
        }

        // 存储请求头
        const headers: Record<string, string> = {};

        // 监听响应
        const originalOnReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function (this: XMLHttpRequest) {
          // 调用原始回调
          if (originalOnReadyStateChange) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            (originalOnReadyStateChange as any).call(this);
          }

          // 在响应完成时处理
          if (xhr.readyState === 4) {
            const response = self.parseResponse(xhr);

            const interceptedRequest: InterceptedRequest = {
              url,
              method,
              headers,
              body: parsedBody,
              response,
              timestamp,
            };

            // 调用捕获回调
            if (self.onCapture) {
              self.onCapture(interceptedRequest);
            }

            // 存储到 Store
            if (self.store && response) {
              self.storeCapture(interceptedRequest);
            }
          }
        };
      }

      // 调用原始方法
      self.originalSend.call(xhr, body);
    };

    log('XHR interceptor started');
  }

  /**
   * 停止拦截
   */
  stop(): void {
    XMLHttpRequest.prototype.open = this.originalOpen;
    XMLHttpRequest.prototype.send = this.originalSend;
    log('XHR interceptor stopped');
  }

  /**
   * 解析 XHR 响应
   */
  private parseResponse(xhr: XMLHttpRequest): unknown {
    try {
      const contentType = xhr.getResponseHeader('Content-Type') || '';
      const responseText = xhr.responseText;

      if (!responseText) {
        return null;
      }

      // 尝试解析 JSON
      if (contentType.includes('application/json')) {
        try {
          return JSON.parse(responseText);
        } catch {
          return responseText;
        }
      }

      // 尝试作为 JSON 解析（即使 Content-Type 不是 JSON）
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } catch (error) {
      logError('Failed to parse XHR response', error);
      return null;
    }
  }

  /**
   * 检查 URL 是否应该被拦截
   */
  private shouldInterceptUrl(url: string): boolean {
    const patterns = this.config.endpointPatterns;
    if (!patterns || patterns.length === 0) {
      // 没有配置模式时，拦截所有请求
      return true;
    }

    for (const pattern of patterns) {
      if (urlMatchesPattern(url, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 存储捕获的数据
   */
  private async storeCapture(request: InterceptedRequest): Promise<void> {
    if (!this.store) return;

    try {
      const conversationData = extractConversationData(request.response);
      if (conversationData) {
        const key = `cache:conversation:${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as StoreKey;
        await this.store.set(key, conversationData);
        log(`Stored conversation: ${key}`, undefined, this.config.debug);
      }

      const messagesData = extractMessagesData(request.response);
      if (messagesData.length > 0) {
        const key = `cache:messages:${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as StoreKey;
        await this.store.set(key, messagesData);
        log(`Stored ${messagesData.length} messages: ${key}`, undefined, this.config.debug);
      }
    } catch (error) {
      logError('Failed to store captured data', error);
    }
  }
}

// ============================================================================
// Fetch 拦截器
// ============================================================================

/**
 * Fetch 拦截器实现
 */
class FetchInterceptor {
  private originalFetch: typeof fetch;
  private config: InterceptorConfig;
  private store: IStore | null;
  private onCapture?: (request: InterceptedRequest) => void;

  constructor(
    config: InterceptorConfig,
    store: IStore | null = null,
    onCapture?: (request: InterceptedRequest) => void
  ) {
    this.config = config;
    this.store = store;
    this.onCapture = onCapture;
    this.originalFetch = fetch;
  }

  /**
   * 启动拦截
   */
  start(): void {
    if (typeof fetch === 'undefined') {
      logError('Fetch not available in this environment');
      return;
    }

    log('Starting Fetch interceptor', this.config, this.config.debug);

    // 拦截全局 fetch
    (window as any).fetch = this.interceptFetch.bind(this);

    log('Fetch interceptor started');
  }

  /**
   * 停止拦截
   */
  stop(): void {
    (window as any).fetch = this.originalFetch;
    log('Fetch interceptor stopped');
  }

  /**
   * 拦截 fetch 请求
   */
  private async interceptFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || 'GET';
    const timestamp = Date.now();

    // 检查是否匹配目标端点
    const shouldIntercept = this.shouldInterceptUrl(url);

    if (!shouldIntercept) {
      return this.originalFetch(input, init);
    }

    log(`Fetch request intercepted: ${method} ${url}`, undefined, this.config.debug);

    // 解析请求体
    let parsedBody: unknown;
    if (init?.body) {
      if (typeof init.body === 'string') {
        try {
          parsedBody = JSON.parse(init.body);
        } catch {
          parsedBody = init.body;
        }
      } else if (init.body instanceof FormData) {
        parsedBody = Object.fromEntries(init.body.entries());
      }
    }

    // 提取请求头
    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        for (const [key, value] of init.headers) {
          headers[key] = value;
        }
      } else {
        Object.assign(headers, init.headers);
      }
    }

    // 发起原始请求
    try {
      const response = await this.originalFetch(input, init);

      // 克隆响应以便读取
      const clonedResponse = response.clone();

      // 异步处理响应（不阻塞原始请求）
      this.processResponse(clonedResponse, {
        url,
        method,
        headers,
        body: parsedBody,
        timestamp,
      });

      return response;
    } catch (error) {
      logError('Fetch request failed', error);
      throw error;
    }
  }

  /**
   * 处理响应
   */
  private async processResponse(
    response: Response,
    request: Omit<InterceptedRequest, 'response'>
  ): Promise<void> {
    try {
      const contentType = response.headers.get('Content-Type') || '';
      let responseData: unknown;

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // 尝试作为文本读取
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      }

      const interceptedRequest: InterceptedRequest = {
        ...request,
        response: responseData,
      };

      // 调用捕获回调
      if (this.onCapture) {
        this.onCapture(interceptedRequest);
      }

      // 存储到 Store
      if (this.store && responseData) {
        await this.storeCapture(interceptedRequest);
      }
    } catch (error) {
      logError('Failed to process fetch response', error);
    }
  }

  /**
   * 检查 URL 是否应该被拦截
   */
  private shouldInterceptUrl(url: string): boolean {
    const patterns = this.config.endpointPatterns;
    if (!patterns || patterns.length === 0) {
      return true;
    }

    for (const pattern of patterns) {
      if (urlMatchesPattern(url, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 存储捕获的数据
   */
  private async storeCapture(request: InterceptedRequest): Promise<void> {
    if (!this.store) return;

    try {
      const conversationData = extractConversationData(request.response);
      if (conversationData) {
        const key = `cache:conversation:${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as StoreKey;
        await this.store.set(key, conversationData);
        log(`Stored conversation: ${key}`, undefined, this.config.debug);
      }

      const messagesData = extractMessagesData(request.response);
      if (messagesData.length > 0) {
        const key = `cache:messages:${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as StoreKey;
        await this.store.set(key, messagesData);
        log(`Stored ${messagesData.length} messages: ${key}`, undefined, this.config.debug);
      }
    } catch (error) {
      logError('Failed to store captured data', error);
    }
  }
}

// ============================================================================
// API 端点探测
// ============================================================================

/**
 * API 端点探测器
 * 动态发现和记录 API 端点
 */
export class ApiEndpointDiscoverer {
  private endpoints: Map<string, ApiEndpoint> = new Map();
  private config: InterceptorConfig;

  constructor(config: InterceptorConfig) {
    this.config = config;
  }

  /**
   * 记录请求
   */
  recordRequest(url: string, response?: unknown): void {
    const existing = this.endpoints.get(url);
    
    if (existing) {
      existing.lastAccessed = Date.now();
      existing.accessCount++;
    } else {
      const type = this.classifyEndpoint(url, response);
      this.endpoints.set(url, {
        url,
        type,
        lastAccessed: Date.now(),
        accessCount: 1,
      });
    }

    log(`Endpoint recorded: ${url} (${this.endpoints.get(url)?.type})`, undefined, this.config.debug);
  }

  /**
   * 分类端点类型
   */
  private classifyEndpoint(url: string, response?: unknown): ApiEndpoint['type'] {
    const urlLower = url.toLowerCase();

    // 对话列表端点
    if (urlLower.includes('/conversations') || urlLower.includes('/chat/list')) {
      return 'list';
    }

    // 单个对话端点
    if (urlLower.includes('/conversation/') || urlLower.includes('/chat/')) {
      return 'conversation';
    }

    // 消息端点
    if (urlLower.includes('/messages') || urlLower.includes('/message/')) {
      return 'message';
    }

    // 从响应内容判断
    if (response) {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj)) {
        return 'list';
      }
      if (obj.messages || obj.conversation) {
        return 'conversation';
      }
    }

    return 'unknown';
  }

  /**
   * 获取所有发现的端点
   */
  getEndpoints(): ApiEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * 获取端点匹配模式
   */
  getPatterns(): string[] {
    return Array.from(this.endpoints.keys());
  }

  /**
   * 清除旧端点
   */
  clearOldEndpoints(maxAge: number = 3600000): void {
    const now = Date.now();
    for (const [url, endpoint] of this.endpoints.entries()) {
      if (now - endpoint.lastAccessed > maxAge) {
        this.endpoints.delete(url);
      }
    }
  }

  /**
   * 导出端点配置
   */
  exportConfig(): InterceptorConfig {
    return {
      ...this.config,
      endpointPatterns: this.getPatterns(),
    };
  }
}

// ============================================================================
// 主拦截器类
// ============================================================================

/**
 * 拦截器状态管理
 */
class InterceptorStateManager {
  private state: InterceptorState;

  constructor() {
    this.state = {
      isRunning: false,
      capturedCount: 0,
      conversationCount: 0,
      endpoints: new Map(),
    };
  }

  /**
   * 更新状态
   */
  update(updates: Partial<InterceptorState>): void {
    Object.assign(this.state, updates);
  }

  /**
   * 记录捕获
   */
  recordCapture(isConversation: boolean): void {
    this.state.capturedCount++;
    if (isConversation) {
      this.state.conversationCount++;
    }
    this.state.lastCapturedAt = Date.now();
  }

  /**
   * 获取状态
   */
  getState(): InterceptorState {
    return { ...this.state };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      isRunning: false,
      capturedCount: 0,
      conversationCount: 0,
      endpoints: new Map(),
    };
  }
}

/**
 * 拦截器主类
 * 统一管理 XHR 和 Fetch 拦截
 */
export class RequestInterceptor {
  private config: InterceptorConfig;
  private store: IStore | null;
  private xhrInterceptor: XHRInterceptor | null = null;
  private fetchInterceptor: FetchInterceptor | null = null;
  private discoverer: ApiEndpointDiscoverer;
  private stateManager: InterceptorStateManager;
  private onCaptureCallbacks: Array<(request: InterceptedRequest) => void> = [];

  constructor(config: InterceptorConfig, store: IStore | null = null) {
    this.config = {
      platform: config.platform,
      endpointPatterns: config.endpointPatterns || [],
      enableXHR: config.enableXHR ?? true,
      enableFetch: config.enableFetch ?? true,
      timeout: config.timeout || 30000,
      debug: config.debug ?? false,
    };
    this.store = store;
    this.discoverer = new ApiEndpointDiscoverer(this.config);
    this.stateManager = new InterceptorStateManager();
  }

  /**
   * 启动拦截
   */
  start(): void {
    if (this.stateManager.getState().isRunning) {
      log('Interceptor already running');
      return;
    }

    log('Starting Request Interceptor', this.config, this.config.debug);

    const onCapture = this.handleCapture.bind(this);

    // 启动 XHR 拦截
    if (this.config.enableXHR && typeof XMLHttpRequest !== 'undefined') {
      this.xhrInterceptor = new XHRInterceptor(this.config, this.store, onCapture);
      this.xhrInterceptor.start();
    }

    // 启动 Fetch 拦截
    if (this.config.enableFetch && typeof fetch !== 'undefined') {
      this.fetchInterceptor = new FetchInterceptor(this.config, this.store, onCapture);
      this.fetchInterceptor.start();
    }

    this.stateManager.update({ isRunning: true });
    log('Request Interceptor started successfully');
  }

  /**
   * 停止拦截
   */
  stop(): void {
    log('Stopping Request Interceptor');

    if (this.xhrInterceptor) {
      this.xhrInterceptor.stop();
      this.xhrInterceptor = null;
    }

    if (this.fetchInterceptor) {
      this.fetchInterceptor.stop();
      this.fetchInterceptor = null;
    }

    this.stateManager.update({ isRunning: false });
    log('Request Interceptor stopped');
  }

  /**
   * 处理捕获的请求
   */
  private handleCapture(request: InterceptedRequest): void {
    this.stateManager.recordCapture(false);

    // 记录端点
    this.discoverer.recordRequest(request.url, request.response);

    // 检查是否包含对话数据
    const conversationData = extractConversationData(request.response);
    if (conversationData) {
      this.stateManager.recordCapture(true);
      log(`Captured conversation data from ${request.url}`, undefined, this.config.debug);
    }

    // 检查是否包含消息数据
    const messagesData = extractMessagesData(request.response);
    if (messagesData.length > 0) {
      log(`Captured ${messagesData.length} messages from ${request.url}`, undefined, this.config.debug);
    }

    // 通知所有回调
    for (const callback of this.onCaptureCallbacks) {
      try {
        callback(request);
      } catch (error) {
        logError('Error in capture callback', error);
      }
    }
  }

  /**
   * 注册捕获回调
   */
  onCapture(callback: (request: InterceptedRequest) => void): void {
    this.onCaptureCallbacks.push(callback);
  }

  /**
   * 移除捕获回调
   */
  offCapture(callback: (request: InterceptedRequest) => void): void {
    const index = this.onCaptureCallbacks.indexOf(callback);
    if (index > -1) {
      this.onCaptureCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取拦截器状态
   */
  getState(): InterceptorState {
    const state = this.stateManager.getState();
    state.endpoints = this.discoverer.getEndpoints().reduce((map, ep) => {
      map.set(ep.url, ep);
      return map;
    }, new Map<string, ApiEndpoint>());
    return state;
  }

  /**
   * 获取发现的 API 端点
   */
  getDiscoveredEndpoints(): ApiEndpoint[] {
    return this.discoverer.getEndpoints();
  }

  /**
   * 获取端点匹配模式
   */
  getEndpointPatterns(): string[] {
    return this.discoverer.getPatterns();
  }

  /**
   * 清除旧端点
   */
  clearOldEndpoints(maxAge?: number): void {
    this.discoverer.clearOldEndpoints(maxAge);
  }

  /**
   * 导出配置
   */
  exportConfig(): InterceptorConfig {
    return this.discoverer.exportConfig();
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.stateManager.reset();
    this.discoverer = new ApiEndpointDiscoverer(this.config);
  }
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 创建并启动拦截器
 */
export function createInterceptor(
  config: InterceptorConfig,
  store?: IStore
): RequestInterceptor {
  const interceptor = new RequestInterceptor(config, store);
  interceptor.start();
  return interceptor;
}

/**
 * 提取对话数据（工具函数）
 */
export function extractConversation(response: unknown): RawConversation | null {
  return extractConversationData(response);
}

/**
 * 提取消息数据（工具函数）
 */
export function extractMessages(response: unknown): RawMessage[] {
  return extractMessagesData(response);
}
