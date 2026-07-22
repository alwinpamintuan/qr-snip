import type { InterpretedResult, ResultInterpreter } from './contract';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/;

export const urlInterpreter: ResultInterpreter = {
  id: 'url',
  matches: (payload) => {
    try {
      const protocol = new URL(payload).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  },
  present: (payload) => ({ value: payload, kind: 'url', openUrl: new URL(payload).href }),
};

export const emailInterpreter: ResultInterpreter = {
  id: 'email',
  matches: (payload) => emailAddress(payload) !== null,
  present: (payload) => {
    const address = emailAddress(payload)!;
    return {
      value: payload,
      kind: 'email',
      openUrl: payload.toLowerCase().startsWith('mailto:') ? payload : `mailto:${address}`,
    };
  },
};

export const phoneInterpreter: ResultInterpreter = {
  id: 'phone',
  matches: (payload) => phoneNumber(payload) !== null,
  present: (payload) => ({
    value: payload,
    kind: 'phone',
    openUrl: payload.toLowerCase().startsWith('tel:') ? payload : `tel:${phoneNumber(payload)!.replace(/\s/g, '')}`,
  }),
};

export const textInterpreter: ResultInterpreter = {
  id: 'text',
  matches: () => true,
  present: (payload): InterpretedResult => ({ value: payload, kind: 'text' }),
};

function emailAddress(payload: string): string | null {
  if (payload.toLowerCase().startsWith('mailto:')) {
    const address = payload.slice('mailto:'.length).split('?')[0] ?? '';
    return EMAIL_PATTERN.test(address) ? address : null;
  }
  return EMAIL_PATTERN.test(payload) ? payload : null;
}

function phoneNumber(payload: string): string | null {
  const number = payload.toLowerCase().startsWith('tel:') ? payload.slice(4) : payload;
  return PHONE_PATTERN.test(number) ? number : null;
}
