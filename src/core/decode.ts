import jsQR from 'jsqr';
import type { PixelCrop } from './selection';

export type DecodeOutcome =
  | Readonly<{ ok: true; value: string }>
  | Readonly<{ ok: false; reason: 'not-found' | 'image-error' }>;

export async function decodeSelection(
  screenshotUrl: string,
  crop: PixelCrop,
): Promise<DecodeOutcome> {
  try {
    const image = await loadImage(screenshotUrl);
    const canvas = document.createElement('canvas');
    canvas.width = crop.sw;
    canvas.height = crop.sh;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return { ok: false, reason: 'image-error' };

    context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.sw, crop.sh);
    const direct = decodeCanvas(context, crop.sw, crop.sh);
    if (direct) return { ok: true, value: direct };

    // A modest nearest-neighbor upscale helps with small on-screen QR codes.
    if (Math.min(crop.sw, crop.sh) < 320) {
      const scale = 2;
      const enlarged = document.createElement('canvas');
      enlarged.width = crop.sw * scale;
      enlarged.height = crop.sh * scale;
      const enlargedContext = enlarged.getContext('2d', { willReadFrequently: true });
      if (enlargedContext) {
        enlargedContext.imageSmoothingEnabled = false;
        enlargedContext.drawImage(canvas, 0, 0, enlarged.width, enlarged.height);
        const retried = decodeCanvas(enlargedContext, enlarged.width, enlarged.height);
        if (retried) return { ok: true, value: retried };
      }
    }

    return { ok: false, reason: 'not-found' };
  } catch {
    return { ok: false, reason: 'image-error' };
  }
}

function decodeCanvas(context: CanvasRenderingContext2D, width: number, height: number): string | null {
  const pixels = context.getImageData(0, 0, width, height);
  const result = jsQR(pixels.data, width, height, { inversionAttempts: 'attemptBoth' });
  return result?.data || null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('Screenshot could not be loaded.')), { once: true });
    image.src = url;
  });
}

