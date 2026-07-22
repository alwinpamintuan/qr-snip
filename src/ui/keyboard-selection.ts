import {
  adjustSelection,
  centeredSelection,
  KEYBOARD_SELECTION_FAST_STEP,
  KEYBOARD_SELECTION_STEP,
  type SelectionBounds,
  type SelectionRect,
} from '../core/selection';

export type KeyboardSelectionCallbacks = Readonly<{
  onChange: (selection: SelectionRect) => void;
  onComplete: (selection: SelectionRect) => void;
}>;

export class KeyboardSelection {
  private selection: SelectionRect | null = null;

  constructor(private readonly callbacks: KeyboardSelectionCallbacks) {}

  start(bounds: SelectionBounds): void {
    this.selection = centeredSelection(bounds);
    this.callbacks.onChange(this.selection);
  }

  cancel(): void {
    this.selection = null;
  }

  handleKeyDown(event: KeyboardEvent, bounds: SelectionBounds): boolean {
    if (!this.selection) return false;
    if (event.key === 'Enter') {
      const completed = this.selection;
      this.selection = null;
      this.callbacks.onComplete(completed);
      return true;
    }

    const direction = directionForKey(event.key);
    if (!direction) return false;
    const step = event.altKey ? KEYBOARD_SELECTION_FAST_STEP : KEYBOARD_SELECTION_STEP;
    this.selection = adjustSelection(this.selection, {
      axis: direction.axis,
      delta: direction.sign * step,
      resize: event.shiftKey,
    }, bounds);
    this.callbacks.onChange(this.selection);
    return true;
  }
}

function directionForKey(key: string): Readonly<{ axis: 'x' | 'y'; sign: -1 | 1 }> | undefined {
  switch (key) {
    case 'ArrowLeft': return { axis: 'x', sign: -1 };
    case 'ArrowRight': return { axis: 'x', sign: 1 };
    case 'ArrowUp': return { axis: 'y', sign: -1 };
    case 'ArrowDown': return { axis: 'y', sign: 1 };
    default: return undefined;
  }
}
