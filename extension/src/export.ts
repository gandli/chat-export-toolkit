import { getAdapter, detectPlatform } from '../../src/adapters';
import {
  getNormalizer,
  yuanbaoToMarkdown,
  chatgptToMarkdown,
} from '../../src/normalizers';
import type { ExportFormat, PlatformType, RawConversation } from '../../src/types';
import type { DownloadPayload, ExtensionStatus } from './contracts';

type SupportedFormat = Extract<ExportFormat, 'json' | 'markdown'>;

const ENABLED_PLATFORMS: PlatformType[] = ['yuanbao', 'chatgpt'];

const MARKDOWN_SERIALIZERS: Partial<Record<PlatformType, (data: unknown) => string>> = {
  yuanbao: (data) => yuanbaoToMarkdown(data as never),
  chatgpt: (data) => chatgptToMarkdown(data as never),
};

export function getExtensionStatus(): ExtensionStatus {
  const platform = detectPlatform();

  if (!platform) {
    return {
      supported: false,
      platform: null,
      message: '当前页面不是已识别的聊天平台。',
    };
  }

  if (!ENABLED_PLATFORMS.includes(platform)) {
    return {
      supported: false,
      platform,
      message: `已识别平台 ${platform}，但未纳入扩展 MVP 首批支持。`,
    };
  }

  return {
    supported: true,
    platform,
    message: `已识别平台：${platform}`,
  };
}

export async function buildCurrentConversationExport(
  format: SupportedFormat
): Promise<DownloadPayload> {
  const status = getExtensionStatus();

  if (!status.supported || !status.platform) {
    throw new Error(status.message);
  }

  const adapter = getAdapter(status.platform);
  const normalizer = getNormalizer(status.platform);

  if (!adapter) {
    throw new Error(`未找到平台适配器：${status.platform}`);
  }
  if (!normalizer) {
    throw new Error(`未找到平台标准化器：${status.platform}`);
  }

  const rawConversation = await adapter.getConversation();
  if (!rawConversation) {
    throw new Error('未能从当前页面提取会话数据。');
  }

  const normalized = await normalizer.normalizeConversation(rawConversation as RawConversation);
  const baseName = sanitizeFilename(normalized.title || normalized.id || 'chat-export');

  if (format === 'json') {
    return {
      filename: `${baseName}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(normalized, null, 2),
    };
  }

  const serializer = MARKDOWN_SERIALIZERS[status.platform];
  if (!serializer) {
    throw new Error(`平台 ${status.platform} 暂无 Markdown 序列化实现。`);
  }

  return {
    filename: `${baseName}.md`,
    mimeType: 'text/markdown;charset=utf-8',
    content: serializer(rawConversation.data),
  };
}

function sanitizeFilename(input: string): string {
  return input.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'chat-export';
}
