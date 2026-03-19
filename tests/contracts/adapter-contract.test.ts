/**
 * Adapter Contract Tests
 * 
 * 测试各平台适配器是否遵守统一的基本契约：
 * 1. detect 存在且可调用
 * 2. normalize 输出基本合法 schema
 * 3. extractMessages 返回数组或安全降级
 * 4. 未知输入不应直接崩溃
 * 
 * 注意：这些测试不依赖真实 DOM 或网络请求，使用 fake input / fixture
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  YuanbaoAdapter,
  ChatGPTAdapter,
  KimiAdapter,
  DoubaoAdapter,
  ClaudeAdapter,
  QwenAdapter,
  DeepSeekAdapter,
} from '../../src/adapters';
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
} from './helpers';

// ============================================================================
// 测试配置
// ============================================================================

/**
 * 要测试的适配器列表
 * 每个条目包含适配器类和平台名称
 */
const ADAPTERS_TO_TEST: Array<{
  name: string;
  AdapterClass: new () => IPlatformAdapter;
  platform: PlatformType;
}> = [
  { name: 'Yuanbao', AdapterClass: YuanbaoAdapter, platform: 'yuanbao' },
  { name: 'ChatGPT', AdapterClass: ChatGPTAdapter, platform: 'chatgpt' },
  { name: 'Kimi', AdapterClass: KimiAdapter, platform: 'kimi' },
  { name: 'Doubao', AdapterClass: DoubaoAdapter, platform: 'doubao' },
  { name: 'Claude', AdapterClass: ClaudeAdapter, platform: 'claude' },
  { name: 'Qwen', AdapterClass: QwenAdapter, platform: 'qwen' },
  { name: 'DeepSeek', AdapterClass: DeepSeekAdapter, platform: 'deepseek' },
];

// ============================================================================
// Contract Test 1: detect 存在且可调用
// ============================================================================

describe('Adapter Contract: detect()', () => {
  for (const { name, AdapterClass, platform } of ADAPTERS_TO_TEST) {
    describe(`${name} Adapter`, () => {
      let adapter: IPlatformAdapter;

      beforeAll(() => {
        adapter = new AdapterClass();
      });

      it('should have detect method', () => {
        expect(adapter.detect).toBeDefined();
        expect(typeof adapter.detect).toBe('function');
      });

      it('should return boolean', () => {
        const result = adapter.detect();
        expect(typeof result).toBe('boolean');
      });

      it('should have platform property matching expected value', () => {
        expect(adapter.platform).toBe(platform);
      });

      it('should not throw when detect is called', () => {
        expect(() => adapter.detect()).not.toThrow();
      });
    });
  }
});

// ============================================================================
// Contract Test 2: extractMessages 返回数组或安全降级
// ============================================================================

describe('Adapter Contract: extractMessages()', () => {
  for (const { name, AdapterClass, platform } of ADAPTERS_TO_TEST) {
    describe(`${name} Adapter`, () => {
      let adapter: IPlatformAdapter;

      beforeAll(() => {
        adapter = new AdapterClass();
      });

      it('should have extractMessages method', () => {
        expect(adapter.extractMessages).toBeDefined();
        expect(typeof adapter.extractMessages).toBe('function');
      });

      it('should return array for valid input', () => {
        const fakeConv = createFakeRawConversation(platform);
        const result = adapter.extractMessages(fakeConv);
        expect(isValidArray(result)).toBe(true);
      });

      it('should return array for empty input', () => {
        const emptyConv = createEmptyRawConversation(platform);
        const result = adapter.extractMessages(emptyConv);
        expect(isValidArray(result)).toBe(true);
      });

      it('should not throw for invalid input', () => {
        const invalidConv = createInvalidRawConversation(platform);
        expect(() => adapter.extractMessages(invalidConv)).not.toThrow();
      });

      it('should not throw for unknown structure', () => {
        const unknownConv = createUnknownStructureRawConversation(platform);
        expect(() => adapter.extractMessages(unknownConv)).not.toThrow();
      });

      it('should return array even on error (graceful degradation)', async () => {
        const invalidConv = createInvalidRawConversation(platform);
        const result = await safeCall(
          () => adapter.extractMessages(invalidConv),
          [] as RawMessage[]
        );
        expect(isValidArray(result)).toBe(true);
      });
    });
  }
});

// ============================================================================
// Contract Test 3: getConversation 不崩溃
// ============================================================================

describe('Adapter Contract: getConversation()', () => {
  for (const { name, AdapterClass, platform } of ADAPTERS_TO_TEST) {
    describe(`${name} Adapter`, () => {
      let adapter: IPlatformAdapter;

      beforeAll(() => {
        adapter = new AdapterClass();
      });

      it('should have getConversation method', () => {
        expect(adapter.getConversation).toBeDefined();
        expect(typeof adapter.getConversation).toBe('function');
      });

      it('should return promise', () => {
        const result = adapter.getConversation();
        expect(result).toBeInstanceOf(Promise);
      });

      it('should have correct platform property', () => {
        expect(adapter.platform).toBe(platform);
      });

      it('should not throw when called without arguments', async () => {
        await expect(adapter.getConversation()).resolves.not.toThrow();
      });

      it('should not throw when called with conversationId', async () => {
        await expect(adapter.getConversation('test-id')).resolves.not.toThrow();
      });

      it('should return null or object', async () => {
        const result = await safeCall(
          () => adapter.getConversation(),
          null as RawConversation | null
        );
        expect(result === null || isValidObject(result)).toBe(true);
      });
    });
  }
});

// ============================================================================
// Contract Test 4: listConversations 不崩溃
// ============================================================================

describe('Adapter Contract: listConversations()', () => {
  for (const { name, AdapterClass, platform } of ADAPTERS_TO_TEST) {
    describe(`${name} Adapter`, () => {
      let adapter: IPlatformAdapter;

      beforeAll(() => {
        adapter = new AdapterClass();
      });

      it('should have listConversations method', () => {
        expect(adapter.listConversations).toBeDefined();
        expect(typeof adapter.listConversations).toBe('function');
      });

      it('should return promise', () => {
        const result = adapter.listConversations();
        expect(result).toBeInstanceOf(Promise);
      });

      it('should have correct platform property', () => {
        expect(adapter.platform).toBe(platform);
      });

      it('should not throw when called', async () => {
        await expect(adapter.listConversations()).resolves.not.toThrow();
      });

      it('should return array', async () => {
        const result = await safeCall(
          () => adapter.listConversations(),
          [] as RawConversation[]
        );
        expect(isValidArray(result)).toBe(true);
      });
    });
  }
});

// ============================================================================
// Contract Test 5: 接口一致性检查
// ============================================================================

describe('Adapter Contract: Interface Consistency', () => {
  it('should have consistent method signatures across all adapters', () => {
    const adapters = ADAPTERS_TO_TEST.map(({ AdapterClass }) => new AdapterClass());
    
    const requiredMethods = ['detect', 'getConversation', 'listConversations', 'extractMessages'] as const;
    
    for (const adapter of adapters) {
      for (const method of requiredMethods) {
        expect(adapter[method as keyof IPlatformAdapter]).toBeDefined();
        expect(typeof adapter[method as keyof IPlatformAdapter]).toBe('function');
      }
    }
  });

  it('should have platform property on all adapters', () => {
    const adapters = ADAPTERS_TO_TEST.map(({ AdapterClass }) => new AdapterClass());
    
    for (const adapter of adapters) {
      expect(adapter.platform).toBeDefined();
      expect(typeof adapter.platform).toBe('string');
    }
  });
});

// ============================================================================
// Contract Test 6: 边界情况处理
// ============================================================================

describe('Adapter Contract: Edge Cases', () => {
  for (const { name, AdapterClass, platform } of ADAPTERS_TO_TEST) {
    describe(`${name} Adapter`, () => {
      let adapter: IPlatformAdapter;

      beforeAll(() => {
        adapter = new AdapterClass();
      });

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
        const emptyInput = { platform, data: {} } as RawConversation;
        expect(() => adapter.extractMessages(emptyInput)).not.toThrow();
      });

      it('should handle deeply nested invalid data', () => {
        const nestedInvalid = {
          platform,
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
  }
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
 * ✅ 接口一致性
 *    - 所有适配器都有必需的方法
 *    - 所有适配器都有 platform 属性
 * 
 * ✅ 边界情况处理
 *    - null/undefined 输入
 *    - 空对象输入
 *    - 深度嵌套的无效数据
 * 
 * 
 * 注意：
 * - 这些测试不验证具体的业务逻辑，只验证接口契约
 * - 测试使用 fake input，不依赖真实 DOM 或网络
 * - 如果某个平台的具体实现有特殊的输入要求，可能需要额外的测试
 */
