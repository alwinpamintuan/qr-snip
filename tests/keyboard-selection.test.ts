import { describe, expect, it, vi } from 'vitest';
import { KeyboardSelection } from '../src/ui/keyboard-selection';

function keyEvent(key: string, options: Readonly<{ altKey?: boolean; shiftKey?: boolean }> = {}): KeyboardEvent {
  return { key, altKey: options.altKey ?? false, shiftKey: options.shiftKey ?? false } as KeyboardEvent;
}

describe('keyboard selection adapter', () => {
  it('starts centered, moves, resizes, and completes without pointer input', () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    const keyboard = new KeyboardSelection({ onChange, onComplete });
    const bounds = { width: 800, height: 600 };

    keyboard.start(bounds);
    expect(onChange).toHaveBeenLastCalledWith({ x: 280, y: 180, width: 240, height: 240 });

    expect(keyboard.handleKeyDown(keyEvent('ArrowRight', { altKey: true }), bounds)).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith({ x: 312, y: 180, width: 240, height: 240 });

    expect(keyboard.handleKeyDown(keyEvent('ArrowDown', { shiftKey: true }), bounds)).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith({ x: 312, y: 180, width: 240, height: 248 });

    expect(keyboard.handleKeyDown(keyEvent('Enter'), bounds)).toBe(true);
    expect(onComplete).toHaveBeenCalledWith({ x: 312, y: 180, width: 240, height: 248 });
    expect(keyboard.handleKeyDown(keyEvent('ArrowLeft'), bounds)).toBe(false);
  });
});
