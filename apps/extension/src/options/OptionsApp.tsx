import { useEffect, useState } from 'react';
import { clearApiKey, getSettings, hasApiKey, setApiKey, saveSettings } from '@/lib/settings';
import { validateApiKey } from '@/lib/llm';

const AVAILABLE_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
] as const;

type SaveState = 'idle' | 'validating' | 'saved' | 'error';

export function OptionsApp() {
  const [apiKey, setApiKeyValue] = useState('');
  const [model, setModel] = useState<string>('llama-3.3-70b-versatile');
  const [hasKey, setHasKey] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const settings = await getSettings();
      setModel(settings.model);
      setHasKey(await hasApiKey());
    })();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaveState('validating');
    try {
      if (apiKey.trim().length > 0) {
        await validateApiKey(apiKey.trim(), model);
        await setApiKey(apiKey.trim());
      }
      await saveSettings({ model });
      setHasKey(await hasApiKey());
      setApiKeyValue('');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      setSaveState('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleClear = async () => {
    await clearApiKey();
    setHasKey(false);
    setApiKeyValue('');
    setSaveState('idle');
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold">
            P
          </div>
          <h1 className="text-2xl font-bold">PageBrief Settings</h1>
        </div>
        <p className="mt-2 text-sm text-ink-600">
          Local-first. BYOK. Your data never leaves this browser except to your chosen LLM
          provider.
        </p>
      </header>

      <section className="card space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Groq API key</h2>
          <p className="mt-1 text-sm text-ink-600">
            PageBrief uses your own Groq API key for all LLM calls. Get one free at{' '}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 underline"
            >
              console.groq.com/keys
            </a>
            . Your key is stored encrypted (AES-256-GCM) in this browser only.
          </p>
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="apiKey">
            {hasKey ? 'Replace API key' : 'API key'}
          </label>
          <input
            id="apiKey"
            type="password"
            className="input font-mono"
            placeholder="gsk_..."
            value={apiKey}
            onChange={(e) => setApiKeyValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {hasKey && (
            <p className="text-xs text-ink-600">
              A key is already saved. Leave blank to keep current key, or paste a new one to
              replace.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="model">
            Model
          </label>
          <select
            id="model"
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-600">
            <code>llama-3.3-70b-versatile</code> is recommended for quality;{' '}
            <code>llama-3.1-8b-instant</code> for speed.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saveState === 'validating'}
          >
            {saveState === 'validating' ? 'Validating…' : 'Save'}
          </button>
          {hasKey && (
            <button className="btn-secondary" onClick={handleClear}>
              Remove key
            </button>
          )}
          {saveState === 'saved' && <span className="text-sm text-green-700">Saved ✓</span>}
        </div>
      </section>

      <section className="mt-6 card">
        <h2 className="text-lg font-semibold">Privacy</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-600 list-disc list-inside">
          <li>No analytics, no telemetry, no signup.</li>
          <li>Data stored locally in IndexedDB. Never sent to any server.</li>
          <li>API key encrypted with a device-local AES-256 key.</li>
          <li>LLM calls go directly to Groq — PageBrief has no backend.</li>
          <li>Uninstalling the extension permanently deletes all your data.</li>
        </ul>
      </section>
    </div>
  );
}
