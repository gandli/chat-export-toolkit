/**
 * 统一 API 请求客户端
 * 提供类型安全的 API 请求封装，与拦截器协同工作
 */

import type { IRuntimeBridge } from './interfaces';
import type { PlatformType } from '../types';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  /** 平台类型 */
  platform: PlatformType;
  /** 基础 URL */
  baseUrl?: string;
  /** 默认请求头 */
  defaultHeaders?: Record<string, string>;
  /** 请求超时时间（ms） */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟（ms） */
  retryDelay?: number;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * API 请求选项
 */
export interface ApiRequestOptions extends RequestInit {
  /** 请求超时（ms） */
  timeout?: number;
  /** 是否使用拦截器缓存 */
  useCache?: boolean;
  /** 缓存键 */
  cacheKey?: string;
}

/**
 * API 响应
 */
export interface ApiResponse<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** HTTP 状态码 */
  status?: number;
  /** 响应头 */
  headers?: Record<string, string>;
  /** 是否来自缓存 */
  fromCache?: boolean;
}

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  /** 数据 */
  data: T;
  /** 创建时间 */
  timestamp: number;
  /** 过期时间 */
  expiresAt?: number;
}

// ============================================================================
// 工具函数
// ============================================================================

function log(message: string, data?: unknown, debug = false): void {
  if (debug) {
    console.log(`[ApiClient] ${message}`, data);
  }
}

function logError(message: string, error?: unknown): void {
  console.error(`[ApiClient] ${message}`, error || '');
}

/**
 * 带超时的 Promise
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * 延迟
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// API 客户端类
// ============================================================================

/**
 * 统一 API 请求客户端
 * 提供类型安全的请求封装，支持缓存、重试、超时等特性
 */
export class ApiClient {
  private config: Required<ApiClientConfig>;
  private runtime: IRuntimeBridge | null;
  private cache = new Map<string, CacheEntry<unknown>>();
  private abortControllers = new Map<string, AbortController>();

  constructor(config: ApiClientConfig, runtime?: IRuntimeBridge | null) {
    this.runtime = runtime ?? null;
    this.config = {
      platform: config.platform,
      baseUrl: config.baseUrl || '',
      defaultHeaders: config.defaultHeaders || {},
      timeout: config.timeout || 30000,
      retryCount: config.retryCount ?? 3,
      retryDelay: config.retryDelay || 1000,
      debug: config.debug ?? false,
    };
  }

  /**
   * 获取平台类型
   */
  get platform(): PlatformType {
    return this.config.platform;
  }

  /**
   * 发起 GET 请求
   */
  async get<T = unknown>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * 发起 POST 请求
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * 发起 PUT 请求
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * 发起 DELETE 请求
   */
  async delete<T = unknown>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * 通用请求方法
   */
  async request<T = unknown>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.config.timeout,
      useCache = false,
      cacheKey,
      ...fetchOptions
    } = options;

    const fullUrl = this.buildUrl(url);
    const requestId = cacheKey || `${fetchOptions.method || 'GET'}:${fullUrl}`;

    log(`Request: ${fetchOptions.method || 'GET'} ${fullUrl}`, undefined, this.config.debug);

    // 检查缓存
    if (useCache && cacheKey) {
      const cached = this.getCached<T>(cacheKey);
      if (cached) {
        log(`Cache hit: ${cacheKey}`, undefined, this.config.debug);
        return {
          success: true,
          data: cached,
          fromCache: true,
        };
      }
    }

    // 合并请求头
    const headers = this.mergeHeaders(fetchOptions.headers);

    // 创建 AbortController
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    try {
      const fetchOptionsWithTimeout: RequestInit = {
        ...fetchOptions,
        headers,
        signal: abortController.signal,
      };

      // 发起请求（带超时）
      const response = await withTimeout(
        this.doFetch(fullUrl, fetchOptionsWithTimeout),
        timeout,
        `Request timeout after ${timeout}ms`
      );

      // 解析响应
      const responseData = await this.parseResponse<T>(response);

      // 检查响应状态
      if (!response.ok) {
        const errorData = responseData as Record<string, unknown> | null;
        return {
          success: false,
          error: (errorData?.error as string) || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      // 缓存响应
      if (useCache && cacheKey) {
        this.setCache(cacheKey, responseData);
      }

      return {
        success: true,
        data: responseData,
        status: response.status,
        headers: this.extractHeaders(response.headers),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Request failed: ${fullUrl}`, error);

      // 检查是否需要重试
      const shouldRetry = this.shouldRetry(error);
      if (shouldRetry && fetchOptions.method !== 'POST') {
        return this.retryRequest<T>(url, options, 0);
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 执行 Fetch 请求
   */
  private async doFetch(url: string, options: RequestInit): Promise<Response> {
    if (this.runtime?.fetch) {
      return this.runtime.fetch(url, options);
    }
    return fetch(url, options);
  }

  /**
   * 解析响应
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  /**
   * 提取响应头
   */
  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 构建完整 URL
   */
  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (this.config.baseUrl && !url.startsWith('/')) {
      return `${this.config.baseUrl}/${url}`;
    }
    if (this.config.baseUrl) {
      return `${this.config.baseUrl}${url}`;
    }
    return url;
  }

  /**
   * 合并请求头
   */
  private mergeHeaders(customHeaders?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = { ...this.config.defaultHeaders };

    if (customHeaders) {
      if (customHeaders instanceof Headers) {
        customHeaders.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(customHeaders)) {
        for (const [key, value] of customHeaders) {
          headers[key] = value;
        }
      } else {
        Object.assign(headers, customHeaders);
      }
    }

    return headers;
  }

  /**
   * 重试请求
   */
  private async retryRequest<T>(
    url: string,
    options: ApiRequestOptions,
    attempt: number
  ): Promise<ApiResponse<T>> {
    if (attempt >= this.config.retryCount) {
      return {
        success: false,
        error: `Max retry attempts (${this.config.retryCount}) reached`,
      };
    }

    const delayMs = this.config.retryDelay * Math.pow(2, attempt);
    log(`Retrying request (attempt ${attempt + 1}/${this.config.retryCount})`, undefined, this.config.debug);
    await delay(delayMs);

    return this.request<T>(url, options);
  }

  /**
   * 检查是否应该重试
   */
  private shouldRetry(error: unknown): boolean {
    // 网络错误可以重试
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // 超时错误可以重试
    if (error instanceof Error && error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  // ============================================================================
  // 缓存管理
  // ============================================================================

  /**
   * 设置缓存
   */
  setCache<T>(key: string, data: T, ttlMs?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    };
    this.cache.set(key, entry);
    log(`Cache set: ${key}`, undefined, this.config.debug);
  }

  /**
   * 获取缓存
   */
  getCached<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 清除缓存
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      log(`Cache cleared: ${key}`, undefined, this.config.debug);
    } else {
      this.cache.clear();
      log('Cache cleared all', undefined, this.config.debug);
    }
  }

  /**
   * 取消请求
   */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
      log(`Request cancelled: ${requestId}`, undefined, this.config.debug);
    }
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
    log('All requests cancelled', undefined, this.config.debug);
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    this.cancelAllRequests();
    this.cache.clear();
    log('ApiClient destroyed', undefined, this.config.debug);
  }
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 创建 API 客户端
 */
export function createApiClient(
  config: ApiClientConfig,
  runtime?: IRuntimeBridge | null
): ApiClient {
  return new ApiClient(config, runtime);
}

/**
 * 发起单次 GET 请求
 */
export async function fetchJson<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    logError('fetchJson failed', error);
    return null;
  }
}
