import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile('public/_locales/en/messages.json', 'utf8'));
const registrySource = await readFile('src/i18n/messages.ts', 'utf8');
const registryBlock = registrySource.match(/MESSAGE_KEYS\s*=\s*\[([\s\S]*?)\]\s*as const/)?.[1];
if (!registryBlock) throw new Error('Could not read the typed message-key registry.');

const registeredKeys = [...registryBlock.matchAll(/'([A-Za-z][A-Za-z0-9]+)'/g)].map((match) => match[1]);
const catalogKeys = Object.keys(catalog);
const missing = registeredKeys.filter((key) => !catalogKeys.includes(key));
const untyped = catalogKeys.filter((key) => !registeredKeys.includes(key));
if (missing.length || untyped.length) {
  throw new Error(`Locale registry mismatch. Missing: ${missing.join(', ') || 'none'}. Untyped: ${untyped.join(', ') || 'none'}.`);
}

for (const [key, entry] of Object.entries(catalog)) {
  if (!entry || typeof entry.message !== 'string' || entry.message.length === 0) {
    throw new Error(`Locale message ${key} must contain non-empty text.`);
  }
}

console.log(`Verified ${catalogKeys.length} typed English runtime messages.`);
