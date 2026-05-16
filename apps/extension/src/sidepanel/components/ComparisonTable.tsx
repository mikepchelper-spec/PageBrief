import { useState } from 'react';
import type { Brief, ComparisonRow, ComparisonSchema, SchemaColumn } from '@/lib/types';
import { saveComparisonRow } from '@/lib/storage';

interface Props {
  schema: ComparisonSchema;
  briefs: Brief[];
  rows: ComparisonRow[];
  onChanged: () => void;
}

export function ComparisonTable({ schema, briefs, rows, onChanged }: Props) {
  const rowByBrief = new Map(rows.map((r) => [r.briefId, r] as const));

  const handleCellEdit = async (briefId: string, columnKey: string, value: string) => {
    const existing = rowByBrief.get(briefId);
    if (!existing) return;
    const next: ComparisonRow = {
      ...existing,
      cells: { ...existing.cells, [columnKey]: value },
      editedKeys: Array.from(new Set([...existing.editedKeys, columnKey])),
    };
    const ws = briefs.find((b) => b.id === briefId)?.workspaceId;
    if (!ws) return;
    await saveComparisonRow(ws, next);
    onChanged();
  };

  return (
    <div className="overflow-x-auto border border-ink-200 rounded-md bg-white">
      <table className="w-full text-xs">
        <thead className="bg-ink-100">
          <tr>
            <th className="text-left px-2 py-1.5 font-semibold text-ink-800 sticky left-0 bg-ink-100 border-r border-ink-200">
              Item
            </th>
            {schema.columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-2 py-1.5 font-semibold text-ink-800 whitespace-nowrap"
                title={col.derivedFrom}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {briefs.map((brief) => {
            const row = rowByBrief.get(brief.id);
            return (
              <tr key={brief.id} className="border-t border-ink-200 hover:bg-ink-50">
                <td className="px-2 py-1.5 text-ink-900 max-w-[140px] sticky left-0 bg-white border-r border-ink-200">
                  <a
                    href={brief.url}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-2 hover:text-brand-600 font-medium"
                    title={brief.title}
                  >
                    {brief.title}
                  </a>
                  <p className="text-ink-400 truncate">{brief.domain}</p>
                </td>
                {schema.columns.map((col) => (
                  <EditableCell
                    key={col.key}
                    column={col}
                    value={row?.cells[col.key] ?? '—'}
                    edited={row?.editedKeys.includes(col.key) ?? false}
                    onSave={(v) => handleCellEdit(brief.id, col.key, v)}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface EditableCellProps {
  column: SchemaColumn;
  value: string;
  edited: boolean;
  onSave: (value: string) => void;
}

function EditableCell({ column, value, edited, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <td className="px-1 py-1 align-top">
        <input
          autoFocus
          className="w-full text-xs rounded border border-brand-500 px-1.5 py-0.5"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft !== value) onSave(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditing(false);
              if (draft !== value) onSave(draft);
            }
            if (e.key === 'Escape') {
              setEditing(false);
              setDraft(value);
            }
          }}
        />
      </td>
    );
  }

  return (
    <td
      className="px-2 py-1.5 align-top text-ink-800 cursor-pointer max-w-[180px]"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title={`${column.label} (click to edit)`}
    >
      <span className="block break-words whitespace-pre-line">
        {value}
        {edited && (
          <span className="ml-1 text-brand-600" title="Edited by you">
            ✎
          </span>
        )}
      </span>
    </td>
  );
}
