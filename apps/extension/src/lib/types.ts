export interface Workspace {
  id: string;
  name: string;
  description?: string;
  schema?: ComparisonSchema;
  createdAt: number;
  updatedAt: number;
}

export interface Entity {
  key: string;
  value: string;
}

export interface Brief {
  id: string;
  workspaceId: string | null;
  url: string;
  title: string;
  domain: string;
  tldr: string[];
  entities: Entity[];
  fullContent: string;
  contentHash: string;
  createdAt: number;
}

export type ColumnType = 'text' | 'number' | 'currency' | 'list';

export interface SchemaColumn {
  key: string;
  label: string;
  type: ColumnType;
  derivedFrom?: string;
}

export interface ComparisonSchema {
  columns: SchemaColumn[];
  derivedAt: number;
}

export interface ComparisonRow {
  briefId: string;
  cells: Record<string, string>;
  editedKeys: string[];
}

export type LLMProvider = 'groq';

export interface Settings {
  llmProvider: LLMProvider;
  encryptedApiKey: string | null;
  apiKeyIv: string | null;
  model: string;
  theme: 'light' | 'dark' | 'system';
}

export interface ExtractedPage {
  title: string;
  url: string;
  domain: string;
  content: string;
  excerpt: string;
}

export type MessageType =
  | { type: 'EXTRACT_PAGE'; tabId?: number }
  | { type: 'PAGE_EXTRACTED'; data: ExtractedPage }
  | { type: 'PING' };
