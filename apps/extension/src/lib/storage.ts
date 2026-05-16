import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Brief, ComparisonRow, Workspace } from './types';

interface PageBriefDB extends DBSchema {
  workspaces: {
    key: string;
    value: Workspace;
    indexes: { 'by-updated': number };
  };
  briefs: {
    key: string;
    value: Brief;
    indexes: { 'by-workspace': string; 'by-created': number; 'by-hash': string };
  };
  comparisonRows: {
    key: string;
    value: ComparisonRow & { workspaceId: string };
    indexes: { 'by-workspace': string };
  };
}

const DB_NAME = 'pagebrief';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PageBriefDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PageBriefDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PageBriefDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workspaces')) {
          const ws = db.createObjectStore('workspaces', { keyPath: 'id' });
          ws.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('briefs')) {
          const briefs = db.createObjectStore('briefs', { keyPath: 'id' });
          briefs.createIndex('by-workspace', 'workspaceId');
          briefs.createIndex('by-created', 'createdAt');
          briefs.createIndex('by-hash', 'contentHash');
        }
        if (!db.objectStoreNames.contains('comparisonRows')) {
          const rows = db.createObjectStore('comparisonRows', { keyPath: 'briefId' });
          rows.createIndex('by-workspace', 'workspaceId');
        }
      },
    });
  }
  return dbPromise;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('workspaces', 'by-updated');
  return all.reverse();
}

export async function getWorkspace(id: string): Promise<Workspace | undefined> {
  const db = await getDB();
  return db.get('workspaces', id);
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const db = await getDB();
  await db.put('workspaces', workspace);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['workspaces', 'briefs', 'comparisonRows'], 'readwrite');
  await tx.objectStore('workspaces').delete(id);
  const briefIndex = tx.objectStore('briefs').index('by-workspace');
  for await (const cursor of briefIndex.iterate(id)) {
    await cursor.update({ ...cursor.value, workspaceId: null });
  }
  const rowIndex = tx.objectStore('comparisonRows').index('by-workspace');
  for await (const cursor of rowIndex.iterate(id)) {
    await cursor.delete();
  }
  await tx.done;
}

export async function listBriefs(workspaceId?: string | null): Promise<Brief[]> {
  const db = await getDB();
  if (workspaceId === undefined) {
    const all = await db.getAllFromIndex('briefs', 'by-created');
    return all.reverse();
  }
  const tx = db.transaction('briefs', 'readonly');
  const idx = tx.store.index('by-workspace');
  const results: Brief[] = [];
  const key = workspaceId === null ? IDBKeyRange.only('') : IDBKeyRange.only(workspaceId);
  if (workspaceId === null) {
    const all = await db.getAll('briefs');
    return all.filter((b) => b.workspaceId === null).sort((a, b) => b.createdAt - a.createdAt);
  }
  for await (const cursor of idx.iterate(key)) {
    results.push(cursor.value);
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getBrief(id: string): Promise<Brief | undefined> {
  const db = await getDB();
  return db.get('briefs', id);
}

export async function saveBrief(brief: Brief): Promise<void> {
  const db = await getDB();
  await db.put('briefs', brief);
}

export async function deleteBrief(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['briefs', 'comparisonRows'], 'readwrite');
  await tx.objectStore('briefs').delete(id);
  await tx.objectStore('comparisonRows').delete(id);
  await tx.done;
}

export async function findBriefByHash(hash: string): Promise<Brief | undefined> {
  const db = await getDB();
  return db.getFromIndex('briefs', 'by-hash', hash);
}

export async function listComparisonRows(workspaceId: string): Promise<ComparisonRow[]> {
  const db = await getDB();
  const tx = db.transaction('comparisonRows', 'readonly');
  const idx = tx.store.index('by-workspace');
  const rows: ComparisonRow[] = [];
  for await (const cursor of idx.iterate(workspaceId)) {
    const { workspaceId: _ws, ...row } = cursor.value;
    rows.push(row);
  }
  return rows;
}

export async function saveComparisonRow(
  workspaceId: string,
  row: ComparisonRow,
): Promise<void> {
  const db = await getDB();
  await db.put('comparisonRows', { ...row, workspaceId });
}

export async function deleteComparisonRow(briefId: string): Promise<void> {
  const db = await getDB();
  await db.delete('comparisonRows', briefId);
}
