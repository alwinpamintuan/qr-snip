import type { PixelCrop } from './selection';
import { constrainedDimensions } from './decode-pipeline';
import DecoderWorker from '../workers/qr-decoder.worker.ts?worker&inline';

export type DecodeOutcome =
  | Readonly<{ ok: true; value: string }>
  | Readonly<{ ok: false; reason: 'not-found' | 'image-error' | 'cancelled' | 'resource-limit' }>;

export interface QrDecoder {
  decode(screenshotUrl: string, crop: PixelCrop, signal: AbortSignal): Promise<DecodeOutcome>;
  destroy(): void;
}

type WorkerResponse = Readonly<{
  requestId: number;
  value: string | null;
  error?: 'resource-limit' | 'image-error';
}>;

export class WorkerQrDecoder implements QrDecoder {
  private worker: Worker | null = null;
  private requestId = 0;

  async decode(screenshotUrl: string, crop: PixelCrop, signal: AbortSignal): Promise<DecodeOutcome> {
    if (signal.aborted) return { ok: false, reason: 'cancelled' };
    try {
      const image = await loadImage(screenshotUrl, signal);
      const dimensions = constrainedDimensions(crop.sw, crop.sh);
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return { ok: false, reason: 'image-error' };
      context.imageSmoothingEnabled = dimensions.width === crop.sw && dimensions.height === crop.sh;
      context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, dimensions.width, dimensions.height);
      const pixels = context.getImageData(0, 0, dimensions.width, dimensions.height);
      canvas.width = 1;
      canvas.height = 1;
      return await this.decodePixels(pixels, signal);
    } catch (error) {
      if (signal.aborted || error instanceof DOMException && error.name === 'AbortError') {
        return { ok: false, reason: 'cancelled' };
      }
      if (error instanceof RangeError) return { ok: false, reason: 'resource-limit' };
      return { ok: false, reason: 'image-error' };
    }
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  private decodePixels(pixels: ImageData, signal: AbortSignal): Promise<DecodeOutcome> {
    const worker = this.getWorker();
    const requestId = ++this.requestId;
    return new Promise((resolve) => {
      const finish = (outcome: DecodeOutcome): void => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        signal.removeEventListener('abort', onAbort);
        resolve(outcome);
      };
      const onMessage = (event: MessageEvent<WorkerResponse>): void => {
        if (event.data.requestId !== requestId) return;
        if (event.data.error) finish({ ok: false, reason: event.data.error });
        else if (event.data.value) finish({ ok: true, value: event.data.value });
        else finish({ ok: false, reason: 'not-found' });
      };
      const onError = (): void => finish({ ok: false, reason: 'image-error' });
      const onAbort = (): void => {
        this.destroy();
        finish({ ok: false, reason: 'cancelled' });
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      signal.addEventListener('abort', onAbort, { once: true });
      worker.postMessage({
        requestId,
        buffer: pixels.data.buffer,
        width: pixels.width,
        height: pixels.height,
      }, [pixels.data.buffer]);
    });
  }

  private getWorker(): Worker {
    this.worker ??= new DecoderWorker();
    return this.worker;
  }
}

function loadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = (): void => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
    };
    const onLoad = (): void => { cleanup(); resolve(image); };
    const onError = (): void => { cleanup(); reject(new Error('Screenshot could not be loaded.')); };
    const onAbort = (): void => { cleanup(); image.src = ''; reject(new DOMException('Cancelled', 'AbortError')); };
    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
    signal.addEventListener('abort', onAbort, { once: true });
    image.src = url;
  });
}
