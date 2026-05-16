import { useState } from 'react';
import type { Brief, Workspace } from '@/lib/types';
import { deleteBrief, deleteComparisonRow, saveBrief } from '@/lib/storage';

interface Props {
  brief: Brief;
  workspaces: Workspace[];
  onChanged: () => void;
  onOpenWorkspace?: (id: string) => void;
}

export function BriefCard({ brief, workspaces, onChanged, onOpenWorkspace }: Props) {
  const [expanded, setExpanded] = useState(false);
  const current = workspaces.find((w) => w.id === brief.workspaceId);

  const handleMove = async (workspaceId: string | null) => {
    const wasInDifferentWorkspace =
      brief.workspaceId !== null && brief.workspaceId !== workspaceId;
    if (wasInDifferentWorkspace) {
      await deleteComparisonRow(brief.id);
    }
    await saveBrief({ ...brief, workspaceId });
    onChanged();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete brief "${brief.title}"?`)) return;
    await deleteBrief(brief.id);
    onChanged();
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <a
            href={brief.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-ink-900 hover:text-brand-600 line-clamp-2"
          >
            {brief.title}
          </a>
          <p className="mt-0.5 text-xs text-ink-400 truncate">{brief.domain}</p>
        </div>
        <button
          className="btn-ghost text-xs"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▴' : '▾'}
        </button>
      </div>

      <ul className="mt-2 space-y-1">
        {brief.tldr.map((bullet, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-ink-800 leading-relaxed">
            <span className="text-brand-600">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {expanded && brief.entities.length > 0 && (
        <div className="mt-3 border-t border-ink-200 pt-2">
          <p className="label mb-1.5">Entities</p>
          <dl className="space-y-1 text-xs">
            {brief.entities.map((entity, i) => (
              <div key={i} className="flex gap-2">
                <dt className="text-ink-600 capitalize whitespace-nowrap">
                  {entity.key.replace(/_/g, ' ')}:
                </dt>
                <dd className="text-ink-900">{entity.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-200 pt-2">
        <div className="flex items-center gap-1.5">
          {current && onOpenWorkspace ? (
            <button
              className="chip hover:bg-brand-100 hover:text-brand-700 transition-colors"
              onClick={() => onOpenWorkspace(current.id)}
              title="Open workspace"
            >
              {current.name}
            </button>
          ) : (
            <select
              className="text-xs rounded border border-ink-200 bg-white px-1.5 py-0.5"
              value={brief.workspaceId ?? ''}
              onChange={(e) => handleMove(e.target.value || null)}
            >
              <option value="">No workspace</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <button className="btn-ghost text-xs text-red-600" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
