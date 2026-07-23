import { describe, expect, it } from 'vitest';
import { interpretResult, RESULT_INTERPRETERS } from '../src/core/interpreters/registry';
import {
  calendarInterpreter,
  geoInterpreter,
  maskWifiPassword,
  vcardInterpreter,
  wifiInterpreter,
} from '../src/core/interpreters/structured';

describe('result interpreter registry', () => {
  it('uses an explicit priority and keeps text as the final fallback', () => {
    expect(RESULT_INTERPRETERS.map(({ id }) => id)).toEqual([
      'wifi', 'vcard', 'calendar', 'geo', 'url', 'email', 'phone', 'text',
    ]);
  });

  it('presents a Wi-Fi password as a sensitive field without creating an open action', () => {
    const payload = String.raw`WIFI:T:WPA;S:Cafe\; Guest;P:sup3rsecret;H:true;;`;
    const result = interpretResult(payload);
    expect(wifiInterpreter.matches(payload)).toBe(true);
    expect(result).toMatchObject({
      kind: 'wifi',
      fields: [
        { label: 'networkName', value: 'Cafe; Guest' },
        { label: 'security', value: 'WPA' },
        { label: 'hiddenNetwork', value: true },
        { label: 'credentials', value: 'sup3rsecret', sensitive: true },
      ],
    });
    expect(result).not.toHaveProperty('openUrl');
  });

  it('parses escaped Wi-Fi password characters exactly', () => {
    const payload = String.raw`WIFI:T:WPA;S:Guest;P:semi\;colon\\slash;;`;
    const result = interpretResult(payload);
    expect(result.fields).toContainEqual({
      label: 'credentials',
      value: 'semi;colon\\slash',
      sensitive: true,
    });
    expect(maskWifiPassword(payload)).toBe(String.raw`WIFI:T:WPA;S:Guest;P:••••••••••;;`);
  });

  it('summarizes a vCard as an inactive contact preview', () => {
    const payload = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ada Lovelace\r\nORG:Analytical Engines\r\nEMAIL:ada@example.com\r\nTEL:+44123456789\r\nEND:VCARD';
    expect(vcardInterpreter.matches(payload)).toBe(true);
    expect(interpretResult(payload)).toMatchObject({
      kind: 'contact',
      fields: [
        { label: 'name', value: 'Ada Lovelace' },
        { label: 'organization', value: 'Analytical Engines' },
        { label: 'email', value: 'ada@example.com' },
        { label: 'phone', value: '+44123456789' },
      ],
    });
  });

  it('summarizes a calendar event without importing it', () => {
    const payload = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Project review\nDTSTART:20260801T090000Z\nDTEND:20260801T100000Z\nLOCATION:Room 3\nEND:VEVENT\nEND:VCALENDAR';
    expect(calendarInterpreter.matches(payload)).toBe(true);
    expect(interpretResult(payload)).toMatchObject({ kind: 'calendar' });
    expect(interpretResult(payload)).not.toHaveProperty('openUrl');
  });

  it('summarizes valid geo coordinates without opening a map', () => {
    const result = interpretResult('geo:25.033,121.5654,10?q=Taipei%20101');
    expect(geoInterpreter.matches('geo:25.033,121.5654,10?q=Taipei%20101')).toBe(true);
    expect(result).toMatchObject({
      kind: 'geo',
      fields: [
        { label: 'latitude', value: '25.033' },
        { label: 'longitude', value: '121.5654' },
        { label: 'altitude', value: '10' },
        { label: 'place', value: 'Taipei 101' },
      ],
    });
    expect(result).not.toHaveProperty('openUrl');
  });

  it.each([
    'WIFI:T:WPA;P:missing-name;;',
    'BEGIN:VCARD\nFN:Missing end',
    'BEGIN:VEVENT\nSUMMARY:Missing start\nEND:VEVENT',
    'geo:91,181',
    'geo:not-a-coordinate',
  ])('falls back to exact text for malformed structured payload: %s', (payload) => {
    expect(interpretResult(payload)).toEqual({ value: payload, kind: 'text' });
  });
});
