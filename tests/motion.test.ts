import { describe, expect, it, vi } from 'vitest';
import {
  animateElement,
  createSpringKeyframes,
  MOTION_PRESETS,
  prefersReducedMotion,
  sampleSpring,
} from '../src/ui/motion';
import { MOTION_SPRINGS } from '../src/ui/theme-tokens';

describe('spring motion', () => {
  it('starts and finishes at exact final states with bounded overshoot', () => {
    const frames = createSpringKeyframes(MOTION_PRESETS.entrance);
    expect(frames[0]).toMatchObject({ offset: 0, opacity: 0 });
    expect(frames.at(-1)).toMatchObject({ offset: 1, opacity: 1 });
    expect(frames.at(-1)?.transform).toContain('translate3d(0px, 0px, 0)');
    expect(frames.at(-1)?.transform).toContain('scale(1)');

    const samples = Array.from({ length: 101 }, (_, index) =>
      sampleSpring(index / 100, MOTION_SPRINGS.expressive));
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1 + MOTION_SPRINGS.expressive.maxOvershoot);
    expect(samples.at(-1)).toBe(1);
  });

  it('cancels superseded animation on the same element', () => {
    const first = fakeAnimation();
    const second = fakeAnimation();
    const animate = vi.fn()
      .mockReturnValueOnce(first.animation)
      .mockReturnValueOnce(second.animation);
    const element = { animate, style: {} } as unknown as HTMLElement;

    animateElement(element, 'entrance', { reducedMotion: false });
    animateElement(element, 'reveal', { reducedMotion: false });

    expect(first.cancel).toHaveBeenCalledOnce();
    expect(second.cancel).not.toHaveBeenCalled();
  });

  it('applies the final state immediately when motion is reduced', () => {
    const element = { animate: vi.fn(), style: {} } as unknown as HTMLElement;
    const result = animateElement(element, 'entrance', { reducedMotion: true });

    expect(result).toBeNull();
    expect(element.animate).not.toHaveBeenCalled();
    expect(element.style.opacity).toBe('1');
    expect(element.style.transform).toContain('scale(1)');
  });

  it('resolves the system reduced-motion preference', () => {
    expect(prefersReducedMotion({
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    } as unknown as typeof globalThis)).toBe(true);
  });
});

function fakeAnimation(): Readonly<{ animation: Animation; cancel: ReturnType<typeof vi.fn> }> {
  const cancel = vi.fn();
  return {
    cancel,
    animation: {
      cancel,
      finished: new Promise<Animation>(() => undefined),
    } as unknown as Animation,
  };
}
