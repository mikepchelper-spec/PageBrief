interface Props {
  onConfigured: () => void;
}

export function OnboardingView({ onConfigured }: Props) {
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="h-14 w-14 rounded-lg bg-brand-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
        P
      </div>
      <h1 className="text-xl font-bold">Welcome to PageBrief</h1>
      <p className="mt-2 text-sm text-ink-600 max-w-xs">
        Synthesize research across tabs into living comparison tables. Local-first, BYOK,
        privacy-respecting.
      </p>

      <ol className="mt-6 space-y-3 text-left text-sm text-ink-800 max-w-xs">
        <li className="flex gap-2">
          <span className="text-brand-600 font-bold">1.</span>
          <span>
            Get a free Groq API key at{' '}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 underline"
            >
              console.groq.com/keys
            </a>
            .
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-600 font-bold">2.</span>
          <span>Open settings and paste your key.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-600 font-bold">3.</span>
          <span>Browse normally. PageBrief works on every tab.</span>
        </li>
      </ol>

      <button className="btn-primary mt-6" onClick={openOptions}>
        Open settings
      </button>
      <button
        className="btn-ghost mt-2 text-xs"
        onClick={onConfigured}
        title="Check again after setting key"
      >
        I&apos;ve set the key
      </button>
    </div>
  );
}
