type TokenGroup<T extends string> = Readonly<Record<T, string>>;

type ColorRole =
  | 'primary' | 'on-primary' | 'primary-container' | 'on-primary-container'
  | 'surface' | 'surface-container' | 'surface-high' | 'on-surface' | 'on-surface-variant'
  | 'outline' | 'error' | 'warning' | 'on-warning' | 'warning-container' | 'on-warning-container'
  | 'shadow' | 'scrim' | 'selection' | 'selection-outline' | 'selection-highlight' | 'white';
type TypeRole = 'font-family' | 'title-size' | 'body-size' | 'label-size' | 'caption-size';
type ShapeRole = 'pill' | 'button' | 'card' | 'card-accent' | 'medium' | 'small';
type ElevationRole = 'floating' | 'dialog' | 'raised' | 'selected';
type MotionRole = 'standard' | 'emphasized' | 'decelerate' | 'fast' | 'medium' | 'slow';
export type MotionSpringName = 'expressive' | 'settled' | 'firm';

export type DesignTokenSet = Readonly<{
  colors: TokenGroup<ColorRole>;
  typography: TokenGroup<TypeRole>;
  shapes: TokenGroup<ShapeRole>;
  elevation: TokenGroup<ElevationRole>;
  motion: TokenGroup<MotionRole>;
}>;

const shared = {
  typography: {
    'font-family': 'Inter, Roboto, "Segoe UI", system-ui, -apple-system, sans-serif',
    'title-size': '24px',
    'body-size': '14px',
    'label-size': '12px',
    'caption-size': '11px',
  },
  shapes: {
    pill: '28px',
    button: '22px',
    card: '32px 32px 32px 12px',
    'card-accent': '28px 44px 28px 16px',
    medium: '18px',
    small: '11px',
  },
  elevation: {
    floating: '0 1px 0 color-mix(in srgb, var(--qr-white) 42%, transparent) inset, 0 8px 30px var(--qr-shadow)',
    dialog: '0 1px 0 color-mix(in srgb, var(--qr-white) 48%, transparent) inset, 0 18px 60px var(--qr-shadow), 0 4px 18px color-mix(in srgb, var(--qr-shadow) 72%, transparent)',
    raised: '0 6px 18px color-mix(in srgb, var(--qr-primary) 20%, transparent)',
    selected: '0 0 0 1px var(--qr-selection-outline), 0 12px 40px var(--qr-shadow), inset 0 0 0 1px var(--qr-selection-highlight)',
  },
  motion: {
    standard: 'cubic-bezier(.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(.05, .7, .1, 1)',
    fast: '180ms',
    medium: '300ms',
    slow: '480ms',
  },
} satisfies Omit<DesignTokenSet, 'colors'>;

export const MOTION_SPRINGS = {
  expressive: { stiffness: 225, damping: 17, mass: 1, maxOvershoot: .08 },
  settled: { stiffness: 240, damping: 24, mass: 1, maxOvershoot: .035 },
  firm: { stiffness: 320, damping: 22, mass: .9, maxOvershoot: .05 },
} as const satisfies Readonly<Record<MotionSpringName, Readonly<{
  stiffness: number;
  damping: number;
  mass: number;
  maxOvershoot: number;
}>>>;

export const LIGHT_TOKENS: DesignTokenSet = {
  colors: {
    primary: '#76558f', 'on-primary': '#ffffff', 'primary-container': '#f0dbff',
    'on-primary-container': '#2d0b43', surface: '#fff7ff', 'surface-container': '#f3edf5',
    'surface-high': '#ede7ef', 'on-surface': '#1e1a20', 'on-surface-variant': '#4c454f',
    outline: '#7d747f', error: '#ba1a1a', warning: '#815500', 'on-warning': '#ffffff',
    'warning-container': '#ffdea5', 'on-warning-container': '#2a1800', shadow: 'rgba(28, 19, 31, .34)',
    scrim: 'rgba(13, 10, 15, .54)', selection: '#f1d7ff', 'selection-outline': 'rgba(48, 16, 66, .65)',
    'selection-highlight': 'rgba(255, 255, 255, .42)', white: '#ffffff',
  },
  ...shared,
};

export const DARK_TOKENS: DesignTokenSet = {
  ...shared,
  colors: {
    primary: '#dcb9f5', 'on-primary': '#422255', 'primary-container': '#593a6d',
    'on-primary-container': '#f0dbff', surface: '#161217', 'surface-container': '#211d22',
    'surface-high': '#2b272c', 'on-surface': '#f3e9f2', 'on-surface-variant': '#d6cad6',
    outline: '#a99daa', error: '#ffb4ab', warning: '#ffb95c', 'on-warning': '#452b00',
    'warning-container': '#624000', 'on-warning-container': '#ffdea5', shadow: 'rgba(0, 0, 0, .58)',
    scrim: 'rgba(0, 0, 0, .58)', selection: '#e5c6fa', 'selection-outline': 'rgba(12, 3, 16, .85)',
    'selection-highlight': 'rgba(255, 255, 255, .3)', white: '#ffffff',
  },
};

export function tokensToCssDeclarations(tokens: DesignTokenSet): string {
  return Object.entries(tokens).flatMap(([group, values]) =>
    Object.entries(values).map(([name, value]) => `--qr-${group === 'colors' ? '' : `${group}-`}${name}: ${value};`),
  ).join('\n');
}

export const THEME_TOKEN_STYLES = String.raw`
  :host {
    ${tokensToCssDeclarations(LIGHT_TOKENS)}
    color-scheme: light dark;
    font-family: var(--qr-typography-font-family);
  }

  @media (prefers-color-scheme: dark) {
    :host(:not([data-theme="light"])) { ${tokensToCssDeclarations(DARK_TOKENS)} }
  }

  :host([data-theme="light"]) { ${tokensToCssDeclarations(LIGHT_TOKENS)} color-scheme: light; }
  :host([data-theme="dark"]) { ${tokensToCssDeclarations(DARK_TOKENS)} color-scheme: dark; }
`;
