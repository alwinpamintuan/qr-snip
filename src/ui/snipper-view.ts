import type { SelectionRect } from '../core/selection';
import { createActionButton as createButtonPrimitive, createIconButton, createStatusIcon } from './components';
import { createIcon, type IconName } from './icons';
import { SNIPPER_STYLES } from './snipper-styles';

export type ResultAction = Readonly<{
  label: string;
  icon?: IconName;
  filled?: boolean;
  onSelect: () => void;
}>;

export type SecurityReviewPresentation = Readonly<{
  scannedValue: string;
  resolvedDestination?: string;
  warnings: readonly string[];
  disclaimer: string;
}>;

export type ResultPresentation = Readonly<{
  title: string;
  subtitle: string;
  value: string;
  review?: SecurityReviewPresentation;
  hostname?: Readonly<{ ascii: string; unicode: string }>;
  isWarning: boolean;
  actions: readonly ResultAction[];
}>;

export type SnipperViewCallbacks = Readonly<{
  onClose: () => void;
  onSnapshotReady: () => void;
  onSnapshotError: () => void;
}>;

export class SnipperView {
  private host: HTMLDivElement | null = null;
  private root: ShadowRoot | null = null;
  private screenshot: HTMLImageElement | null = null;
  private selection: HTMLElement | null = null;
  private resultCard: HTMLElement | null = null;
  private toast: HTMLElement | null = null;
  private screenshotUrl = '';
  private toastTimer: number | null = null;

  get selectionSurface(): HTMLElement {
    const surface = this.root?.querySelector<HTMLElement>('.qr-snip-app');
    if (!surface) throw new Error('Snipper view is not mounted.');
    return surface;
  }

  get snapshotIsReady(): boolean {
    return Boolean(this.screenshot?.complete && this.screenshot.naturalWidth > 0);
  }

  get snapshotDimensions(): Readonly<{ width: number; height: number }> {
    return {
      width: this.screenshot?.naturalWidth ?? 0,
      height: this.screenshot?.naturalHeight ?? 0,
    };
  }

  mount(screenshotUrl: string, callbacks: SnipperViewCallbacks): void {
    this.unmount();
    this.screenshotUrl = screenshotUrl;
    this.host = document.createElement('div');
    this.host.id = `qr-snip-${browser.runtime.id}`;
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      display: 'block',
    });
    this.root = this.host.attachShadow({ mode: 'closed' });
    this.installStyles();
    this.root.append(this.createLayout());
    document.documentElement.append(this.host);

    this.screenshot = this.root.querySelector('.snapshot');
    this.selection = this.root.querySelector('.selection');
    this.resultCard = this.root.querySelector('.result-card');
    this.toast = this.root.querySelector('.toast');
    this.screenshot?.addEventListener('load', callbacks.onSnapshotReady, { once: true });
    this.screenshot?.addEventListener('error', callbacks.onSnapshotError, { once: true });
    if (this.screenshot) this.screenshot.src = screenshotUrl;
    this.root.querySelector('[data-action="close"]')?.addEventListener('click', callbacks.onClose);
  }

  showSelection(rect: SelectionRect): void {
    if (!this.selection) return;
    Object.assign(this.selection.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      backgroundImage: `url("${this.screenshotUrl}")`,
      backgroundPosition: `${-rect.x}px ${-rect.y}px`,
    });
    this.selection.classList.add('visible');
    const label = this.selection.querySelector('.selection-label');
    if (label) label.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  }

  resetSelection(): void {
    this.selection?.classList.remove('visible');
    this.resultCard?.classList.remove('visible');
  }

  showResult(presentation: ResultPresentation): void {
    if (!this.resultCard) return;
    this.resultCard.querySelector('.result-title')!.textContent = presentation.title;
    this.resultCard.querySelector('.result-subtitle')!.textContent = presentation.subtitle;
    this.showResultContent(presentation);
    const hostname = this.resultCard.querySelector<HTMLElement>('.hostname-row')!;
    if (presentation.hostname) {
      hostname.hidden = false;
      hostname.querySelector<HTMLElement>('.hostname-ascii')!.textContent = presentation.hostname.ascii;
      hostname.querySelector<HTMLElement>('.hostname-unicode')!.textContent = presentation.hostname.unicode;
      hostname.classList.toggle('same-hostname', presentation.hostname.ascii === presentation.hostname.unicode);
    } else {
      hostname.hidden = true;
    }

    const status = this.resultCard.querySelector('.status-icon')!;
    status.replaceWith(createStatusIcon(presentation.isWarning ? 'warning' : 'check', presentation.isWarning));
    this.resultCard.classList.toggle('warning', presentation.isWarning);

    const actions = this.resultCard.querySelector('.result-actions')!;
    actions.replaceChildren(...presentation.actions.map((action) => this.createActionButton(action)));
    this.resultCard.classList.add('visible');
    this.resultCard.querySelector<HTMLButtonElement>('button')?.focus();
    this.setInstruction(presentation.title, presentation.subtitle);
  }

  setInstruction(title: string, subtitle: string): void {
    const instruction = this.root?.querySelector('.instruction');
    if (!instruction) return;
    instruction.querySelector('strong')!.textContent = title;
    instruction.querySelector('span')!.textContent = subtitle;
    instruction.classList.remove('changed');
    void (instruction as HTMLElement).offsetWidth;
    instruction.classList.add('changed');
  }

  showToast(message: string): void {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add('visible');
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast?.classList.remove('visible'), 1800);
  }

  setBusy(busy: boolean): void {
    this.selectionSurface.classList.toggle('is-busy', busy);
    this.resultCard?.setAttribute('aria-busy', String(busy));
  }

  copyFallback(value: string): boolean {
    if (!this.root) return false;
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.className = 'copy-fallback';
    this.root.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }

  unmount(): void {
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.host?.remove();
    this.host = null;
    this.root = null;
    this.screenshot = null;
    this.selection = null;
    this.resultCard = null;
    this.toast = null;
  }

  private installStyles(): void {
    if (!this.root) return;
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(SNIPPER_STYLES);
      this.root.adoptedStyleSheets = [sheet];
    } catch {
      const style = document.createElement('style');
      style.textContent = SNIPPER_STYLES;
      this.root.append(style);
    }
  }

  private createLayout(): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = `
      <main class="qr-snip-app" role="application" aria-label="QR code snipping tool">
        <img class="snapshot" alt="" draggable="false">
        <div class="scrim"></div>
        <header class="top-bar">
          <span class="brand-mark" data-icon="qr"></span>
          <span class="instruction" aria-live="polite">
            <strong>Preparing screen…</strong><span>QR Snip</span>
          </span>
          <span data-component="close"></span>
        </header>
        <div class="selection" role="region" aria-label="QR selection" aria-hidden="true">
          <span class="corner tl"></span><span class="corner tr"></span>
          <span class="corner bl"></span><span class="corner br"></span>
          <span class="selection-label"></span>
        </div>
        <section class="result-card" role="dialog" aria-modal="true" aria-labelledby="qr-result-title">
          <div class="result-heading">
            <span class="status-icon"></span>
            <div><h1 class="result-title" id="qr-result-title"></h1><p class="result-subtitle"></p></div>
          </div>
          <div class="hostname-row" hidden>
            <span class="hostname-label">Destination</span>
            <strong class="hostname-unicode"></strong>
            <code class="hostname-ascii"></code>
          </div>
          <div class="result-value" tabindex="0"></div>
          <div class="security-review" tabindex="0" hidden>
            <section class="review-section">
              <span class="review-label">Scanned value</span>
              <code class="review-scanned-value"></code>
            </section>
            <section class="review-section review-resolved-section" hidden>
              <span class="review-label">Resolved destination</span>
              <code class="review-resolved-value"></code>
            </section>
            <section class="risk-panel">
              <div class="risk-heading">
                <span class="risk-symbol" data-icon="warning"></span>
                <strong>Why this needs care</strong>
              </div>
              <ul class="risk-list"></ul>
            </section>
            <p class="review-disclaimer"></p>
          </div>
          <div class="result-actions"></div>
        </section>
        <div class="toast" role="status" aria-live="polite"></div>
      </main>`;
    const fragment = template.content;
    fragment.querySelector('[data-icon="qr"]')?.append(createIcon('qr'));
    fragment.querySelector('[data-icon="warning"]')?.append(createIcon('warning'));
    fragment.querySelector('[data-component="close"]')?.replaceWith(createIconButton('Cancel snip', 'close', 'close'));
    return fragment;
  }

  private createActionButton(action: ResultAction): HTMLButtonElement {
    return createButtonPrimitive(action.label, action.filled ? 'filled' : 'text', action.onSelect, action.icon);
  }

  private showResultContent(presentation: ResultPresentation): void {
    const value = this.resultCard!.querySelector<HTMLElement>('.result-value')!;
    const review = this.resultCard!.querySelector<HTMLElement>('.security-review')!;

    if (!presentation.review) {
      value.hidden = false;
      value.textContent = presentation.value;
      review.hidden = true;
      return;
    }

    value.hidden = true;
    review.hidden = false;
    review.querySelector<HTMLElement>('.review-scanned-value')!.textContent = presentation.review.scannedValue;
    review.querySelector<HTMLElement>('.review-disclaimer')!.textContent = presentation.review.disclaimer;

    const resolvedSection = review.querySelector<HTMLElement>('.review-resolved-section')!;
    if (presentation.review.resolvedDestination) {
      resolvedSection.hidden = false;
      resolvedSection.querySelector<HTMLElement>('.review-resolved-value')!.textContent = presentation.review.resolvedDestination;
    } else {
      resolvedSection.hidden = true;
    }

    const riskList = review.querySelector<HTMLUListElement>('.risk-list')!;
    riskList.replaceChildren(...presentation.review.warnings.map((warning) => {
      const item = document.createElement('li');
      const marker = document.createElement('span');
      marker.className = 'risk-marker';
      marker.setAttribute('aria-hidden', 'true');
      const message = document.createElement('span');
      message.textContent = warning;
      item.append(marker, message);
      return item;
    }));
  }
}
