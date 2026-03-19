/**
 * Chat Export Toolkit V2
 * 统一的消息导出工具包
 * 
 * @version 2.0.0-alpha
 * @author Chat Export Toolkit Team
 * @license MIT
 */

// ============================================================================
// 类型导出
// ============================================================================
export * from './types';

// ============================================================================
// 核心接口导出
// ============================================================================
export * from './core/interfaces';
export { BrowserStore, MemoryStore, createStore } from './core/store';
export { RuntimeBridge, createRuntimeBridge } from './core/runtime';

// ============================================================================
// 平台适配器导出
// ============================================================================
export { BasePlatformAdapter, adapterRegistry, registerAdapter, getAdapter } from './adapters';

// ============================================================================
// 标准化器导出
// ============================================================================
export { BaseNormalizer, normalizerRegistry, registerNormalizer, getNormalizer } from './normalizers';

// ============================================================================
// 导出器导出
// ============================================================================
export { BaseExporter, JSONExporter, exporterRegistry, registerExporter, getExporter } from './exporters';

// ============================================================================
// UI 组件导出
// ============================================================================
export { BaseUI, PlaceholderUI, createPlaceholderUI, ChatExportUI, createUI, injectStyles } from './ui';
export type {
  ToastType,
  ToastOptions,
  ProgressOptions,
  UIState,
  UIEventCallbacks,
  UIConfig,
} from './ui';

// ============================================================================
// 工具函数导出
// ============================================================================
export * from './utils';

// ============================================================================
// 主入口类
// ============================================================================

import type { ExportResult, RuntimeBridgeConfig } from './types';
import type { IPlatformAdapter, IStore, IRuntimeBridge, INormalizer, IExporter } from './core/interfaces';
import type { UIConfig } from './ui';
import { createRuntimeBridge } from './core/runtime';
import { createStore } from './core/store';
import { getAdapter, detectPlatform } from './adapters';
import { getNormalizer } from './normalizers';
import { getExporter } from './exporters';
import { createUI } from './ui';
import { createInterceptor } from './core/interceptor';
import type { Conversation, RawConversation, ExportFormat } from './types';

/**
 * Chat Export Toolkit 主类
 * 提供统一的 API 入口
 */
export class ChatExportToolkit {
  private runtime: IRuntimeBridge | null = null;
  private store: IStore | null = null;
  private adapter: IPlatformAdapter | null = null;
  private normalizer: INormalizer | null = null;
  private exporter: IExporter | null = null;
  private ui: ReturnType<typeof createUI> | null = null;
  private interceptor: ReturnType<typeof createInterceptor> | null = null;
  private isInitialized = false;
  private currentPlatform: string | null = null;

  /**
   * 版本号
   */
  static readonly VERSION = '2.0.0-alpha';

  /**
   * 初始化 Toolkit
   */
  async init(config?: {
    runtime?: RuntimeBridgeConfig;
    platform?: string;
    ui?: UIConfig;
    autoDetect?: boolean;
  }): Promise<void> {
    if (this.isInitialized) {
      console.warn('[ChatExportToolkit] Already initialized');
      return;
    }

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     Chat Export Toolkit V2                            ║');
    console.log('║     Version:', ChatExportToolkit.VERSION.padEnd(34), '║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('[Toolkit] Initializing...');

    try {
      // 1. 初始化运行时桥接
      this.runtime = createRuntimeBridge(config?.runtime);
      await this.runtime.init();
      console.log('[Toolkit] Runtime bridge initialized');

      // 2. 初始化存储
      this.store = createStore();
      console.log('[Toolkit] Store initialized');

      // 3. 检测或设置平台
      if (config?.autoDetect !== false) {
        this.currentPlatform = detectPlatform();
        if (this.currentPlatform) {
          console.log(`[Toolkit] Auto-detected platform: ${this.currentPlatform}`);
        }
      }
      
      if (!this.currentPlatform && config?.platform) {
        this.currentPlatform = config.platform;
      }

      // 4. 初始化平台适配器
      if (this.currentPlatform) {
        this.adapter = getAdapter(this.currentPlatform);
        if (this.adapter) {
          console.log(`[Toolkit] Platform adapter initialized: ${this.currentPlatform}`);
          
          // 初始化标准化器
          this.normalizer = getNormalizer(this.currentPlatform);
          if (this.normalizer) {
            console.log(`[Toolkit] Normalizer initialized: ${this.currentPlatform}`);
          }
        } else {
          console.warn(`[Toolkit] No adapter found for platform: ${this.currentPlatform}`);
        }
      }

      // 5. 初始化默认导出器（JSON）
      this.exporter = getExporter('json');
      if (this.exporter) {
        console.log('[Toolkit] Default exporter initialized: json');
      }

      // 6. 安装 API 拦截器（用于捕获对话数据）
      if (this.currentPlatform === 'yuanbao') {
        this.interceptor = createInterceptor({
          platform: 'yuanbao',
          enableXHR: true,
          enableFetch: true,
          debug: true,
        }, this.store);
        console.log('[Toolkit] API interceptor installed');
      }

      // 7. 初始化 UI
      this.ui = createUI({
        ...config?.ui,
        callbacks: {
          onExportStart: this.handleExportStart.bind(this),
          onExportComplete: this.handleExportComplete.bind(this),
          onExportError: this.handleExportError.bind(this),
        },
      });
      await this.ui.init();
      console.log('[Toolkit] UI initialized');

      this.isInitialized = true;
      console.log('[Toolkit] ✅ Initialization complete');
      console.log('[Toolkit] Environment:', this.runtime.capabilities.environment);
      console.log('[Toolkit] DOM Access:', this.runtime.capabilities.canAccessDOM);
      console.log('[Toolkit] Network:', this.runtime.capabilities.canMakeNetworkRequests);
      console.log('[Toolkit] Storage:', this.runtime.capabilities.canStoreData);
    } catch (error) {
      console.error('[Toolkit] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 处理导出开始
   */
  private async handleExportStart(options: { scope: 'current' | 'all'; format: ExportFormat }): Promise<void> {
    console.log('[Toolkit] Export started:', options);
    
    try {
      if (options.scope === 'current') {
        await this.exportCurrentConversation(options.format);
      } else {
        await this.exportAllConversations(options.format);
      }
    } catch (error) {
      this.handleExportError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 处理导出完成
   */
  private handleExportComplete(result: ExportResult): void {
    console.log('[Toolkit] Export complete:', result);
    this.ui?.exportComplete(result);
  }

  /**
   * 处理导出错误
   */
  private handleExportError(error: Error): void {
    console.error('[Toolkit] Export error:', error);
    this.ui?.exportError(error);
  }

  /**
   * 导出当前对话（最小可运行链路）
   */
  async exportCurrentConversation(format: ExportFormat = 'json'): Promise<ExportResult> {
    if (!this.isInitialized) {
      throw new Error('[Toolkit] Not initialized. Call init() first.');
    }

    console.log('[Toolkit] Exporting current conversation...');

    try {
      // 1. 从缓存中获取对话数据
      let cachedConvs = await this.store?.query<RawConversation>('cache:conversation:*');
      
      if (!cachedConvs || cachedConvs.length === 0) {
        // 如果没有缓存，尝试从当前页面获取
        if (this.adapter) {
          const rawConv = await this.adapter.getConversation();
          if (rawConv) {
            if (!cachedConvs) cachedConvs = [];
            cachedConvs.push(rawConv);
          }
        }
      }

      if (!cachedConvs || cachedConvs.length === 0) {
        // Demo 模式：创建测试数据
        console.log('[Toolkit] No cached data found, using demo data');
        return this.exportDemoData(format);
      }

      // 2. 标准化对话
      const conversations: Conversation[] = [];
      for (const rawConv of cachedConvs) {
        if (this.normalizer) {
          const normalized = await this.normalizer.normalizeConversation(rawConv);
          conversations.push(normalized);
        }
      }

      if (conversations.length === 0) {
        return {
          success: false,
          error: 'No conversations to export',
          stats: { messageCount: 0, conversationCount: 0 },
        };
      }

      // 3. 导出对话
      const exporter = format ? getExporter(format) : this.exporter;
      if (!exporter) {
        return {
          success: false,
          error: `No exporter found for format: ${format}`,
          stats: { messageCount: 0, conversationCount: 0 },
        };
      }

      // 导出第一个对话
      const result = await exporter.exportConversation(conversations[0], {
        format,
        includeMetadata: true,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stats: { messageCount: 0, conversationCount: 0 },
      };
    }
  }

  /**
   * 导出所有对话（支持 ZIP 批量导出）
   * 
   * @param format 导出格式，支持 'json', 'markdown', 'zip'
   * @returns 导出结果
   */
  async exportAllConversations(format: ExportFormat = 'json'): Promise<ExportResult> {
    if (!this.isInitialized) {
      throw new Error('[Toolkit] Not initialized. Call init() first.');
    }

    console.log('[Toolkit] Exporting all conversations...');

    try {
      // 1. 从缓存中获取所有对话数据
      let cachedConvs = await this.store?.query<RawConversation>('cache:conversation:*');
      
      if (!cachedConvs || cachedConvs.length === 0) {
        // 如果没有缓存，尝试从当前页面获取
        if (this.adapter) {
          const rawConv = await this.adapter.getConversation();
          if (rawConv) {
            if (!cachedConvs) cachedConvs = [];
            cachedConvs.push(rawConv);
          }
        }
      }

      if (!cachedConvs || cachedConvs.length === 0) {
        // Demo 模式：创建测试数据
        console.log('[Toolkit] No cached data found, using demo data');
        return this.exportDemoDataAll(format);
      }

      // 2. 标准化对话
      const conversations: Conversation[] = [];
      for (const rawConv of cachedConvs) {
        if (this.normalizer) {
          const normalized = await this.normalizer.normalizeConversation(rawConv);
          conversations.push(normalized);
        }
      }

      if (conversations.length === 0) {
        return {
          success: false,
          error: 'No conversations to export',
          stats: { messageCount: 0, conversationCount: 0 },
        };
      }

      console.log(`[Toolkit] Found ${conversations.length} conversations to export`);

      // 3. 根据格式选择导出方式
      if (format === 'zip') {
        // ZIP 批量导出
        const exporter = getExporter('zip');
        if (!exporter) {
          return {
            success: false,
            error: 'ZIP exporter not found',
            stats: { messageCount: 0, conversationCount: 0 },
          };
        }

        return await exporter.exportAll(conversations, {
          format: 'json', // ZIP 内部使用 JSON 格式
          includeMetadata: true,
        });
      } else {
        // 单个文件导出（JSON/Markdown）- 合并所有对话到一个文件
        const exporter = getExporter(format);
        if (!exporter) {
          return {
            success: false,
            error: `No exporter found for format: ${format}`,
            stats: { messageCount: 0, conversationCount: 0 },
          };
        }

        // 对于非 ZIP 格式，导出所有对话到一个文件
        return await exporter.exportAll(conversations, {
          format,
          includeMetadata: true,
        });
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stats: { messageCount: 0, conversationCount: 0 },
      };
    }
  }

  /**
   * 导出 Demo 数据（用于测试链路）
   */
  private async exportDemoData(format: ExportFormat): Promise<ExportResult> {
    console.log('[Toolkit] Exporting demo data...');

    const demoConversation: Conversation = {
      id: 'demo_conversation_001',
      title: 'Demo Conversation',
      messages: [
        {
          id: 'msg_001',
          role: 'user',
          content: { text: '你好，这是一个测试对话' },
          timestamp: Date.now() - 60000,
          metadata: { platform: 'yuanbao' },
        },
        {
          id: 'msg_002',
          role: 'assistant',
          content: { text: '你好！这是 Chat Export Toolkit V2 的演示数据。\n\n如果你看到这条消息，说明导出链路已经成功运行！' },
          timestamp: Date.now(),
          metadata: { platform: 'yuanbao' },
        },
      ],
      createdAt: Date.now() - 60000,
      updatedAt: Date.now(),
      metadata: {
        platform: 'yuanbao',
        participantCount: 2,
        messageCount: 2,
      },
    };

    const exporter = getExporter(format);
    if (!exporter) {
      return {
        success: false,
        error: `No exporter found for format: ${format}`,
        stats: { messageCount: 0, conversationCount: 0 },
      };
    }

    return await exporter.exportConversation(demoConversation, {
      format,
      includeMetadata: true,
      filename: `demo-export-${format}.${format === 'json' ? 'json' : 'md'}`,
    });
  }

  /**
   * 导出 Demo 数据（批量导出测试）
   */
  private async exportDemoDataAll(format: ExportFormat): Promise<ExportResult> {
    console.log('[Toolkit] Exporting demo data (all conversations)...');

    // 创建多个测试对话
    const demoConversations: Conversation[] = [
      {
        id: 'demo_001',
        title: '测试对话 1',
        messages: [
          {
            id: 'msg_001',
            role: 'user',
            content: { text: '你好，这是第一个测试对话' },
            timestamp: Date.now() - 120000,
            metadata: { platform: 'yuanbao' },
          },
          {
            id: 'msg_002',
            role: 'assistant',
            content: { text: '你好！这是第一个演示对话。' },
            timestamp: Date.now() - 60000,
            metadata: { platform: 'yuanbao' },
          },
        ],
        createdAt: Date.now() - 120000,
        updatedAt: Date.now() - 60000,
        metadata: { platform: 'yuanbao' },
      },
      {
        id: 'demo_002',
        title: '测试对话 2',
        messages: [
          {
            id: 'msg_003',
            role: 'user',
            content: { text: '请问如何学习编程？' },
            timestamp: Date.now() - 60000,
            metadata: { platform: 'yuanbao' },
          },
          {
            id: 'msg_004',
            role: 'assistant',
            content: { text: '学习编程的建议：\n1. 选择一门语言开始\n2. 多做练习\n3. 参与实际项目' },
            timestamp: Date.now(),
            metadata: { platform: 'yuanbao' },
          },
        ],
        createdAt: Date.now() - 60000,
        updatedAt: Date.now(),
        metadata: { platform: 'yuanbao' },
      },
    ];

    // ZIP 格式使用 ZIPExporter
    if (format === 'zip') {
      const exporter = getExporter('zip');
      if (!exporter) {
        return {
          success: false,
          error: 'ZIP exporter not found',
          stats: { messageCount: 0, conversationCount: 0 },
        };
      }

      return await exporter.exportAll(demoConversations, {
        format: 'json',
        includeMetadata: true,
      });
    }

    // 其他格式使用对应的导出器
    const exporter = getExporter(format);
    if (!exporter) {
      return {
        success: false,
        error: `No exporter found for format: ${format}`,
        stats: { messageCount: 0, conversationCount: 0 },
      };
    }

    return await exporter.exportAll(demoConversations, {
      format,
      includeMetadata: true,
    });
  }

  /**
   * 设置平台适配器
   */
  setPlatform(platform: string): void {
    this.adapter = getAdapter(platform);
    if (!this.adapter) {
      throw new Error(`No adapter found for platform: ${platform}`);
    }
    this.normalizer = getNormalizer(platform);
    this.currentPlatform = platform;
    console.log(`[Toolkit] Platform set to: ${platform}`);
  }

  /**
   * 检测当前平台
   */
  detectPlatform(): string | null {
    return detectPlatform();
  }

  /**
   * 获取存储实例
   */
  getStore(): IStore | null {
    return this.store;
  }

  /**
   * 获取运行时实例
   */
  getRuntime(): IRuntimeBridge | null {
    return this.runtime;
  }

  /**
   * 检查是否已初始化
   */
  checkInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 销毁 Toolkit
   */
  destroy(): void {
    console.log('[Toolkit] Destroying...');
    
    if (this.interceptor) {
      this.interceptor.stop();
      this.interceptor = null;
    }
    
    if (this.runtime) {
      this.runtime.dispose();
      this.runtime = null;
    }
    
    if (this.ui) {
      this.ui.destroy();
      this.ui = null;
    }
    
    this.store = null;
    this.adapter = null;
    this.normalizer = null;
    this.exporter = null;
    this.isInitialized = false;
    
    console.log('[Toolkit] Destroyed');
  }
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 创建 Toolkit 实例（单例模式）
 */
let toolkitInstance: ChatExportToolkit | null = null;

export function getToolkit(): ChatExportToolkit {
  if (!toolkitInstance) {
    toolkitInstance = new ChatExportToolkit();
  }
  return toolkitInstance;
}

/**
 * 快速初始化
 */
export async function initToolkit(config?: Parameters<ChatExportToolkit['init']>[0]): Promise<ChatExportToolkit> {
  const toolkit = getToolkit();
  await toolkit.init(config);
  return toolkit;
}

// ============================================================================
// 自动初始化（浏览器环境）
// ============================================================================

if (typeof window !== 'undefined') {
  console.log('[Toolkit] Running in browser environment');
  
  // 暴露到全局（可选）
  (window as any).ChatExportToolkit = ChatExportToolkit;
  (window as any).getToolkit = getToolkit;
  (window as any).initToolkit = initToolkit;
}
