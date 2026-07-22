export const SETTINGS_SCHEMA_VERSION = 1 as const;

export type ThemePreference = 'system' | 'light' | 'dark';

export type Settings = Readonly<{
  version: typeof SETTINGS_SCHEMA_VERSION;
  theme: ThemePreference;
  closeAfterCopy: boolean;
  decoderDiagnostics: boolean;
}>;

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  version: SETTINGS_SCHEMA_VERSION,
  theme: 'system',
  closeAfterCopy: false,
  decoderDiagnostics: false,
});

const THEME_PREFERENCES = new Set<ThemePreference>(['system', 'light', 'dark']);

export function migrateSettings(value: unknown): Settings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;

  if (value.version === SETTINGS_SCHEMA_VERSION) {
    return {
      version: SETTINGS_SCHEMA_VERSION,
      theme: isThemePreference(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
      closeAfterCopy: booleanOrDefault(value.closeAfterCopy, DEFAULT_SETTINGS.closeAfterCopy),
      decoderDiagnostics: booleanOrDefault(value.decoderDiagnostics, DEFAULT_SETTINGS.decoderDiagnostics),
    };
  }

  // Development builds before the versioned schema stored these fields without a version.
  if (value.version === undefined || value.version === 0) {
    return {
      version: SETTINGS_SCHEMA_VERSION,
      theme: value.theme === 'auto'
        ? 'system'
        : isThemePreference(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
      closeAfterCopy: booleanOrDefault(value.closeAfterCopy, DEFAULT_SETTINGS.closeAfterCopy),
      decoderDiagnostics: booleanOrDefault(value.decoderDiagnostics, DEFAULT_SETTINGS.decoderDiagnostics),
    };
  }

  return DEFAULT_SETTINGS;
}

export function isSettings(value: unknown): value is Settings {
  if (!isRecord(value)) return false;
  return value.version === SETTINGS_SCHEMA_VERSION
    && isThemePreference(value.theme)
    && typeof value.closeAfterCopy === 'boolean'
    && typeof value.decoderDiagnostics === 'boolean';
}

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_PREFERENCES.has(value as ThemePreference);
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
