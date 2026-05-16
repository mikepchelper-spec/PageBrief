# PageBrief — Roadmap

## Sprint 1 — Single-tab briefs (week 1)

**Goal**: User can install the extension, configure BYOK, and get a 3-bullet brief of any page.

- [x] Repo + monorepo scaffolding (pnpm workspaces)
- [x] Vite + React + TS + Tailwind setup for the extension
- [x] Manifest V3 with side panel, options page, content script, service worker
- [x] Content extraction with Mozilla Readability
- [x] BYOK settings page with encrypted storage
- [x] LLM client (Groq) with `summarizePage` prompt
- [x] Side panel: "Summarize this tab" button → renders structured brief
- [x] IndexedDB storage layer for briefs
- [x] Briefs list with delete + copy-to-clipboard

## Sprint 2 — Workspaces & comparison (week 2)

**Goal**: User can group briefs into workspaces and see a living comparison table.

- [ ] Workspace CRUD
- [ ] Add/remove brief to/from workspace
- [ ] LLM call to derive comparison schema from briefs
- [ ] LLM call to fill cells per brief
- [ ] Editable comparison table UI (TanStack Table or similar)
- [ ] "Suggest workspace" — when user creates a brief about something similar, suggest adding to existing workspace (basic keyword overlap, embeddings come in Sprint 3)
- [ ] Re-run schema derivation when N+1 brief is added

## Sprint 3 — Polish & ship (week 3)

**Goal**: Production-ready extension on Chrome Web Store.

- [ ] Local embeddings with transformers.js for semantic dedup and similar-page detection
- [ ] Export workspace to Markdown table (clipboard)
- [ ] Export workspace to CSV (file download)
- [ ] Onboarding flow (first install → BYOK setup with screenshots → first summary)
- [ ] Error handling polish (toasts, retry buttons, offline detection)
- [ ] Landing page (mikepchelper-spec.github.io/PageBrief or similar)
- [ ] Chrome Web Store listing assets (screenshots, icons, description)
- [ ] Submit to Chrome Web Store

## Post-MVP — Pro tier (month 2-3)

- [ ] Cloud sync (E2E encrypted, optional)
- [ ] Notion export
- [ ] Google Docs export
- [ ] Cross-workspace search
- [ ] Scheduled briefings ("digest of this week's research")
- [ ] OpenAI/Anthropic provider support
- [ ] Firefox port

## Future (someday-maybe)

- [ ] PDF brief support (using PDF.js)
- [ ] YouTube transcript briefs
- [ ] Team workspaces (sharing)
- [ ] Browser-native voice notes attached to briefs
- [ ] AI agents that "go research X" and return a populated workspace
