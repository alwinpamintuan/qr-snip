import {
  createActionButton,
  createIconButton,
  createPill,
  createResultSurface,
  createStatusIcon,
  createToast,
} from '../../src/ui/components';
import { GALLERY_STYLES } from '../../src/ui/gallery-styles';
import { createI18n, type I18n } from '../../src/i18n/messages';

class QrSnipGallery extends HTMLElement {
  private readonly i18n: I18n = createI18n(browser.i18n);

  connectedCallback(): void {
    const root = this.attachShadow({ mode: 'open' });
    const query = new URLSearchParams(location.search);
    this.dataset.theme = query.get('theme') ?? 'light';
    this.dataset.contrast = query.get('contrast') ?? 'normal';
    this.dataset.viewport = query.get('viewport') ?? 'wide';
    this.dataset.scale = query.get('scale') ?? '1';
    this.dir = query.get('dir') === 'rtl' ? 'rtl' : 'ltr';
    document.documentElement.lang = browser.i18n.getUILanguage();
    document.title = this.i18n.t('galleryTitle');

    const style = document.createElement('style');
    style.textContent = GALLERY_STYLES;
    root.append(style, this.createGallery());
  }

  private createGallery(): HTMLElement {
    const main = document.createElement('main');
    main.innerHTML = `
      <header><span class="eyebrow"></span><h1></h1><p></p></header>
      <div class="gallery-grid">
        <section class="sample" data-sample="buttons"><h2></h2><div class="sample-row"></div></section>
        <section class="sample" data-sample="status"><h2></h2><div class="sample-row"></div></section>
        <section class="sample wide" data-sample="surface"><h2></h2></section>
      </div>`;
    const t = this.i18n.t;
    main.querySelector<HTMLElement>('.eyebrow')!.textContent = t('galleryEyebrow');
    main.querySelector<HTMLElement>('h1')!.textContent = t('galleryHero');
    main.querySelector<HTMLElement>('header p')!.textContent = t('galleryDescription');
    main.querySelector<HTMLElement>('[data-sample="buttons"] h2')!.textContent = t('galleryActions');
    main.querySelector<HTMLElement>('[data-sample="status"] h2')!.textContent = t('galleryStatus');
    main.querySelector<HTMLElement>('[data-sample="surface"] h2')!.textContent = t('galleryResultSurface');

    const buttonRow = main.querySelector<HTMLElement>('[data-sample="buttons"] .sample-row')!;
    buttonRow.append(
      createActionButton(t('scanAnotherAction'), 'text', () => undefined, 'refresh'),
      createActionButton(t('copyAction'), 'tonal', () => undefined, 'copy'),
      createActionButton(t('openLinkAction'), 'filled', () => undefined, 'open'),
      createIconButton(t('cancelAction'), 'close', 'close'),
    );

    const statusRow = main.querySelector<HTMLElement>('[data-sample="status"] .sample-row')!;
    const pill = createPill('demo-pill');
    pill.textContent = t('galleryReady');
    const toast = createToast();
    toast.textContent = t('copiedToast');
    statusRow.append(createStatusIcon('check'), createStatusIcon('warning', true), pill, toast);

    const result = createResultSurface();
    result.removeAttribute('aria-modal');
    result.setAttribute('aria-label', t('galleryExampleResult'));
    const heading = document.createElement('h3');
    heading.textContent = t('resultFoundTitle');
    const description = document.createElement('p');
    description.textContent = t('galleryPreview');
    result.append(heading, description, createActionButton(t('openLinkAction'), 'filled', () => undefined, 'open'));
    main.querySelector('[data-sample="surface"]')!.append(result);
    return main;
  }
}

customElements.define('qr-snip-gallery', QrSnipGallery);
