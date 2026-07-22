import { createIcon, type IconName } from './icons';

export type ButtonKind = 'filled' | 'tonal' | 'text';

export function createIconButton(label: string, icon: IconName, action: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-button';
  button.dataset.action = action;
  button.setAttribute('aria-label', label);
  button.append(createIcon(icon));
  return button;
}

export function createActionButton(
  label: string,
  kind: ButtonKind,
  onSelect: () => void,
  icon?: IconName,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `action-button ${kind}`;
  if (icon) button.append(createIcon(icon));
  const text = document.createElement('span');
  text.textContent = label;
  button.append(text);
  button.addEventListener('click', onSelect);
  return button;
}

export function createStatusIcon(icon: IconName, warning = false): HTMLSpanElement {
  const status = document.createElement('span');
  status.className = `status-icon${warning ? ' error' : ''}`;
  status.setAttribute('aria-hidden', 'true');
  status.append(createIcon(icon));
  return status;
}

export function createPill(className: string): HTMLElement {
  const pill = document.createElement('div');
  pill.className = className;
  return pill;
}

export function createResultSurface(): HTMLElement {
  const surface = document.createElement('section');
  surface.className = 'result-card';
  surface.setAttribute('role', 'dialog');
  surface.setAttribute('aria-modal', 'true');
  return surface;
}

export function createToast(): HTMLElement {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  return toast;
}
