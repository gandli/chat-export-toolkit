/**
 * 类型定义契约测试
 * 验证 Conversation 和 Message schema 符合预期
 */

import { describe, it, expect } from 'vitest';
import type { Conversation, Message, MessageRole } from '../../src/types';

describe('Conversation Schema Contract', () => {
  describe('必需字段', () => {
    it('Conversation 必须包含 id', () => {
      const conv: Conversation = {
        id: 'test-conv-1',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      expect(conv.id).toBeDefined();
      expect(typeof conv.id).toBe('string');
    });

    it('Conversation 必须包含 messages 数组', () => {
      const conv: Conversation = {
        id: 'test-conv-2',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      expect(conv.messages).toBeInstanceOf(Array);
      expect(Array.isArray(conv.messages)).toBe(true);
    });

    it('Conversation 必须包含时间戳', () => {
      const now = Date.now();
      const conv: Conversation = {
        id: 'test-conv-3',
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      
      expect(conv.createdAt).toBeTypeOf('number');
      expect(conv.updatedAt).toBeTypeOf('number');
      expect(conv.createdAt).toBeLessThanOrEqual(conv.updatedAt);
    });
  });

  describe('可选字段', () => {
    it('Conversation 可以包含 title', () => {
      const convWithouTitle: Conversation = {
        id: 'test-conv-4',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const convWithTitle: Conversation = {
        id: 'test-conv-5',
        title: '测试对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      expect(convWithouTitle.title).toBeUndefined();
      expect(convWithTitle.title).toBe('测试对话');
    });

    it('Conversation 可以包含 metadata', () => {
      const convWithoutMetadata: Conversation = {
        id: 'test-conv-6',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const convWithMetadata: Conversation = {
        id: 'test-conv-7',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          platform: 'yuanbao',
          version: '2.0',
        },
      };
      
      expect(convWithoutMetadata.metadata).toBeUndefined();
      expect(convWithMetadata.metadata?.platform).toBe('yuanbao');
    });
  });
});

describe('Message Schema Contract', () => {
  describe('必需字段', () => {
    it('Message 必须包含 id', () => {
      const msg: Message = {
        id: 'msg-1',
        role: 'user',
        content: { text: 'hello' },
        timestamp: Date.now(),
      };
      
      expect(msg.id).toBeDefined();
      expect(typeof msg.id).toBe('string');
    });

    it('Message 必须包含 role', () => {
      const validRoles: MessageRole[] = ['user', 'assistant', 'system', 'tool', 'unknown'];
      
      validRoles.forEach(role => {
        const msg: Message = {
          id: `msg-${role}`,
          role,
          content: { text: 'test' },
          timestamp: Date.now(),
        };
        
        expect(validRoles).toContain(msg.role);
      });
    });

    it('Message 必须包含 content', () => {
      const msg: Message = {
        id: 'msg-content',
        role: 'user',
        content: { text: 'test content' },
        timestamp: Date.now(),
      };
      
      expect(msg.content).toBeDefined();
      expect(msg.content.text).toBe('test content');
    });

    it('Message 必须包含 timestamp', () => {
      const msg: Message = {
        id: 'msg-timestamp',
        role: 'user',
        content: { text: 'test' },
        timestamp: 1234567890,
      };
      
      expect(msg.timestamp).toBeTypeOf('number');
      expect(msg.timestamp).toBeGreaterThan(0);
    });
  });

  describe('可选字段', () => {
    it('Message 可以包含 metadata', () => {
      const msgWithoutMetadata: Message = {
        id: 'msg-no-meta',
        role: 'user',
        content: { text: 'test' },
        timestamp: Date.now(),
      };

      const msgWithMetadata: Message = {
        id: 'msg-with-meta',
        role: 'user',
        content: { text: 'test' },
        timestamp: Date.now(),
        metadata: {
          model: 'gpt-4',
          tokens: 100,
        },
      };
      
      expect(msgWithoutMetadata.metadata).toBeUndefined();
      expect(msgWithMetadata.metadata?.model).toBe('gpt-4');
    });

    it('Message content 可以包含 attachments', () => {
      const msg: Message = {
        id: 'msg-attachments',
        role: 'user',
        content: {
          text: '带附件的消息',
          attachments: [
            {
              id: 'att-1',
              type: 'image',
              url: 'https://example.com/image.png',
            },
          ],
        },
        timestamp: Date.now(),
      };
      
      expect(msg.content.attachments).toHaveLength(1);
    });
  });
});

describe('Message Role Validation', () => {
  it('user 角色应该有效', () => {
    const role: MessageRole = 'user';
    expect(['user', 'assistant', 'system', 'tool', 'unknown']).toContain(role);
  });

  it('assistant 角色应该有效', () => {
    const role: MessageRole = 'assistant';
    expect(['user', 'assistant', 'system', 'tool', 'unknown']).toContain(role);
  });

  it('system 角色应该有效', () => {
    const role: MessageRole = 'system';
    expect(['user', 'assistant', 'system', 'tool', 'unknown']).toContain(role);
  });

  it('tool 角色应该有效', () => {
    const role: MessageRole = 'tool';
    expect(['user', 'assistant', 'system', 'tool', 'unknown']).toContain(role);
  });

  it('unknown 角色应该有效', () => {
    const role: MessageRole = 'unknown';
    expect(['user', 'assistant', 'system', 'tool', 'unknown']).toContain(role);
  });
});
