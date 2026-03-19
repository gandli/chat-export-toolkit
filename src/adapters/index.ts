/**
 * Adapters Module Exports
 */

import { YuanbaoAdapter } from './yuanbao';
import { ChatGPTAdapter } from './chatgpt';
import { DoubaoAdapter } from './doubao';
import { KimiAdapter } from './kimi';
import { ClaudeAdapter } from './claude';
import { DeepSeekAdapter } from './deepseek';
import { QwenAdapter } from './qwen';
import type { PlatformType } from '../types';

export { BasePlatformAdapter } from './base';
export { YuanbaoAdapter, yuanbaoAdapter } from './yuanbao';
export { ChatGPTAdapter, chatgptAdapter } from './chatgpt';
export { DoubaoAdapter, doubaoAdapter } from './doubao';
export { KimiAdapter, kimiAdapter } from './kimi';
export { ClaudeAdapter, claudeAdapter } from './claude';
export { DeepSeekAdapter, deepseekAdapter } from './deepseek';
export { QwenAdapter, qwenAdapter } from './qwen';
export type {
  YuanbaoConversationDetail,
  YuanbaoConversationList,
  YuanbaoConversationMeta,
  YuanbaoApiEndpoints,
  YuanbaoTurn,
  YuanbaoSpeech,
  YuanbaoContentBlock,
  YuanbaoMessageBlock,
  YuanbaoTurnNormalized,
  YuanbaoConversationListItem,
} from './yuanbao-types';
export type {
  ChatGPTConversationDetail,
  ChatGPTConversationList,
  ChatGPTConversationMeta,
  ChatGPTApiEndpoints,
  ChatGPTMessage,
  ChatGPTContentPart,
  ChatGPTMessageNode,
  ChatGPTMessageBlock,
  ChatGPTMessageNormalized,
  ChatGPTConversationListItem,
} from './chatgpt-types';
export type {
  DoubaoConversationDetail,
  DoubaoConversationList,
  DoubaoConversationMeta,
  DoubaoApiEndpoints,
  DoubaoTurn,
  DoubaoMessageUnit,
  DoubaoContentBlock,
  DoubaoMessageBlock,
  DoubaoTurnNormalized,
  DoubaoConversationListItem,
  DoubaoDetectionOptions,
  DoubaoPlatformFeatures,
} from './doubao-types';
export type {
  KimiConversationDetail,
  KimiConversationList,
  KimiConversationMeta,
  KimiApiEndpoints,
  KimiMessage,
  KimiContentPart,
  KimiMessageNode,
  KimiMessageBlock,
  KimiMessageNormalized,
  KimiConversationListItem,
  KimiSearchInfo,
  KimiSearchResult,
  KimiFileInfo,
  KimiCapabilityLevel,
} from './kimi-types';
export type {
  ClaudeConversationDetail,
  ClaudeConversationList,
  ClaudeConversationMeta,
  ClaudeApiEndpoints,
  ClaudeMessage,
  ClaudeContentPart,
  ClaudeMessageBlock,
  ClaudeMessageNormalized,
  ClaudeConversationListItem,
  ClaudeAttachment,
  ClaudeCapabilityLevel,
} from './claude-types';
export type {
  DeepSeekConversationDetail,
  DeepSeekConversationList,
  DeepSeekConversationMeta,
  DeepSeekApiEndpoints,
  DeepSeekMessage,
  DeepSeekContentPart,
  DeepSeekMessageNode,
  DeepSeekMessageBlock,
  DeepSeekMessageNormalized,
  DeepSeekConversationListItem,
  DeepSeekCitation,
  DeepSeekAttachment,
  DeepSeekCapabilityLevel,
} from './deepseek-types';
export type {
  QwenConversationDetail,
  QwenConversationList,
  QwenConversationMeta,
  QwenApiEndpoints,
  QwenMessage,
  QwenContentPart,
  QwenMessageNode,
  QwenMessageBlock,
  QwenMessageNormalized,
  QwenConversationListItem,
  QwenPluginInfo,
  QwenFileInfo,
  QwenImageInfo,
  QwenCapabilityLevel,
} from './qwen-types';

/**
 * 适配器注册表
 * 用于动态注册和查找适配器
 */
export const adapterRegistry = new Map<string, new () => any>();

// 注册 Yuanbao 适配器
adapterRegistry.set('yuanbao', YuanbaoAdapter as unknown as new () => any);

// 注册 ChatGPT 适配器
adapterRegistry.set('chatgpt', ChatGPTAdapter as unknown as new () => any);

// 注册 Doubao 适配器
adapterRegistry.set('doubao', DoubaoAdapter as unknown as new () => any);

// 注册 Kimi 适配器
adapterRegistry.set('kimi', KimiAdapter as unknown as new () => any);

// 注册 Claude 适配器
adapterRegistry.set('claude', ClaudeAdapter as unknown as new () => any);

// 注册 DeepSeek 适配器
adapterRegistry.set('deepseek', DeepSeekAdapter as unknown as new () => any);

// 注册 Qwen 适配器
adapterRegistry.set('qwen', QwenAdapter as unknown as new () => any);

/**
 * 注册平台适配器
 * @param platform 平台类型
 * @param adapterClass 适配器类
 */
export function registerAdapter(platform: string, adapterClass: new () => any): void {
  adapterRegistry.set(platform, adapterClass);
  console.log(`[AdapterRegistry] Registered adapter for ${platform}`);
}

/**
 * 获取平台适配器
 * @param platform 平台类型
 */
export function getAdapter(platform: string): any | null {
  const AdapterClass = adapterRegistry.get(platform);
  if (!AdapterClass) {
    console.warn(`[AdapterRegistry] No adapter found for ${platform}`);
    return null;
  }
  return new AdapterClass();
}

/**
 * 检测当前平台
 * 遍历所有已注册的适配器，返回第一个匹配的平台
 */
export function detectPlatform(): PlatformType | null {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const [platform, AdapterClass] of adapterRegistry.entries()) {
    try {
      const adapter = new AdapterClass();
      if (adapter.detect && typeof adapter.detect === 'function') {
        if (adapter.detect()) {
          console.log(`[AdapterRegistry] Detected platform: ${platform}`);
          return platform as PlatformType;
        }
      }
    } catch (error) {
      console.warn(`[AdapterRegistry] Error detecting platform ${platform}:`, error);
    }
  }

  return null;
}
