import { describe, expect, it } from 'vitest';
import { displayPayload, isAllowedOpenUrl, normalizePayload } from '../src/core/result';
import { interpretResult } from '../src/core/interpreters/registry';

describe('QR result handling', () => {
  it('recognizes secure and insecure web links', () => {
    expect(interpretResult('https://example.com/path').kind).toBe('url');
    expect(interpretResult('http://example.com').openUrl).toBe('http://example.com/');
  });

  it('turns plain email addresses into mail links', () => {
    expect(interpretResult('hello@example.com')).toMatchObject({
      kind: 'email',
      openUrl: 'mailto:hello@example.com',
    });
  });

  it('keeps ordinary payloads as text', () => {
    const result = interpretResult('unrecognized:value');
    expect(result.kind).toBe('text');
    expect(result).not.toHaveProperty('openUrl');
  });

  it('blocks dangerous and unsupported protocols', () => {
    expect(isAllowedOpenUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedOpenUrl('data:text/html,hello')).toBe(false);
    expect(isAllowedOpenUrl('https://example.com')).toBe(true);
    expect(isAllowedOpenUrl('mailto:hello@example.com')).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    ' JAVASCRIPT:alert(1) ',
    '\u00a0data:text/html,hello\u00a0',
    'file:///etc/passwd',
    'chrome://settings',
    'https://example.com/\u0000hidden',
  ])('rejects dangerous, normalized, or controlled navigation input: %s', (value) => {
    expect(isAllowedOpenUrl(value)).toBe(false);
  });

  it('normalizes Unicode edge whitespace without mutating interior content', () => {
    expect(normalizePayload('\u2003 hello world \uFEFF')).toBe('hello world');
  });

  it('limits rendering while preserving the complete source for copy', () => {
    const value = 'x'.repeat(20_000);
    const displayed = displayPayload(value);
    expect(displayed.truncated).toBe(true);
    expect(displayed.text.length).toBeLessThan(value.length);
    expect(interpretResult(value).value).toBe(value);
  });
});
