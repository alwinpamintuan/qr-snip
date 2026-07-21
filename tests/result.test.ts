import { describe, expect, it } from 'vitest';
import { classifyResult, isAllowedOpenUrl } from '../src/core/result';

describe('QR result handling', () => {
  it('recognizes secure and insecure web links', () => {
    expect(classifyResult('https://example.com/path').kind).toBe('url');
    expect(classifyResult('http://example.com').openUrl).toBe('http://example.com/');
  });

  it('turns plain email addresses into mail links', () => {
    expect(classifyResult('hello@example.com')).toMatchObject({
      kind: 'email',
      openUrl: 'mailto:hello@example.com',
    });
  });

  it('keeps ordinary payloads as text', () => {
    const result = classifyResult('WIFI:T:WPA;S:Guest;P:secret;;');
    expect(result.kind).toBe('text');
    expect(result).not.toHaveProperty('openUrl');
  });

  it('blocks dangerous and unsupported protocols', () => {
    expect(isAllowedOpenUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedOpenUrl('data:text/html,hello')).toBe(false);
    expect(isAllowedOpenUrl('https://example.com')).toBe(true);
    expect(isAllowedOpenUrl('mailto:hello@example.com')).toBe(true);
  });
});
