import { describe, expect, it } from 'vitest';
import {
  clampPoint,
  isUsableSelection,
  rectFromPoints,
  toPixelCrop,
} from '../src/core/selection';

describe('selection geometry', () => {
  it('normalizes a drag in any direction', () => {
    expect(rectFromPoints({ x: 90, y: 70 }, { x: 20, y: 10 })).toEqual({
      x: 20,
      y: 10,
      width: 70,
      height: 60,
    });
  });

  it('clamps pointer coordinates to the viewport', () => {
    expect(clampPoint({ x: -4, y: 140 }, 100, 100)).toEqual({ x: 0, y: 100 });
  });

  it('rejects accidental clicks and tiny drags', () => {
    expect(isUsableSelection({ x: 0, y: 0, width: 19, height: 80 })).toBe(false);
    expect(isUsableSelection({ x: 0, y: 0, width: 20, height: 20 })).toBe(true);
  });

  it('maps CSS viewport coordinates to screenshot pixels', () => {
    expect(toPixelCrop(
      { x: 100, y: 50, width: 200, height: 100 },
      { width: 1000, height: 500 },
      { width: 2000, height: 1000 },
    )).toEqual({ sx: 200, sy: 100, sw: 400, sh: 200 });
  });

  it('keeps a crop inside the screenshot bounds', () => {
    expect(toPixelCrop(
      { x: 95, y: 95, width: 20, height: 20 },
      { width: 100, height: 100 },
      { width: 200, height: 200 },
    )).toEqual({ sx: 190, sy: 190, sw: 10, sh: 10 });
  });
});

