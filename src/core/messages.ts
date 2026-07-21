export type StartCaptureMessage = {
  type: 'START_CAPTURE';
  screenshotUrl: string;
};

export type OpenResultMessage = {
  type: 'OPEN_RESULT';
  url: string;
};

export type BackgroundMessage = OpenResultMessage;
export type ContentMessage = StartCaptureMessage;

export function isStartCaptureMessage(value: unknown): value is StartCaptureMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Partial<StartCaptureMessage>;
  return message.type === 'START_CAPTURE' && typeof message.screenshotUrl === 'string';
}

export function isOpenResultMessage(value: unknown): value is OpenResultMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Partial<OpenResultMessage>;
  return message.type === 'OPEN_RESULT' && typeof message.url === 'string';
}

