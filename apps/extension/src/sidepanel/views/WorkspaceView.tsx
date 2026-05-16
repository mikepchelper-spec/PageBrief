import { useCallback, useEffect, useState } from 'react';
import type { Brief, ComparisonRow, Workspace } from '@/lib/types';
import {
  getWorkspace,
  listBriefs,
  listComparisonRows,
  listWorkspaces,
  saveComparisonRow,
  saveWorkspace,
} from '@/lib/storage';
import { LLMError, deriveSchema, fillRow } from '@/lib/llm';
import { BriefCard } from '../components/BriefCard';
import { SummarizeButton } from '../components/SummarizeButton';
import { ComparisonTable } from '../components/ComparisonTable';
import { workspaceToMarkdown, workspaceToCsv, downloadFile, copyToClipboard } from '../utils/export';

interface Props {
  workspaceId: string;
  onBack: () => void;
  onRefresh: () => Promise<void> | void;
}

type RegenState = 'idle' | 'deriving' | 'filling' | 'error';

export function WorkspaceView({ workspaceId, onBack, onRefresh }: Props) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [regenState, setRegenState] = useState<RegenState>('idle');
  const [regenError, setRegenError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [ws, all, bs, rs] = await Promise.all([
      getWorkspace(workspaceId),
      listWorkspaces(),
      listBriefs(workspaceId),
      listComparisonRows(workspaceId),
    ]);
    setWorkspace(ws ?? null);
    setAllWorkspaces(all);
    setBriefs(bs);
    setRows(rs);
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRegenerate = async () => {
    if (!workspace) return;
    if (briefs.length < 2) {
      setRegenError('Add at least 2 briefs to derive a comparison table.');
      setRegenState('error');
      return;
    }
    setRegenError(null);
    setRegenState('deriving');
    try {
      const schema = await deriveSchema(briefs);
      const updatedWs: Workspace = {
        ...workspace,
        schema,
        updatedAt: Date.now(),
      };
      await saveWorkspace(updatedWs);
      setWorkspace(updatedWs);

      setRegenState('filling');
      const existingRows = new Map(rows.map((r) => [r.briefId, r] as const));
      for (const brief of briefs) {
        const existing = existingRows.get(brief.id);
        const preservedCells: Record<string, string> = {};
        if (existing) {
          for (const k of existing.editedKeys) {
            preservedCells[k] = existing.cells[k];
          }
        }
        const cells = await fillRow({ schema, brief });
        for (const [k, v] of Object.entries(preservedCells)) {
          cells[k] = v;
        }
        await saveComparisonRow(workspaceId, {
          briefId: brief.id,
          cells,
          editedKeys: existing?.editedKeys ?? [],
        });
      }
      await refresh();
      await onRefresh();
      setRegenState('idle');
    } catch (err) {
      setRegenState('error');
      setRegenError(err instanceof LLMError ? err.message : String(err));
    }
  };

  const handleExportMarkdown = async () => {
    if (!workspace) return;
    const md = workspaceToMarkdown(workspace, briefs, rows);
    await copyToClipboard(md);
    setExportMessage('Markdown copied to clipboard');
    setTimeout(() => setExportMessage(null), 2000);
  };

  const handleExportCsv = () => {
    if (!workspace) return;
    const csv = workspaceToCsv(workspace, briefs, rows);
    const filename = `pagebrief-${workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    downloadFile(filename, csv, 'text/csv');
    setExportMessage('CSV downloaded');
    setTimeout(() => setExportMessage(null), 2000);
  };

  if (!workspace) {
    return (
      <div className="p-4 text-sm text-ink-600">
        Workspace not found.
        <button className="btn-ghost ml-2 text-xs" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-ink-200 bg-white p-3">
        <button className="btn-ghost text-xs mb-2" onClick={onBack}>
          ← Back
        </button>
        <h1 className="text-lg font-bold">{workspace.name}</h1>
        <p className="text-xs text-ink-400 mt-0.5">
          {briefs.length} brief{briefs.length === 1 ? '' : 's'}
        </p>
        <div className="mt-3">
          <SummarizeButton defaultWorkspaceId={workspaceId} onCreated={() => void refresh()} />
        </div>
      </div>

      <section className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">Comparison</h2>
          <div className="flex gap-1.5">
            <button
              className="btn-secondary text-xs"
              onClick={handleRegenerate}
              disabled={regenState === 'deriving' || regenState === 'filling' || briefs.length < 2}
            >
              {regenState === 'deriving' && 'Deriving schema…'}
              {regenState === 'filling' && 'Filling cells…'}
              {(regenState === 'idle' || regenState === 'error') &&
                (workspace.schema ? 'Refresh table' : 'Generate table')}
            </button>
          </div>
        </div>

        {regenError && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {regenError}
          </div>
        )}

        {workspace.schema ? (
          <>
            <ComparisonTable
              schema={workspace.schema}
              briefs={briefs}
              rows={rows}
              onChanged={() => void refresh()}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button className="btn-secondary text-xs" onClick={handleExportMarkdown}>
                📋 Copy as Markdown
              </button>
              <button className="btn-secondary text-xs" onClick={handleExportCsv}>
                ⬇ Download CSV
              </button>
              {exportMessage && (
                <span className="text-xs text-green-700">{exportMessage}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-400 italic">
            {briefs.length < 2
              ? 'Add 2+ briefs to generate a comparison table.'
              : 'Click "Generate table" to derive a comparison schema.'}
          </p>
        )}
      </section>

      <section className="p-3 pt-0">
        <h2 className="mb-2 text-sm font-semibold text-ink-800">Briefs</h2>
        {briefs.length === 0 ? (
          <p className="text-xs text-ink-400 italic">
            No briefs in this workspace yet. Summarize a tab above to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {briefs.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                workspaces={allWorkspaces}
                onChanged={() => void refresh()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
