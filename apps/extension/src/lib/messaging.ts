import type { ExtractedPage } from './types';

interface ExtractResponse {
  ok: boolean;
  page?: ExtractedPage;
  error?: string;
}

export async function extractActivePage(): Promise<ExtractedPage> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    throw new Error('No active tab found.');
  }
  const tabId = activeTab.id;
  const url = activeTab.url ?? '';

  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url === ''
  ) {
    throw new Error(
      'Cannot extract content from this page (browser internal URLs are not accessible).',
    );
  }

  let response: ExtractResponse | undefined;
  try {
    response = (await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_PAGE' })) as
      | ExtractResponse
      | undefined;
  } catch {
    throw new Error('Page reader not ready on this tab. Reload the page and try again.');
  }

  if (!response || !response.ok || !response.page) {
    throw new Error(response?.error ?? 'Page extraction returned no result.');
  }
  if (response.page.content.length < 50) {
    throw new Error('Page content was too short to summarize.');
  }
  return response.page;
}

export async function openOptions(): Promise<void> {
  await chrome.runtime.openOptionsPage();
}
