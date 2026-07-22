import type { SelectionRect } from '../core/selection';
import type { I18n } from '../i18n/messages';
import { createActionButton as createButtonPrimitive, createIconButton, createStatusIcon } from './components';
import { createIcon, type IconName } from './icons';
import { SNIPPER_STYLES } from './snipper-styles';
import type { ThemePreference } from '../core/settings';

let sharedStyleSheet: CSSStyleSheet | null | undefined;
let sharedLayoutTemplate: HTMLTemplateElement | undefined;

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
  diagnostics?: string;
  actions: readonly ResultAction[];
}>;

export type SnipperViewCallbacks = Readonly<{
  onClose: () => void;
  onKeyboardSelection: () => void;
  onSnapshotReady: () => void;
  onSnapshotError: () => void;
}>;

export class SnipperView {
  private host: HTMLDivElement | null = null;
  private root: ShadowRoot | null = null;
  private screenshot: HTMLImageElement | null = null;
  private selection: HTMLElement | null = null;
  private selectionLabel: HTMLElement | null = null;
  private resultCard: HTMLElement | null = null;
  private toast: HTMLElement | null = null;
  private toastTimer: number | null = null;
  private announcementTimer: number | null = null;
  private returnFocus: HTMLElement | null = null;

  constructor(
    private readonly i18n: I18n,
    private readonly shadowMode: ShadowRootMode = 'closed',
  ) {}

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

  mount(screenshotUrl: string, callbacks: SnipperViewCallbacks, theme: ThemePreference = 'system'): void {
    this.unmount();
    this.host = document.createElement('div');
    this.host.id = `qr-snip-${browser.runtime.id}`;
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      display: 'block',
    });
    this.root = this.host.attachShadow({ mode: this.shadowMode });
    if (theme !== 'system') this.host.dataset.theme = theme;
    this.installStyles();
    this.root.append(this.createLayout());
    document.documentElement.append(this.host);

    this.screenshot = this.root.querySelector('.snapshot');
    this.selection = this.root.querySelector('.selection');
    this.selectionLabel = this.root.querySelector('.selection-label');
    this.resultCard = this.root.querySelector('.result-card');
    this.toast = this.root.querySelector('.toast');
    if (this.selection) this.selection.style.backgroundImage = `url("${screenshotUrl}")`;
    this.screenshot?.addEventListener('load', callbacks.onSnapshotReady, { once: true });
    this.screenshot?.addEventListener('error', callbacks.onSnapshotError, { once: true });
    if (this.screenshot) this.screenshot.src = screenshotUrl;
    this.root.querySelector('[data-action="close"]')?.addEventListener('click', callbacks.onClose);
    this.root.querySelector('[data-action="keyboard"]')?.addEventListener('click', callbacks.onKeyboardSelection);
    this.resultCard?.addEventListener('keydown', this.onResultKeyDown);
  }

  showSelection(rect: SelectionRect): void {
    if (!this.selection) return;
    Object.assign(this.selection.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      backgroundPosition: `${-rect.x}px ${-rect.y}px`,
    });
    this.selection.classList.add('visible');
    this.selection.setAttribute('aria-hidden', 'false');
    if (this.selectionLabel) this.selectionLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  }

  resetSelection(): void {
    this.selection?.classList.remove('visible');
    this.selection?.setAttribute('aria-hidden', 'true');
    this.resultCard?.classList.remove('visible');
    this.returnFocus?.focus();
    this.returnFocus = null;
  }

  showResult(presentation: ResultPresentation): void {
    if (!this.resultCard) return;
    this.resultCard.querySelector('.result-title')!.textContent = presentation.title;
    this.resultCard.querySelector('.result-subtitle')!.textContent = presentation.subtitle;
    this.showResultContent(presentation);
    const diagnostics = this.resultCard.querySelector<HTMLElement>('.decoder-diagnostics')!;
    diagnostics.hidden = !presentation.diagnostics;
    diagnostics.textContent = presentation.diagnostics ?? '';
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
    this.returnFocus = this.root?.activeElement instanceof HTMLElement ? this.root.activeElement : null;
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

  enableKeyboardSelection(): void {
    const button = this.root?.querySelector<HTMLButtonElement>('[data-action="keyboard"]');
    if (button) button.disabled = false;
  }

  setKeyboardSelectionActionVisible(visible: boolean): void {
    const button = this.root?.querySelector<HTMLButtonElement>('[data-action="keyboard"]');
    if (button) button.hidden = !visible;
  }

  focusSelectionSurface(): void {
    this.selectionSurface.focus();
  }

  announceSelection(rect: SelectionRect): void {
    if (this.announcementTimer !== null) window.clearTimeout(this.announcementTimer);
    this.announcementTimer = window.setTimeout(() => {
      const liveRegion = this.root?.querySelector<HTMLElement>('.selection-live');
      if (!liveRegion) return;
      liveRegion.textContent = this.i18n.t('selectionAnnouncement', [
        String(Math.round(rect.x)), String(Math.round(rect.y)),
        String(Math.round(rect.width)), String(Math.round(rect.height)),
      ]);
    }, 160);
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
    if (this.announcementTimer !== null) window.clearTimeout(this.announcementTimer);
    this.resultCard?.removeEventListener('keydown', this.onResultKeyDown);
    this.host?.remove();
    this.host = null;
    this.root = null;
    this.screenshot = null;
    this.selection = null;
    this.selectionLabel = null;
    this.resultCard = null;
    this.toast = null;
    this.returnFocus = null;
  }

  private installStyles(): void {
    if (!this.root) return;
    try {
      if (sharedStyleSheet === undefined) {
        sharedStyleSheet = new CSSStyleSheet();
        sharedStyleSheet.replaceSync(SNIPPER_STYLES);
      }
      if (!sharedStyleSheet) throw new Error('Constructed stylesheets are unavailable.');
      this.root.adoptedStyleSheets = [sharedStyleSheet];
    } catch {
      sharedStyleSheet = null;
      const style = document.createElement('style');
      style.textContent = SNIPPER_STYLES;
      this.root.append(style);
    }
  }

  private createLayout(): DocumentFragment {
    sharedLayoutTemplate ??= document.createElement('template');
    if (!sharedLayoutTemplate.innerHTML) sharedLayoutTemplate.innerHTML = `
      <main class="qr-snip-app" role="application" tabindex="-1">
        <img class="snapshot" alt="" draggable="false">
        <div class="scrim"></div>
        <header class="top-bar">
          <span class="brand-mark" data-icon="qr"></span>
          <span class="instruction" aria-live="polite">
            <strong></strong><span></span>
          </span>
          <span data-component="keyboard"></span>
          <span data-component="close"></span>
        </header>
        <div class="selection" role="region" aria-hidden="true">
          <span class="corner tl"></span><span class="corner tr"></span>
          <span class="corner bl"></span><span class="corner br"></span>
          <span class="selection-label"></span>
        </div>
        <div class="selection-live visually-hidden" aria-live="polite" aria-atomic="true"></div>
        <section class="result-card" role="dialog" aria-modal="true" aria-labelledby="qr-result-title">
          <div class="result-heading">
            <span class="status-icon"></span>
            <div><h1 class="result-title" id="qr-result-title"></h1><p class="result-subtitle"></p></div>
          </div>
          <div class="hostname-row" hidden>
            <span class="hostname-label"></span>
            <strong class="hostname-unicode"></strong>
            <code class="hostname-ascii"></code>
          </div>
          <div class="result-value" tabindex="0"></div>
          <p class="decoder-diagnostics" hidden></p>
          <div class="security-review" tabindex="0" hidden>
            <section class="review-section">
              <span class="review-label"></span>
              <code class="review-scanned-value"></code>
            </section>
            <section class="review-section review-resolved-section" hidden>
              <span class="review-label"></span>
              <code class="review-resolved-value"></code>
            </section>
            <section class="risk-panel">
              <div class="risk-heading">
                <span class="risk-symbol" data-icon="warning"></span>
                <strong></strong>
              </div>
              <ul class="risk-list"></ul>
            </section>
            <p class="review-disclaimer"></p>
          </div>
          <div class="result-actions"></div>
        </section>
        <div class="toast" role="status" aria-live="polite"></div>
      </main>`;
    const fragment = sharedLayoutTemplate.content.cloneNode(true) as DocumentFragment;
    const t = this.i18n.t;
    const app = fragment.querySelector<HTMLElement>('.qr-snip-app')!;
    app.dir = this.i18n.direction;
    app.setAttribute('aria-label', t('applicationLabel'));
    fragment.querySelector<HTMLElement>('.instruction strong')!.textContent = t('preparingTitle');
    fragment.querySelector<HTMLElement>('.instruction span')!.textContent = t('extensionName');
    fragment.querySelector<HTMLElement>('.selection')!.setAttribute('aria-label', t('selectionLabel'));
    fragment.querySelector<HTMLElement>('.hostname-label')!.textContent = t('destinationLabel');
    const reviewLabels = fragment.querySelectorAll<HTMLElement>('.review-label');
    reviewLabels[0]!.textContent = t('scannedValueLabel');
    reviewLabels[1]!.textContent = t('resolvedDestinationLabel');
    fragment.querySelector<HTMLElement>('.risk-heading strong')!.textContent = t('riskHeading');
    fragment.querySelector('[data-icon="qr"]')?.append(createIcon('qr'));
    fragment.querySelector('[data-icon="warning"]')?.append(createIcon('warning'));
    const keyboardButton = createButtonPrimitive(t('keyboardSelectionAction'), 'text', () => undefined);
    keyboardButton.dataset.action = 'keyboard';
    keyboardButton.classList.add('keyboard-action');
    keyboardButton.setAttribute('aria-label', t('keyboardSelectionAction'));
    keyboardButton.setAttribute('aria-keyshortcuts', 'K');
    keyboardButton.title = t('keyboardSelectionAction');
    keyboardButton.querySelector('span')?.classList.add('keyboard-action-label');
    const shortcut = document.createElement('kbd');
    shortcut.className = 'keyboard-shortcut';
    shortcut.setAttribute('aria-hidden', 'true');
    shortcut.textContent = t('keyboardSelectionShortcut');
    keyboardButton.append(shortcut);
    keyboardButton.disabled = true;
    fragment.querySelector('[data-component="keyboard"]')?.replaceWith(keyboardButton);
    fragment.querySelector('[data-component="close"]')?.replaceWith(createIconButton(t('cancelSnipLabel'), 'close', 'close'));
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

  private readonly onResultKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || !this.resultCard?.classList.contains('visible')) return;
    const controls = [...this.resultCard.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    if (controls.length === 0) return;
    const first = controls[0]!;
    const last = controls[controls.length - 1]!;
    const active = this.root?.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
