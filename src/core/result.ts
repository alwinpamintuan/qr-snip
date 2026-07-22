export type ResultKind = 'url' | 'email' | 'phone' | 'text';

export type ClassifiedResult = Readonly<{
  value: string;
  kind: ResultKind;
  openUrl?: string;
}>;

export const MAX_DISPLAY_PAYLOAD_LENGTH = 16_384;
export const MAX_PAYLOAD_LENGTH = 1_000_000;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
const UNICODE_EDGE_WHITESPACE_PATTERN = /^[\p{White_Space}\uFEFF]+|[\p{White_Space}\uFEFF]+$/gu;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/;

export function classifyResult(rawValue: string): ClassifiedResult {
  const value = normalizePayload(rawValue);
  if (value.length > MAX_PAYLOAD_LENGTH || CONTROL_CHARACTER_PATTERN.test(value)) {
    return { value, kind: 'text' };
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { value, kind: 'url', openUrl: url.href };
    }
  } catch {
    // Continue through non-URL result types.
  }

  if (value.toLowerCase().startsWith('mailto:')) {
    const address = value.slice('mailto:'.length).split('?')[0] ?? '';
    if (EMAIL_PATTERN.test(address)) {
      return { value, kind: 'email', openUrl: value };
    }
  }

  if (EMAIL_PATTERN.test(value)) {
    return { value, kind: 'email', openUrl: `mailto:${value}` };
  }

  if (value.toLowerCase().startsWith('tel:') && PHONE_PATTERN.test(value.slice(4))) {
    return { value, kind: 'phone', openUrl: value };
  }

  if (PHONE_PATTERN.test(value)) {
    return { value, kind: 'phone', openUrl: `tel:${value.replace(/\s/g, '')}` };
  }

  return { value, kind: 'text' };
}

export function isAllowedOpenUrl(value: string): boolean {
  const normalized = normalizePayload(value);
  if (normalized.length > MAX_PAYLOAD_LENGTH || CONTROL_CHARACTER_PATTERN.test(normalized)) return false;
  try {
    const protocol = new URL(normalized).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:';
  } catch {
    return false;
  }
}

export function normalizePayload(value: string): string {
  return value.replace(UNICODE_EDGE_WHITESPACE_PATTERN, '');
}

export function displayPayload(value: string): Readonly<{ text: string; truncated: boolean }> {
  if (value.length <= MAX_DISPLAY_PAYLOAD_LENGTH) return { text: value, truncated: false };
  return {
    text: value.slice(0, MAX_DISPLAY_PAYLOAD_LENGTH),
    truncated: true,
  };
}
