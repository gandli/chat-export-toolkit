/**
 * DeepSeek Adapter Contract Tests
 * 
 * 测试 DeepSeek 适配器是否遵守统一的基本契约：
 * 1. detect 存在且可调用
 * 2. normalize 输出基本合法 schema
 * 3. extractMessages 返回数组或安全降级
 * 4. 未知输入不应直接崩溃
 * 
 * 注意：这些测试不依赖真实 DOM 或网络请求，使用 fake input / fixture
 */

import { describe, it, expect } from 'vitest';
import { DeepSeekAdapter } from '../../src/adapters/deepseek';
import { DeepSeekNormalizer } from '../../src/normalizers/deepseek';
import type { IPlatformAdapter } from '../../src/core';
import type { PlatformType, RawConversation, RawMessage } from '../../src/types';
import {
  createFakeRawConversation,
  createEmptyRawConversation,
  createInvalidRawConversation,
  createUnknownStructureRawConversation,
  safeCall,
  isValidArray,
  isValidObject,
} from '../contracts/helpers';

// ============================================================================
// 测试配置
// ============================================================================

const PLATFORM: PlatformType = 'deepseek';
const adapter: IPlatformAdapter = new DeepSeekAdapter();
const normalizer = new DeepSeekNormalizer();

// ============================================================================
// Contract Test 1: detect 存在且可调用
// ============================================================================

describe('DeepSeek Adapter Contract: detect()', () => {
  it('should have detect method', () => {
    expect(adapter.detect).toBeDefined();
    expect(typeof adapter.detect).toBe('function');
  });

  it('should return boolean', () => {
    const result = adapter.detect();
    expect(typeof result).toBe('boolean');
  });

  it('should have platform property matching expected value', () => {
    expect(adapter.platform).toBe('deepseek');
  });

  it('should not throw when detect is called', () => {
    expect(() => adapter.detect()).not.toThrow();
  });
});

// ============================================================================
// Contract Test 2: extractMessages 返回数组或安全降级
// ============================================================================

describe('DeepSeek Adapter Contract: extractMessages()', () => {
  it('should have extractMessages method', () => {
    expect(adapter.extractMessages).toBeDefined();
    expect(typeof adapter.extractMessages).toBe('function');
  });

  it('should return array for valid input', () => {
    const fakeConv = createFakeRawConversation(PLATFORM);
    const result = adapter.extractMessages(fakeConv);
    expect(isValidArray(result)).toBe(true);
  });

  it('should return array for empty input', () => {
    const emptyConv = createEmptyRawConversation(PLATFORM);
    const result = adapter.extractMessages(emptyConv);
    expect(isValidArray(result)).toBe(true);
  });

  it('should not throw for invalid input', () => {
    const invalidConv = createInvalidRawConversation(PLATFORM);
    expect(() => adapter.extractMessages(invalidConv)).not.toThrow();
  });

  it('should not throw for unknown structure', () => {
    const unknownConv = createUnknownStructureRawConversation(PLATFORM);
    expect(() => adapter.extractMessages(unknownConv)).not.toThrow();
  });

  it('should return array even on error (graceful degradation)', async () => {
    const invalidConv = createInvalidRawConversation(PLATFORM);
    const result = await safeCall(
      () => adapter.extractMessages(invalidConv),
      [] as RawMessage[]
    );
    expect(isValidArray(result)).toBe(true);
  });
});

// ============================================================================
// Contract Test 3: getConversation 不崩溃
// ============================================================================

describe('DeepSeek Adapter Contract: getConversation()', () => {
  it('should have getConversation method', () => {
    expect(adapter.getConversation).toBeDefined();
    expect(typeof adapter.getConversation).toBe('function');
  });

  it('should return promise', () => {
    const result = adapter.getConversation();
    expect(result).toBeInstanceOf(Promise);
  });

  it('should have correct platform property', () => {
    expect(adapter.platform).toBe('deepseek');
  });

  it('should not throw when called without arguments', async () => {
    // 骨架阶段返回 null 是正常的
    const result = await adapter.getConversation();
    expect(result === null || isValidObject(result)).toBe(true);
  });

  it('should not throw when called with conversationId', async () => {
    // 骨架阶段返回 null 是正常的
    const result = await adapter.getConversation('test-id');
    expect(result === null || isValidObject(result)).toBe(true);
  });

  it('should return null or object', async () => {
    const result = await safeCall(
      () => adapter.getConversation(),
      null as RawConversation | null
    );
    expect(result === null || isValidObject(result)).toBe(true);
  });
});

// ============================================================================
// Contract Test 4: listConversations 不崩溃
// ============================================================================

describe('DeepSeek Adapter Contract: listConversations()', () => {
  it('should have listConversations method', () => {
    expect(adapter.listConversations).toBeDefined();
    expect(typeof adapter.listConversations).toBe('function');
  });

  it('should return promise', () => {
    const result = adapter.listConversations();
    expect(result).toBeInstanceOf(Promise);
  });

  it('should have correct platform property', () => {
    expect(adapter.platform).toBe('deepseek');
  });

  it('should not throw when called', async () => {
    // 骨架阶段返回空数组是正常的
    const result = await adapter.listConversations();
    expect(isValidArray(result)).toBe(true);
  });

  it('should return array', async () => {
    const result = await safeCall(
      () => adapter.listConversations(),
      [] as RawConversation[]
    );
    expect(isValidArray(result)).toBe(true);
  });
});

// ============================================================================
// Contract Test 5: Normalizer 输出符合 schema
// ============================================================================

describe('DeepSeek Normalizer Contract: normalizeConversation()', () => {
  it('should have normalizeConversation method', () => {
    expect(normalizer.normalizeConversation).toBeDefined();
    expect(typeof normalizer.normalizeConversation).toBe('function');
  });

  it('should return promise', () => {
    const fakeConv = createFakeRawConversation(PLATFORM);
    const result = normalizer.normalizeConversation(fakeConv);
    expect(result).toBeInstanceOf(Promise);
  });

  it('should return valid Conversation schema', async () => {
    const fakeConv = createFakeRawConversation(PLATFORM);
    const result = await normalizer.normalizeConversation(fakeConv);

    expect(isValidObject(result)).toBe(true);
    expect(typeof result.id).toBe('string');
    expect(typeof result.title).toBe('string');
    expect(isValidArray(result.messages)).toBe(true);
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
  });

  it('should preserve platform in metadata', async () => {
    const fakeConv = createFakeRawConversation(PLATFORM);
    const result = await normalizer.normalizeConversation(fakeConv);

    expect(result.metadata?.platform).toBe('deepseek');
  });

  it('should handle empty input gracefully', async () => {
    const emptyConv = createEmptyRawConversation(PLATFORM);
    const result = await normalizer.normalizeConversation(emptyConv);

    expect(result).toBeDefined();
    expect(result.messages).toHaveLength(0);
  });

  it('should not throw for invalid input', async () => {
    const invalidConv = createInvalidRawConversation(PLATFORM);
    // 骨架阶段应返回空 conversation 而不是抛出
    const result = await normalizer.normalizeConversation(invalidConv);
    expect(result).toBeDefined();
    expect(result.messages).toHaveLength(0);
  });
});

// ============================================================================
// Contract Test 6: 边界情况处理
// ============================================================================

describe('DeepSeek Adapter Contract: Edge Cases', () => {
  it('should handle null input gracefully', () => {
    expect(() => {
      // @ts-expect-error - testing null input
      adapter.extractMessages(null);
    }).not.toThrow();
  });

  it('should handle undefined input gracefully', () => {
    expect(() => {
      // @ts-expect-error - testing undefined input
      adapter.extractMessages(undefined);
    }).not.toThrow();
  });

  it('should handle empty object input gracefully', () => {
    const emptyInput = { platform: PLATFORM, data: {} } as RawConversation;
    expect(() => adapter.extractMessages(emptyInput)).not.toThrow();
  });

  it('should handle deeply nested invalid data', () => {
    const nestedInvalid = {
      platform: PLATFORM,
      data: {
        level1: {
          level2: {
            level3: null,
          },
        },
      },
    } as unknown as RawConversation;
    expect(() => adapter.extractMessages(nestedInvalid)).not.toThrow();
  });
});

// ============================================================================
// 测试总结
// ============================================================================

/**
 * 测试覆盖说明：
 * 
 * ✅ detect 存在且可调用
 *    - 方法存在
 *    - 返回 boolean
 *    - 不抛出异常
 * 
 * ✅ extractMessages 返回数组或安全降级
 *    - 对有效输入返回数组
 *    - 对空输入返回数组
 *    - 对无效输入不崩溃
 *    - 对未知结构不崩溃
 * 
 * ✅ getConversation 不崩溃
 *    - 方法存在
 *    - 返回 Promise
 *    - 无参数调用不崩溃
 *    - 带参数调用不崩溃
 * 
 * ✅ listConversations 不崩溃
 *    - 方法存在
 *    - 返回 Promise
 *    - 返回数组
 * 
 * ✅ Normalizer 输出符合 schema
 *    - 返回有效的 Conversation 对象
 *    - 包含必需字段 (id, title, messages, createdAt, updatedAt)
 *    - 保留 platform metadata
 * 
 * ✅ 边界情况处理
 *    - null/undefined 输入
 *    - 空对象输入
 *    - 深度嵌套的无效数据
 * 
 * 注意：
 * - 这些测试不验证具体的业务逻辑，只验证接口契约
 * - 测试使用 fake input，不依赖真实 DOM 或网络
 * - DeepSeek 当前为骨架实现，真实功能需要样本验证
 */
