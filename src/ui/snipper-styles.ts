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
    --qr-warning: #815500;
    --qr-on-warning: #ffffff;
    --qr-warning-container: #ffdea5;
    --qr-on-warning-container: #2a1800;
    --qr-shadow: rgba(28, 19, 31, 0.28);
    --qr-emphasized: cubic-bezier(.2, 0, 0, 1);
    --qr-emphasized-decelerate: cubic-bezier(.05, .7, .1, 1);
    --qr-standard: cubic-bezier(.2, 0, 0, 1);
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
    isolation: isolate;
    animation: qr-app-enter 240ms var(--qr-emphasized-decelerate) both;
  }

  .snapshot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    filter: brightness(0.52) saturate(0.72);
    transform: scale(1);
    animation: qr-snapshot-settle 500ms var(--qr-emphasized-decelerate) both;
  }

  .scrim {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 42%, rgba(70, 42, 82, .08), transparent 42%),
      rgba(13, 10, 15, 0.3);
    pointer-events: none;
    animation: qr-scrim-in 320ms ease-out both;
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
    box-shadow:
      0 1px 0 color-mix(in srgb, white 42%, transparent) inset,
      0 8px 30px var(--qr-shadow);
    cursor: default;
    transform: translateX(-50%);
    backdrop-filter: blur(18px);
    transform-origin: 50% 0;
    animation: qr-enter 420ms var(--qr-emphasized-decelerate) both;
  }

  .brand-mark {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    color: var(--qr-on-primary-container);
    background: var(--qr-primary-container);
    border-radius: 11px 16px 11px 16px;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--qr-primary) 24%, transparent);
    animation: qr-mark-enter 560ms var(--qr-emphasized-decelerate) 80ms both;
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

  .instruction.changed {
    animation: qr-instruction-change 260ms var(--qr-emphasized-decelerate);
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
    transition:
      color 180ms var(--qr-standard),
      background-color 180ms var(--qr-standard),
      transform 180ms var(--qr-emphasized);
  }


  .icon-button:hover {
    background: color-mix(in srgb, var(--qr-primary) 10%, transparent);
  }

  .icon-button:hover svg {
    transform: rotate(8deg) scale(1.08);
  }

  .icon-button:active {
    transform: scale(.9);
  }

  .icon-button svg {
    transition: transform 220ms var(--qr-emphasized);
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
    transform-origin: center;
  }

  .selection.visible {
    display: block;
    animation: qr-selection 220ms var(--qr-emphasized-decelerate);
  }

  .selection::after {
    position: absolute;
    inset: -3px;
    content: "";
    border-radius: inherit;
    opacity: 0;
    pointer-events: none;
  }

  .is-busy {
    cursor: progress;
  }

  .is-busy .selection::after {
    opacity: 1;
    background: linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, .44) 48%, transparent 76%);
    background-size: 240% 100%;
    animation: qr-selection-scan 900ms ease-in-out infinite;
  }

  .is-busy .selection {
    box-shadow:
      0 0 0 1px rgba(48, 16, 66, .65),
      0 0 0 7px color-mix(in srgb, var(--qr-primary) 15%, transparent),
      0 16px 50px rgba(19, 7, 25, .45);
  }


  .corner {
    position: absolute;
    width: 17px;
    height: 17px;
    background: var(--qr-primary-container);
    border: 3px solid var(--qr-primary);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(24, 8, 31, .28);
    animation: qr-corner-enter 300ms var(--qr-emphasized-decelerate) both;
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
    box-shadow: 0 5px 16px color-mix(in srgb, var(--qr-primary) 20%, transparent);
    animation: qr-label-enter 260ms var(--qr-emphasized-decelerate) 60ms both;
  }

  .result-card {
    position: absolute;
    top: 50%;
    left: 50%;
    display: none;
    width: min(520px, calc(100vw - 32px));
    max-height: calc(100vh - 40px);
    padding: 24px;
    overflow: auto;
    color: var(--qr-on-surface);
    background:
      radial-gradient(circle at 92% 0%, color-mix(in srgb, var(--qr-primary-container) 32%, transparent), transparent 38%),
      var(--qr-surface);
    border: 1px solid color-mix(in srgb, var(--qr-outline) 22%, transparent);
    border-radius: 32px 32px 32px 12px;
    box-shadow:
      0 1px 0 color-mix(in srgb, white 48%, transparent) inset,
      0 18px 60px rgba(20, 9, 27, .38),
      0 4px 18px rgba(20, 9, 27, .2);
    cursor: default;
    transform: translate(-50%, -50%);
    transform-origin: 50% 100%;
    backdrop-filter: blur(24px);
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--qr-primary) 38%, transparent) transparent;
  }

  .result-card.visible {
    display: block;
    animation: qr-result 480ms var(--qr-emphasized-decelerate) both;
  }

  .result-card.warning {
    background:
      radial-gradient(circle at 92% 0%, color-mix(in srgb, var(--qr-warning-container) 48%, transparent), transparent 40%),
      var(--qr-surface);
    border-color: color-mix(in srgb, var(--qr-warning) 35%, var(--qr-outline));
    border-radius: 28px 44px 28px 16px;
  }

  .result-heading {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .result-card.visible .result-heading,
  .result-card.visible .hostname-row:not([hidden]),
  .result-card.visible .result-value:not([hidden]),
  .result-card.visible .security-review:not([hidden]),
  .result-card.visible .result-actions {
    animation: qr-content-enter 380ms var(--qr-emphasized-decelerate) both;
  }

  .result-card.visible .hostname-row:not([hidden]) { animation-delay: 55ms; }
  .result-card.visible .result-value:not([hidden]),
  .result-card.visible .security-review:not([hidden]) { animation-delay: 95ms; }
  .result-card.visible .result-actions { animation-delay: 145ms; }

  .status-icon {
    display: grid;
    flex: 0 0 48px;
    width: 48px;
    height: 48px;
    place-items: center;
    color: var(--qr-on-primary-container);
    background: var(--qr-primary-container);
    border-radius: 16px 24px 16px 24px;
    box-shadow: 0 6px 18px color-mix(in srgb, var(--qr-primary) 20%, transparent);
    transition: border-radius 300ms var(--qr-emphasized), transform 300ms var(--qr-emphasized);
  }

  .status-icon.error {
    color: var(--qr-on-warning-container);
    background: var(--qr-warning-container);
    border-radius: 24px 16px 24px 16px;
    box-shadow: 0 6px 18px color-mix(in srgb, var(--qr-warning) 24%, transparent);
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
    border: 1px solid color-mix(in srgb, var(--qr-outline) 12%, transparent);
    box-shadow: 0 1px 0 color-mix(in srgb, white 35%, transparent) inset;
  }

  .result-value[hidden] { display: none; }

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

  .security-review {
    display: grid;
    gap: 12px;
    margin: 18px 0 20px;
    user-select: text;
  }

  .security-review[hidden] { display: none; }

  .review-section {
    display: grid;
    gap: 7px;
    padding: 14px 16px;
    color: var(--qr-on-surface);
    background: var(--qr-surface-container);
    border: 1px solid color-mix(in srgb, var(--qr-outline) 14%, transparent);
    border-radius: 18px 18px 18px 7px;
    box-shadow: 0 1px 0 color-mix(in srgb, white 32%, transparent) inset;
  }

  .review-resolved-section {
    background: color-mix(in srgb, var(--qr-primary-container) 38%, var(--qr-surface-container));
    border-color: color-mix(in srgb, var(--qr-primary) 18%, transparent);
    border-radius: 18px 7px 18px 18px;
  }

  .review-resolved-section[hidden] { display: none; }

  .review-label {
    color: var(--qr-on-surface-variant);
    font-size: 11px;
    font-weight: 780;
    letter-spacing: .09em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .review-section code {
    color: var(--qr-on-surface);
    font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
    font-size: 13px;
    line-height: 1.55;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .risk-panel {
    display: grid;
    gap: 12px;
    padding: 16px;
    color: var(--qr-on-warning-container);
    background: color-mix(in srgb, var(--qr-warning-container) 72%, var(--qr-surface));
    border: 1px solid color-mix(in srgb, var(--qr-warning) 28%, transparent);
    border-radius: 22px 22px 8px 22px;
  }

  .risk-heading {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 14px;
  }

  .risk-symbol {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    color: var(--qr-on-warning);
    background: var(--qr-warning);
    border-radius: 9px 13px 9px 13px;
  }

  .risk-symbol svg {
    width: 17px;
    height: 17px;
    fill: currentColor;
  }

  .risk-list {
    display: grid;
    gap: 9px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .risk-list li {
    display: grid;
    grid-template-columns: 8px 1fr;
    align-items: start;
    gap: 10px;
    font-size: 13px;
    line-height: 1.45;
  }

  .risk-marker {
    width: 7px;
    height: 7px;
    margin-top: 6px;
    background: var(--qr-warning);
    border-radius: 2px 5px 2px 5px;
    transform: rotate(8deg);
  }

  .review-disclaimer {
    margin: 0;
    padding: 2px 4px 2px 13px;
    color: var(--qr-on-surface-variant);
    border-left: 3px solid color-mix(in srgb, var(--qr-warning) 52%, transparent);
    font-size: 12px;
    line-height: 1.5;
  }

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
    position: relative;
    overflow: hidden;
    transition:
      color 180ms var(--qr-standard),
      background-color 180ms var(--qr-standard),
      box-shadow 220ms var(--qr-emphasized),
      transform 180ms var(--qr-emphasized),
      border-radius 220ms var(--qr-emphasized);
  }

  .action-button:hover {
    background: color-mix(in srgb, var(--qr-primary) 9%, transparent);
    border-radius: 16px 24px 16px 24px;
    transform: translateY(-1px);
  }

  .action-button.filled {
    color: var(--qr-on-primary);
    background: var(--qr-primary);
    box-shadow: 0 5px 14px color-mix(in srgb, var(--qr-primary) 28%, transparent);
  }

  .result-card.warning .action-button.filled {
    color: var(--qr-on-warning);
    background: var(--qr-warning);
    box-shadow: 0 5px 14px color-mix(in srgb, var(--qr-warning) 28%, transparent);
  }

  .action-button.filled:hover {
    box-shadow: 0 4px 12px color-mix(in srgb, var(--qr-primary) 34%, transparent);
    filter: brightness(1.06);
  }

  .result-card.warning .action-button.filled:hover {
    box-shadow: 0 4px 12px color-mix(in srgb, var(--qr-warning) 38%, transparent);
  }

  .action-button:active {
    transform: translateY(0) scale(.96);
  }

  .toast {
    position: absolute;
    bottom: max(24px, env(safe-area-inset-bottom));
    left: 50%;
    display: none;
    padding: 12px 18px;
    color: var(--qr-surface);
    background: var(--qr-on-surface);
    border-radius: 8px 18px 18px 18px;
    box-shadow: 0 8px 24px var(--qr-shadow);
    cursor: default;
    font-size: 13px;
    font-weight: 650;
    transform: translateX(-50%);
  }

  .toast.visible {
    display: block;
    animation: qr-toast 300ms var(--qr-emphasized-decelerate);
  }

  @keyframes qr-enter {
    0% { opacity: 0; transform: translate(-50%, -20px) scale(.88, .82); border-radius: 38px; }
    72% { opacity: 1; transform: translate(-50%, 2px) scale(1.02, .99); }
    100% { transform: translateX(-50%) scale(1); }
  }

  @keyframes qr-result {
    0% { opacity: 0; transform: translate(-50%, -42%) scale(.82, .76); border-radius: 48px; }
    68% { opacity: 1; transform: translate(-50%, -51%) scale(1.015, 1.02); }
    100% { transform: translate(-50%, -50%) scale(1); }
  }

  @keyframes qr-toast {
    0% { opacity: 0; transform: translate(-50%, 14px) scale(.88); }
    72% { opacity: 1; transform: translate(-50%, -2px) scale(1.02); }
    100% { transform: translateX(-50%) scale(1); }
  }

  @keyframes qr-selection {
    0% { opacity: 0; transform: scale(.86); border-radius: 30px; }
    75% { opacity: 1; transform: scale(1.015); }
    100% { transform: scale(1); }
  }

  @keyframes qr-app-enter {
    from { opacity: 0; }
  }

  @keyframes qr-snapshot-settle {
    from { opacity: .72; transform: scale(1.018); filter: brightness(.68) saturate(.86); }
  }

  @keyframes qr-scrim-in {
    from { opacity: 0; }
  }

  @keyframes qr-mark-enter {
    0% { opacity: 0; transform: rotate(-18deg) scale(.62); border-radius: 50%; }
    72% { opacity: 1; transform: rotate(3deg) scale(1.08); }
    100% { transform: rotate(0) scale(1); }
  }

  @keyframes qr-instruction-change {
    0% { opacity: .35; transform: translateY(4px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes qr-content-enter {
    0% { opacity: 0; transform: translateY(12px) scale(.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes qr-corner-enter {
    0% { opacity: 0; transform: scale(.4) rotate(-20deg); }
    72% { opacity: 1; transform: scale(1.15) rotate(4deg); }
    100% { transform: scale(1) rotate(0); }
  }

  @keyframes qr-label-enter {
    from { opacity: 0; transform: translate(-50%, -5px) scale(.85); }
  }

  @keyframes qr-selection-scan {
    0% { background-position: 160% 0; }
    100% { background-position: -80% 0; }
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
      --qr-warning: #ffb95c;
      --qr-on-warning: #452b00;
      --qr-warning-container: #624000;
      --qr-on-warning-container: #ffdea5;
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
      transition-duration: .01ms !important;
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
