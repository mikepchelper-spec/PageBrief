# PageBrief — Install & Develop

## Load the unpacked extension in Chrome

> Before the first install you need to build the extension. PageBrief is not yet on the Chrome Web Store.

### 1. Build

```bash
git clone https://github.com/mikepchelper-spec/PageBrief.git
cd PageBrief
pnpm install
pnpm build
```

The compiled extension is in `apps/extension/dist/`.

### 2. Load into Chrome

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Pick the folder `apps/extension/dist`
5. Pin the PageBrief icon from the puzzle-piece menu so it's always visible

### 3. Configure your Groq API key

1. Get a free key at [console.groq.com/keys](https://console.groq.com/keys)
2. Right-click the PageBrief icon → **Options**
3. Paste your key, pick a model, click **Save**

The key is encrypted with AES-256-GCM using a device-local key and stored in `chrome.storage.local`. It never leaves your browser except in calls to Groq.

### 4. Use it

1. Open any webpage you want to summarize
2. Click the PageBrief icon (or use the side panel toggle)
3. Click **Summarize this tab**
4. Optionally: create a workspace (e.g. "CRMs 2026") and add the brief to it
5. With 2+ briefs in a workspace, click **Generate table** to see the comparison
6. Export to Markdown (clipboard) or CSV (download) from the workspace view

## Development mode

```bash
pnpm dev
```

This starts Vite in watch mode. After it boots, load `apps/extension/dist/` as unpacked (same as above). Changes auto-rebuild and the extension reloads via @crxjs HMR.

## Type-check / lint

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

## Project layout

```
PageBrief/
├── apps/
│   └── extension/              # Chrome extension (MV3)
│       ├── manifest.config.ts  # @crxjs manifest definition
│       ├── sidepanel.html      # side panel entry
│       ├── options.html        # settings page entry
│       └── src/
│           ├── sidepanel/      # React side-panel UI
│           │   ├── App.tsx
│           │   ├── views/      # HomeView, WorkspaceView, OnboardingView
│           │   ├── components/ # BriefCard, SummarizeButton, ComparisonTable, …
│           │   └── utils/export.ts
│           ├── options/        # React settings UI
│           ├── background/
│           │   └── service-worker.ts
│           ├── content/
│           │   └── extractor.ts          # Mozilla Readability extraction
│           ├── lib/
│           │   ├── llm.ts                # Groq client
│           │   ├── prompts.ts            # summarize / deriveSchema / fillRow
│           │   ├── storage.ts            # IndexedDB (workspaces, briefs, rows)
│           │   ├── settings.ts           # encrypted settings
│           │   ├── crypto.ts             # AES-256-GCM wrapper
│           │   ├── messaging.ts          # chrome.scripting.executeScript helpers
│           │   └── types.ts
│           └── styles/globals.css        # Tailwind
└── docs/
    ├── SPEC.md
    ├── ROADMAP.md
    └── INSTALL.md
```

## Troubleshooting

**"Cannot extract content from this page (chrome:// URLs are not accessible)"** —
Chrome forbids extensions from running on `chrome://`, `chrome-extension://`, and a few other internal URLs. Test on a regular http(s) page.

**"Page content was too short to summarize"** —
Readability discarded most of the page. Try scrolling to the main content first, or test on a content-rich page like a blog post or product page.

**"No API key configured"** —
You haven't pasted a Groq key in Options yet. Open the side panel and click the gear icon.

**Rate limit / 429** —
You hit Groq's free tier rate limit. Wait a minute or upgrade your Groq account.

**The extension icon is greyed out** —
Some pages (Chrome Web Store, new-tab page) block extensions. Try a normal site.
