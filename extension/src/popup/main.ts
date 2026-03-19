import type {
  ExportResponse,
  ExtensionExportFormat,
  StatusResponse,
} from '../shared/export-model';
import { EXTENSION_MESSAGE_TYPES } from '../shared/messages';
import './styles.css';

const providerNameElement = document.querySelector<HTMLElement>('#provider-name');
const providerDetailElement = document.querySelector<HTMLElement>('#provider-detail');
const markdownButton = document.querySelector<HTMLButtonElement>('#export-markdown');
const jsonButton = document.querySelector<HTMLButtonElement>('#export-json');

function setBusyState(isBusy: boolean): void {
  if (markdownButton) {
    markdownButton.disabled = isBusy;
  }

  if (jsonButton) {
    jsonButton.disabled = isBusy;
  }
}

function setStatus(name: string, detail: string, supported: boolean): void {
  if (providerNameElement) {
    providerNameElement.textContent = name;
  }

  if (providerDetailElement) {
    providerDetailElement.textContent = detail;
  }

  if (markdownButton) {
    markdownButton.disabled = !supported;
  }

  if (jsonButton) {
    jsonButton.disabled = !supported;
  }
}

async function getActiveTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab?.id) {
    throw new Error('未找到当前活动标签页。');
  }

  return activeTab.id;
}

async function queryStatus(): Promise<void> {
  try {
    const tabId = await getActiveTabId();
    const response = await chrome.tabs.sendMessage(tabId, {
      type: EXTENSION_MESSAGE_TYPES.getStatus,
    }) as StatusResponse;

    if (!response.ok) {
      throw new Error('无法读取当前站点状态。');
    }

    setStatus(
      response.provider.displayName,
      response.provider.detail,
      response.provider.supported
    );
  } catch (error) {
    const detail = chrome.runtime.lastError?.message ||
      (error instanceof Error ? error.message : String(error));
    setStatus('不可用', detail, false);
  }
}

async function exportCurrentConversation(format: ExtensionExportFormat): Promise<void> {
  setBusyState(true);

  try {
    const tabId = await getActiveTabId();
    const response = await chrome.tabs.sendMessage(tabId, {
      type: EXTENSION_MESSAGE_TYPES.exportCurrent,
      format,
    }) as ExportResponse;

    if (!response.ok) {
      throw new Error(response.error || '导出失败。');
    }

    const title = response.conversation?.title || response.conversation?.id || '当前对话';
    setStatus(
      response.provider?.displayName || '已导出',
      `已导出：${title}`,
      true
    );
  } catch (error) {
    const detail = chrome.runtime.lastError?.message ||
      (error instanceof Error ? error.message : String(error));
    setStatus('导出失败', detail, false);
  } finally {
    setBusyState(false);
  }
}

markdownButton?.addEventListener('click', () => {
  void exportCurrentConversation('markdown');
});

jsonButton?.addEventListener('click', () => {
  void exportCurrentConversation('json');
});

void queryStatus();
