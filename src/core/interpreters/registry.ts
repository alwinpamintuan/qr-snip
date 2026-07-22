import { MAX_PAYLOAD_LENGTH, normalizePayload, payloadHasUnsafeControls } from '../result';
import type { InterpretedResult, ResultInterpreter } from './contract';
import { emailInterpreter, phoneInterpreter, textInterpreter, urlInterpreter } from './generic';
import { calendarInterpreter, geoInterpreter, vcardInterpreter, wifiInterpreter } from './structured';

export const RESULT_INTERPRETERS: readonly ResultInterpreter[] = Object.freeze([
  wifiInterpreter,
  vcardInterpreter,
  calendarInterpreter,
  geoInterpreter,
  urlInterpreter,
  emailInterpreter,
  phoneInterpreter,
  textInterpreter,
]);

export function interpretResult(rawPayload: string, registry = RESULT_INTERPRETERS): InterpretedResult {
  const payload = normalizePayload(rawPayload);
  if (payload.length > MAX_PAYLOAD_LENGTH || payloadHasUnsafeControls(payload)) {
    return textInterpreter.present(payload);
  }
  const interpreter = registry.find((candidate) => candidate.matches(payload)) ?? textInterpreter;
  return interpreter.present(payload);
}
