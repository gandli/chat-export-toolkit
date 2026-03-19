import type {
  DownloadRequest,
  DownloadResponse,
  ExtensionMessageRequest,
} from '../shared/export-model';
import { EXTENSION_MESSAGE_TYPES } from '../shared/messages';

export function registerBackgroundMessageListener(): void {
  chrome.runtime.onInstalled?.addListener(() => {
    console.log('[Chat Export Toolkit] browser extension MVP installed');
  });

  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const typedMessage = message as ExtensionMessageRequest;

    if (typedMessage.type !== EXTENSION_MESSAGE_TYPES.download) {
      return false;
    }

    void handleDownload(typedMessage).then((response) => {
      sendResponse(response);
    });

    return true;
  });
}

async function handleDownload(request: DownloadRequest): Promise<DownloadResponse> {
  try {
    const downloadId = await chrome.downloads.download({
      url: toDataUrl(request.payload.content, request.payload.mimeType),
      filename: request.payload.filename,
      saveAs: true,
    });

    return { ok: true, downloadId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function toDataUrl(content: string, mimeType: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return `data:${mimeType};base64,${btoa(binary)}`;
}
