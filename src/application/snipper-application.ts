import { WorkerQrDecoder, type DecodeOutcome, type QrDecoder } from '../core/decode';
import { classifyResult, displayPayload, type ClassifiedResult, type ResultKind } from '../core/result';
import { toPixelCrop, type SelectionRect } from '../core/selection';
import type { MessageKey, Translator } from '../i18n/messages';
import { assessLinkSecurity, type LinkRisk, type LinkSecurityAssessment } from '../security/link-security';
import { toUnicode } from 'punycode';
import { KeyboardSelection } from '../ui/keyboard-selection';
import { SelectionGesture } from '../ui/selection-gesture';
import { SnipperView } from '../ui/snipper-view';
import { DEFAULT_SETTINGS, type Settings } from '../core/settings';

export class SnipperApplication {
  private gesture: SelectionGesture | null = null;
  private keyboardSelection: KeyboardSelection | null = null;
  private keyboardMode = false;
  private screenshotUrl = '';
  private invocationId = '';
  private decodeController: AbortController | null = null;
  private settings: Settings = DEFAULT_SETTINGS;
  private diagnostics: string | undefined;

  constructor(
    private readonly view: SnipperView,
    private readonly t: Translator,
    private readonly decoder: QrDecoder = new WorkerQrDecoder(),
  ) {}

  start(invocationId: string, screenshotUrl: string, settings: Settings = DEFAULT_SETTINGS): void {
    this.destroy();
    this.invocationId = invocationId;
    this.screenshotUrl = screenshotUrl;
    this.settings = settings;
    this.diagnostics = undefined;
    this.view.mount(screenshotUrl, {
      onClose: () => this.destroy(),
      onKeyboardSelection: () => this.beginKeyboardSelection(),
      onSnapshotReady: () => this.onSnapshotReady(),
      onSnapshotError: () => this.showDecodeFailure('image-error'),
    }, settings.theme);
    this.gesture = new SelectionGesture(this.view.selectionSurface, {
      onChange: (selection) => {
        this.view.setKeyboardSelectionActionVisible(true);
        this.keyboardMode = false;
        this.keyboardSelection?.cancel();
        this.view.showSelection(selection);
      },
      onComplete: (selection) => void this.scan(selection),
      onInvalid: () => this.rejectSmallSelection(),
    });
    this.keyboardSelection = new KeyboardSelection({
      onChange: (selection) => {
        this.view.showSelection(selection);
        this.view.announceSelection(selection);
      },
      onComplete: (selection) => void this.scan(selection),
    });
    window.addEventListener('keydown', this.onKeyDown, true);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.decodeController?.abort();
    this.decodeController = null;
    this.decoder.destroy();
    this.gesture?.detach();
    this.gesture = null;
    this.keyboardSelection?.cancel();
    this.keyboardSelection = null;
    this.keyboardMode = false;
    this.invocationId = '';
    this.screenshotUrl = '';
    this.view.unmount();
  }

  private onSnapshotReady(): void {
    this.gesture?.attach();
    this.view.enableKeyboardSelection();
    this.view.setInstruction(this.t('dragInstruction'), this.t('cancelHint'));
    this.view.focusSelectionSurface();
  }

  private async scan(selection: SelectionRect): Promise<void> {
    if (!this.view.snapshotIsReady) return;
    const invocationId = this.invocationId;
    this.decodeController?.abort();
    this.decodeController = new AbortController();
    this.view.setBusy(true);
    this.view.setInstruction(this.t('scanningTitle'), this.t('localProcessingHint'));
    const crop = toPixelCrop(
      selection,
      { width: window.innerWidth, height: window.innerHeight },
      this.view.snapshotDimensions,
    );
    const startedAt = performance.now();
    const outcome = await this.decoder.decode(this.screenshotUrl, crop, this.decodeController.signal);
    if (!this.screenshotUrl || invocationId !== this.invocationId) return;
    this.view.setBusy(false);
    this.diagnostics = this.settings.decoderDiagnostics
      ? this.t('decoderDiagnosticsSummary', [
        String(Math.round(performance.now() - startedAt)), String(crop.sw), String(crop.sh),
      ])
      : undefined;
    if (outcome.ok) {
      this.previewResult(classifyResult(outcome.value));
    } else if (outcome.reason !== 'cancelled') {
      this.showDecodeFailure(outcome.reason);
    }
  }

  private previewResult(result: ClassifiedResult): void {
    const linkSecurity = result.kind === 'url' && result.openUrl
      ? assessLinkSecurity(result.openUrl, toUnicode)
      : undefined;
    const displayed = this.displayPayload(result.value);

    if (result.openUrl && linkSecurity?.requiresConfirmation) {
      this.previewSuspiciousLink(result, linkSecurity);
      return;
    }

    this.view.showResult({
      title: this.t('resultFoundTitle'),
      subtitle: this.t('resultSubtitle', [
        this.resultKindLabel(result.kind),
        displayed.truncated ? this.t('longValueSuffix') : '',
      ]),
      value: displayed.text,
      ...(linkSecurity ? { hostname: linkSecurity.hostname } : {}),
      isWarning: false,
      ...(this.diagnostics ? { diagnostics: this.diagnostics } : {}),
      actions: [
        { label: this.t('scanAnotherAction'), icon: 'refresh', onSelect: () => this.reset() },
        { label: this.t('copyAction'), icon: 'copy', onSelect: () => void this.copyValue(result.value) },
        ...(result.openUrl ? [{
          label: result.kind === 'url' ? this.t('openLinkAction') : this.t('openAction'),
          icon: 'open' as const,
          filled: true,
          onSelect: () => this.openResult(result.openUrl!),
        }] : []),
      ],
    });
  }

  private previewSuspiciousLink(result: ClassifiedResult, assessment: LinkSecurityAssessment): void {
    const url = result.openUrl!;
    const scannedValue = this.displayPayload(result.value);
    const resolvedDestination = this.displayPayload(url);
    const contentWasTruncated = scannedValue.truncated || resolvedDestination.truncated;
    this.view.showResult({
      title: this.t('checkDestinationTitle'),
      subtitle: this.t('warningSubtitle', [
        String(assessment.risks.length),
        this.t(assessment.risks.length === 1 ? 'warningSignalSingular' : 'warningSignalPlural'),
        contentWasTruncated ? this.t('longValueSuffix') : '',
      ]),
      value: scannedValue.text,
      review: {
        scannedValue: scannedValue.text,
        ...(result.value === url ? {} : { resolvedDestination: resolvedDestination.text }),
        warnings: assessment.risks.map((risk) => this.riskMessage(risk)),
        disclaimer: this.t('riskDisclaimer'),
      },
      hostname: assessment.hostname,
      isWarning: true,
      ...(this.diagnostics ? { diagnostics: this.diagnostics } : {}),
      actions: [
        { label: this.t('scanAnotherAction'), icon: 'refresh', onSelect: () => this.reset() },
        { label: this.t('copyInsteadAction'), icon: 'copy', onSelect: () => void this.copyValue(result.value) },
        { label: this.t('openAnywayAction'), icon: 'open', filled: true, onSelect: () => this.openResult(url) },
      ],
    });
  }

  private showDecodeFailure(reason: 'not-found' | 'image-error' | 'resource-limit'): void {
    this.view.showResult({
      title: this.t('tryWiderTitle'),
      subtitle: reason === 'not-found'
        ? this.t('notFoundMessage')
        : reason === 'resource-limit'
          ? this.t('resourceLimitMessage')
          : this.t('imageErrorMessage'),
      value: this.t('selectionHelp'),
      isWarning: true,
      ...(this.diagnostics ? { diagnostics: this.diagnostics } : {}),
      actions: [
        { label: this.t('cancelAction'), onSelect: () => this.destroy() },
        { label: this.t('tryAgainAction'), icon: 'refresh', filled: true, onSelect: () => this.reset() },
      ],
    });
  }

  private openResult(url: string): void {
    void browser.runtime.sendMessage({ type: 'OPEN_RESULT', url });
  }

  private async copyValue(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.onCopied();
    } catch {
      const copied = this.view.copyFallback(value);
      if (copied) this.onCopied();
      else this.view.showToast(this.t('copyFailedToast'));
    }
  }

  private onCopied(): void {
    if (this.settings.closeAfterCopy) this.destroy();
    else this.view.showToast(this.t('copiedToast'));
  }

  private rejectSmallSelection(): void {
    this.reset();
    this.view.showToast(this.t('selectionTooSmallToast'));
  }

  private reset(): void {
    this.decodeController?.abort();
    this.decodeController = null;
    this.gesture?.cancel();
    this.view.resetSelection();
    this.view.setBusy(false);
    if (this.keyboardMode) {
      this.beginKeyboardSelection();
    } else {
      this.view.setKeyboardSelectionActionVisible(true);
      this.view.setInstruction(this.t('dragInstruction'), this.t('cancelHint'));
      this.view.focusSelectionSurface();
    }
  }

  private beginKeyboardSelection(): void {
    if (!this.view.snapshotIsReady) return;
    this.keyboardMode = true;
    this.gesture?.cancel();
    this.view.resetSelection();
    this.view.setKeyboardSelectionActionVisible(false);
    this.view.setInstruction(this.t('keyboardSelectionStarted'), this.t('keyboardSelectionHint'));
    this.keyboardSelection?.start({ width: window.innerWidth, height: window.innerHeight });
    this.view.focusSelectionSurface();
  }

  private displayPayload(value: string): Readonly<{ text: string; truncated: boolean }> {
    const displayed = displayPayload(value);
    return displayed.truncated
      ? { text: `${displayed.text}\n\n${this.t('displayLimitedNotice')}`, truncated: true }
      : displayed;
  }

  private resultKindLabel(kind: ResultKind): string {
    const key: Record<ResultKind, MessageKey> = {
      url: 'resultTypeUrl', email: 'resultTypeEmail', phone: 'resultTypePhone', text: 'resultTypeText',
    };
    return this.t(key[kind]);
  }

  private riskMessage(risk: LinkRisk): string {
    const key: Record<LinkRisk['code'], MessageKey> = {
      unencrypted: 'riskUnencrypted',
      credentials: 'riskCredentials',
      'internationalized-domain': 'riskInternationalizedDomain',
      'ip-address': 'riskIpAddress',
      'local-network': 'riskLocalNetwork',
      'unusual-port': 'riskUnusualPort',
    };
    return this.t(key[risk.code], risk.detail);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.destroy();
      return;
    }
    if (!this.keyboardMode && event.key.toLowerCase() === 'k' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this.beginKeyboardSelection();
      return;
    }
    const handled = this.keyboardSelection?.handleKeyDown(event, {
      width: window.innerWidth,
      height: window.innerHeight,
    }) ?? false;
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
}
