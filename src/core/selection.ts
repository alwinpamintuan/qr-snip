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
export const DEFAULT_KEYBOARD_SELECTION_SIZE = 240;
export const KEYBOARD_SELECTION_STEP = 8;
export const KEYBOARD_SELECTION_FAST_STEP = 32;

export type SelectionBounds = Readonly<{ width: number; height: number }>;
export type SelectionAdjustment = Readonly<{
  axis: 'x' | 'y';
  delta: number;
  resize: boolean;
}>;

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

export function centeredSelection(bounds: SelectionBounds): SelectionRect {
  const width = Math.max(MIN_SELECTION_SIZE, Math.min(DEFAULT_KEYBOARD_SELECTION_SIZE, bounds.width));
  const height = Math.max(MIN_SELECTION_SIZE, Math.min(DEFAULT_KEYBOARD_SELECTION_SIZE, bounds.height));
  return {
    x: Math.max(0, (bounds.width - width) / 2),
    y: Math.max(0, (bounds.height - height) / 2),
    width,
    height,
  };
}

export function adjustSelection(
  rect: SelectionRect,
  adjustment: SelectionAdjustment,
  bounds: SelectionBounds,
): SelectionRect {
  if (adjustment.resize) return resizeSelection(rect, adjustment, bounds);
  const nextX = adjustment.axis === 'x' ? rect.x + adjustment.delta : rect.x;
  const nextY = adjustment.axis === 'y' ? rect.y + adjustment.delta : rect.y;
  return {
    ...rect,
    x: Math.min(Math.max(nextX, 0), Math.max(0, bounds.width - rect.width)),
    y: Math.min(Math.max(nextY, 0), Math.max(0, bounds.height - rect.height)),
  };
}

function resizeSelection(
  rect: SelectionRect,
  adjustment: SelectionAdjustment,
  bounds: SelectionBounds,
): SelectionRect {
  const width = adjustment.axis === 'x'
    ? Math.min(Math.max(rect.width + adjustment.delta, MIN_SELECTION_SIZE), Math.max(MIN_SELECTION_SIZE, bounds.width - rect.x))
    : rect.width;
  const height = adjustment.axis === 'y'
    ? Math.min(Math.max(rect.height + adjustment.delta, MIN_SELECTION_SIZE), Math.max(MIN_SELECTION_SIZE, bounds.height - rect.y))
    : rect.height;
  return { ...rect, width, height };
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
