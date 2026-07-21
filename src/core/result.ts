export type ResultKind = 'url' | 'email' | 'phone' | 'text';

export type ClassifiedResult = Readonly<{
  value: string;
  kind: ResultKind;
  openUrl?: string;
  label: string;
}>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/;

export function classifyResult(rawValue: string): ClassifiedResult {
  const value = rawValue.trim();

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { value, kind: 'url', openUrl: url.href, label: 'Web link' };
    }
  } catch {
    // Continue through non-URL result types.
  }

  if (value.toLowerCase().startsWith('mailto:')) {
    const address = value.slice('mailto:'.length).split('?')[0] ?? '';
    if (EMAIL_PATTERN.test(address)) {
      return { value, kind: 'email', openUrl: value, label: 'Email address' };
    }
  }

  if (EMAIL_PATTERN.test(value)) {
    return { value, kind: 'email', openUrl: `mailto:${value}`, label: 'Email address' };
  }

  if (value.toLowerCase().startsWith('tel:') && PHONE_PATTERN.test(value.slice(4))) {
    return { value, kind: 'phone', openUrl: value, label: 'Phone number' };
  }

  if (PHONE_PATTERN.test(value)) {
    return { value, kind: 'phone', openUrl: `tel:${value.replace(/\s/g, '')}`, label: 'Phone number' };
  }

  return { value, kind: 'text', label: 'Text' };
}

export function isAllowedOpenUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:';
  } catch {
    return false;
  }
}

