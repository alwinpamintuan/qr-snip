import { WorkerQrDecoder, type DecodeOutcome, type QrDecoder } from '../core/decode';
import { classifyResult, displayPayload, type ClassifiedResult } from '../core/result';
import { toPixelCrop, type SelectionRect } from '../core/selection';
import { assessLinkSecurity, type LinkSecurityAssessment } from '../security/link-security';
import { toUnicode } from 'punycode';
import { SelectionGesture } from '../ui/selection-gesture';
import { SnipperView } from '../ui/snipper-view';

export class SnipperApplication {
  private gesture: SelectionGesture | null = null;
  private screenshotUrl = '';
  private invocationId = '';
  private decodeController: AbortController | null = null;

  constructor(
    private readonly view: SnipperView,
    private readonly decoder: QrDecoder = new WorkerQrDecoder(),
  ) {}

  start(invocationId: string, screenshotUrl: string): void {
    this.destroy();
    this.invocationId = invocationId;
    this.screenshotUrl = screenshotUrl;
    this.view.mount(screenshotUrl, {
      onClose: () => this.destroy(),
      onSnapshotReady: () => this.onSnapshotReady(),
      onSnapshotError: () => this.showDecodeFailure('image-error'),
    });
    this.gesture = new SelectionGesture(this.view.selectionSurface, {
      onChange: (selection) => this.view.showSelection(selection),
      onComplete: (selection) => void this.scan(selection),
      onInvalid: () => this.rejectSmallSelection(),
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
    this.invocationId = '';
    this.screenshotUrl = '';
    this.view.unmount();
  }

  private onSnapshotReady(): void {
    this.gesture?.attach();
    this.view.setInstruction('Drag around a QR code', 'Press Esc to cancel');
  }

  private async scan(selection: SelectionRect): Promise<void> {
    if (!this.view.snapshotIsReady) return;
    const invocationId = this.invocationId;
    this.decodeController?.abort();
    this.decodeController = new AbortController();
    this.view.setBusy(true);
    this.view.setInstruction('Scanning selection…', 'Everything stays on this device');
    const crop = toPixelCrop(
      selection,
      { width: window.innerWidth, height: window.innerHeight },
      this.view.snapshotDimensions,
    );
    const outcome = await this.decoder.decode(this.screenshotUrl, crop, this.decodeController.signal);
    if (!this.screenshotUrl || invocationId !== this.invocationId) return;
    this.view.setBusy(false);
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
    const displayed = displayPayload(result.value);

    if (result.openUrl && linkSecurity?.requiresConfirmation) {
      this.previewSuspiciousLink(result, linkSecurity);
      return;
    }

    this.view.showResult({
      title: 'QR code found',
      subtitle: `${result.label} · preview only${displayed.truncated ? ' · long value' : ''}`,
      value: displayed.text,
      ...(linkSecurity ? { hostname: linkSecurity.hostname } : {}),
      isWarning: false,
      actions: [
        { label: 'Scan another', icon: 'refresh', onSelect: () => this.reset() },
        { label: 'Copy', icon: 'copy', onSelect: () => void this.copyValue(result.value) },
        ...(result.openUrl ? [{
          label: this.openLabel(result),
          icon: 'open' as const,
          filled: true,
          onSelect: () => this.openResult(result.openUrl!),
        }] : []),
      ],
    });
  }

  private previewSuspiciousLink(result: ClassifiedResult, assessment: LinkSecurityAssessment): void {
    const url = result.openUrl!;
    const scannedValue = displayPayload(result.value);
    const resolvedDestination = displayPayload(url);
    const contentWasTruncated = scannedValue.truncated || resolvedDestination.truncated;
    this.view.showResult({
      title: 'Check this destination',
      subtitle: `${assessment.risks.length} warning ${assessment.risks.length === 1 ? 'signal' : 'signals'} · nothing has opened${contentWasTruncated ? ' · long value' : ''}`,
      value: scannedValue.text,
      review: {
        scannedValue: scannedValue.text,
        ...(result.value === url ? {} : { resolvedDestination: resolvedDestination.text }),
        warnings: assessment.risks.map((risk) => risk.message),
        disclaimer: 'These signals do not prove the link is malicious. Check the destination before continuing.',
      },
      hostname: assessment.hostname,
      isWarning: true,
      actions: [
        { label: 'Scan another', icon: 'refresh', onSelect: () => this.reset() },
        { label: 'Copy instead', icon: 'copy', onSelect: () => void this.copyValue(result.value) },
        { label: 'Open anyway', icon: 'open', filled: true, onSelect: () => this.openResult(url) },
      ],
    });
  }

  private showDecodeFailure(reason: 'not-found' | 'image-error' | 'resource-limit'): void {
    this.view.showResult({
      title: 'Try a wider selection',
      subtitle: reason === 'not-found'
        ? 'No QR code was found in that area.'
        : reason === 'resource-limit'
          ? 'That area is too large to scan safely.'
          : 'The screen capture could not be read.',
      value: 'Include the full QR code and a small margin around it. Avoid selecting only part of the code.',
      isWarning: true,
      actions: [
        { label: 'Cancel', onSelect: () => this.destroy() },
        { label: 'Try again', icon: 'refresh', filled: true, onSelect: () => this.reset() },
      ],
    });
  }

  private openLabel(result: ClassifiedResult): string {
    return result.kind === 'url' ? 'Open link' : 'Open';
  }

  private openResult(url: string): void {
    void browser.runtime.sendMessage({ type: 'OPEN_RESULT', url });
  }

  private async copyValue(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.view.showToast('Copied to clipboard');
    } catch {
      const copied = this.view.copyFallback(value);
      this.view.showToast(copied ? 'Copied to clipboard' : 'Copy failed');
    }
  }

  private rejectSmallSelection(): void {
    this.reset();
    this.view.showToast('Select a slightly larger area.');
  }

  private reset(): void {
    this.decodeController?.abort();
    this.decodeController = null;
    this.gesture?.cancel();
    this.view.resetSelection();
    this.view.setBusy(false);
    this.view.setInstruction('Drag around a QR code', 'Press Esc to cancel');
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    this.destroy();
  };
}
