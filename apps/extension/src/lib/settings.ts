import { decryptString, encryptString } from './crypto';
import type { Settings } from './types';

const SETTINGS_KEY = 'pagebrief_settings';

const DEFAULT_SETTINGS: Settings = {
  llmProvider: 'groq',
  encryptedApiKey: null,
  apiKeyIv: null,
  model: 'llama-3.3-70b-versatile',
  theme: 'system',
};

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const existing = stored[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(existing ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

export async function setApiKey(apiKey: string): Promise<void> {
  const { ciphertext, iv } = await encryptString(apiKey);
  await saveSettings({ encryptedApiKey: ciphertext, apiKeyIv: iv });
}

export async function getApiKey(): Promise<string | null> {
  const settings = await getSettings();
  if (!settings.encryptedApiKey || !settings.apiKeyIv) return null;
  return decryptString(settings.encryptedApiKey, settings.apiKeyIv);
}

export async function clearApiKey(): Promise<void> {
  await saveSettings({ encryptedApiKey: null, apiKeyIv: null });
}

export async function hasApiKey(): Promise<boolean> {
  const settings = await getSettings();
  return Boolean(settings.encryptedApiKey && settings.apiKeyIv);
}
