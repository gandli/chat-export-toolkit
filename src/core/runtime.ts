/**
 * Runtime Bridge 实现
 * 提供跨环境的统一 API
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

import type { IRuntimeBridge } from './interfaces';
import type { RuntimeBridgeConfig, RuntimeCapabilities, RuntimeEnvironment } from '../types';

// GM_xhr 类型声明（userscript 环境）
declare const GM_xmlhttpRequest: any;

/**
 * 运行时桥接实现
 */
export class RuntimeBridge implements IRuntimeBridge {
  private config: { environment: RuntimeEnvironment; capabilities: RuntimeCapabilities };

  constructor(config: RuntimeBridgeConfig = {}) {
    const environment = config.environment || this.detectEnvironment();
    const caps: Partial<RuntimeCapabilities> = config.capabilities || {};
    this.config = {
      environment,
      capabilities: {
        environment,
        canAccessDOM: caps.canAccessDOM ?? (typeof document !== 'undefined'),
        canAccessFileSystem: caps.canAccessFileSystem ?? (typeof process !== 'undefined'),
        canMakeNetworkRequests: caps.canMakeNetworkRequests ?? (typeof fetch !== 'undefined'),
        canStoreData: caps.canStoreData ?? (typeof localStorage !== 'undefined'),
      },
    };
  }

  /**
   * 运行时能力
   */
  get capabilities(): RuntimeCapabilities {
    return this.config.capabilities;
  }

  /**
   * 检测运行时环境
   */
  private detectEnvironment(): RuntimeEnvironment {
    if (typeof window !== 'undefined') {
      // 检查是否在 userscript 环境（Greasemonkey/Tampermonkey）
      // @ts-ignore - GM_info 和 unsafeWindow 在 userscript 环境中存在
      if (typeof GM_info !== 'undefined' || typeof unsafeWindow !== 'undefined') {
        return 'userscript';
      }
      return 'browser';
    }
    if (typeof process !== 'undefined' && process.versions?.node) {
      return 'node';
    }
    return 'browser'; // 默认
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    console.log('[RuntimeBridge] Initializing...', {
      environment: this.config.environment,
      capabilities: this.capabilities,
    });

    // 环境特定的初始化
    switch (this.config.environment) {
      case 'userscript':
        await this.initUserscript();
        break;
      case 'browser':
        await this.initBrowser();
        break;
      case 'node':
        await this.initNode();
        break;
    }

    console.log('[RuntimeBridge] Initialized successfully');
  }

  /**
   * Userscript 环境初始化
   */
  private async initUserscript(): Promise<void> {
    console.log('[RuntimeBridge] Userscript environment detected');
    // TODO: 初始化 GM API
  }

  /**
   * 浏览器环境初始化
   */
  private async initBrowser(): Promise<void> {
    console.log('[RuntimeBridge] Browser environment detected');
    // TODO: 浏览器特定初始化
  }

  /**
   * Node.js 环境初始化
   */
  private async initNode(): Promise<void> {
    console.log('[RuntimeBridge] Node.js environment detected');
    // TODO: Node.js 特定初始化
  }

  /**
   * 发起 HTTP 请求
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    console.log(`[RuntimeBridge] Fetch: ${url}`);
    
    if (this.config.environment === 'node') {
      // Node.js 环境使用原生 fetch（Node 18+）或 http 模块
      return fetch(url, options);
    }
    
    // 浏览器/userscript 环境
    if (typeof GM_xmlhttpRequest !== 'undefined') {
      // Userscript 环境使用 GM API
      return this.gmFetch(url, options);
    }
    
    return fetch(url, options);
  }

  /**
   * GM API fetch 封装
   */
  private gmFetch(url: string, options?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === 'undefined') {
        reject(new Error('GM_xmlhttpRequest not available'));
        return;
      }
      GM_xmlhttpRequest({
        method: options?.method || 'GET',
        url,
        headers: options?.headers as Record<string, string> || {},
        data: options?.body,
        onload: (response: any) => {
          resolve({
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            statusText: response.statusText,
            text: () => Promise.resolve(response.responseText),
            json: () => Promise.resolve(JSON.parse(response.responseText)),
            headers: {
              get: (name: string) => response.responseHeaders?.split('\n').find((h: string) => h.startsWith(name))?.split(': ')[1],
            },
          } as Response);
        },
        onerror: () => reject(new Error(`GM_xhr failed: ${url}`)),
      });
    });
  }

  /**
   * 下载文件
   */
  async downloadFile(url: string, filename: string): Promise<void> {
    console.log(`[RuntimeBridge] Download: ${url} -> ${filename}`);

    if (this.config.environment === 'node') {
      // TODO: Node.js 文件下载实现
      console.warn('[RuntimeBridge] downloadFile not implemented for Node.js yet');
      return;
    }

    // 浏览器环境
    const response = await this.fetch(url);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 读取剪贴板
   */
  async readClipboard?(): Promise<string> {
    if (typeof navigator?.clipboard?.readText === 'function') {
      return navigator.clipboard.readText();
    }
    throw new Error('Clipboard API not available');
  }

  /**
   * 写入剪贴板
   */
  async writeClipboard?(text: string): Promise<void> {
    if (typeof navigator?.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      console.log('[RuntimeBridge] Wrote to clipboard');
    } else {
      throw new Error('Clipboard API not available');
    }
  }

  /**
   * 发送通知
   */
  async notify?(title: string, message: string): Promise<void> {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body: message });
      console.log(`[RuntimeBridge] Notification: ${title}`);
    } else {
      console.log(`[RuntimeBridge] Notification (console): ${title} - ${message}`);
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    console.log('[RuntimeBridge] Disposed');
    // TODO: 清理任何持有的资源
  }
}

/**
 * 创建默认运行时桥接实例
 */
export function createRuntimeBridge(config?: RuntimeBridgeConfig): IRuntimeBridge {
  return new RuntimeBridge(config);
}
