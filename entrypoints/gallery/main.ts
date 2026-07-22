import {
  createActionButton,
  createIconButton,
  createPill,
  createResultSurface,
  createStatusIcon,
  createToast,
} from '../../src/ui/components';
import { GALLERY_STYLES } from '../../src/ui/gallery-styles';

class QrSnipGallery extends HTMLElement {
  connectedCallback(): void {
    const root = this.attachShadow({ mode: 'open' });
    const query = new URLSearchParams(location.search);
    this.dataset.theme = query.get('theme') ?? 'light';
    this.dataset.contrast = query.get('contrast') ?? 'normal';
    this.dataset.viewport = query.get('viewport') ?? 'wide';
    this.dataset.scale = query.get('scale') ?? '1';
    this.dir = query.get('dir') === 'rtl' ? 'rtl' : 'ltr';

    const style = document.createElement('style');
    style.textContent = GALLERY_STYLES;
    root.append(style, this.createGallery());
  }

  private createGallery(): HTMLElement {
    const main = document.createElement('main');
    main.innerHTML = `
      <header><span class="eyebrow">Local visual reference</span><h1>Material, with momentum.</h1><p>Reusable QR Snip surfaces use strong shape contrast, confident type, and purposeful state color while keeping every interaction calm and legible.</p></header>
      <div class="gallery-grid">
        <section class="sample" data-sample="buttons"><h2>Actions</h2><div class="sample-row"></div></section>
        <section class="sample" data-sample="status"><h2>Status & pills</h2><div class="sample-row"></div></section>
        <section class="sample wide" data-sample="surface"><h2>Result surface</h2></section>
      </div>`;

    const buttonRow = main.querySelector<HTMLElement>('[data-sample="buttons"] .sample-row')!;
    buttonRow.append(
      createActionButton('Scan another', 'text', () => undefined, 'refresh'),
      createActionButton('Copy', 'tonal', () => undefined, 'copy'),
      createActionButton('Open link', 'filled', () => undefined, 'open'),
      createIconButton('Close', 'close', 'close'),
    );

    const statusRow = main.querySelector<HTMLElement>('[data-sample="status"] .sample-row')!;
    const pill = createPill('demo-pill');
    pill.textContent = 'Ready to scan';
    const toast = createToast();
    toast.textContent = 'Copied to clipboard';
    statusRow.append(createStatusIcon('check'), createStatusIcon('warning', true), pill, toast);

    const result = createResultSurface();
    result.removeAttribute('aria-modal');
    result.setAttribute('aria-label', 'Example result');
    result.innerHTML = '<h3>QR code found</h3><p>Website · preview only. The destination stays inactive until you choose to open it.</p>';
    result.append(createActionButton('Open link', 'filled', () => undefined, 'open'));
    main.querySelector('[data-sample="surface"]')!.append(result);
    return main;
  }
}

customElements.define('qr-snip-gallery', QrSnipGallery);
