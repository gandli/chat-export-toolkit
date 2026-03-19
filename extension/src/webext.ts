type RuntimeApi = typeof chrome.runtime;
type TabsApi = typeof chrome.tabs;
type DownloadsApi = typeof chrome.downloads;

declare const browser: {
  runtime?: RuntimeApi;
  tabs?: TabsApi;
  downloads?: DownloadsApi;
} | undefined;

export function getRuntimeApi(): RuntimeApi {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser.runtime;
  }
  return chrome.runtime;
}

export function getTabsApi(): TabsApi {
  if (typeof browser !== 'undefined' && browser.tabs) {
    return browser.tabs;
  }
  return chrome.tabs;
}

export function getDownloadsApi(): DownloadsApi {
  if (typeof browser !== 'undefined' && browser.downloads) {
    return browser.downloads;
  }
  return chrome.downloads;
}
