export {};

declare global {
  interface ChromeRuntimeMessageSender {
    tab?: {
      id?: number;
      url?: string;
    };
  }

  interface ChromeTabsQueryInfo {
    active?: boolean;
    currentWindow?: boolean;
  }

  interface ChromeTab {
    id?: number;
    url?: string;
    title?: string;
  }

  interface ChromeRuntime {
    onInstalled?: {
      addListener(callback: () => void): void;
    };
    onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: ChromeRuntimeMessageSender,
          sendResponse: (response: unknown) => void
        ) => boolean | void
      ): void;
    };
    sendMessage(message: unknown): Promise<unknown>;
    lastError?: {
      message: string;
    };
  }

  interface ChromeTabs {
    query(queryInfo: ChromeTabsQueryInfo): Promise<ChromeTab[]>;
    sendMessage(tabId: number, message: unknown): Promise<unknown>;
  }

  interface ChromeDownloadOptions {
    url: string;
    filename?: string;
    saveAs?: boolean;
  }

  interface ChromeDownloads {
    download(options: ChromeDownloadOptions): Promise<number>;
  }

  interface ChromeApi {
    runtime: ChromeRuntime;
    tabs: ChromeTabs;
    downloads: ChromeDownloads;
  }

  const chrome: ChromeApi;
}
