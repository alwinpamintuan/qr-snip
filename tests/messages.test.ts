import { describe, expect, it } from 'vitest';
import { isOpenResultMessage, isProbeContentMessage, isStartCaptureMessage } from '../src/core/messages';
import { DEFAULT_SETTINGS } from '../src/core/settings';

describe('runtime message guards', () => {
  it('accepts only the internal content readiness probe', () => {
    expect(isProbeContentMessage({ type: 'PROBE_CONTENT' })).toBe(true);
    expect(isProbeContentMessage({ type: 'PROBE_CONTENT', ready: true })).toBe(true);
    expect(isProbeContentMessage({ type: 'START_CAPTURE' })).toBe(false);
  });

  it('requires an invocation ID and image data URL for capture messages', () => {
    expect(isStartCaptureMessage({
      type: 'START_CAPTURE',
      invocationId: 'scan-2',
      screenshotUrl: 'data:image/png;base64,abc',
      settings: DEFAULT_SETTINGS,
    })).toBe(true);
    expect(isStartCaptureMessage({ type: 'START_CAPTURE', screenshotUrl: 'data:image/png;base64,abc' })).toBe(false);
    expect(isStartCaptureMessage({ type: 'START_CAPTURE', invocationId: 'scan-2', screenshotUrl: 'https://example.com/a.png' })).toBe(false);
    expect(isStartCaptureMessage({
      type: 'START_CAPTURE', invocationId: 'scan-2', screenshotUrl: 'data:image/png;base64,abc', settings: { ...DEFAULT_SETTINGS, theme: 'neon' },
    })).toBe(false);
  });

  it('accepts only shaped open requests without deciding protocol policy', () => {
    expect(isOpenResultMessage({ type: 'OPEN_RESULT', url: 'https://example.com' })).toBe(true);
    expect(isOpenResultMessage({ type: 'OPEN_RESULT', url: 42 })).toBe(false);
  });
});
