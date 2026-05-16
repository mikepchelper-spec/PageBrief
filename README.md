# PageBrief

> Tu mesa de investigación, automática.

Chrome extension that summarizes pages and **synthesizes research across multiple tabs** into a living comparison table. Built for fundadores, marketers, and analysts doing competitive research.

**Local-first. BYOK-first. Privacy-respecting.**

---

## Why PageBrief

You open 8 tabs to research competitors. You bookmark them. You forget what was on tab 3 by the time you get to tab 8. You end up with a half-finished doc and unanswered questions.

Existing tools (Sider, MaxAI, Monica, Glasp) summarize *one page at a time*. They don't connect the dots between tabs. **PageBrief does.**

## How it works

1. You name a research workspace (e.g., "CRMs 2026")
2. You browse normally — open tabs about whatever you're researching
3. PageBrief detects related content and asks: *"Add this to your CRMs research?"*
4. As you add tabs, it builds a **living comparison table** (price, target, integrations, pros/cons)
5. Export to markdown / CSV / clipboard with one click

## Differentiators

| Feature | PageBrief | Sider / MaxAI / Monica |
|---|---|---|
| Cross-tab synthesis | ✓ | ✗ |
| Living comparison tables | ✓ | ✗ |
| BYOK (zero recurring cost) | ✓ | ✗ |
| Local-first storage | ✓ | ✗ |
| No telemetry | ✓ | ✗ |
| Specialized for research workflows | ✓ | ✗ |

## Status

🚧 **Pre-MVP — Spec phase.** See [`docs/SPEC.md`](docs/SPEC.md) for the detailed technical specification.

## Tech stack

- **Extension**: Manifest V3, TypeScript, React 18, Vite
- **LLM**: Groq (BYOK) with `llama-3.3-70b-versatile` as default
- **Storage**: IndexedDB (local-first)
- **Content extraction**: Mozilla Readability.js
- **Embeddings**: transformers.js (local, `all-MiniLM-L6-v2`)
- **Build**: pnpm workspaces

## Roadmap

- **Sprint 1**: Single-tab summarization, content extraction, local storage, BYOK onboarding
- **Sprint 2**: Workspaces, cross-tab synthesis, comparison tables, auto-suggestion
- **Sprint 3**: Export (markdown, CSV), polish, onboarding, landing page

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for details.

## License

MIT — see [LICENSE](LICENSE).
