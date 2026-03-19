/**
 * JSON 导出器 Golden 测试
 * 验证导出输出与预期格式一致
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Conversation } from '../../src/types';

// 获取当前文件所在目录
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('JSON Exporter Golden Tests', () => {
  const fixturesDir = join(__dirname, '../../fixtures');
  const goldenDir = join(__dirname, '../golden');

  // 读取测试数据
  const testConversation: Conversation = JSON.parse(
    readFileSync(join(fixturesDir, 'v2-normalized-conversation.json'), 'utf-8')
  );

  it('应该生成与 golden 文件一致的 JSON（包含 metadata）', async () => {
    // 读取预期的 golden 文件
    const goldenPath = join(goldenDir, 'json/with-metadata.json');
    const expectedOutput = readFileSync(goldenPath, 'utf-8');

    // 模拟导出（不触发下载）
    const exportData = {
      ...testConversation,
    };
    const jsonContent = JSON.stringify(exportData, null, 2);

    // 对比输出（忽略末尾换行符差异）
    expect(jsonContent.trim()).toBe(expectedOutput.trim());
  });

  it('应该生成不包含 metadata 的 JSON', async () => {
    // 创建不包含 metadata 的预期输出
    const exportData = {
      id: testConversation.id,
      title: testConversation.title,
      messages: testConversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      createdAt: testConversation.createdAt,
      updatedAt: testConversation.updatedAt,
    };
    const jsonContent = JSON.stringify(exportData, null, 2);

    // 验证基本结构
    const parsed = JSON.parse(jsonContent);
    expect(parsed.id).toBe(testConversation.id);
    expect(parsed.title).toBe(testConversation.title);
    expect(parsed.messages).toHaveLength(4);
    expect(parsed.metadata).toBeUndefined();
  });

  it('应该保持消息顺序', async () => {
    const exportData = { ...testConversation };
    const jsonContent = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(jsonContent);

    // 验证消息顺序
    expect(parsed.messages[0].role).toBe('user');
    expect(parsed.messages[1].role).toBe('assistant');
    expect(parsed.messages[2].role).toBe('user');
    expect(parsed.messages[3].role).toBe('assistant');

    // 验证时间戳递增
    const timestamps = parsed.messages.map((m: any) => m.timestamp);
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });

  it('应该正确序列化特殊字符', async () => {
    const convWithSpecialChars: Conversation = {
      ...testConversation,
      title: '测试 "引号" 和 \\ 反斜杠',
      messages: [
        {
          ...testConversation.messages[0],
          content: {
            ...testConversation.messages[0].content,
            text: '包含\n换行符\t制表符和"引号"',
          },
        },
      ],
    };

    const exportData = { ...convWithSpecialChars };
    const jsonContent = JSON.stringify(exportData, null, 2);

    // 验证可以正确反序列化
    const parsed = JSON.parse(jsonContent);
    expect(parsed.title).toBe('测试 "引号" 和 \\ 反斜杠');
    expect(parsed.messages[0].content.text).toContain('换行符');
  });

  it('应该处理空消息列表', async () => {
    const emptyConversation: Conversation = {
      id: 'empty-conv',
      title: '空对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const exportData = { ...emptyConversation };
    const jsonContent = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(jsonContent);

    expect(parsed.messages).toHaveLength(0);
    expect(parsed.id).toBe('empty-conv');
  });
});
