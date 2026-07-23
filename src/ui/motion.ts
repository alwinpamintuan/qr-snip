import { MOTION_SPRINGS, type MotionSpringName } from './theme-tokens';

export type MotionPresetName = 'entrance' | 'exit' | 'press' | 'reveal';

export type MotionPoint = Readonly<{
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
}>;

export type SpringMotion = Readonly<{
  from: MotionPoint;
  to: MotionPoint;
  spring: MotionSpringName;
  duration: number;
}>;

export type MotionOptions = Readonly<{
  delay?: number;
  prefix?: string;
  persist?: boolean;
  reducedMotion?: boolean;
}>;

export const MOTION_PRESETS: Readonly<Record<MotionPresetName, SpringMotion>> = {
  entrance: {
    from: { y: -18, scale: .88, opacity: 0 },
    to: { y: 0, scale: 1, opacity: 1 },
    spring: 'expressive',
    duration: 420,
  },
  exit: {
    from: { y: 0, scale: 1, opacity: 1 },
    to: { y: -8, scale: .94, opacity: 0 },
    spring: 'settled',
    duration: 180,
  },
  press: {
    from: { scale: .92, opacity: 1 },
    to: { scale: 1, opacity: 1 },
    spring: 'firm',
    duration: 300,
  },
  reveal: {
    from: { y: 12, scale: .97, opacity: 0 },
    to: { y: 0, scale: 1, opacity: 1 },
    spring: 'settled',
    duration: 360,
  },
};

const activeAnimations = new WeakMap<Element, Animation>();

export function sampleSpring(
  progress: number,
  spring: Readonly<{ stiffness: number; damping: number; mass: number; maxOvershoot: number }>,
): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;

  const naturalFrequency = Math.sqrt(spring.stiffness / spring.mass);
  const dampingRatio = spring.damping / (2 * Math.sqrt(spring.stiffness * spring.mass));
  let value: number;
  if (dampingRatio < 1) {
    const dampedFrequency = naturalFrequency * Math.sqrt(1 - dampingRatio ** 2);
    const seconds = progress;
    value = 1 - Math.exp(-dampingRatio * naturalFrequency * seconds)
      * (Math.cos(dampedFrequency * seconds)
        + (dampingRatio * naturalFrequency / dampedFrequency) * Math.sin(dampedFrequency * seconds));
  } else {
    value = 1 - Math.exp(-naturalFrequency * progress) * (1 + naturalFrequency * progress);
  }
  return Math.min(1 + spring.maxOvershoot, Math.max(0, value));
}

export function createSpringKeyframes(
  motion: SpringMotion,
  prefix = '',
  sampleCount = 18,
): Keyframe[] {
  const spring = MOTION_SPRINGS[motion.spring];
  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const offset = index / sampleCount;
    const sampled = index === sampleCount ? 1 : sampleSpring(offset, spring);
    return pointToKeyframe(interpolatePoint(motion.from, motion.to, sampled), prefix, offset);
  });
}

export function prefersReducedMotion(
  matcher: Pick<typeof globalThis, 'matchMedia'> = globalThis,
): boolean {
  return typeof matcher.matchMedia === 'function'
    && matcher.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function cancelMotion(element: Element): void {
  const active = activeAnimations.get(element);
  if (!active) return;
  activeAnimations.delete(element);
  active.cancel();
}

export function animateElement(
  element: HTMLElement,
  preset: MotionPresetName | SpringMotion,
  options: MotionOptions = {},
): Animation | null {
  cancelMotion(element);
  const motion = typeof preset === 'string' ? MOTION_PRESETS[preset] : preset;
  const keyframes = createSpringKeyframes(motion, options.prefix);
  const finalFrame = keyframes[keyframes.length - 1]!;

  if (options.reducedMotion ?? prefersReducedMotion()) {
    if (options.persist !== false) applyFrame(element, finalFrame);
    return null;
  }

  const animation = element.animate(keyframes, {
    duration: motion.duration,
    delay: options.delay ?? 0,
    fill: 'both',
    easing: 'linear',
  });
  activeAnimations.set(element, animation);
  void animation.finished.then(() => {
    if (activeAnimations.get(element) !== animation) return;
    activeAnimations.delete(element);
    if (options.persist === false) {
      element.style.removeProperty('opacity');
      element.style.removeProperty('transform');
    } else {
      applyFrame(element, finalFrame);
    }
  }, () => undefined);
  return animation;
}

export function animateStagger(
  elements: Iterable<HTMLElement>,
  preset: MotionPresetName = 'reveal',
  interval = 48,
  options: MotionOptions = {},
): void {
  [...elements].forEach((element, index) => {
    animateElement(element, preset, { ...options, delay: (options.delay ?? 0) + index * interval });
  });
}

export function installPressMotion(element: HTMLElement): void {
  element.addEventListener('pointerdown', () => animateElement(element, 'press', { persist: false }));
}

function interpolatePoint(from: MotionPoint, to: MotionPoint, progress: number): Required<MotionPoint> {
  return {
    x: interpolate(from.x ?? 0, to.x ?? 0, progress),
    y: interpolate(from.y ?? 0, to.y ?? 0, progress),
    scale: interpolate(from.scale ?? 1, to.scale ?? 1, progress),
    rotate: interpolate(from.rotate ?? 0, to.rotate ?? 0, progress),
    opacity: interpolate(from.opacity ?? 1, to.opacity ?? 1, Math.min(1, progress)),
  };
}

function pointToKeyframe(point: Required<MotionPoint>, prefix: string, offset: number): Keyframe {
  const base = prefix ? `${prefix} ` : '';
  return {
    offset,
    opacity: point.opacity,
    transform: `${base}translate3d(${point.x}px, ${point.y}px, 0) rotate(${point.rotate}deg) scale(${point.scale})`,
  };
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function applyFrame(element: HTMLElement, frame: Keyframe): void {
  if (frame.opacity !== undefined && frame.opacity !== null) element.style.opacity = String(frame.opacity);
  if (typeof frame.transform === 'string') element.style.transform = frame.transform;
}
