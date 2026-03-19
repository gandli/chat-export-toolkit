/**
 * 核心接口定义
 * 定义系统各模块必须实现的接口
 */

import type {
  Conversation,
  RawConversation,
  Message,
  RawMessage,
  ExportOptions,
  ExportResult,
  PlatformType,
  StoreKey,
  StoreValue,
  StoreQueryOptions,
  RuntimeCapabilities,
} from '../types';

// ============================================================================
// PlatformAdapter 接口
// ============================================================================

/**
 * 平台适配器接口
 * 每个支持的平台必须实现此接口以提取原始数据
 */
export interface IPlatformAdapter {
  /**
   * 平台类型标识
   */
  readonly platform: PlatformType;

  /**
   * 检测当前页面是否属于此平台
   */
  detect(): boolean;

  /**
   * 获取单个对话的原始数据
   * @param conversationId 对话 ID（可选，由平台决定如何获取）
   */
  getConversation(conversationId?: string): Promise<RawConversation | null>;

  /**
   * 获取对话列表的原始数据
   */
  listConversations(): Promise<RawConversation[]>;

  /**
   * 提取消息列表
   * @param rawConversation 原始对话数据
   */
  extractMessages(rawConversation: RawConversation): RawMessage[];

  /**
   * 获取平台元数据
   */
  getMetadata?(): Promise<Record<string, unknown>>;
}

// ============================================================================
// Normalizer 接口
// ============================================================================

/**
 * 标准化器接口
 * 负责将平台特定的数据转换为统一的 Conversation schema
 */
export interface INormalizer {
  /**
   * 支持的平台类型
   */
  readonly platform: PlatformType;

  /**
   * 将原始对话标准化为统一格式
   * @param rawConversation 原始对话数据
   */
  normalizeConversation(rawConversation: RawConversation): Promise<Conversation>;

  /**
   * 将原始消息标准化为统一格式
   * @param rawMessage 原始消息数据
   * @param conversationId 所属对话 ID
   */
  normalizeMessage(rawMessage: RawMessage, conversationId: string): Promise<Message>;

  /**
   * 批量标准化对话列表
   * @param rawConversations 原始对话列表
   */
  normalizeAll(rawConversations: RawConversation[]): Promise<Conversation[]>;
}

// ============================================================================
// Exporter 接口
// ============================================================================

/**
 * 导出器接口
 * 负责将标准化的对话导出为不同格式
 */
export interface IExporter {
  /**
   * 支持的导出格式
   */
  readonly format: string;

  /**
   * 导出单个对话
   * @param conversation 标准化的对话
   * @param options 导出选项
   */
  exportConversation(conversation: Conversation, options: ExportOptions): Promise<ExportResult>;

  /**
   * 批量导出对话
   * @param conversations 标准化对话列表
   * @param options 导出选项
   */
  exportAll(conversations: Conversation[], options: ExportOptions): Promise<ExportResult>;

  /**
   * 生成文件名
   * @param conversation 对话
   * @param extension 文件扩展名
   */
  generateFilename?(conversation: Conversation, extension: string): string;
}

// ============================================================================
// Store 接口
// ============================================================================

/**
 * 存储接口
 * 提供数据持久化能力（支持多种存储后端）
 */
export interface IStore {
  /**
   * 存储数据
   * @param key 存储键
   * @param value 存储值
   */
  set<T extends StoreValue>(key: StoreKey, value: T): Promise<void>;

  /**
   * 读取数据
   * @param key 存储键
   */
  get<T extends StoreValue>(key: StoreKey): Promise<T | null>;

  /**
   * 删除数据
   * @param key 存储键
   */
  delete(key: StoreKey): Promise<void>;

  /**
   * 查询数据
   * @param pattern 键匹配模式（支持通配符）
   * @param options 查询选项
   */
  query<T extends StoreValue>(pattern: string, options?: StoreQueryOptions): Promise<T[]>;

  /**
   * 清空存储
   */
  clear(): Promise<void>;

  /**
   * 检查存储是否可用
   */
  isAvailable(): boolean;
}

// ============================================================================
// RuntimeBridge 接口
// ============================================================================

/**
 * 运行时桥接接口
 * 提供跨环境（browser/node/userscript）的统一 API
 */
export interface IRuntimeBridge {
  /**
   * 运行时环境信息
   */
  readonly capabilities: RuntimeCapabilities;

  /**
   * 初始化运行时桥接
   */
  init(): Promise<void>;

  /**
   * 发起 HTTP 请求
   * @param url 请求 URL
   * @param options 请求选项
   */
  fetch(url: string, options?: RequestInit): Promise<Response>;

  /**
   * 下载文件
   * @param url 文件 URL
   * @param filename 保存文件名
   */
  downloadFile(url: string, filename: string): Promise<void>;

  /**
   * 读取剪贴板
   */
  readClipboard?(): Promise<string>;

  /**
   * 写入剪贴板
   * @param text 文本内容
   */
  writeClipboard?(text: string): Promise<void>;

  /**
   * 发送通知
   * @param title 通知标题
   * @param message 通知内容
   */
  notify?(title: string, message: string): Promise<void>;

  /**
   * 清理资源
   */
  dispose(): void;
}

// ============================================================================
// 工厂接口
// ============================================================================

/**
 * 适配器工厂
 */
export interface AdapterFactory {
  /**
   * 创建平台适配器
   * @param platform 平台类型
   */
  createAdapter(platform: PlatformType): IPlatformAdapter | null;
}

/**
 * 导出器工厂
 */
export interface ExporterFactory {
  /**
   * 创建导出器
   * @param format 导出格式
   */
  createExporter(format: string): IExporter | null;
}
