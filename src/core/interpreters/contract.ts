export type ResultKind = 'url' | 'email' | 'phone' | 'wifi' | 'contact' | 'calendar' | 'geo' | 'text';

export type ResultFieldLabel =
  | 'networkName' | 'security' | 'hiddenNetwork' | 'credentials'
  | 'name' | 'organization' | 'email' | 'phone'
  | 'event' | 'starts' | 'ends' | 'location'
  | 'latitude' | 'longitude' | 'altitude' | 'place';

export type ResultField = Readonly<{
  label: ResultFieldLabel;
  value: string | boolean;
  sensitive?: boolean;
}>;

export type InterpretedResult = Readonly<{
  value: string;
  kind: ResultKind;
  openUrl?: string;
  fields?: readonly ResultField[];
}>;

export interface ResultInterpreter {
  readonly id: string;
  matches(payload: string): boolean;
  present(payload: string): InterpretedResult;
}
