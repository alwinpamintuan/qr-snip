import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { decodeRgba } from '../src/core/decode-pipeline';

type Fixture = Readonly<{
  id: string;
  path: string;
  expectedPayload: string | null;
  crop?: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

const fixtureRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/qr');
const manifest = JSON.parse(readFileSync(resolve(fixtureRoot, 'manifest.json'), 'utf8')) as {
  positives: Fixture[];
  negatives: Fixture[];
};

describe('QR decoder fixture corpus', () => {
  it('decodes at least 90% of the documented positive corpus', () => {
    const failures: string[] = [];
    for (const fixture of manifest.positives) {
      const image = readFixture(fixture);
      const value = decodeRgba(image);
      if (value !== fixture.expectedPayload) failures.push(fixture.id);
    }
    const successRate = (manifest.positives.length - failures.length) / manifest.positives.length;
    expect(manifest.positives.length).toBeGreaterThanOrEqual(100);
    expect(successRate, `Failed fixture IDs: ${failures.join(', ')}`).toBeGreaterThanOrEqual(.9);
  }, 30_000);

  it('does not produce a false positive in the negative corpus', () => {
    const falsePositives = manifest.negatives
      .filter((fixture) => decodeRgba(readFixture(fixture)) !== null)
      .map((fixture) => fixture.id);
    expect(manifest.negatives.length).toBeGreaterThanOrEqual(30);
    expect(falsePositives, `False-positive fixture IDs: ${falsePositives.join(', ')}`).toEqual([]);
  }, 30_000);
});

function readFixture(fixture: Fixture): { data: Uint8ClampedArray; width: number; height: number } {
  const png = PNG.sync.read(readFileSync(resolve(fixtureRoot, fixture.path)));
  if (!fixture.crop) return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height };
  const { x, y, width, height } = fixture.crop;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((y + row) * png.width + x) * 4;
    data.set(png.data.subarray(sourceStart, sourceStart + width * 4), row * width * 4);
  }
  return { data, width, height };
}
