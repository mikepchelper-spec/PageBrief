import { useState } from 'react';
import { nanoid } from 'nanoid';
import { extractActivePage } from '@/lib/messaging';
import { LLMError, summarizePage } from '@/lib/llm';
import { findBriefByHash, saveBrief } from '@/lib/storage';
import { hashString } from '@/lib/crypto';
import type { Brief } from '@/lib/types';

interface Props {
  defaultWorkspaceId?: string | null;
  onCreated: (brief: Brief) => void;
}

type Status = 'idle' | 'extracting' | 'summarizing' | 'error';

export function SummarizeButton({ defaultWorkspaceId = null, onCreated }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setStatus('extracting');
    try {
      const page = await extractActivePage();
      const contentHash = await hashString(page.url + '|' + page.content);
      const existing = await findBriefByHash(contentHash);
      if (existing) {
        onCreated(existing);
        setStatus('idle');
        return;
      }

      setStatus('summarizing');
      const summary = await summarizePage({
        title: page.title,
        url: page.url,
        content: page.content,
      });

      const brief: Brief = {
        id: nanoid(),
        workspaceId: defaultWorkspaceId ?? null,
        url: page.url,
        title: page.title,
        domain: page.domain,
        tldr: summary.tldr,
        entities: summary.entities,
        fullContent: page.content.slice(0, 30000),
        contentHash,
        createdAt: Date.now(),
      };
      await saveBrief(brief);
      onCreated(brief);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      if (err instanceof LLMError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  const isWorking = status === 'extracting' || status === 'summarizing';

  return (
    <div>
      <button
        className="btn-primary w-full"
        onClick={handleClick}
        disabled={isWorking}
      >
        {status === 'extracting' && 'Reading page…'}
        {status === 'summarizing' && 'Summarizing…'}
        {(status === 'idle' || status === 'error') && '✨ Summarize this tab'}
      </button>
      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
