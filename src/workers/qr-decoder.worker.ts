/// <reference lib="webworker" />

import { decodeRgba } from '../core/decode-pipeline';

type DecodeRequest = Readonly<{
  requestId: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
}>;

self.addEventListener('message', (event: MessageEvent<DecodeRequest>) => {
  const { requestId, buffer, width, height } = event.data;
  try {
    const value = decodeRgba({ data: new Uint8ClampedArray(buffer), width, height });
    self.postMessage({ requestId, value });
  } catch (error) {
    self.postMessage({
      requestId,
      value: null,
      error: error instanceof RangeError ? 'resource-limit' : 'image-error',
    });
  }
});
