import { Readability } from '@mozilla/readability';
import type { ExtractedPage } from '@/lib/types';

function extractPage(): ExtractedPage {
  const docClone = document.cloneNode(true) as Document;
  const reader = new Readability(docClone, {
    debug: false,
    charThreshold: 200,
  });
  const article = reader.parse();

  const url = window.location.href;
  const domain = window.location.hostname.replace(/^www\./, '');
  const title = article?.title ?? document.title ?? domain;

  const rawText = article?.textContent ?? document.body.innerText ?? '';
  const content = rawText
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const excerpt = article?.excerpt ?? content.slice(0, 240);

  return { title, url, domain, content, excerpt };
}

interface IncomingMessage {
  type?: string;
}

chrome.runtime.onMessage.addListener((message: IncomingMessage, _sender, sendResponse) => {
  if (message && message.type === 'EXTRACT_PAGE') {
    try {
      const page = extractPage();
      sendResponse({ ok: true, page });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return false;
  }
  return false;
});
