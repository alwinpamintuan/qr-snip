import { describe, expect, it } from 'vitest';
import englishMessages from '../public/_locales/en/messages.json';
import { createI18n, MESSAGE_KEYS, type MessageCatalog } from '../src/i18n/messages';

describe('internationalization foundation', () => {
  it('keeps the typed key registry aligned with the English catalog', () => {
    expect([...MESSAGE_KEYS].sort()).toEqual(Object.keys(englishMessages).sort());
  });

  it('supports substitutions and reports missing keys', () => {
    const catalog: MessageCatalog = {
      getMessage: (key, substitutions) => {
        if (key === '@@bidi_dir') return 'ltr';
        if (key !== 'riskUnusualPort') return '';
        const port = Array.isArray(substitutions) ? substitutions[0] : substitutions;
        return `port:${port ?? ''}`;
      },
    };
    const i18n = createI18n(catalog);
    expect(i18n.t('riskUnusualPort', '8443')).toBe('port:8443');
    expect(() => i18n.t('copiedToast')).toThrow('Missing localized message: copiedToast');
  });

  it('accepts long pseudo-localized strings and RTL direction', () => {
    const catalog: MessageCatalog = {
      getMessage: (key) => key === '@@bidi_dir' ? 'rtl' : `⟦${key} ${'word '.repeat(12)}⟧`,
    };
    const i18n = createI18n(catalog);
    expect(i18n.direction).toBe('rtl');
    expect(i18n.t('dragInstruction').length).toBeGreaterThan('Drag around a QR code'.length * 1.4);
  });
});
