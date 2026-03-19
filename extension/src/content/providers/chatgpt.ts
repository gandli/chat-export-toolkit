import { ChatGPTAdapter } from '../../../../src/adapters/chatgpt';
import { ChatGPTRNormalizer } from '../../../../src/normalizers/chatgpt';
import type { Conversation, Message, MessageRole } from '../../../../src/types';
import type { ProviderStatus } from '../../shared/export-model';
import type { ExtensionProvider } from './base';

const CHATGPT_HOSTS = ['chat.openai.com', 'chatgpt.com'];

export class ChatGPTExtensionProvider implements ExtensionProvider {
  readonly id = 'chatgpt';
  readonly displayName = 'ChatGPT';
  readonly hosts = CHATGPT_HOSTS;

  matches(location: Location): boolean {
    return this.hosts.includes(location.hostname);
  }

  async getStatus(): Promise<ProviderStatus> {
    const supported = this.matches(window.location);

    return {
      providerId: this.id,
      displayName: this.displayName,
      supported,
      detail: supported
        ? '已识别 ChatGPT 页面，可导出当前对话。'
        : '当前页面不是 ChatGPT。',
    };
  }

  async collectCurrentConversation(): Promise<Conversation> {
    const adapter = new ChatGPTAdapter();
    const normalizer = new ChatGPTRNormalizer();

    try {
      const rawConversation = await adapter.getConversation();
      if (rawConversation) {
        return await normalizer.normalizeConversation(rawConversation);
      }
    } catch (error) {
      console.warn('[extension/chatgpt] Adapter path failed, falling back to DOM.', error);
    }

    return this.collectConversationFromDom();
  }

  private collectConversationFromDom(): Conversation {
    const messageNodes = this.collectMessageNodes();
    if (messageNodes.length === 0) {
      throw new Error('未在当前页面找到可导出的消息节点。');
    }

    const conversationId = this.extractConversationId();
    const title = this.extractTitle();
    const now = Date.now();

    const messages: Message[] = messageNodes
      .map((node, index) => this.nodeToMessage(node, conversationId, index))
      .filter((message): message is Message => Boolean(message));

    if (messages.length === 0) {
      throw new Error('页面中存在对话容器，但未提取到有效消息内容。');
    }

    const timestamps = messages.map((message) => message.timestamp).filter(Boolean);

    return {
      id: conversationId,
      title,
      messages,
      createdAt: timestamps.length > 0 ? Math.min(...timestamps) : now,
      updatedAt: timestamps.length > 0 ? Math.max(...timestamps) : now,
      metadata: {
        platform: this.id,
        extractionMode: 'dom-fallback',
        messageCount: messages.length,
        sourceUrl: window.location.href,
      },
    };
  }

  private collectMessageNodes(): HTMLElement[] {
    const direct = Array.from(
      document.querySelectorAll<HTMLElement>('[data-message-author-role]')
    );

    if (direct.length > 0) {
      return direct;
    }

    return Array.from(
      document.querySelectorAll<HTMLElement>('article[data-testid^="conversation-turn-"]')
    );
  }

  private nodeToMessage(node: HTMLElement, conversationId: string, index: number): Message | null {
    const role = this.resolveRole(node);
    const text = this.serializeNode(node).trim();

    if (!text) {
      return null;
    }

    return {
      id: `${conversationId}_dom_${index + 1}`,
      role,
      content: {
        text,
        metadata: {
          extractionMode: 'dom-fallback',
        },
      },
      timestamp: Date.now() + index,
      metadata: {
        platform: this.id,
        originalId: node.dataset.testid || node.dataset.messageId || `${index + 1}`,
      },
    };
  }

  private resolveRole(node: HTMLElement): MessageRole {
    const role =
      node.dataset.messageAuthorRole ||
      node.getAttribute('data-message-author-role') ||
      '';

    if (role === 'user') {
      return 'user';
    }

    if (role === 'assistant') {
      return 'assistant';
    }

    const text = node.textContent?.toLowerCase() || '';
    if (text.includes('chatgpt')) {
      return 'assistant';
    }

    return 'unknown';
  }

  private serializeNode(node: HTMLElement): string {
    const root = node.matches('[data-message-author-role]')
      ? node
      : node.querySelector<HTMLElement>('[data-message-author-role]') || node;

    const markdown = Array.from(root.childNodes)
      .map((child) => this.serializeChild(child))
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return markdown || (root.textContent?.trim() ?? '');
  }

  private serializeChild(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (!(node instanceof HTMLElement)) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();

    if (tagName === 'br') {
      return '\n';
    }

    if (tagName === 'pre') {
      const code = node.innerText.trim();
      return code ? `\n\`\`\`\n${code}\n\`\`\`\n` : '';
    }

    if (tagName === 'code') {
      return node.closest('pre') ? '' : `\`${node.innerText.trim()}\``;
    }

    if (tagName === 'li') {
      return `- ${this.serializeChildren(node).trim()}\n`;
    }

    if (tagName === 'ul' || tagName === 'ol') {
      return `\n${this.serializeChildren(node).trim()}\n`;
    }

    if (/^h[1-6]$/.test(tagName)) {
      const level = Number(tagName[1]);
      return `\n${'#'.repeat(level)} ${this.serializeChildren(node).trim()}\n\n`;
    }

    if (tagName === 'blockquote') {
      return `\n> ${this.serializeChildren(node).trim().replace(/\n/g, '\n> ')}\n\n`;
    }

    if (tagName === 'p') {
      return `${this.serializeChildren(node).trim()}\n\n`;
    }

    return this.serializeChildren(node);
  }

  private serializeChildren(node: HTMLElement): string {
    return Array.from(node.childNodes)
      .map((child) => this.serializeChild(child))
      .join('');
  }

  private extractConversationId(): string {
    const match = window.location.pathname.match(/\/(?:c|chat|conversation)\/([^/?#]+)/i);
    return match?.[1] || `chatgpt-${Date.now()}`;
  }

  private extractTitle(): string {
    const trimmed = document.title.replace(/\s*[-|].*$/, '').trim();
    return trimmed || 'ChatGPT Chat';
  }
}
