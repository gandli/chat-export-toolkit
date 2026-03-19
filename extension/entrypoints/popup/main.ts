import type {
  ExportResponse,
  ExtensionMessageRequest,
  StatusResponse,
} from '../../src/shared/export-model';
import { EXTENSION_MESSAGE_TYPES } from '../../src/shared/messages';

const statusEl = document.querySelector<HTMLParagraphElement>('#status');
const resultEl = document.querySelector<HTMLParagraphElement>('#result');
const jsonButton = document.querySelector<HTMLButtonElement>('#export-json');
const markdownButton = document.querySelector<HTMLButtonElement>('#export-markdown');

void refreshStatus();

jsonButton?.addEventListener('click', () => {
  void exportCurrent('json');
});

markdownButton?.addEventListener('click', () => {
  void exportCurrent('markdown');
});

async function refreshStatus(): Promise<void> {
  const response = await sendMessageToActiveTab({
    type: EXTENSION_MESSAGE_TYPES.getStatus,
  }) as StatusResponse | null;

  if (!statusEl) {
    return;
  }

  if (!response?.ok || !response.provider) {
    statusEl.textContent = '无法连接当前标签页。';
    disableButtons(true);
    return;
  }

  statusEl.textContent = response.provider.detail;
  disableButtons(!response.provider.supported);
}

async function exportCurrent(format: 'json' | 'markdown'): Promise<void> {
  setResult('正在导出...');

  const response = await sendMessageToActiveTab({
    type: EXTENSION_MESSAGE_TYPES.exportCurrent,
    format,
  }) as ExportResponse | null;

  if (!response?.ok) {
    setResult(response?.error || '导出失败。');
    return;
  }

  const title = response.conversation?.title || response.conversation?.id || '当前对话';
  setResult(`已导出：${title}`);
}

async function sendMessageToActiveTab(
  message: ExtensionMessageRequest
): Promise<ExportResponse | StatusResponse | null> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab?.id) {
    return null;
  }

  return chrome.tabs.sendMessage(activeTab.id, message) as Promise<ExportResponse | StatusResponse>;
}

function disableButtons(disabled: boolean): void {
  jsonButton?.toggleAttribute('disabled', disabled);
  markdownButton?.toggleAttribute('disabled', disabled);
}

function setResult(message: string): void {
  if (resultEl) {
    resultEl.textContent = message;
  }
}
