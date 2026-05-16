import Groq from 'groq-sdk';
import { getApiKey, getSettings } from './settings';
import {
  DERIVE_SCHEMA_SYSTEM,
  FILL_ROW_SYSTEM,
  SUMMARIZE_SYSTEM,
  deriveSchemaPrompt,
  fillRowPrompt,
  summarizePrompt,
} from './prompts';
import type { Brief, ComparisonSchema, Entity, SchemaColumn } from './types';

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

async function getClient(): Promise<{ client: Groq; model: string }> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new LLMError(
      'No API key configured. Open PageBrief settings to add your Groq API key.',
    );
  }
  const { model } = await getSettings();
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  return { client, model };
}

function parseJson<T>(content: string): T {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/, '')
      .trim();
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new LLMError(`Model returned non-JSON output: ${cleaned.slice(0, 200)}`, err);
  }
}

export interface SummarizeOutput {
  tldr: string[];
  entities: Entity[];
}

export async function summarizePage(input: {
  title: string;
  url: string;
  content: string;
}): Promise<SummarizeOutput> {
  const { client, model } = await getClient();
  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SUMMARIZE_SYSTEM },
        { role: 'user', content: summarizePrompt(input) },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });
    const content = response.choices[0]?.message?.content ?? '';
    const parsed = parseJson<SummarizeOutput>(content);
    return {
      tldr: Array.isArray(parsed.tldr) ? parsed.tldr.slice(0, 3) : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
    };
  } catch (err) {
    if (err instanceof LLMError) throw err;
    throw new LLMError(
      `Summarization failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }
}

export async function deriveSchema(briefs: Brief[]): Promise<ComparisonSchema> {
  if (briefs.length < 2) {
    throw new LLMError('Need at least 2 briefs to derive a comparison schema.');
  }
  const { client, model } = await getClient();
  const briefsJson = JSON.stringify(
    briefs.map((b) => ({
      title: b.title,
      url: b.url,
      tldr: b.tldr,
      entities: b.entities,
    })),
    null,
    2,
  );

  const response = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: DERIVE_SCHEMA_SYSTEM },
      { role: 'user', content: deriveSchemaPrompt(briefsJson) },
    ],
    temperature: 0.2,
    max_tokens: 600,
  });
  const content = response.choices[0]?.message?.content ?? '';
  const parsed = parseJson<{ columns: SchemaColumn[] }>(content);
  const columns = (parsed.columns ?? [])
    .filter((c) => c && typeof c.key === 'string' && typeof c.label === 'string')
    .slice(0, 7);
  if (columns.length === 0) {
    throw new LLMError('Schema derivation returned no usable columns.');
  }
  return { columns, derivedAt: Date.now() };
}

export async function fillRow(input: {
  schema: ComparisonSchema;
  brief: Brief;
}): Promise<Record<string, string>> {
  const { client, model } = await getClient();
  const briefJson = JSON.stringify(
    {
      title: input.brief.title,
      url: input.brief.url,
      tldr: input.brief.tldr,
      entities: input.brief.entities,
    },
    null,
    2,
  );
  const schemaJson = JSON.stringify(input.schema.columns, null, 2);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: FILL_ROW_SYSTEM },
      { role: 'user', content: fillRowPrompt({ schemaJson, briefJson }) },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });
  const content = response.choices[0]?.message?.content ?? '';
  const parsed = parseJson<{ cells: Record<string, string> }>(content);
  const cells: Record<string, string> = {};
  for (const col of input.schema.columns) {
    const v = parsed.cells?.[col.key];
    cells[col.key] = typeof v === 'string' && v.length > 0 ? v : '—';
  }
  return cells;
}

export async function validateApiKey(apiKey: string, model: string): Promise<void> {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
    max_tokens: 5,
    temperature: 0,
  });
}
