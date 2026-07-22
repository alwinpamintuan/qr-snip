import englishMessages from '../../public/_locales/en/messages.json';
import { SnipperApplication } from '../../src/application/snipper-application';
import type { DecodeOutcome, QrDecoder } from '../../src/core/decode';
import { createI18n, type MessageCatalog } from '../../src/i18n/messages';
import { SnipperView } from '../../src/ui/snipper-view';

type CatalogEntry = Readonly<{
  message: string;
  placeholders?: Readonly<Record<string, Readonly<{ content: string }>>>;
}>;

const query = new URLSearchParams(location.search);
const messages: unknown[] = [];
const state = document.querySelector<HTMLOutputElement>('#test-state')!;
const catalog: MessageCatalog = {
  getMessage(key, substitutions) {
    if (key === '@@bidi_dir') return query.get('dir') === 'rtl' ? 'rtl' : 'ltr';
    const entry = (englishMessages as Record<string, CatalogEntry>)[key];
    if (!entry) return '';
    const values = typeof substitutions === 'string' ? [substitutions] : substitutions ?? [];
    const placeholderValues = new Map(
      Object.entries(entry.placeholders ?? {}).map(([name, placeholder]) => {
        const index = Number(placeholder.content.slice(1)) - 1;
        return [name.toUpperCase(), values[index] ?? ''] as const;
      }),
    );
    const message = entry.message.replace(/\$([A-Z_]+)\$/g, (_, name: string) => placeholderValues.get(name) ?? '');
    return query.get('pseudo') === 'long' ? `⟦${message} · extended localized words⟧` : message;
  },
};

const browserMock = {
  runtime: {
    id: 'e2e-harness',
    sendMessage: async (message: unknown) => {
      messages.push(message);
      state.textContent = JSON.stringify(messages);
      return undefined;
    },
  },
};
(globalThis as unknown as { browser: typeof browserMock }).browser = browserMock;

class DeterministicDecoder implements QrDecoder {
  async decode(_screenshotUrl: string, _crop: unknown, signal: AbortSignal): Promise<DecodeOutcome> {
    await new Promise((resolve) => window.setTimeout(resolve, 30));
    if (signal.aborted) return { ok: false, reason: 'cancelled' };
    const scenario = query.get('scenario') ?? 'happy';
    if (scenario === 'not-found') return { ok: false, reason: 'not-found' };
    if (scenario === 'suspicious') return { ok: true, value: 'http://user:pass@192.168.1.4:8080/path' };
    return { ok: true, value: 'https://example.com/qr-snip' };
  }

  destroy(): void {}
}

function createScreenshot(): string {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(800, window.innerWidth);
  canvas.height = Math.max(600, window.innerHeight);
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f7effb');
  gradient.addColorStop(1, '#c9a8df');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#2d1738';
  context.font = '700 44px system-ui';
  context.fillText('Synthetic QR Snip screen', 64, 100);
  return canvas.toDataURL('image/png');
}

const i18n = createI18n(catalog);
const application = new SnipperApplication(new SnipperView(i18n, 'open'), i18n.t, new DeterministicDecoder());
application.start(crypto.randomUUID(), createScreenshot());
state.textContent = 'Harness ready';
