/**
 * 测试工厂函数
 * 用于创建测试数据
 */

import type { Conversation, Message } from '../../src/types';

/**
 * 创建测试消息
 */
export function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'user',
    content: { text: '测试消息' },
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * 创建测试对话
 */
export function createConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: '测试对话',
    messages: [createMessage()],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

/**
 * 创建多消息对话
 */
export function createMultiMessageConversation(
  messageCount: number,
  overrides: Partial<Conversation> = {}
): Conversation {
  const messages: Message[] = [];
  
  for (let i = 0; i < messageCount; i++) {
    messages.push(
      createMessage({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: Date.now() + i * 1000,
      })
    );
  }
  
  return {
    id: `conv-multi-${messageCount}`,
    title: `多消息对话 (${messageCount} 条)`,
    messages,
    createdAt: messages[0].timestamp,
    updatedAt: messages[messages.length - 1].timestamp,
    ...overrides,
  };
}

/**
 * 创建空对话
 */
export function createEmptyConversation(): Conversation {
  return {
    id: 'conv-empty',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * 创建包含特殊字符的消息
 */
export function createSpecialCharsMessage(): Message {
  return createMessage({
    content: {
      text: '特殊字符：\n\t"引号"\\反斜杠/正斜杠\n换行\r\n回车',
    },
  });
}

/**
 * 创建超长消息
 */
export function createLongMessage(length: number = 10000): Message {
  return createMessage({
    content: {
      text: 'a'.repeat(length),
    },
  });
}

/**
 * 创建平台特定的元数据
 */
export function createPlatformMetadata(platform: string): Record<string, any> {
  return {
    platform,
    version: '2.0',
    capturedAt: Date.now(),
  };
}
