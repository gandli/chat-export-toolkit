import { getExporter } from '../../../src/exporters';
import type { Conversation } from '../../../src/types';
import type {
  ExportRequest,
  ExportResponse,
  ExtensionMessageRequest,
  ProviderStatus,
  StatusResponse,
} from '../shared/export-model';
import { EXTENSION_MESSAGE_TYPES } from '../shared/messages';
import { detectProvider } from './providers';

export function getProviderStatus(): ProviderStatus {
  const provider = detectProvider(window.location);

  if (!provider) {
    return {
      providerId: 'unsupported',
      displayName: '未支持站点',
      supported: false,
      detail: `当前页面 ${window.location.hostname} 暂未接入浏览器扩展 MVP。`,
    };
  }

  return {
    providerId: provider.id,
    displayName: provider.displayName,
    supported: true,
    detail: `已识别 ${provider.displayName}，可导出当前对话。`,
  };
}

async function exportConversation(
  conversation: Conversation,
  format: 'markdown' | 'json'
): Promise<{ filename: string; mimeType: string; content: string }> {
  const exporter = getExporter(format);
  if (!exporter) {
    throw new Error(`未找到 ${format} 导出器。`);
  }

  const result = await exporter.exportConversation(conversation, {
    format,
    filename: undefined,
    download: false,
    includeMetadata: true,
    includeAttachments: false,
  });

  if (!result.success || !result.outputPath || !result.content || !result.mimeType) {
    throw new Error(result.error || '导出失败。');
  }

  return {
    filename: result.outputPath,
    mimeType: result.mimeType,
    content: result.content,
  };
}

async function handleExport(request: ExportRequest): Promise<ExportResponse> {
  const provider = detectProvider(window.location);

  if (!provider) {
    return {
      ok: false,
      provider: getProviderStatus(),
      error: '当前页面未匹配到可用 provider。',
    };
  }

  try {
    const conversation = await provider.collectCurrentConversation();
    const download = await exportConversation(conversation, request.format);

    return {
      ok: true,
      provider: await provider.getStatus(),
      conversation: {
        id: conversation.id,
        title: conversation.title,
      },
      download,
    };
  } catch (error) {
    return {
      ok: false,
      provider: await provider.getStatus(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleExtensionMessage(
  message: ExtensionMessageRequest
): Promise<ExportResponse | StatusResponse | null> {
  if (message.type === EXTENSION_MESSAGE_TYPES.getStatus) {
    return {
      ok: true,
      provider: getProviderStatus(),
    } satisfies StatusResponse;
  }

  if (message.type === EXTENSION_MESSAGE_TYPES.exportCurrent) {
    return handleExport(message);
  }

  return null;
}

export function registerContentMessageListener(): void {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const typedMessage = message as ExtensionMessageRequest;

    void handleExtensionMessage(typedMessage).then((response) => {
      if (response) {
        sendResponse(response);
      }
    });

    return true;
  });
}
