import type { ExtractedPage } from './types';

export async function extractActivePage(): Promise<ExtractedPage> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    throw new Error('No active tab found.');
  }
  const tabId = activeTab.id;
  const url = activeTab.url ?? '';

  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url === '') {
    throw new Error('Cannot extract content from this page (chrome:// URLs are not accessible).');
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content/extractor.ts'],
  });

  const result = results[0]?.result as ExtractedPage | undefined;
  if (!result) {
    throw new Error('Page extraction returned no result.');
  }
  if (!result.content || result.content.length < 50) {
    throw new Error('Page content was too short to summarize.');
  }
  return result;
}

export async function openOptions(): Promise<void> {
  await chrome.runtime.openOptionsPage();
}
