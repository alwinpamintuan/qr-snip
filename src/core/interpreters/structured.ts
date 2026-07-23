import type { InterpretedResult, ResultField, ResultInterpreter } from './contract';

export const wifiInterpreter: ResultInterpreter = {
  id: 'wifi',
  matches: (payload) => parseWifi(payload) !== null,
  present: (payload) => {
    const wifi = parseWifi(payload)!;
    const fields: ResultField[] = [
      { label: 'networkName', value: wifi.name },
      { label: 'security', value: wifi.security || 'nopass' },
      { label: 'hiddenNetwork', value: wifi.hidden },
      {
        label: 'credentials',
        value: wifi.password || false,
        ...(wifi.password ? { sensitive: true } : {}),
      },
    ];
    return { value: payload, kind: 'wifi', fields };
  },
};

export const vcardInterpreter: ResultInterpreter = {
  id: 'vcard',
  matches: (payload) => parseVcard(payload) !== null,
  present: (payload) => ({ value: payload, kind: 'contact', fields: parseVcard(payload)! }),
};

export const calendarInterpreter: ResultInterpreter = {
  id: 'calendar',
  matches: (payload) => parseCalendar(payload) !== null,
  present: (payload) => ({ value: payload, kind: 'calendar', fields: parseCalendar(payload)! }),
};

export const geoInterpreter: ResultInterpreter = {
  id: 'geo',
  matches: (payload) => parseGeo(payload) !== null,
  present: (payload) => ({ value: payload, kind: 'geo', fields: parseGeo(payload)! }),
};

export function maskWifiPassword(payload: string): string {
  return payload.replace(
    /(WIFI:|;)(P:)((?:\\.|[^;])*)/iu,
    (_match, prefix: string, key: string, password: string) =>
      `${prefix}${key}${password ? '••••••••••' : ''}`,
  );
}

function parseWifi(payload: string): Readonly<{
  name: string;
  security: string;
  hidden: boolean;
  password: string;
}> | null {
  if (!payload.toUpperCase().startsWith('WIFI:') || !payload.endsWith(';;')) return null;
  const fields = parseEscapedFields(payload.slice(5, -2));
  const name = fields.get('S') ?? '';
  if (!name) return null;
  const hidden = fields.get('H')?.toLowerCase();
  if (hidden !== undefined && hidden !== 'true' && hidden !== 'false') return null;
  return {
    name,
    security: fields.get('T') ?? '',
    hidden: hidden === 'true',
    password: fields.get('P') ?? '',
  };
}

function parseVcard(payload: string): readonly ResultField[] | null {
  const lines = contentLines(payload);
  if (!hasEnvelope(lines, 'VCARD')) return null;
  const name = firstValue(lines, ['FN', 'N']);
  if (!name) return null;
  return compactFields([
    { label: 'name', value: name },
    { label: 'organization', value: firstValue(lines, ['ORG']) },
    { label: 'email', value: firstValue(lines, ['EMAIL']) },
    { label: 'phone', value: firstValue(lines, ['TEL']) },
  ]);
}

function parseCalendar(payload: string): readonly ResultField[] | null {
  const lines = contentLines(payload);
  const eventStart = lines.findIndex((line) => line.toUpperCase() === 'BEGIN:VEVENT');
  const eventEnd = lines.findIndex((line, index) => index > eventStart && line.toUpperCase() === 'END:VEVENT');
  if (eventStart < 0 || eventEnd < 0) return null;
  const eventLines = lines.slice(eventStart + 1, eventEnd);
  const starts = firstValue(eventLines, ['DTSTART']);
  if (!starts) return null;
  return compactFields([
    { label: 'event', value: firstValue(eventLines, ['SUMMARY']) },
    { label: 'starts', value: starts },
    { label: 'ends', value: firstValue(eventLines, ['DTEND']) },
    { label: 'location', value: firstValue(eventLines, ['LOCATION']) },
  ]);
}

function parseGeo(payload: string): readonly ResultField[] | null {
  const match = /^geo:([^?]+)(?:\?(.*))?$/iu.exec(payload);
  if (!match) return null;
  const coordinates = (match[1] ?? '').split(',');
  if (coordinates.length < 2 || coordinates.length > 3) return null;
  const latitude = Number(coordinates[0]);
  const longitude = Number(coordinates[1]);
  const altitude = coordinates[2] === undefined ? undefined : Number(coordinates[2]);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || altitude !== undefined && !Number.isFinite(altitude)) return null;
  const query = new URLSearchParams(match[2] ?? '');
  return compactFields([
    { label: 'latitude', value: String(latitude) },
    { label: 'longitude', value: String(longitude) },
    { label: 'altitude', value: altitude === undefined ? '' : String(altitude) },
    { label: 'place', value: query.get('q') ?? '' },
  ]);
}

function parseEscapedFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  let key = '';
  let value = '';
  let readingValue = false;
  let escaped = false;
  const commit = (): void => {
    if (key) fields.set(key.toUpperCase(), value);
    key = '';
    value = '';
    readingValue = false;
  };
  for (const character of body) {
    if (escaped) {
      if (readingValue) value += character;
      else key += character;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === ':' && !readingValue) {
      readingValue = true;
    } else if (character === ';') {
      commit();
    } else if (readingValue) {
      value += character;
    } else {
      key += character;
    }
  }
  if (escaped) value += '\\';
  commit();
  return fields;
}

function contentLines(payload: string): readonly string[] {
  const unfolded: string[] = [];
  for (const line of payload.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^[ \t]/.test(line) && unfolded.length > 0) unfolded[unfolded.length - 1] += line.slice(1);
    else unfolded.push(line);
  }
  return unfolded.map((line) => line.trimEnd());
}

function hasEnvelope(lines: readonly string[], name: string): boolean {
  return lines[0]?.toUpperCase() === `BEGIN:${name}` && lines.at(-1)?.toUpperCase() === `END:${name}`;
}

function firstValue(lines: readonly string[], names: readonly string[]): string {
  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const property = line.slice(0, separator).split(';')[0]?.toUpperCase();
    if (property && names.includes(property)) return unescapeContentValue(line.slice(separator + 1));
  }
  return '';
}

function unescapeContentValue(value: string): string {
  return value.replace(/\\[nN]/g, '\n').replace(/\\([,;\\])/g, '$1');
}

function compactFields(fields: readonly { label: ResultField['label']; value: string }[]): readonly ResultField[] {
  return fields.filter((field) => field.value.length > 0);
}
