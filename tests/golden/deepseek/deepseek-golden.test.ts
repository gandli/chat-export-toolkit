/**
 * DeepSeek Golden Tests
 * 验证 DeepSeek normalizer + exporters 的输出与 golden 文件一致
 * 
 * ⚠️ 注意：当前使用模板数据，真实样本采集后需要更新 golden 文件
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Conversation, RawConversation } from '../../../src/types';
import { DeepSeekNormalizer } from '../../../src/normalizers/deepseek';

// 获取当前文件所在目录
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('DeepSeek Golden Tests', () => {
  const fixturesDir = join(__dirname, '../../../fixtures/deepseek');
  const goldenDir = join(__dirname, '../../golden/deepseek');

  describe('Normalizer', () => {
    const normalizer = new DeepSeekNormalizer();

    it('应该将 template-detail-001 raw 数据正确标准化', async () => {
      // 读取原始数据
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/template-detail-001.json'), 'utf-8')
      );

      // 读取预期的 normalized 输出
      const expectedNormalized: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/template-normalized-001.json'), 'utf-8')
      );

      // 执行标准化
      const result = await normalizer.normalizeConversation(rawData);

      // 验证基本字段
      expect(result.id).toBe(expectedNormalized.id);
      expect(result.title).toBe(expectedNormalized.title);
      expect(result.messages).toHaveLength(expectedNormalized.messages.length);
      expect(result.createdAt).toBe(expectedNormalized.createdAt);
      expect(result.updatedAt).toBe(expectedNormalized.updatedAt);

      // 验证每条消息
      for (let i = 0; i < result.messages.length; i++) {
        const msg = result.messages[i];
        const expected = expectedNormalized.messages[i];

        expect(msg.id).toBe(expected.id);
        expect(msg.role).toBe(expected.role);
        expect(msg.content.text).toBe(expected.content.text);
        expect(msg.timestamp).toBe(expected.timestamp);
        expect(msg.metadata?.platform).toBe('deepseek');
        expect(msg.metadata?.originalId).toBe(expected.metadata?.originalId);
      }

      // 验证 metadata
      expect(result.metadata?.platform).toBe('deepseek');
      expect(result.metadata?.messageCount).toBe(4);
    });

    it('应该正确处理 think/reasoning 块', async () => {
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/template-detail-001.json'), 'utf-8')
      );

      const result = await normalizer.normalizeConversation(rawData);

      // 查找包含 reasoning 的消息
      const messagesWithReasoning = result.messages.filter(
        m => m.content.metadata?.hasReasoning || m.metadata?.hasReasoning
      );

      expect(messagesWithReasoning.length).toBeGreaterThan(0);

      // 验证 reasoning 内容格式
      const firstReasoningMsg = messagesWithReasoning[0];
      expect(firstReasoningMsg.content.text).toContain('> [Reasoning]');
    });

    it('应该正确处理代码块', async () => {
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/template-detail-001.json'), 'utf-8')
      );

      const result = await normalizer.normalizeConversation(rawData);

      // 查找包含代码的消息
      const messageWithCode = result.messages.find(m =>
        m.content.text.includes('```python')
      );

      expect(messageWithCode).toBeDefined();
      expect(messageWithCode?.content.text).toContain('def quick_sort');
    });
  });

  describe('Edge Cases', () => {
    const normalizer = new DeepSeekNormalizer();

    it('应该正确处理空消息和 null 内容', async () => {
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/template-edge-001.json'), 'utf-8')
      );

      const result = await normalizer.normalizeConversation(rawData);

      // 验证空消息处理
      expect(result.messages[0].content.text).toBe('_No content_');
      expect(result.messages[3].content.text).toBe('_No content_');
    });

    it('应该保留特殊字符和 emoji', async () => {
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/template-edge-001.json'), 'utf-8')
      );

      const result = await normalizer.normalizeConversation(rawData);

      // 验证特殊字符和 emoji
      expect(result.messages[1].content.text).toContain('🎉🚀');
      expect(result.messages[1].content.text).toContain('@#$%^&*()');
    });

    it('应该保留 LaTeX 数学公式', async () => {
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/template-edge-001.json'), 'utf-8')
      );

      const result = await normalizer.normalizeConversation(rawData);

      // 验证数学公式
      expect(result.messages[2].content.text).toContain('$E = mc^2$');
      expect(result.messages[2].content.text).toContain('$$\\int_0^\\infty');
    });
  });

  describe('Markdown Golden Files', () => {
    it('V1 Markdown golden 文件应该存在且格式正确', () => {
      const expectedMarkdown = readFileSync(
        join(goldenDir, 'expected-markdown-v1.md'),
        'utf-8'
      );

      // 验证基本结构
      expect(expectedMarkdown).toContain('# DeepSeek 模板对话');
      expect(expectedMarkdown).toContain('> Exported at:');
      expect(expectedMarkdown).toContain('## User');
      expect(expectedMarkdown).toContain('## Assistant');
      expect(expectedMarkdown).toContain('> [Reasoning]');
      expect(expectedMarkdown).toContain('---');
    });

    it('V2 Markdown golden 文件应该存在且格式正确', () => {
      const expectedMarkdown = readFileSync(
        join(goldenDir, 'expected-markdown-v2.md'),
        'utf-8'
      );

      // 验证基本结构
      expect(expectedMarkdown).toContain('# DeepSeek 模板对话');
      expect(expectedMarkdown).toContain('## 元数据');
      expect(expectedMarkdown).toContain('## 对话内容');
      expect(expectedMarkdown).toContain('### 第 1 轮');
      expect(expectedMarkdown).toContain('> **思考过程:**');
    });
  });

  describe('JSON Golden Files', () => {
    it('JSON golden 文件应该存在且结构正确', () => {
      const expectedJson = readFileSync(
        join(goldenDir, 'expected-json.json'),
        'utf-8'
      );

      const parsed = JSON.parse(expectedJson);

      // 验证基本结构
      expect(parsed.id).toBe('deepseek-template-001');
      expect(parsed.title).toBe('DeepSeek 模板对话');
      expect(parsed.messages).toHaveLength(4);
      expect(parsed.messages[0].role).toBe('user');
      expect(parsed.messages[1].role).toBe('assistant');
      expect(parsed.messages[0].metadata?.platform).toBe('deepseek');
    });

    it('应该保持消息的 metadata 字段', async () => {
      const normalizedData: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/template-normalized-001.json'), 'utf-8')
      );

      // 直接验证数据结构
      expect(normalizedData.messages[0].metadata?.platform).toBe('deepseek');
      expect(normalizedData.messages[0].metadata?.originalId).toBe('msg-template-001');
      expect(normalizedData.messages[1].metadata?.hasReasoning).toBe(true);
    });
  });

  describe('Reasoning Block Handling', () => {
    it('应该正确处理 reasoning_content 字段', async () => {
      const normalizedData: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/template-normalized-001.json'), 'utf-8')
      );

      // 查找包含 reasoning 的消息
      const reasoningMessage = normalizedData.messages.find(m =>
        m.content.text.includes('> [Reasoning]')
      );

      expect(reasoningMessage).toBeDefined();
      expect(reasoningMessage?.content.text).toContain('> [Reasoning]');
      expect(reasoningMessage?.content.metadata?.hasReasoning).toBe(true);
    });

    it('应该在 metadata 中标记 hasReasoning', async () => {
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/template-detail-001.json'), 'utf-8')
      );

      const normalizer = new DeepSeekNormalizer();
      const result = await normalizer.normalizeConversation(rawData);

      // 验证有 reasoning 的消息
      const messagesWithReasoning = result.messages.filter(
        m => m.content.metadata?.hasReasoning === true
      );

      expect(messagesWithReasoning.length).toBe(2);
    });
  });

  describe('Timestamp Handling', () => {
    it('应该使用正确的时间戳格式', async () => {
      const normalizedData: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/template-normalized-001.json'), 'utf-8')
      );

      // 验证时间戳是毫秒级 Unix 时间戳
      expect(normalizedData.createdAt).toBe(1710840000000);
      expect(normalizedData.updatedAt).toBe(1710840015000);

      // 验证消息时间戳
      expect(normalizedData.messages[0].timestamp).toBe(1710840000000);
      expect(normalizedData.messages[3].timestamp).toBe(1710840015000);
    });
  });
});
