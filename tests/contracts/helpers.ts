/**
 * Adapter Contract Test Helpers
 * 提供测试所需的辅助函数和 fixture
 */

import type { RawConversation, RawMessage, PlatformType } from '../../src/types';

/**
 * 最小化的 fake input fixture
 * 用于测试适配器在不依赖真实 DOM 的情况下的基本行为
 */

/**
 * 创建一个最小的 RawConversation fixture
 */
export function createFakeRawConversation(
  platform: PlatformType,
  overrides?: Partial<RawConversation>
): RawConversation {
  return {
    platform,
    data: {
      id: `fake-${platform}-conversation-${Date.now()}`,
      title: `Fake ${platform} Conversation`,
      messages: [],
    },
    ...overrides,
  };
}

/**
 * 创建一个最小的 RawMessage fixture
 */
export function createFakeRawMessage(
  platform: PlatformType,
  overrides?: Partial<RawMessage>
): RawMessage {
  return {
    platform,
    data: {
      id: `fake-message-${Date.now()}`,
      content: 'Fake message content',
      role: 'user',
    },
    ...overrides,
  };
}

/**
 * 创建一个空的 RawConversation（用于测试边界情况）
 */
export function createEmptyRawConversation(platform: PlatformType): RawConversation {
  return {
    platform,
    data: {},
  };
}

/**
 * 创建一个包含无效数据的 RawConversation（用于测试容错）
 */
export function createInvalidRawConversation(platform: PlatformType): RawConversation {
  return {
    platform,
    data: null as unknown as Record<string, unknown>,
  };
}

/**
 * 创建一个包含未知结构的 RawConversation（用于测试兼容性）
 */
export function createUnknownStructureRawConversation(platform: PlatformType): RawConversation {
  return {
    platform,
    data: {
      unknownField: 'unknown value',
      nested: {
        deep: {
          data: 'some data',
        },
      },
    },
  };
}

/**
 * 安全地调用适配器方法，捕获异常
 */
export async function safeCall<T>(
  fn: () => T | Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    const result = await fn();
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 检查值是否为有效的数组
 */
export function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 检查值是否为有效的对象（非 null）
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/**
 * 检查 normalize 输出是否符合基本 schema
 */
export function isValidNormalizedConversation(value: unknown): boolean {
  if (!isValidObject(value)) return false;
  
  const conv = value as Record<string, unknown>;
  
  // 必须包含 id 和 messages
  if (typeof conv.id !== 'string') return false;
  if (!isValidArray(conv.messages)) return false;
  
  // 可选但推荐的字段
  if (conv.title !== undefined && typeof conv.title !== 'string') return false;
  if (conv.createdAt !== undefined && typeof conv.createdAt !== 'number') return false;
  if (conv.updatedAt !== undefined && typeof conv.updatedAt !== 'number') return false;
  
  return true;
}

/**
 * 检查 normalizeMessage 输出是否符合基本 schema
 */
export function isValidNormalizedMessage(value: unknown): boolean {
  if (!isValidObject(value)) return false;
  
  const msg = value as Record<string, unknown>;
  
  // 必须包含 id, role, content
  if (typeof msg.id !== 'string') return false;
  if (typeof msg.role !== 'string') return false;
  if (!isValidObject(msg.content)) return false;
  
  const content = msg.content as Record<string, unknown>;
  if (typeof content.text !== 'string') return false;
  
  return true;
}
