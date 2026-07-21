import { describe, expect, it } from 'vitest';
import { constrainedDimensions, decodeRgba, MAX_DECODE_PIXELS } from '../src/core/decode-pipeline';

describe('RGBA decode pipeline', () => {
  it('rejects malformed buffers before invoking the decoder', () => {
    expect(() => decodeRgba({ data: new Uint8ClampedArray(3), width: 1, height: 1 })).toThrow(RangeError);
  });

  it('bounds high-DPI crops by dimensions and total pixels', () => {
    const constrained = constrainedDimensions(12_000, 8_000);
    expect(constrained.width).toBeLessThanOrEqual(6_000);
    expect(constrained.width * constrained.height).toBeLessThanOrEqual(MAX_DECODE_PIXELS);
  });

  it('returns no false positive for a blank image', () => {
    const width = 100;
    const height = 100;
    expect(decodeRgba({ data: new Uint8ClampedArray(width * height * 4).fill(255), width, height })).toBeNull();
  });
});
