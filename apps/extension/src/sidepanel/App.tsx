import { useCallback, useEffect, useState } from 'react';
import { hasApiKey } from '@/lib/settings';
import { listBriefs, listWorkspaces } from '@/lib/storage';
import type { Brief, Workspace } from '@/lib/types';
import { HomeView } from './views/HomeView';
import { WorkspaceView } from './views/WorkspaceView';
import { OnboardingView } from './views/OnboardingView';
import { ErrorBoundary } from './components/ErrorBoundary';

type View =
  | { kind: 'home' }
  | { kind: 'workspace'; workspaceId: string };

export function App() {
  const [keyReady, setKeyReady] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [view, setView] = useState<View>({ kind: 'home' });

  const refresh = useCallback(async () => {
    const [ws, br] = await Promise.all([listWorkspaces(), listBriefs(undefined)]);
    setWorkspaces(ws);
    setBriefs(br);
  }, []);

  useEffect(() => {
    void (async () => {
      setKeyReady(await hasApiKey());
      await refresh();
    })();
  }, [refresh]);

  const handleKeyConfigured = async () => {
    setKeyReady(await hasApiKey());
  };

  if (keyReady === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-600">
        Loading…
      </div>
    );
  }

  if (!keyReady) {
    return <OnboardingView onConfigured={handleKeyConfigured} />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-full flex-col bg-ink-50">
        <Header
          onHome={() => setView({ kind: 'home' })}
          isHome={view.kind === 'home'}
        />
        {view.kind === 'home' && (
          <HomeView
            workspaces={workspaces}
            briefs={briefs}
            onRefresh={refresh}
            onOpenWorkspace={(id) => setView({ kind: 'workspace', workspaceId: id })}
          />
        )}
        {view.kind === 'workspace' && (
          <WorkspaceView
            workspaceId={view.workspaceId}
            onBack={() => setView({ kind: 'home' })}
            onRefresh={refresh}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

interface HeaderProps {
  onHome: () => void;
  isHome: boolean;
}

function Header({ onHome, isHome }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-ink-200 bg-white px-3 py-2">
      <button
        className="flex items-center gap-2 text-left"
        onClick={onHome}
        disabled={isHome}
      >
        <div className="h-6 w-6 rounded bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
          P
        </div>
        <span className="font-semibold">PageBrief</span>
      </button>
      <button
        className="btn-ghost text-xs"
        onClick={() => chrome.runtime.openOptionsPage()}
        title="Settings"
      >
        ⚙
      </button>
    </header>
  );
}
