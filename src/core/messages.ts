import { isSettings, type Settings } from './settings';

export type StartCaptureMessage = {
  type: 'START_CAPTURE';
  invocationId: string;
  screenshotUrl: string;
  settings: Settings;
};

export type ProbeContentMessage = {
  type: 'PROBE_CONTENT';
};

export type OpenResultMessage = {
  type: 'OPEN_RESULT';
  url: string;
};

export type BackgroundMessage = OpenResultMessage;
export type ContentMessage = ProbeContentMessage | StartCaptureMessage;

export function isProbeContentMessage(value: unknown): value is ProbeContentMessage {
  if (typeof value !== 'object' || value === null) return false;
  return (value as Partial<ProbeContentMessage>).type === 'PROBE_CONTENT';
}

export function isStartCaptureMessage(value: unknown): value is StartCaptureMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Partial<StartCaptureMessage>;
  return message.type === 'START_CAPTURE'
    && typeof message.invocationId === 'string'
    && message.invocationId.length > 0
    && typeof message.screenshotUrl === 'string'
    && message.screenshotUrl.startsWith('data:image/')
    && isSettings(message.settings);
}

export function isOpenResultMessage(value: unknown): value is OpenResultMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Partial<OpenResultMessage>;
  return message.type === 'OPEN_RESULT' && typeof message.url === 'string';
}
