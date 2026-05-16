import type { Brief, ComparisonRow, Workspace } from '@/lib/types';

export function workspaceToMarkdown(
  workspace: Workspace,
  briefs: Brief[],
  rows: ComparisonRow[],
): string {
  const lines: string[] = [];
  lines.push(`# ${workspace.name}`);
  lines.push('');
  if (workspace.description) {
    lines.push(workspace.description);
    lines.push('');
  }
  lines.push(`_Exported by PageBrief — ${new Date().toLocaleString()}_`);
  lines.push('');

  if (workspace.schema && rows.length > 0) {
    lines.push('## Comparison table');
    lines.push('');
    const headerKeys = ['item', ...workspace.schema.columns.map((c) => c.key)];
    const headerLabels = ['Item', ...workspace.schema.columns.map((c) => c.label)];
    lines.push('| ' + headerLabels.join(' | ') + ' |');
    lines.push('| ' + headerKeys.map(() => '---').join(' | ') + ' |');
    const rowsByBrief = new Map(rows.map((r) => [r.briefId, r] as const));
    for (const brief of briefs) {
      const row = rowsByBrief.get(brief.id);
      const cells = [`[${escapePipe(brief.title)}](${brief.url})`];
      for (const col of workspace.schema.columns) {
        cells.push(escapePipe(row?.cells[col.key] ?? '—'));
      }
      lines.push('| ' + cells.join(' | ') + ' |');
    }
    lines.push('');
  }

  lines.push('## Briefs');
  lines.push('');
  for (const brief of briefs) {
    lines.push(`### [${brief.title}](${brief.url})`);
    lines.push(`_${brief.domain}_`);
    lines.push('');
    for (const bullet of brief.tldr) {
      lines.push(`- ${bullet}`);
    }
    if (brief.entities.length > 0) {
      lines.push('');
      for (const entity of brief.entities) {
        lines.push(`- **${entity.key.replace(/_/g, ' ')}**: ${entity.value}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

function escapePipe(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function workspaceToCsv(
  workspace: Workspace,
  briefs: Brief[],
  rows: ComparisonRow[],
): string {
  const lines: string[] = [];
  const headers = ['title', 'url', 'domain'];
  if (workspace.schema) {
    for (const col of workspace.schema.columns) headers.push(col.label);
  }
  lines.push(headers.map(csvCell).join(','));

  const rowsByBrief = new Map(rows.map((r) => [r.briefId, r] as const));
  for (const brief of briefs) {
    const row = rowsByBrief.get(brief.id);
    const values: string[] = [brief.title, brief.url, brief.domain];
    if (workspace.schema) {
      for (const col of workspace.schema.columns) {
        values.push(row?.cells[col.key] ?? '');
      }
    }
    lines.push(values.map(csvCell).join(','));
  }

  return lines.join('\n');
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
