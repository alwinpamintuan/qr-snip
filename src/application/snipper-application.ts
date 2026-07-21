import { decodeSelection, type DecodeOutcome } from '../core/decode';
import { classifyResult, type ClassifiedResult } from '../core/result';
import { toPixelCrop, type PixelCrop, type SelectionRect } from '../core/selection';
import { assessLinkSecurity, type LinkSecurityAssessment } from '../security/link-security';
import { ICONS } from '../ui/icons';
import { SelectionGesture } from '../ui/selection-gesture';
import { SnipperView } from '../ui/snipper-view';

export type SelectionDecoder = (screenshotUrl: string, crop: PixelCrop) => Promise<DecodeOutcome>;

export class SnipperApplication {
  private gesture: SelectionGesture | null = null;
  private screenshotUrl = '';

  constructor(
    private readonly view: SnipperView,
    private readonly decode: SelectionDecoder = decodeSelection,
  ) {}

  start(screenshotUrl: string): void {
    this.destroy();
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
    this.gesture?.detach();
    this.gesture = null;
    this.screenshotUrl = '';
    this.view.unmount();
  }

  private onSnapshotReady(): void {
    this.gesture?.attach();
    this.view.setInstruction('Drag around a QR code', 'Press Esc to cancel');
  }

  private async scan(selection: SelectionRect): Promise<void> {
    if (!this.view.snapshotIsReady) return;
    this.view.setInstruction('Scanning selection…', 'Everything stays on this device');
    const crop = toPixelCrop(
      selection,
      { width: window.innerWidth, height: window.innerHeight },
      this.view.snapshotDimensions,
    );
    const outcome = await this.decode(this.screenshotUrl, crop);
    if (!this.screenshotUrl) return;
    if (outcome.ok) this.previewResult(classifyResult(outcome.value));
    else this.showDecodeFailure(outcome.reason);
  }

  private previewResult(result: ClassifiedResult): void {
    const linkSecurity = result.kind === 'url' && result.openUrl
      ? assessLinkSecurity(result.openUrl)
      : undefined;
    this.view.showResult({
      title: 'QR code found',
      subtitle: this.previewSubtitle(result, linkSecurity),
      value: result.value,
      isWarning: Boolean(linkSecurity?.requiresConfirmation),
      actions: [
        { label: 'Scan another', icon: ICONS.refresh, onSelect: () => this.reset() },
        { label: 'Copy', icon: ICONS.copy, onSelect: () => void this.copyValue(result.value) },
        ...(result.openUrl ? [{
          label: linkSecurity?.requiresConfirmation ? 'Review link' : this.openLabel(result),
          icon: ICONS.open,
          filled: true,
          onSelect: () => linkSecurity?.requiresConfirmation
            ? this.confirmSuspiciousLink(result.openUrl!, linkSecurity)
            : this.openResult(result.openUrl!),
        }] : []),
      ],
    });
  }

  private confirmSuspiciousLink(url: string, assessment: LinkSecurityAssessment): void {
    const explanation = assessment.risks.map((risk) => `• ${risk.message}`).join('\n');
    this.view.showResult({
      title: 'Review before opening',
      subtitle: 'This destination has security signals worth checking.',
      value: `Destination\n${url}\n\nWhy this needs care\n${explanation}`,
      isWarning: true,
      actions: [
        { label: 'Back', onSelect: () => this.previewResult(classifyResult(url)) },
        { label: 'Copy instead', icon: ICONS.copy, onSelect: () => void this.copyValue(url) },
        { label: 'Open anyway', icon: ICONS.open, filled: true, onSelect: () => this.openResult(url) },
      ],
    });
  }

  private showDecodeFailure(reason: 'not-found' | 'image-error'): void {
    this.view.showResult({
      title: 'Try a wider selection',
      subtitle: reason === 'not-found'
        ? 'No QR code was found in that area.'
        : 'The screen capture could not be read.',
      value: 'Include the full QR code and a small margin around it. Avoid selecting only part of the code.',
      isWarning: true,
      actions: [
        { label: 'Cancel', onSelect: () => this.destroy() },
        { label: 'Try again', icon: ICONS.refresh, filled: true, onSelect: () => this.reset() },
      ],
    });
  }

  private previewSubtitle(result: ClassifiedResult, security?: LinkSecurityAssessment): string {
    if (security?.requiresConfirmation) return `${result.label} · review recommended`;
    return `${result.label} · preview only`;
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
      const textarea = document.createElement('textarea');
      textarea.value = value;
      Object.assign(textarea.style, { position: 'fixed', opacity: '0' });
      document.documentElement.append(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      this.view.showToast(copied ? 'Copied to clipboard' : 'Copy failed');
    }
  }

  private rejectSmallSelection(): void {
    this.reset();
    this.view.showToast('Select a slightly larger area.');
  }

  private reset(): void {
    this.gesture?.cancel();
    this.view.resetSelection();
    this.view.setInstruction('Drag around a QR code', 'Press Esc to cancel');
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    this.destroy();
  };
}
