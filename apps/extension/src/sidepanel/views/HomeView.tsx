import { useState } from 'react';
import { nanoid } from 'nanoid';
import type { Brief, Workspace } from '@/lib/types';
import { SummarizeButton } from '../components/SummarizeButton';
import { BriefCard } from '../components/BriefCard';
import { deleteWorkspace, saveWorkspace } from '@/lib/storage';

interface Props {
  workspaces: Workspace[];
  briefs: Brief[];
  onRefresh: () => Promise<void> | void;
  onOpenWorkspace: (id: string) => void;
}

export function HomeView({ workspaces, briefs, onRefresh, onOpenWorkspace }: Props) {
  const [newWsName, setNewWsName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateWorkspace = async () => {
    const name = newWsName.trim();
    if (!name) return;
    const now = Date.now();
    const ws: Workspace = {
      id: nanoid(),
      name,
      createdAt: now,
      updatedAt: now,
    };
    await saveWorkspace(ws);
    setNewWsName('');
    setCreating(false);
    await onRefresh();
  };

  const handleDeleteWorkspace = async (id: string, name: string) => {
    if (!confirm(`Delete workspace "${name}"? Briefs in it will be unfiled.`)) return;
    await deleteWorkspace(id);
    await onRefresh();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 border-b border-ink-200 bg-white">
        <SummarizeButton onCreated={() => onRefresh()} />
      </div>

      <section className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">Workspaces</h2>
          <button
            className="btn-ghost text-xs"
            onClick={() => setCreating(!creating)}
          >
            {creating ? 'Cancel' : '+ New'}
          </button>
        </div>

        {creating && (
          <div className="mb-2 flex gap-1.5">
            <input
              className="input flex-1 text-sm"
              autoFocus
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="e.g., CRMs 2026"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreateWorkspace();
                if (e.key === 'Escape') setCreating(false);
              }}
            />
            <button className="btn-primary text-xs" onClick={handleCreateWorkspace}>
              Create
            </button>
          </div>
        )}

        {workspaces.length === 0 && !creating && (
          <p className="text-xs text-ink-400 italic">
            No workspaces yet. Create one to start grouping briefs.
          </p>
        )}

        <ul className="space-y-1.5">
          {workspaces.map((ws) => {
            const count = briefs.filter((b) => b.workspaceId === ws.id).length;
            return (
              <li
                key={ws.id}
                className="card flex items-center justify-between hover:border-brand-500 cursor-pointer"
                onClick={() => onOpenWorkspace(ws.id)}
              >
                <div>
                  <p className="text-sm font-semibold">{ws.name}</p>
                  <p className="text-xs text-ink-400">
                    {count} brief{count === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  className="btn-ghost text-xs text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteWorkspace(ws.id, ws.name);
                  }}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="p-3 pt-0">
        <h2 className="mb-2 text-sm font-semibold text-ink-800">
          Recent briefs
          {briefs.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-ink-400">({briefs.length})</span>
          )}
        </h2>
        {briefs.length === 0 ? (
          <p className="text-xs text-ink-400 italic">
            No briefs yet. Click &ldquo;Summarize this tab&rdquo; above to start.
          </p>
        ) : (
          <div className="space-y-2">
            {briefs.slice(0, 20).map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                workspaces={workspaces}
                onChanged={() => onRefresh()}
                onOpenWorkspace={onOpenWorkspace}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
