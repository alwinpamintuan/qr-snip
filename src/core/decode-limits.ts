export const MAX_DECODE_PIXELS = 4_000_000;
export const MAX_DECODE_DIMENSION = 4_096;

export function constrainedDimensions(width: number, height: number): Readonly<{ width: number; height: number }> {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Image dimensions must be positive.');
  }
  const dimensionScale = Math.min(1, MAX_DECODE_DIMENSION / Math.max(width, height));
  const pixelScale = Math.min(1, Math.sqrt(MAX_DECODE_PIXELS / (width * height)));
  const scale = Math.min(dimensionScale, pixelScale);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}
