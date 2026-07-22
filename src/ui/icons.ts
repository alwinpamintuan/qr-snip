const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const ICON_PATHS = {
  qr: 'M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h3v3h-3v-3Zm5 0h3v5h-3v-5Zm-5 5h5v3h-5v-3Zm6 1h2v2h-2v-2Z',
  close: 'm18.3 7.1-1.4-1.4L12 10.6 7.1 5.7 5.7 7.1l4.9 4.9-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9 4.9-4.9Z',
  check: 'm9.6 18.2-5.7-5.7 1.4-1.4 4.3 4.3 9.1-9.1 1.4 1.4-10.5 10.5Z',
  warning: 'M1.8 21 12 3l10.2 18H1.8Zm3.4-2h13.6L12 7 5.2 19Zm5.8-2h2v-2h-2v2Zm0-4h2V9h-2v4Z',
  copy: 'M7 22q-.8 0-1.4-.6Q5 20.8 5 20V6h2v14h11v2H7Zm4-4q-.8 0-1.4-.6Q9 16.8 9 16V4q0-.8.6-1.4Q10.2 2 11 2h9q.8 0 1.4.6.6.6.6 1.4v12q0 .8-.6 1.4-.6.6-1.4.6h-9Zm0-2h9V4h-9v12Z',
  open: 'M5 21q-.8 0-1.4-.6Q3 19.8 3 19V5q0-.8.6-1.4Q4.2 3 5 3h7v2H5v14h14v-7h2v7q0 .8-.6 1.4-.6.6-1.4.6H5Zm4.7-5.3-1.4-1.4L17.6 5H14V3h7v7h-2V6.4l-9.3 9.3Z',
  refresh: 'M12 20q-3.3 0-5.7-2.3Q4 15.3 4 12t2.3-5.7Q8.7 4 12 4q1.7 0 3.2.7 1.5.7 2.6 1.9V4H20v7h-7V9h4q-.8-1.4-2.1-2.2Q13.6 6 12 6 9.5 6 7.8 7.8 6 9.5 6 12t1.8 4.2Q9.5 18 12 18q1.9 0 3.4-1.1 1.5-1.1 2.2-2.9h2.1q-.7 2.7-2.9 4.4Q14.7 20 12 20Z',
  keyboard: 'M3 5h18q.8 0 1.4.6.6.6.6 1.4v10q0 .8-.6 1.4-.6.6-1.4.6H3q-.8 0-1.4-.6Q1 17.8 1 17V7q0-.8.6-1.4Q2.2 5 3 5Zm0 2v10h18V7H3Zm2 2h2v2H5V9Zm3 0h2v2H8V9Zm3 0h2v2h-2V9Zm3 0h2v2h-2V9Zm3 0h2v2h-2V9ZM5 13h3v2H5v-2Zm4 0h8v2H9v-2Zm9 0h1v2h-1v-2Z',
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function createIcon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NAMESPACE, 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.append(path);
  return svg;
}
