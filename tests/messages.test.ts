import { describe, expect, it } from 'vitest';
import { isOpenResultMessage, isStartCaptureMessage } from '../src/core/messages';

describe('runtime message guards', () => {
  it('requires an invocation ID and image data URL for capture messages', () => {
    expect(isStartCaptureMessage({
      type: 'START_CAPTURE',
      invocationId: 'scan-2',
      screenshotUrl: 'data:image/png;base64,abc',
    })).toBe(true);
    expect(isStartCaptureMessage({ type: 'START_CAPTURE', screenshotUrl: 'data:image/png;base64,abc' })).toBe(false);
    expect(isStartCaptureMessage({ type: 'START_CAPTURE', invocationId: 'scan-2', screenshotUrl: 'https://example.com/a.png' })).toBe(false);
  });

  it('accepts only shaped open requests without deciding protocol policy', () => {
    expect(isOpenResultMessage({ type: 'OPEN_RESULT', url: 'https://example.com' })).toBe(true);
    expect(isOpenResultMessage({ type: 'OPEN_RESULT', url: 42 })).toBe(false);
  });
});
