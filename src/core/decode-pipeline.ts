import jsQR from 'jsqr';
import { MAX_DECODE_PIXELS } from './decode-limits';

export type RgbaImage = Readonly<{
  data: Uint8ClampedArray;
  width: number;
  height: number;
}>;

const RETRY_DECODE_PIXELS = 2_000_000;

export function decodeRgba(image: RgbaImage): string | null {
  assertImage(image);
  const direct = runDecoder(image);
  if (direct) return direct;

  if (image.width * image.height > RETRY_DECODE_PIXELS) {
    const retried = runDecoder(scaleToPixelBudget(image, RETRY_DECODE_PIXELS));
    if (retried) return retried;
  }

  if (Math.min(image.width, image.height) >= 320) return null;
  const enlarged = scaleNearest(image, 2);
  return runDecoder(enlarged);
}

function assertImage(image: RgbaImage): void {
  if (image.width <= 0 || image.height <= 0 || image.width * image.height > MAX_DECODE_PIXELS) {
    throw new RangeError('Image exceeds the decoder resource budget.');
  }
  if (image.data.byteLength !== image.width * image.height * 4) {
    throw new RangeError('RGBA buffer length does not match its dimensions.');
  }
}

function runDecoder(image: RgbaImage): string | null {
  return jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data || null;
}

function scaleToPixelBudget(image: RgbaImage, pixelBudget: number): RgbaImage {
  const scale = Math.sqrt(pixelBudget / (image.width * image.height));
  return scaleNearestDimensions(
    image,
    Math.max(1, Math.floor(image.width * scale)),
    Math.max(1, Math.floor(image.height * scale)),
  );
}

function scaleNearest(image: RgbaImage, scale: number): RgbaImage {
  return scaleNearestDimensions(image, image.width * scale, image.height * scale);
}

function scaleNearestDimensions(image: RgbaImage, width: number, height: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.floor(y * image.height / height);
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.floor(x * image.width / width);
      const sourceOffset = (sourceY * image.width + sourceX) * 4;
      const targetOffset = (y * width + x) * 4;
      data[targetOffset] = image.data[sourceOffset] ?? 0;
      data[targetOffset + 1] = image.data[sourceOffset + 1] ?? 0;
      data[targetOffset + 2] = image.data[sourceOffset + 2] ?? 0;
      data[targetOffset + 3] = image.data[sourceOffset + 3] ?? 255;
    }
  }
  return { data, width, height };
}
