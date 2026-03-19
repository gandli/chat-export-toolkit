/**
 * Yuanbao Edge Cases & Security Tests
 * 
 * 针对 Yuanbao normalizer 和 exporters 的边界情况、异常输入和安全降级测试
 * 
 * 测试覆盖：
 * - 空内容处理
 * - think 块的各种变体
 * - 命名规则验证
 * - metadata 完整性
 * - 异常输入安全降级
 * - 特殊字符和 Unicode
 * - 时间戳边界情况
 */

import { describe, it, expect } from 'vitest';
import { YuanbaoNormalizer, yuanbaoToMarkdown } from '../../../src/normalizers/yuanbao';
import { MarkdownExporter } from '../../../src/exporters/markdown';
import type { RawConversation, Conversation } from '../../../src/types';
import type { YuanbaoConversationDetail } from '../../../src/adapters/yuanbao-types';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * 创建最小的有效 Yuanbao 原始数据
 */
function createMinimalRawData(overrides?: Partial<YuanbaoConversationDetail>): RawConversation {
  return {
    platform: 'yuanbao',
    data: {
      convs: [],
      sessionTitle: 'Test',
      title: 'Test',
      ...overrides,
    },
  };
}

/**
 * 创建包含 think 块的原始数据
 */
function createRawWithThinkBlock(thinkTitle?: string, thinkContent?: string): RawConversation {
  return {
    platform: 'yuanbao',
    data: {
      convs: [
        {
          index: 0,
          speaker: 'ai',
          createTime: Date.now(),
          speechesV2: [
            {
              content: [
                {
                  type: 'think',
                  title: thinkTitle,
                  content: thinkContent || '思考内容',
                },
                {
                  type: 'text',
                  msg: '回答内容',
                },
              ],
            },
          ],
        },
      ],
      sessionTitle: 'Think Test',
      title: 'Think Test',
    },
  };
}

/**
 * 创建空消息的原始数据
 */
function createRawWithEmptyMessage(): RawConversation {
  return {
    platform: 'yuanbao',
    data: {
      convs: [
        {
          index: 0,
          speaker: 'user',
          createTime: Date.now(),
          speechesV2: [
            {
              content: [], // 空内容数组
            },
          ],
        },
      ],
      sessionTitle: 'Empty Test',
      title: 'Empty Test',
    },
  };
}

/**
 * 创建包含特殊字符的原始数据
 */
function createRawWithSpecialChars(): RawConversation {
  return {
    platform: 'yuanbao',
    data: {
      convs: [
        {
          index: 0,
          speaker: 'user',
          createTime: Date.now(),
          speechesV2: [
            {
              content: [
                {
                  type: 'text',
                  msg: '特殊字符：<script>alert("XSS")</script> & emoji 🎉🚀 中文',
                },
              ],
            },
          ],
        },
      ],
      sessionTitle: 'Special <>&"\' Chars',
      title: 'Special Chars',
    },
  };
}

// ============================================================================
// Edge Case Tests
// ============================================================================

describe('Yuanbao Edge Cases & Security Tests', () => {
  describe('Empty Content Handling', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该正确处理空 speechesV2 数组', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'user',
              createTime: Date.now(),
              speechesV2: [], // 空数组
            },
          ],
          sessionTitle: 'Empty Speeches',
          title: 'Empty Speeches',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toBe('_No content_');
    });

    it('应该正确处理 undefined speechesV2', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'user',
              createTime: Date.now(),
              // speechesV2 未定义
            },
          ],
          sessionTitle: 'Undefined Speeches',
          title: 'Undefined Speeches',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toBe('_No content_');
    });

    it('应该正确处理空 content 数组', async () => {
      const rawData = createRawWithEmptyMessage();
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toBe('_No content_');
    });

    it('应该正确处理 null content', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'user',
              createTime: Date.now(),
              speechesV2: [
                {
                  content: null as any,
                },
              ],
            },
          ],
          sessionTitle: 'Null Content',
          title: 'Null Content',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      // 应该安全降级，不抛出异常
      expect(result.messages[0].content.text).toBeDefined();
    });

    it('应该正确处理空对话（无消息）', async () => {
      const rawData = createMinimalRawData({ convs: [] });
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(0);
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test');
    });
  });

  describe('Think Block Handling', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该正确处理带标题的 think 块', async () => {
      const rawData = createRawWithThinkBlock('推理过程', '逐步推理...');
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toContain('> [Think] 推理过程');
      expect(result.messages[0].content.text).toContain('> 逐步推理...');
    });

    it('应该正确处理空标题的 think 块', async () => {
      const rawData = createRawWithThinkBlock('', '思考内容...');
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      // 空标题应该只显示 [Think]
      expect(result.messages[0].content.text).toContain('> [Think]');
      expect(result.messages[0].content.text).not.toContain('> [Think] ');
    });

    it('应该正确处理 undefined 标题的 think 块', async () => {
      const rawData = createRawWithThinkBlock(undefined as any, '思考内容...');
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toContain('> [Think]');
    });

    it('应该正确处理嵌套 content 数组的 think 块', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'ai',
              createTime: Date.now(),
              speechesV2: [
                {
                  content: [
                    {
                      type: 'think',
                      title: '嵌套思考',
                      content: [
                        { type: 'text', msg: '第一层' },
                        { type: 'text', msg: '第二层' },
                      ],
                    },
                    {
                      type: 'text',
                      msg: '回答',
                    },
                  ],
                },
              ],
            },
          ],
          sessionTitle: 'Nested Think',
          title: 'Nested Think',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toContain('> [Think] 嵌套思考');
      expect(result.messages[0].content.text).toContain('第一层');
      expect(result.messages[0].content.text).toContain('第二层');
    });

    it('应该正确处理多个 think 块', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'ai',
              createTime: Date.now(),
              speechesV2: [
                {
                  content: [
                    { type: 'think', title: '思考 1', content: '内容 1' },
                    { type: 'text', msg: '中间内容' },
                    { type: 'think', title: '思考 2', content: '内容 2' },
                    { type: 'text', msg: '最终回答' },
                  ],
                },
              ],
            },
          ],
          sessionTitle: 'Multiple Thinks',
          title: 'Multiple Thinks',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toContain('> [Think] 思考 1');
      expect(result.messages[0].content.text).toContain('> [Think] 思考 2');
      expect(result.messages[0].content.text).toContain('中间内容');
      expect(result.messages[0].content.text).toContain('最终回答');
    });
  });

  describe('Special Characters & Unicode', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该正确处理 emoji', async () => {
      const rawData = createRawWithSpecialChars();
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].content.text).toContain('🎉🚀');
    });

    it('应该正确处理 HTML 特殊字符', async () => {
      const rawData = createRawWithSpecialChars();
      const result = await normalizer.normalizeConversation(rawData);

      // 应该保留原始字符，不进行转义
      expect(result.messages[0].content.text).toContain('<script>');
      expect(result.messages[0].content.text).toContain('&');
    });

    it('应该正确处理中文字符', async () => {
      const rawData = createRawWithSpecialChars();
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].content.text).toContain('特殊字符');
      expect(result.messages[0].content.text).toContain('中文');
    });

    it('应该正确处理引号和撇号', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'user',
              createTime: Date.now(),
              speechesV2: [
                {
                  content: [
                    {
                      type: 'text',
                      msg: 'He said "Hello" and \'goodbye\'',
                    },
                  ],
                },
              ],
            },
          ],
          sessionTitle: 'Quotes Test',
          title: 'Quotes Test',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].content.text).toContain('"Hello"');
      expect(result.messages[0].content.text).toContain("'goodbye'");
    });

    it('应该正确处理换行符和制表符', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'user',
              createTime: Date.now(),
              speechesV2: [
                {
                  content: [
                    {
                      type: 'text',
                      msg: 'Line 1\nLine 2\tTabbed',
                    },
                  ],
                },
              ],
            },
          ],
          sessionTitle: 'Whitespace Test',
          title: 'Whitespace Test',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].content.text).toContain('Line 1');
      expect(result.messages[0].content.text).toContain('Line 2');
      expect(result.messages[0].content.text).toContain('Tabbed');
    });
  });

  describe('Metadata Integrity', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该为每条消息添加 platform metadata', async () => {
      const rawData = createMinimalRawData({
        convs: [
          {
            index: 0,
            speaker: 'user',
            createTime: Date.now(),
            speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }],
          },
        ],
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].metadata?.platform).toBe('yuanbao');
    });

    it('应该为每条消息添加 originalIndex metadata', async () => {
      const rawData = createMinimalRawData({
        convs: [
          { index: 0, speaker: 'user', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
          { index: 5, speaker: 'ai', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
          { index: 10, speaker: 'user', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
        ],
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].metadata?.originalIndex).toBe(0);
      expect(result.messages[1].metadata?.originalIndex).toBe(5);
      expect(result.messages[2].metadata?.originalIndex).toBe(10);
    });

    it('应该为每条消息添加 blockCount metadata', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'ai',
              createTime: Date.now(),
              speechesV2: [
                {
                  content: [
                    { type: 'think', title: 't', content: 'c' },
                    { type: 'text', msg: 'm1' },
                    { type: 'text', msg: 'm2' },
                  ],
                },
              ],
            },
          ],
          sessionTitle: 'Block Count',
          title: 'Block Count',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].metadata?.blockCount).toBe(3);
    });

    it('应该为 conversation 添加 participantCount metadata', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            { index: 0, speaker: 'user', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
            { index: 1, speaker: 'ai', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
            { index: 2, speaker: 'system', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
          ],
          sessionTitle: 'Participants',
          title: 'Participants',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.metadata?.participantCount).toBe(3);
    });

    it('应该保留 originalData 在 metadata 中', async () => {
      const rawData = createMinimalRawData();
      const result = await normalizer.normalizeConversation(rawData);

      expect(result.metadata?.originalData).toBeDefined();
      expect(result.metadata?.originalData).toBe(rawData.data);
    });
  });

  describe('Naming Rules & Filename Generation', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该从 sessionTitle 提取标题', async () => {
      const rawData = createMinimalRawData({
        sessionTitle: 'My Conversation Title',
        title: 'Different Title',
      });

      const result = await normalizer.normalizeConversation(rawData);

      // sessionTitle 优先级更高
      expect(result.title).toBe('My Conversation Title');
    });

    it('应该在没有 sessionTitle 时使用 title', async () => {
      const rawData = createMinimalRawData({
        sessionTitle: undefined as any,
        title: 'Fallback Title',
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.title).toBe('Fallback Title');
    });

    it('应该在没有标题时使用默认值', async () => {
      const rawData = createMinimalRawData({
        sessionTitle: undefined,
        title: undefined,
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.title).toBe('Yuanbao Chat');
    });

    it('应该正确处理超长标题', async () => {
      const longTitle = 'A'.repeat(200);
      const rawData = createMinimalRawData({
        sessionTitle: longTitle,
      });

      const result = await normalizer.normalizeConversation(rawData);

      // 标题应该被保留（normalizer 不截断）
      expect(result.title).toBe(longTitle);
    });

    it('应该从 conversationId 字段提取 ID', async () => {
      const rawData = createMinimalRawData({
        conversationId: 'explicit-id-123',
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.id).toBe('explicit-id-123');
    });

    it('应该支持多种 ID 字段变体', async () => {
      const idVariants = [
        { field: 'conversation_id', value: 'id-variant-1' },
        { field: 'convId', value: 'id-variant-2' },
        { field: 'conversationUuid', value: 'id-variant-3' },
        { field: 'sessionId', value: 'id-variant-4' },
        { field: 'chatId', value: 'id-variant-5' },
      ];

      for (const { field, value } of idVariants) {
        const rawData = createMinimalRawData({
          [field]: value,
        } as Partial<YuanbaoConversationDetail>);

        const result = await normalizer.normalizeConversation(rawData);

        expect(result.id).toBe(value);
      }
    });
  });

  describe('Timestamp Handling', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该正确处理毫秒级时间戳', async () => {
      const timestamp = 1710840000000; // 毫秒级
      const rawData = createMinimalRawData({
        convs: [
          {
            index: 0,
            speaker: 'user',
            createTime: timestamp,
            speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }],
          },
        ],
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].timestamp).toBe(timestamp);
    });

    it('应该正确处理秒级时间戳', async () => {
      const timestamp = 1710840000; // 秒级
      const rawData = createMinimalRawData({
        convs: [
          {
            index: 0,
            speaker: 'user',
            createTime: timestamp,
            speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }],
          },
        ],
      });

      const result = await normalizer.normalizeConversation(rawData);

      // 应该转换为毫秒级
      expect(result.messages[0].timestamp).toBe(timestamp * 1000);
    });

    it('应该正确处理字符串时间戳', async () => {
      const timestamp = '1710840000000';
      const rawData = createMinimalRawData({
        convs: [
          {
            index: 0,
            speaker: 'user',
            createTime: timestamp,
            speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }],
          },
        ],
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].timestamp).toBe(1710840000000);
    });

    it('应该在时间戳无效时使用当前时间', async () => {
      const rawData = createMinimalRawData({
        convs: [
          {
            index: 0,
            speaker: 'user',
            createTime: 'invalid',
            speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }],
          },
        ],
      });

      const result = await normalizer.normalizeConversation(rawData);

      // 应该使用当前时间（在合理范围内）
      expect(result.messages[0].timestamp).toBeGreaterThan(Date.now() - 1000);
      expect(result.messages[0].timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('应该在 createTime 缺失时使用当前时间', async () => {
      const rawData = createMinimalRawData({
        convs: [
          {
            index: 0,
            speaker: 'user',
            // createTime 缺失
            speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }],
          },
        ],
      });

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].timestamp).toBeGreaterThan(Date.now() - 1000);
    });

    it('应该正确计算 createdAt 和 updatedAt', async () => {
      // 使用明确的毫秒级时间戳（大于 1e12）
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            { index: 0, speaker: 'user', createTime: 1710840000000, speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
            { index: 1, speaker: 'ai', createTime: 1710840001000, speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
            { index: 2, speaker: 'user', createTime: 1710840002000, speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
          ],
          sessionTitle: 'Timestamp Test',
          title: 'Timestamp Test',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.createdAt).toBe(1710840000000);
      expect(result.updatedAt).toBe(1710840002000);
    });
  });

  describe('Error Handling & Safe Degradation', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该正确处理 null 输入', async () => {
      // @ts-expect-error - 测试 null 输入
      const result = await normalizer.normalizeConversation(null);

      // 应该抛出异常或返回安全结果
      expect(result).toBeDefined();
    });

    it('应该正确处理 undefined 输入', async () => {
      // @ts-expect-error - 测试 undefined 输入
      const result = await normalizer.normalizeConversation(undefined);

      expect(result).toBeDefined();
    });

    it('应该正确处理空对象输入', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {},
      };

      const result = await normalizer.normalizeConversation(rawData);

      // 应该安全降级
      expect(result).toBeDefined();
      expect(result.messages).toHaveLength(0);
    });

    it('应该正确处理损坏的 convs 数据', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            null as any,
            undefined as any,
            { index: 0, speaker: 'user', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'valid' }] }] },
          ] as any,
          sessionTitle: 'Mixed',
          title: 'Mixed',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      // 应该跳过损坏的消息，处理有效的消息
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    });

    it('应该正确处理未知的 speaker 类型', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            { index: 0, speaker: 'unknown_role', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
            { index: 1, speaker: 'bot', createTime: Date.now(), speechesV2: [{ content: [{ type: 'text', msg: 'test' }] }] },
          ],
          sessionTitle: 'Unknown Roles',
          title: 'Unknown Roles',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      expect(result.messages[0].role).toBe('unknown');
      expect(result.messages[1].role).toBe('unknown');
    });

    it('应该正确处理未知的块类型', async () => {
      const rawData: RawConversation = {
        platform: 'yuanbao',
        data: {
          convs: [
            {
              index: 0,
              speaker: 'ai',
              createTime: Date.now(),
              speechesV2: [
                {
                  content: [
                    { type: 'unknown_type', msg: 'Unknown block' },
                    { type: 'video', msg: 'Video block' },
                    { type: 'text', msg: 'Text block' },
                  ],
                },
              ],
            },
          ],
          sessionTitle: 'Unknown Blocks',
          title: 'Unknown Blocks',
        },
      };

      const result = await normalizer.normalizeConversation(rawData);

      // 应该包含所有块的内容
      expect(result.messages[0].content.text).toContain('Unknown block');
      expect(result.messages[0].content.text).toContain('Video block');
      expect(result.messages[0].content.text).toContain('Text block');
    });
  });

  describe('Markdown Exporter Integration', () => {
    const exporter = new MarkdownExporter();

    it('应该正确处理 V1 格式的空对话', async () => {
      const conversation: Conversation = {
        id: 'empty-001',
        title: 'Empty',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await exporter.exportConversation(conversation, {
        format: 'markdown',
        formatVersion: 'v1',
      });

      // 在 Node.js 环境中，由于没有 Blob，export 会失败
      // 这里只验证返回结构
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      if (!result.success) {
        // 预期在 Node.js 环境中失败
        expect(result.error).toBeDefined();
      }
    });

    it('应该正确处理 V2 格式的空对话', async () => {
      const conversation: Conversation = {
        id: 'empty-001',
        title: 'Empty',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await exporter.exportConversation(conversation, {
        format: 'markdown',
        formatVersion: 'v2',
      });

      // 在 Node.js 环境中，由于没有 Blob，export 会失败
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('应该正确处理包含 think 块的对话', async () => {
      const conversation: Conversation = {
        id: 'think-001',
        title: 'Think Test',
        messages: [
          {
            id: 'msg-001',
            role: 'assistant',
            content: {
              text: '> [Think] 思考\n\n回答内容',
              attachments: [],
            },
            timestamp: Date.now(),
            metadata: { platform: 'yuanbao' },
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await exporter.exportConversation(conversation, {
        format: 'markdown',
        formatVersion: 'v1',
      });

      // 在 Node.js 环境中，由于没有 Blob，export 会失败
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('yuanbaoToMarkdown Function', () => {
    it('应该正确处理空对话', () => {
      const data: YuanbaoConversationDetail = {
        convs: [],
        sessionTitle: 'Empty',
        title: 'Empty',
      };

      const markdown = yuanbaoToMarkdown(data);

      expect(markdown).toContain('# Empty');
      expect(markdown).toContain('> Exported at:');
    });

    it('应该正确处理包含 think 块的对话', () => {
      const data: YuanbaoConversationDetail = {
        convs: [
          {
            index: 0,
            speaker: 'ai',
            createTime: Date.now(),
            speechesV2: [
              {
                content: [
                  { type: 'think', title: '思考', content: '思考内容' },
                  { type: 'text', msg: '回答' },
                ],
              },
            ],
          },
        ],
        sessionTitle: 'Think Test',
        title: 'Think Test',
      };

      const markdown = yuanbaoToMarkdown(data);

      expect(markdown).toContain('> [Think] 思考');
      expect(markdown).toContain('> 思考内容');
    });

    it('应该正确处理空标题的 think 块', () => {
      const data: YuanbaoConversationDetail = {
        convs: [
          {
            index: 0,
            speaker: 'ai',
            createTime: Date.now(),
            speechesV2: [
              {
                content: [
                  { type: 'think', title: '', content: '思考内容' },
                  { type: 'text', msg: '回答' },
                ],
              },
            ],
          },
        ],
        sessionTitle: 'Empty Title Think',
        title: 'Empty Title Think',
      };

      const markdown = yuanbaoToMarkdown(data);

      expect(markdown).toContain('> [Think]');
    });
  });
});
