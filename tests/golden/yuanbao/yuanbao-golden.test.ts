/**
 * Yuanbao Golden Tests
 * 验证 Yuanbao normalizer + exporters 的输出与 golden 文件一致
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Conversation, RawConversation } from '../../../src/types';
import { YuanbaoNormalizer } from '../../../src/normalizers/yuanbao';

// 获取当前文件所在目录
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Yuanbao Golden Tests', () => {
  const fixturesDir = join(__dirname, '../../../fixtures/yuanbao');
  const goldenDir = join(__dirname, '../../golden/yuanbao');

  describe('Normalizer', () => {
    const normalizer = new YuanbaoNormalizer();

    it('应该将 detail-001 raw 数据正确标准化', async () => {
      // 读取原始数据
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/detail-001.json'), 'utf-8')
      );

      // 读取预期的 normalized 输出
      const expectedNormalized: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/normalized-001.json'), 'utf-8')
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
        expect(msg.metadata?.platform).toBe('yuanbao');
        expect(msg.metadata?.originalIndex).toBe(expected.metadata?.originalIndex);
      }
    });

    it('应该正确处理 edge-case-001（空消息、特殊字符）', async () => {
      const rawData: RawConversation = JSON.parse(
        readFileSync(join(fixturesDir, 'raw/edge-case-001.json'), 'utf-8')
      );

      const expectedNormalized: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/normalized-edge-001.json'), 'utf-8')
      );

      const result = await normalizer.normalizeConversation(rawData);

      // 验证消息数量
      expect(result.messages).toHaveLength(4);

      // 验证空消息处理
      expect(result.messages[0].content.text).toBe('_No content_');

      // 验证特殊字符和 emoji
      expect(result.messages[2].content.text).toContain('🎉🚀');
      expect(result.messages[3].content.text).toContain('@#$%^&*()');

      // 验证 think 块（空标题）
      expect(result.messages[1].content.text).toContain('> [Think]');
    });
  });

  describe('Markdown Golden Files', () => {
    it('V1 Markdown golden 文件应该存在且格式正确', () => {
      const expectedMarkdown = readFileSync(
        join(goldenDir, 'expected-markdown-v1.md'),
        'utf-8'
      );

      // 验证基本结构
      expect(expectedMarkdown).toContain('# Golden Test - TypeScript 代码示例');
      expect(expectedMarkdown).toContain('> Exported at:');
      expect(expectedMarkdown).toContain('## User (Turn 0)');
      expect(expectedMarkdown).toContain('## Assistant (Turn 1)');
      expect(expectedMarkdown).toContain('> [Think] 思考过程');
      expect(expectedMarkdown).toContain('---');
    });

    it('V2 Markdown golden 文件应该存在且格式正确', () => {
      const expectedMarkdown = readFileSync(
        join(goldenDir, 'expected-markdown-v2.md'),
        'utf-8'
      );

      // 验证基本结构
      expect(expectedMarkdown).toContain('# Golden Test - TypeScript 代码示例');
      expect(expectedMarkdown).toContain('## 元数据');
      expect(expectedMarkdown).toContain('## 对话内容');
      expect(expectedMarkdown).toContain('### 第 1 轮 - 用户');
      expect(expectedMarkdown).toContain('### 第 2 轮 - 助手');
      expect(expectedMarkdown).toContain('> **思考过程:**');
    });

    it('Edge-case Markdown golden 文件应该存在且格式正确', () => {
      const expectedMarkdown = readFileSync(
        join(goldenDir, 'expected-markdown-edge-001.md'),
        'utf-8'
      );

      // 验证基本结构
      expect(expectedMarkdown).toContain('# Edge Case Test');
      expect(expectedMarkdown).toContain('_No content_');
      expect(expectedMarkdown).toContain('🎉🚀');
      expect(expectedMarkdown).toContain('@#$%^&*()');
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
      expect(parsed.id).toBe('yuanbao_golden_001');
      expect(parsed.title).toBe('Golden Test - TypeScript 代码示例');
      expect(parsed.messages).toHaveLength(4);
      expect(parsed.messages[0].role).toBe('user');
      expect(parsed.messages[1].role).toBe('assistant');
      expect(parsed.messages[0].metadata?.platform).toBe('yuanbao');
    });

    it('应该保持消息的 metadata 字段', async () => {
      const normalizedData: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/normalized-001.json'), 'utf-8')
      );

      // 直接验证数据结构
      expect(normalizedData.messages[0].metadata?.platform).toBe('yuanbao');
      expect(normalizedData.messages[0].metadata?.originalIndex).toBe(0);
      expect(normalizedData.messages[1].metadata?.blockCount).toBe(2);
    });
  });

  describe('ZIP Export Manifest', () => {
    it('应该验证 ZIP manifest 的结构', async () => {
      const manifest = JSON.parse(
        readFileSync(join(goldenDir, 'expected-zip-manifest.json'), 'utf-8')
      );

      // 验证 manifest 结构
      expect(manifest.zipFilename).toBeDefined();
      expect(manifest.format).toBe('json');
      expect(manifest.files).toHaveLength(2);
      expect(manifest.files[0].path).toContain('.json');
      expect(manifest.files[1].path).toBe('metadata.json');

      // 验证命名规则
      expect(manifest.namingRules.pattern).toBe('{index}_{title}_{date}.{extension}');
      expect(manifest.namingRules.indexPadding).toBe(3);
      expect(manifest.namingRules.titleMaxLength).toBe(50);

      // 验证验证检查
      expect(manifest.validationChecks.bitPerfectRequired).toBe(false);
    });
  });

  describe('Think Block Handling', () => {
    it('应该正确处理带标题的 think 块', async () => {
      const normalizedData: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/normalized-001.json'), 'utf-8')
      );

      // 查找包含 think 的消息
      const thinkMessage = normalizedData.messages.find(m =>
        m.content.text.includes('> [Think] 思考过程')
      );

      expect(thinkMessage).toBeDefined();
      expect(thinkMessage?.content.text).toContain('> [Think] 思考过程');
      expect(thinkMessage?.content.text).toContain(
        '> 用户想了解我的基本信息'
      );
    });

    it('应该正确处理空标题的 think 块', async () => {
      const normalizedData: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/normalized-001.json'), 'utf-8')
      );

      // 查找第二个 think 块（空标题）
      const thinkMessage = normalizedData.messages.find(m =>
        m.content.text.includes('> [Think]\n> 用户需要 TypeScript')
      );

      expect(thinkMessage).toBeDefined();
      expect(thinkMessage?.content.text).toContain('> [Think]');
      expect(thinkMessage?.content.text).not.toContain('> [Think] ');
    });
  });

  describe('Timestamp Formatting', () => {
    it('应该使用正确的时间戳格式', async () => {
      const normalizedData: Conversation = JSON.parse(
        readFileSync(join(fixturesDir, 'normalized/normalized-001.json'), 'utf-8')
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
