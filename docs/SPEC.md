# PageBrief — Technical Specification

> Version 0.1 — Initial MVP spec
> Status: 🚧 In development

## 1. Vision

PageBrief is a Chrome extension that turns scattered research tabs into a structured, comparable knowledge base. Where Sider/MaxAI/Monica summarize **one page at a time**, PageBrief **synthesizes across tabs** into living comparison tables.

**Positioning**: "Tu mesa de investigación, automática."

## 2. Target user (MVP)

**Primary**: Fundadores y marketers B2B haciendo análisis competitivo.

Profile:
- Opens 5–20 tabs of competitor/category research per session
- Wants structured output (table, bullets) not prose
- Pays for productivity tools ($5–15/mo range)
- Privacy-conscious about LLM data leaks
- Comfortable getting their own API key

Secondary (post-MVP): estudiantes de tesis, analistas de inversión.

## 3. Core features (MVP — Sprint 1+2)

### 3.1 Single-tab brief
- User clicks extension icon → side panel opens
- Active tab's content is extracted (Mozilla Readability)
- LLM call returns a **structured brief**:
  - 3-bullet TL;DR
  - Key entities (product name, company, pricing if mentioned)
  - Source URL + extracted title + timestamp
- Saved to local IndexedDB

### 3.2 Workspaces
- User creates a workspace (e.g., "CRMs 2026")
- Pinea briefs to that workspace (one-click "Add to workspace")
- Workspace has:
  - Name + optional description
  - List of briefs
  - Auto-derived comparison schema (see 3.3)

### 3.3 Cross-tab comparison table
- For workspaces with ≥2 briefs:
- LLM is asked to **derive a comparison schema** from the briefs (e.g., for CRMs: `price`, `target_audience`, `key_integrations`, `differentiators`)
- LLM extracts values for each brief against the schema
- Table is **living**: when user adds a new brief, schema is updated and new row is filled in
- User can manually edit cells

### 3.4 Export
- One-click export per workspace:
  - Markdown table (clipboard)
  - CSV file (download)
- Post-MVP: Notion, Obsidian, Google Docs

### 3.5 BYOK setup
- Settings page asks for Groq API key
- Validates by making a test call
- Stored encrypted in `chrome.storage.local` (Web Crypto API)
- Optional model override (default: `llama-3.3-70b-versatile`)
- Future: support OpenAI/Anthropic keys

## 4. Out of scope (MVP)

- PDF/video summarization
- Auto-summarize on tab open (always user-initiated to avoid wasted tokens)
- Cloud sync between devices
- Multi-user collaboration / sharing workspaces
- Notion/Google Docs integration (markdown copy-paste is enough)
- Mobile apps
- Non-Chrome browsers (Firefox port is post-MVP)

## 5. Architecture

```
┌──────────────────────────────────────────────────────┐
│  Chrome Extension (Manifest V3)                      │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │ Side Panel   │◀──▶│ Service Worker (BG)      │   │
│  │ (React)      │    │ - Orchestrates calls     │   │
│  │              │    │ - Manages workspaces     │   │
│  │ - Workspaces │    │ - Calls LLM API          │   │
│  │ - Briefs     │    └──────────────┬───────────┘   │
│  │ - Compare    │                   │               │
│  │ - Settings   │                   ▼               │
│  └──────────────┘    ┌──────────────────────────┐   │
│         │            │ Content Script           │   │
│         │            │ - Mozilla Readability    │   │
│         │            │ - Page metadata          │   │
│         │            └──────────────────────────┘   │
│         │                                            │
│         ▼                                            │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │ IndexedDB    │    │ chrome.storage.local     │   │
│  │ - workspaces │    │ - settings (encrypted    │   │
│  │ - briefs     │    │   API key)               │   │
│  │ - comparisons│    └──────────────────────────┘   │
│  └──────────────┘                                    │
└──────────────────────────────────────────────────────┘
                          │
                          ▼ (BYOK direct call, no proxy)
                   ┌─────────────┐
                   │  Groq API   │
                   └─────────────┘
```

### Key decisions

- **No backend, no proxy**: BYOK means user's key talks directly to Groq. Zero server costs for us, maximum privacy for user.
- **IndexedDB, not chrome.storage**: storage is large (briefs are ~5–20KB each), IndexedDB handles 50MB+ easily.
- **Side panel UI** (not popup, not full-page): persistent across tabs, doesn't dismiss on click-outside, perfect for research workflows.
- **Manifest V3 service worker** for background tasks (Chrome killed background pages in MV3).
- **Mozilla Readability.js** to strip nav/ads/footer before sending to LLM — saves ~70% tokens and improves quality.
- **Local-first**: no telemetry, no analytics, no signup.

## 6. Data models

### Workspace
```typescript
interface Workspace {
  id: string;            // uuid
  name: string;
  description?: string;
  schema?: ComparisonSchema;  // derived after 2+ briefs
  createdAt: number;
  updatedAt: number;
}
```

### Brief
```typescript
interface Brief {
  id: string;
  workspaceId: string | null;  // null = unfiled
  url: string;
  title: string;
  domain: string;
  tldr: string[];              // 3 bullets
  entities: Entity[];
  fullContent: string;         // extracted content, for re-querying
  contentHash: string;         // dedup by content
  createdAt: number;
}

interface Entity {
  key: string;        // e.g., "price", "company"
  value: string;
  confidence: number; // 0..1
}
```

### ComparisonSchema
```typescript
interface ComparisonSchema {
  workspaceId: string;
  columns: SchemaColumn[];
  rows: ComparisonRow[];   // one per brief
  derivedAt: number;
}

interface SchemaColumn {
  key: string;              // e.g., "price"
  label: string;            // e.g., "Pricing"
  type: 'text' | 'number' | 'currency' | 'list';
  derivedFrom: string;      // LLM rationale
}

interface ComparisonRow {
  briefId: string;
  cells: Record<string, string>;  // columnKey → value
  editedKeys: string[];           // user-edited cells (don't auto-overwrite)
}
```

### Settings
```typescript
interface Settings {
  llmProvider: 'groq';        // future: 'openai' | 'anthropic'
  encryptedApiKey: string;    // base64(AES-GCM)
  apiKeyIv: string;           // initialization vector
  model: string;              // default: 'llama-3.3-70b-versatile'
  autoOpenSidePanel: boolean;
  theme: 'light' | 'dark' | 'system';
}
```

## 7. LLM integration

### Provider
- **Groq** with `llama-3.3-70b-versatile` (default)
- Why: sub-second latency, cheap, good quality for summarization
- BYOK: user provides own key

### Prompts (versioned in `apps/extension/src/llm/prompts.ts`)

#### `summarizePage`
```
You are PageBrief, a research assistant. Given the content of a web page,
produce a structured brief:

1. A TL;DR of exactly 3 bullets. Each bullet ≤ 20 words. Concrete, no fluff.
2. Key entities as JSON: any product names, company names, pricing,
   key features, target audience, or claims worth comparing.

Output JSON with shape:
{
  "tldr": ["bullet 1", "bullet 2", "bullet 3"],
  "entities": [
    {"key": "product_name", "value": "..."},
    {"key": "pricing", "value": "..."},
    ...
  ]
}

Page title: {{title}}
Page URL: {{url}}
Page content:
{{content}}
```

#### `deriveSchema`
```
You are PageBrief. Given 2+ research briefs about similar things,
derive a comparison schema. The schema should be the most useful columns
for the user to compare these items.

Output JSON: { "columns": [{"key": "...", "label": "...", "type": "text|number|currency|list"}] }
Rules:
- 3-8 columns max
- Always include the most discriminating attributes
- Avoid columns where all values would be the same
- Avoid free-form prose columns

Briefs:
{{briefs}}
```

#### `fillRow`
```
You are PageBrief. Given a brief and a comparison schema, extract
values for each column. If a value is unknown, return "—".

Output JSON: { "cells": { "columnKey": "value", ... } }

Schema: {{schema}}
Brief: {{brief}}
```

### Rate limiting & error handling
- Local queue with concurrency = 2
- Exponential backoff on 429 / 5xx
- User-facing error toast with retry button on persistent failure
- All LLM calls have a 30s timeout

## 8. Privacy & security

- **No telemetry**: zero analytics, zero pings home
- **No backend**: there is no PageBrief server; user's data never leaves their machine except to their chosen LLM provider
- **Encrypted API key**: stored in `chrome.storage.local` encrypted with a key derived from a device-local secret (Web Crypto API, AES-256-GCM)
- **Permissions**: minimum required (`activeTab`, `storage`, `sidePanel`, host permissions only on user-initiated action)
- **No remote code**: all code shipped in the extension bundle, no eval/dynamic imports of remote URLs (MV3 requirement anyway)
- **Open source**: full source on GitHub for auditability

## 9. Monetization

### Free tier (BYOK)
- Unlimited briefs
- Unlimited workspaces
- All export formats
- All LLM features

### Pro tier — $5/month (post-MVP, target month 3)
- Cloud sync between devices (E2E encrypted)
- Cross-workspace search and meta-comparisons
- Advanced exports (Notion, Google Docs, scheduled emails)
- Priority support
- Early access to new features

### Why not freemium-by-usage?
Because BYOK means we don't pay for inference. Charging per-brief would be artificial. We charge for **infrastructure** (sync, hosted features) instead.

## 10. Success metrics (MVP)

- **Activation**: % of installs that complete BYOK setup → target 60%
- **Time-to-first-brief**: target < 90s from install
- **Briefs per user per week**: target 10+ in week 1 for activated users
- **W4 retention**: target 25% (4-week retention is the leading indicator)
- **Workspace adoption**: % of users who create ≥1 workspace → target 40%

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Pages with paywall/JS-heavy content | Readability handles ~80%, log misses, add fallbacks per-domain post-MVP |
| Cookie banners contaminate extracted text | Readability strips these mostly; add a known-selectors blocklist post-MVP |
| Groq rate limits with many tabs at once | Local queue, exponential backoff, user-facing throttling indicator |
| Users won't get their own API key | Onboarding deep-links to Groq signup with screenshots; clear value prop |
| Chrome Web Store review delays | Submit early in dev cycle, keep permissions minimal |
| Schema derivation produces bad columns | User can edit/delete columns manually; v2 will learn from edits |
| Browser other than Chrome | Out of scope for MVP; Firefox port is straightforward (MV3 compatible) |

## 12. Open questions

- Should we offer a "managed" tier with our own API key for non-technical users? **Decision so far: no, keep it BYOK-only to preserve margins and privacy story.**
- Should brief schema be one-shot or refined incrementally as new briefs arrive? **Decision: refine on each new brief, but only auto-rerun if column count changed; preserve user edits.**
- Embeddings for "similar tab" detection — local (transformers.js) or use LLM? **Decision: local with `all-MiniLM-L6-v2` to keep it free and fast.** Deferred to Sprint 2.
- License — MIT or AGPL? **Decision: MIT to encourage forks/contributions.**

## 13. References

- Mozilla Readability: https://github.com/mozilla/readability
- Manifest V3 docs: https://developer.chrome.com/docs/extensions/mv3
- Groq API: https://console.groq.com/docs
- @crxjs/vite-plugin: https://crxjs.dev/vite-plugin
- transformers.js: https://huggingface.co/docs/transformers.js
