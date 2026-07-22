import { DARK_TOKENS, LIGHT_TOKENS, tokensToCssDeclarations } from './theme-tokens';

export const GALLERY_STYLES = String.raw`
  :host {
    ${tokensToCssDeclarations(LIGHT_TOKENS)}
    display: block;
    min-height: 100vh;
    color: var(--qr-on-surface);
    background: var(--qr-surface);
    font-family: var(--qr-typography-font-family);
  }

  :host([data-theme="dark"]) { ${tokensToCssDeclarations(DARK_TOKENS)} }
  * { box-sizing: border-box; }
  button { font: inherit; }
  main { width: min(1040px, 100%); margin-inline: auto; padding: 48px clamp(20px, 5vw, 64px) 80px; }
  header { display: grid; gap: 10px; margin-block-end: 40px; }
  h1 { margin: 0; font-size: clamp(34px, 6vw, 64px); line-height: .96; letter-spacing: -.045em; }
  header p { max-width: 680px; margin: 0; color: var(--qr-on-surface-variant); font-size: 16px; line-height: 1.6; }
  .eyebrow { width: fit-content; padding: 7px 12px; color: var(--qr-on-primary-container); background: var(--qr-primary-container); border-radius: var(--qr-shapes-small); font-size: var(--qr-typography-label-size); font-weight: 760; letter-spacing: .08em; text-transform: uppercase; }
  .gallery-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
  .sample { display: grid; align-content: start; gap: 22px; min-width: 0; padding: 24px; background: var(--qr-surface-container); border: 1px solid color-mix(in srgb, var(--qr-outline) 22%, transparent); border-radius: var(--qr-shapes-card); box-shadow: 0 8px 24px color-mix(in srgb, var(--qr-shadow) 32%, transparent); }
  .sample.wide { grid-column: 1 / -1; }
  .sample h2 { margin: 0; font-size: 18px; }
  .sample-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .icon-button { display: grid; width: 48px; height: 48px; padding: 0; place-items: center; color: var(--qr-on-surface-variant); background: transparent; border: 0; border-radius: 50%; }
  .icon-button:hover { background: color-mix(in srgb, var(--qr-primary) 12%, transparent); }
  .icon-button svg, .action-button svg, .status-icon svg { width: 20px; height: 20px; fill: currentColor; }
  .action-button { display: inline-flex; min-height: 44px; padding-inline: 18px; align-items: center; justify-content: center; gap: 8px; color: var(--qr-primary); background: transparent; border: 0; border-radius: var(--qr-shapes-button); font-weight: 700; }
  .action-button.tonal { color: var(--qr-on-primary-container); background: var(--qr-primary-container); }
  .action-button.filled { color: var(--qr-on-primary); background: var(--qr-primary); box-shadow: 0 5px 14px color-mix(in srgb, var(--qr-primary) 28%, transparent); }
  .action-button:focus-visible, .icon-button:focus-visible { outline: 3px solid color-mix(in srgb, var(--qr-primary) 52%, transparent); outline-offset: 3px; }
  .status-icon { display: grid; width: 52px; height: 52px; place-items: center; color: var(--qr-on-primary-container); background: var(--qr-primary-container); border-radius: 17px 26px 17px 26px; box-shadow: var(--qr-elevation-raised); }
  .status-icon.error { color: var(--qr-on-warning-container); background: var(--qr-warning-container); border-radius: 26px 17px 26px 17px; }
  .demo-pill { padding: 12px 18px; color: var(--qr-on-primary-container); background: var(--qr-primary-container); border-radius: var(--qr-shapes-pill); font-weight: 720; }
  .result-card { display: grid; gap: 20px; padding: 26px; color: var(--qr-on-surface); background: radial-gradient(circle at 92% 0%, color-mix(in srgb, var(--qr-primary-container) 36%, transparent), transparent 40%), var(--qr-surface); border: 1px solid color-mix(in srgb, var(--qr-outline) 24%, transparent); border-radius: var(--qr-shapes-card); box-shadow: var(--qr-elevation-dialog); }
  .result-card h3, .result-card p { margin: 0; }
  .result-card p { color: var(--qr-on-surface-variant); line-height: 1.5; }
  .toast { padding: 12px 18px; color: var(--qr-surface); background: var(--qr-on-surface); border-radius: 8px 18px 18px 18px; box-shadow: 0 8px 24px var(--qr-shadow); font-weight: 650; }
  :host([data-contrast="more"]) .sample, :host([data-contrast="more"]) .result-card { border-width: 2px; border-color: var(--qr-outline); }
  :host([data-viewport="narrow"]) main { max-width: 420px; padding-inline: 16px; }
  :host([data-viewport="narrow"]) .gallery-grid { grid-template-columns: 1fr; }
  :host([data-viewport="narrow"]) .sample.wide { grid-column: auto; }
  :host([data-scale="2"]) { font-size: 200%; }
  :host([data-scale="2"]) main { width: min(1280px, 100%); }
  @media (max-width: 680px) { .gallery-grid { grid-template-columns: 1fr; } .sample.wide { grid-column: auto; } main { padding-top: 32px; } }
`;
