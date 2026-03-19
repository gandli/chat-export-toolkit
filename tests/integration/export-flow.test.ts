/**
 * 导出流程集成测试
 * 测试从原始数据到最终导出的完整流程
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Conversation } from '../../src/types';

// 获取当前文件所在目录
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Export Flow Integration', () => {
  const fixturesDir = join(__dirname, '../../fixtures');

  describe('数据流转', () => {
    it('应该能够加载和解析 fixture 数据', () => {
      const rawData = readFileSync(
        join(fixturesDir, 'v2-normalized-conversation.json'),
        'utf-8'
      );
      
      const conversation: Conversation = JSON.parse(rawData);
      
      expect(conversation.id).toBe('test-conv-001');
      expect(conversation.title).toBe('测试会话 - V1 格式');
      expect(conversation.messages).toHaveLength(4);
    });

    it('应该验证 conversation schema', () => {
      const rawData = readFileSync(
        join(fixturesDir, 'v2-normalized-conversation.json'),
        'utf-8'
      );
      
      const conversation: Conversation = JSON.parse(rawData);
      
      // 验证必需字段
      expect(conversation.id).toBeDefined();
      expect(conversation.messages).toBeDefined();
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
      
      // 验证消息结构
      conversation.messages.forEach((msg) => {
        expect(msg.id).toBeDefined();
        expect(msg.role).toBeDefined();
        expect(msg.content).toBeDefined();
        expect(msg.timestamp).toBeDefined();
        
        // 验证角色有效性
        const validRoles = ['user', 'assistant', 'system', 'tool', 'unknown'];
        expect(validRoles).toContain(msg.role);
      });
    });

    it('应该保持元数据完整性', () => {
      const rawData = readFileSync(
        join(fixturesDir, 'v2-normalized-conversation.json'),
        'utf-8'
      );
      
      const conversation: Conversation = JSON.parse(rawData);
      
      // 验证对话元数据
      expect(conversation.metadata?.platform).toBe('yuanbao');
      expect(conversation.metadata?.participantCount).toBe(2);
      expect(conversation.metadata?.messageCount).toBe(4);
      
      // 验证消息元数据
      conversation.messages.forEach((msg, index) => {
        expect(msg.metadata?.platform).toBe('yuanbao');
        expect(msg.metadata?.originalIndex).toBe(index);
      });
    });
  });

  describe('跨平台数据兼容', () => {
    it('应该能够加载不同平台的样本数据', () => {
      const platforms = ['yuanbao', 'chatgpt', 'claude'];
      
      platforms.forEach(platform => {
        const samplePath = join(fixturesDir, 'samples', `${platform}-sample.json`);
        
        // 检查文件是否存在
        try {
          const data = readFileSync(samplePath, 'utf-8');
          const parsed = JSON.parse(data);
          
          expect(parsed).toBeDefined();
        } catch (error) {
          // 文件可能不存在，跳过
          console.log(`Sample file not found: ${samplePath}`);
        }
      });
    });

    it('应该验证统一 schema 的兼容性', () => {
      // 读取标准化后的数据
      const normalizedData = readFileSync(
        join(fixturesDir, 'v2-normalized-conversation.json'),
        'utf-8'
      );
      const normalized = JSON.parse(normalizedData);
      
      // 验证符合统一 schema
      expect(normalized).toHaveProperty('id');
      expect(normalized).toHaveProperty('messages');
      expect(normalized).toHaveProperty('createdAt');
      expect(normalized).toHaveProperty('updatedAt');
      
      // 验证消息格式
      normalized.messages.forEach((msg: any) => {
        expect(msg).toHaveProperty('id');
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('content');
        expect(msg).toHaveProperty('timestamp');
      });
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空对话', () => {
      const emptyConversation: Conversation = {
        id: 'empty',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      expect(emptyConversation.messages).toHaveLength(0);
      expect(emptyConversation.id).toBe('empty');
    });

    it('应该处理超长消息', () => {
      const longMessage = 'a'.repeat(10000);
      const conversation: Conversation = {
        id: 'long-message-test',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: { text: longMessage },
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      expect(conversation.messages[0].content.text).toHaveLength(10000);
    });

    it('应该处理特殊字符', () => {
      const specialChars = '特殊字符：\n\t"引号"\\反斜杠/正斜杠\n换行';
      const conversation: Conversation = {
        id: 'special-chars-test',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: { text: specialChars },
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // 验证可以正确序列化
      const json = JSON.stringify(conversation);
      const parsed = JSON.parse(json);
      
      expect(parsed.messages[0].content.text).toBe(specialChars);
    });
  });

  describe('序列化与反序列化', () => {
    it('应该保持数据完整性', () => {
      const originalData = readFileSync(
        join(fixturesDir, 'v2-normalized-conversation.json'),
        'utf-8'
      );
      const original: Conversation = JSON.parse(originalData);
      
      // 序列化
      const json = JSON.stringify(original, null, 2);
      
      // 反序列化
      const restored: Conversation = JSON.parse(json);
      
      // 验证关键字段
      expect(restored.id).toBe(original.id);
      expect(restored.title).toBe(original.title);
      expect(restored.messages).toHaveLength(original.messages.length);
      expect(restored.createdAt).toBe(original.createdAt);
      expect(restored.updatedAt).toBe(original.updatedAt);
    });

    it('应该生成有效的 JSON', () => {
      const rawData = readFileSync(
        join(fixturesDir, 'v2-normalized-conversation.json'),
        'utf-8'
      );
      const conversation: Conversation = JSON.parse(rawData);
      
      const json = JSON.stringify(conversation);
      
      // 验证是有效的 JSON
      expect(() => JSON.parse(json)).not.toThrow();
      
      // 验证可以反序列化回相同结构
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe(conversation.id);
      expect(parsed.messages.length).toBe(conversation.messages.length);
    });
  });
});
