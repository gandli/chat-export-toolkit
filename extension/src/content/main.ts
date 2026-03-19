import { getExporter } from '../../../src/exporters';
import type { Conversation } from '../../../src/types';
import type {
  DownloadRequest,
  DownloadResponse,
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

async function exportConversation(conversation: Conversation, format: 'markdown' | 'json'): Promise<void> {
  const exporter = getExporter(format);
  if (!exporter) {
    throw new Error(`未找到 ${format} 导出器。`);
  }

  const result = await exporter.exportConversation(conversation, {
    format,
    filename: undefined,
    includeMetadata: true,
    includeAttachments: false,
  });

  if (!result.success) {
    throw new Error(result.error || '导出失败。');
  }
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
    await exportConversation(conversation, request.format);

    return {
      ok: true,
      provider: await provider.getStatus(),
      conversation: {
        id: conversation.id,
        title: conversation.title,
      },
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
): Promise<ExportResponse | StatusResponse | DownloadResponse | null> {
  if (message.type === EXTENSION_MESSAGE_TYPES.getStatus) {
    return {
      ok: true,
      provider: getProviderStatus(),
    } satisfies StatusResponse;
  }

  if (message.type === EXTENSION_MESSAGE_TYPES.exportCurrent) {
    return handleExport(message);
  }

  if (message.type === EXTENSION_MESSAGE_TYPES.download) {
    return handleDownload(message);
  }

  return null;
}

async function handleDownload(request: DownloadRequest): Promise<DownloadResponse> {
  try {
    const url = URL.createObjectURL(
      new Blob([request.payload.content], { type: request.payload.mimeType })
    );

    try {
      const downloadId = await chrome.downloads.download({
        url,
        filename: request.payload.filename,
        saveAs: true,
      });

      return {
        ok: true,
        downloadId,
      };
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
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
