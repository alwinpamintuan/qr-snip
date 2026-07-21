export type Point = Readonly<{ x: number; y: number }>;

export type SelectionRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type PixelCrop = Readonly<{
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}>;

export const MIN_SELECTION_SIZE = 20;

export function rectFromPoints(start: Point, end: Point): SelectionRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function clampPoint(point: Point, width: number, height: number): Point {
  return {
    x: Math.min(Math.max(point.x, 0), width),
    y: Math.min(Math.max(point.y, 0), height),
  };
}

export function isUsableSelection(rect: SelectionRect): boolean {
  return rect.width >= MIN_SELECTION_SIZE && rect.height >= MIN_SELECTION_SIZE;
}

export function toPixelCrop(
  rect: SelectionRect,
  viewport: Readonly<{ width: number; height: number }>,
  image: Readonly<{ width: number; height: number }>,
): PixelCrop {
  if (viewport.width <= 0 || viewport.height <= 0 || image.width <= 0 || image.height <= 0) {
    throw new RangeError('Viewport and image dimensions must be positive.');
  }

  const scaleX = image.width / viewport.width;
  const scaleY = image.height / viewport.height;
  const sx = Math.max(0, Math.floor(rect.x * scaleX));
  const sy = Math.max(0, Math.floor(rect.y * scaleY));
  const right = Math.min(image.width, Math.ceil((rect.x + rect.width) * scaleX));
  const bottom = Math.min(image.height, Math.ceil((rect.y + rect.height) * scaleY));

  return {
    sx,
    sy,
    sw: Math.max(1, right - sx),
    sh: Math.max(1, bottom - sy),
  };
}

