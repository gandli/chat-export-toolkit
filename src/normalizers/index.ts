/**
 * Normalizers Module Exports
 */

import { YuanbaoNormalizer } from './yuanbao';
import { ChatGPTRNormalizer } from './chatgpt';
import { DoubaoNormalizer } from './doubao';
import { KimiNormalizer } from './kimi';
import { ClaudeNormalizer } from './claude';
import { DeepSeekNormalizer } from './deepseek';
import { QwenNormalizer } from './qwen';
import type { INormalizer } from '../core';

export { BaseNormalizer } from './base';
export { YuanbaoNormalizer, yuanbaoNormalizer, yuanbaoToMarkdown } from './yuanbao';
export { ChatGPTRNormalizer, chatgptNormalizer, chatgptToMarkdown } from './chatgpt';
export { DoubaoNormalizer, doubaoNormalizer, doubaoToMarkdown } from './doubao';
export { KimiNormalizer, kimiNormalizer, kimiToMarkdown } from './kimi';
export { ClaudeNormalizer, claudeNormalizer, claudeToMarkdown } from './claude';
export { DeepSeekNormalizer, deepseekNormalizer, deepseekToMarkdown } from './deepseek';
export { QwenNormalizer, qwenNormalizer, qwenToMarkdown } from './qwen';

/**
 * 标准化器注册表
 */
export const normalizerRegistry = new Map<string, new () => INormalizer>();

// 注册 Yuanbao 标准化器
normalizerRegistry.set('yuanbao', YuanbaoNormalizer as unknown as new () => INormalizer);

// 注册 ChatGPT 标准化器
normalizerRegistry.set('chatgpt', ChatGPTRNormalizer as unknown as new () => INormalizer);

// 注册 Doubao 标准化器
normalizerRegistry.set('doubao', DoubaoNormalizer as unknown as new () => INormalizer);

// 注册 Kimi 标准化器
normalizerRegistry.set('kimi', KimiNormalizer as unknown as new () => INormalizer);

// 注册 Claude 标准化器
normalizerRegistry.set('claude', ClaudeNormalizer as unknown as new () => INormalizer);

// 注册 DeepSeek 标准化器
normalizerRegistry.set('deepseek', DeepSeekNormalizer as unknown as new () => INormalizer);

// 注册 Qwen 标准化器
normalizerRegistry.set('qwen', QwenNormalizer as unknown as new () => INormalizer);

/**
 * 注册标准化器
 */
export function registerNormalizer(platform: string, normalizerClass: new () => INormalizer): void {
  normalizerRegistry.set(platform, normalizerClass);
  console.log(`[NormalizerRegistry] Registered normalizer for ${platform}`);
}

/**
 * 获取标准化器
 */
export function getNormalizer(platform: string): INormalizer | null {
  const NormalizerClass = normalizerRegistry.get(platform);
  if (!NormalizerClass) {
    console.warn(`[NormalizerRegistry] No normalizer found for ${platform}`);
    return null;
  }
  return new NormalizerClass();
}
