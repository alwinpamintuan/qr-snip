import { describe, expect, it, vi } from 'vitest';
import { loadSettings, resetSettings, saveSettings, SETTINGS_STORAGE_KEY } from '../src/application/settings-store';
import { DEFAULT_SETTINGS, migrateSettings } from '../src/core/settings';

describe('versioned settings', () => {
  it('uses privacy-preserving defaults for missing or malformed data', () => {
    expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings({ version: 99, theme: 'dark', closeAfterCopy: true })).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates the pre-versioned development shape', () => {
    expect(migrateSettings({ theme: 'auto', closeAfterCopy: true, decoderDiagnostics: true })).toEqual({
      version: 1, theme: 'system', closeAfterCopy: true, decoderDiagnostics: true,
    });
  });

  it('sanitizes individual fields in the current schema', () => {
    expect(migrateSettings({ version: 1, theme: 'neon', closeAfterCopy: 'yes', decoderDiagnostics: true })).toEqual({
      version: 1, theme: 'system', closeAfterCopy: false, decoderDiagnostics: true,
    });
  });

  it('persists migrations and supports save and reset through a narrow storage adapter', async () => {
    const data: Record<string, unknown> = { [SETTINGS_STORAGE_KEY]: { theme: 'dark' } };
    const storage = {
      get: vi.fn(async () => ({ ...data })),
      set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(data, items); }),
    };
    expect(await loadSettings(storage)).toMatchObject({ version: 1, theme: 'dark' });
    expect(storage.set).toHaveBeenCalledTimes(1);
    await saveSettings(storage, { ...DEFAULT_SETTINGS, closeAfterCopy: true });
    expect(data[SETTINGS_STORAGE_KEY]).toMatchObject({ closeAfterCopy: true });
    expect(await resetSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });
});
