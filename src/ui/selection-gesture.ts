import {
  clampPoint,
  isUsableSelection,
  rectFromPoints,
  type Point,
  type SelectionRect,
} from '../core/selection';

export type SelectionGestureCallbacks = Readonly<{
  onChange: (selection: SelectionRect) => void;
  onComplete: (selection: SelectionRect) => void;
  onInvalid: () => void;
}>;

export class SelectionGesture {
  private dragStart: Point | null = null;
  private activePointerId: number | null = null;
  private pendingSelection: SelectionRect | null = null;
  private changeFrame: number | null = null;

  constructor(
    private readonly surface: HTMLElement,
    private readonly callbacks: SelectionGestureCallbacks,
  ) {}

  attach(): void {
    this.surface.addEventListener('pointerdown', this.onPointerDown);
    this.surface.addEventListener('pointermove', this.onPointerMove);
    this.surface.addEventListener('pointerup', this.onPointerUp);
    this.surface.addEventListener('pointercancel', this.onPointerCancel);
  }

  detach(): void {
    this.surface.removeEventListener('pointerdown', this.onPointerDown);
    this.surface.removeEventListener('pointermove', this.onPointerMove);
    this.surface.removeEventListener('pointerup', this.onPointerUp);
    this.surface.removeEventListener('pointercancel', this.onPointerCancel);
    this.cancel();
  }

  cancel(): void {
    if (this.changeFrame !== null) cancelAnimationFrame(this.changeFrame);
    this.dragStart = null;
    this.activePointerId = null;
    this.pendingSelection = null;
    this.changeFrame = null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    const origin = event.composedPath()[0];
    if (event.button !== 0 || (origin instanceof Element && origin.closest('button, .result-card'))) return;

    this.dragStart = this.pointFromEvent(event);
    this.activePointerId = event.pointerId;
    this.surface.setPointerCapture(event.pointerId);
    this.callbacks.onChange(rectFromPoints(this.dragStart, this.dragStart));
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.dragStart === null || this.activePointerId !== event.pointerId) return;
    this.pendingSelection = rectFromPoints(this.dragStart, this.pointFromEvent(event));
    this.changeFrame ??= requestAnimationFrame(() => {
      const selection = this.pendingSelection;
      this.pendingSelection = null;
      this.changeFrame = null;
      if (selection) this.callbacks.onChange(selection);
    });
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (this.dragStart === null || this.activePointerId !== event.pointerId) return;
    const selection = rectFromPoints(this.dragStart, this.pointFromEvent(event));
    this.cancel();
    this.callbacks.onChange(selection);
    if (this.surface.hasPointerCapture(event.pointerId)) this.surface.releasePointerCapture(event.pointerId);

    if (isUsableSelection(selection)) this.callbacks.onComplete(selection);
    else this.callbacks.onInvalid();
  };

  private readonly onPointerCancel = (): void => {
    this.cancel();
    this.callbacks.onInvalid();
  };

  private pointFromEvent(event: PointerEvent): Point {
    return clampPoint({ x: event.clientX, y: event.clientY }, window.innerWidth, window.innerHeight);
  }
}
