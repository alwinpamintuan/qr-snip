import { DEFAULT_SETTINGS, migrateSettings, type Settings } from '../core/settings';

export const SETTINGS_STORAGE_KEY = 'settings';

export type SettingsStorage = Readonly<{
  get: (key: string) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
}>;

export async function loadSettings(storage: SettingsStorage): Promise<Settings> {
  const stored = await storage.get(SETTINGS_STORAGE_KEY);
  const value = stored[SETTINGS_STORAGE_KEY];
  const settings = migrateSettings(value);
  if (!settingsEqual(value, settings)) await saveSettings(storage, settings);
  return settings;
}

export async function saveSettings(storage: SettingsStorage, settings: Settings): Promise<void> {
  await storage.set({ [SETTINGS_STORAGE_KEY]: settings });
}

export async function resetSettings(storage: SettingsStorage): Promise<Settings> {
  await saveSettings(storage, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

function settingsEqual(value: unknown, settings: Settings): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Settings>;
  return candidate.version === settings.version
    && candidate.theme === settings.theme
    && candidate.closeAfterCopy === settings.closeAfterCopy
    && candidate.decoderDiagnostics === settings.decoderDiagnostics;
}
