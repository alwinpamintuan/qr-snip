export const MAX_DISPLAY_PAYLOAD_LENGTH = 16_384;
export const MAX_PAYLOAD_LENGTH = 1_000_000;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
const UNICODE_EDGE_WHITESPACE_PATTERN = /^[\p{White_Space}\uFEFF]+|[\p{White_Space}\uFEFF]+$/gu;

export function isAllowedOpenUrl(value: string): boolean {
  const normalized = normalizePayload(value);
  if (normalized.length > MAX_PAYLOAD_LENGTH || payloadHasUnsafeControls(normalized)) return false;
  try {
    const protocol = new URL(normalized).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:';
  } catch {
    return false;
  }
}

export function payloadHasUnsafeControls(value: string): boolean {
  return CONTROL_CHARACTER_PATTERN.test(value);
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
