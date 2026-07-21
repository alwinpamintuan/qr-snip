export const SNIPPER_STYLES = String.raw`
  :host {
    all: initial;
    color-scheme: light dark;
    --qr-primary: #76558f;
    --qr-on-primary: #ffffff;
    --qr-primary-container: #f0dbff;
    --qr-on-primary-container: #2d0b43;
    --qr-surface: #fff7ff;
    --qr-surface-container: #f3edf5;
    --qr-surface-high: #ede7ef;
    --qr-on-surface: #1e1a20;
    --qr-on-surface-variant: #4c454f;
    --qr-outline: #7d747f;
    --qr-error: #ba1a1a;
    --qr-shadow: rgba(28, 19, 31, 0.28);
    font-family: Inter, Roboto, "Segoe UI", system-ui, -apple-system, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  button {
    font: inherit;
  }

  .visually-hidden,
  .copy-fallback {
    position: fixed !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    overflow: hidden !important;
    clip: rect(0 0 0 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  .qr-snip-app {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    cursor: crosshair;
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }

  .snapshot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    filter: brightness(0.52) saturate(0.72);
  }

  .scrim {
    position: absolute;
    inset: 0;
    background: rgba(13, 10, 15, 0.28);
    pointer-events: none;
  }

  .top-bar {
    position: absolute;
    top: max(20px, env(safe-area-inset-top));
    left: 50%;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 8px 8px 8px 20px;
    color: var(--qr-on-surface);
    background: color-mix(in srgb, var(--qr-surface) 94%, transparent);
    border: 1px solid color-mix(in srgb, var(--qr-outline) 24%, transparent);
    border-radius: 28px;
    box-shadow: 0 8px 30px var(--qr-shadow);
    cursor: default;
    transform: translateX(-50%);
    backdrop-filter: blur(18px);
    animation: qr-enter 260ms cubic-bezier(.2, .8, .2, 1);
  }

  .brand-mark {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    color: var(--qr-on-primary-container);
    background: var(--qr-primary-container);
    border-radius: 11px 16px 11px 16px;
  }

  .brand-mark svg,
  .icon-button svg,
  .action-button svg,
  .status-icon svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  .instruction {
    display: grid;
    gap: 1px;
    min-width: 200px;
  }

  .instruction strong {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: .01em;
  }

  .instruction span {
    color: var(--qr-on-surface-variant);
    font-size: 12px;
  }

  .icon-button {
    display: grid;
    width: 40px;
    height: 40px;
    padding: 0;
    place-items: center;
    color: var(--qr-on-surface-variant);
    background: transparent;
    border: 0;
    border-radius: 20px;
    cursor: pointer;
  }


  .icon-button:hover {
    background: color-mix(in srgb, var(--qr-primary) 10%, transparent);
  }

  .icon-button:focus-visible,
  .action-button:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--qr-primary) 48%, transparent);
    outline-offset: 2px;
  }

  .selection {
    position: absolute;
    display: none;
    overflow: visible;
    background-repeat: no-repeat;
    background-size: 100vw 100vh;
    border: 3px solid #f1d7ff;
    border-radius: 18px;
    box-shadow:
      0 0 0 1px rgba(48, 16, 66, .65),
      0 12px 40px rgba(19, 7, 25, .38),
      inset 0 0 0 1px rgba(255, 255, 255, .42);
    pointer-events: none;
  }

  .selection.visible {
    display: block;
    animation: qr-selection 140ms ease-out;
  }


  .corner {
    position: absolute;
    width: 17px;
    height: 17px;
    background: var(--qr-primary-container);
    border: 3px solid var(--qr-primary);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(24, 8, 31, .28);
  }

  .corner.tl { top: -9px; left: -9px; border-radius: 9px 5px 5px 5px; }
  .corner.tr { top: -9px; right: -9px; border-radius: 5px 9px 5px 5px; }
  .corner.bl { bottom: -9px; left: -9px; border-radius: 5px 5px 5px 9px; }
  .corner.br { right: -9px; bottom: -9px; border-radius: 5px 5px 9px 5px; }

  .selection-label {
    position: absolute;
    bottom: -35px;
    left: 50%;
    padding: 5px 10px;
    color: var(--qr-on-primary-container);
    background: var(--qr-primary-container);
    border-radius: 11px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    transform: translateX(-50%);
  }

  .result-card {
    position: absolute;
    top: 50%;
    left: 50%;
    display: none;
    width: min(440px, calc(100vw - 32px));
    max-height: calc(100vh - 40px);
    padding: 24px;
    overflow: auto;
    color: var(--qr-on-surface);
    background: var(--qr-surface);
    border: 1px solid color-mix(in srgb, var(--qr-outline) 22%, transparent);
    border-radius: 32px 32px 32px 12px;
    box-shadow: 0 18px 60px rgba(20, 9, 27, .38);
    cursor: default;
    transform: translate(-50%, -50%);
  }

  .result-card.visible {
    display: block;
    animation: qr-result 320ms cubic-bezier(.2, .9, .2, 1);
  }

  .result-heading {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .status-icon {
    display: grid;
    flex: 0 0 48px;
    width: 48px;
    height: 48px;
    place-items: center;
    color: var(--qr-on-primary-container);
    background: var(--qr-primary-container);
    border-radius: 16px 24px 16px 24px;
  }

  .status-icon.error {
    color: var(--qr-error);
    background: color-mix(in srgb, var(--qr-error) 12%, var(--qr-surface));
  }

  .result-title {
    margin: 1px 0 3px;
    font-size: 24px;
    font-weight: 760;
    letter-spacing: -.02em;
    line-height: 1.15;
  }

  .result-subtitle {
    margin: 0;
    color: var(--qr-on-surface-variant);
    font-size: 14px;
    line-height: 1.4;
  }

  .result-value {
    min-height: 68px;
    max-height: 164px;
    margin: 20px 0;
    padding: 16px;
    overflow: auto;
    color: var(--qr-on-surface);
    background: var(--qr-surface-container);
    border-radius: 18px;
    font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
    font-size: 13px;
    line-height: 1.55;
    overflow-wrap: anywhere;
    user-select: text;
  }

  .hostname-row {
    display: grid;
    gap: 3px;
    margin: 20px 0 -8px;
    padding: 14px 16px;
    color: var(--qr-on-surface);
    background: color-mix(in srgb, var(--qr-primary-container) 66%, var(--qr-surface));
    border: 1px solid color-mix(in srgb, var(--qr-primary) 24%, transparent);
    border-radius: 18px;
    overflow-wrap: anywhere;
  }

  .hostname-row[hidden] { display: none; }
  .hostname-label { color: var(--qr-on-surface-variant); font-size: 11px; font-weight: 750; text-transform: uppercase; letter-spacing: .08em; }
  .hostname-unicode { font-size: 16px; line-height: 1.35; }
  .hostname-ascii { color: var(--qr-on-surface-variant); font-size: 12px; }
  .hostname-row.same-hostname .hostname-ascii { display: none; }

  .result-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 18px;
    gap: 8px;
    color: var(--qr-primary);
    background: transparent;
    border: 0;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .action-button:hover {
    background: color-mix(in srgb, var(--qr-primary) 9%, transparent);
  }

  .action-button.filled {
    color: var(--qr-on-primary);
    background: var(--qr-primary);
  }

  .action-button.filled:hover {
    box-shadow: 0 4px 12px color-mix(in srgb, var(--qr-primary) 34%, transparent);
    filter: brightness(1.06);
  }

  .toast {
    position: absolute;
    bottom: max(24px, env(safe-area-inset-bottom));
    left: 50%;
    display: none;
    padding: 12px 18px;
    color: var(--qr-surface);
    background: var(--qr-on-surface);
    border-radius: 16px;
    box-shadow: 0 8px 24px var(--qr-shadow);
    cursor: default;
    font-size: 13px;
    font-weight: 650;
    transform: translateX(-50%);
  }

  .toast.visible {
    display: block;
    animation: qr-toast 180ms ease-out;
  }

  @keyframes qr-enter {
    from { opacity: 0; transform: translate(-50%, -12px) scale(.96); }
  }

  @keyframes qr-result {
    from { opacity: 0; transform: translate(-50%, -47%) scale(.92); border-radius: 40px; }
  }

  @keyframes qr-toast {
    from { opacity: 0; transform: translate(-50%, 8px); }
  }

  @keyframes qr-selection {
    from { opacity: 0; transform: scale(.98); }
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --qr-primary: #dcb9f5;
      --qr-on-primary: #422255;
      --qr-primary-container: #593a6d;
      --qr-on-primary-container: #f0dbff;
      --qr-surface: #161217;
      --qr-surface-container: #211d22;
      --qr-surface-high: #2b272c;
      --qr-on-surface: #e9e0e8;
      --qr-on-surface-variant: #cfc3cf;
      --qr-outline: #998d9a;
      --qr-shadow: rgba(0, 0, 0, .54);
    }
  }

  @media (prefers-contrast: more) {
    .top-bar,
    .result-card { border-width: 2px; border-color: var(--qr-outline); }
    .selection { border-width: 4px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
    }
  }

  @media (max-width: 520px) {
    .top-bar { top: 12px; width: calc(100vw - 24px); }
    .instruction { min-width: 0; flex: 1; }
    .instruction span { display: none; }
    .result-card { padding: 20px; border-radius: 28px 28px 28px 10px; }
    .result-actions { display: grid; grid-template-columns: 1fr 1fr; }
    .action-button:last-child:nth-child(odd) { grid-column: 1 / -1; }
  }

  @media (max-height: 560px) {
    .top-bar { top: 8px; min-height: 48px; }
    .result-card { max-height: calc(100vh - 20px); padding: 18px; }
    .result-value { max-height: 108px; margin-block: 14px; }
  }
`;
