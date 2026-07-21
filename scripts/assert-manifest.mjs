import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const targets = ['chrome-mv3', 'firefox-mv3'];
const expectedPermissions = ['activeTab', 'scripting'];

for (const target of targets) {
  const path = resolve('.output', target, 'manifest.json');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const permissions = [...(manifest.permissions ?? [])].sort();
  if (JSON.stringify(permissions) !== JSON.stringify([...expectedPermissions].sort())) {
    throw new Error(`${target} permissions changed: ${permissions.join(', ') || '(none)'}`);
  }
  if ((manifest.host_permissions ?? []).length > 0) {
    throw new Error(`${target} unexpectedly declares host permissions.`);
  }
  if ((manifest.content_scripts ?? []).length > 0) {
    throw new Error(`${target} unexpectedly declares persistent content scripts.`);
  }
  if (manifest.externally_connectable) {
    throw new Error(`${target} unexpectedly enables external messaging.`);
  }
  const workerResources = (manifest.web_accessible_resources ?? [])
    .flatMap((entry) => entry.resources ?? []);
  if (!workerResources.includes('assets/qr-decoder.worker-*.js')) {
    throw new Error(`${target} does not expose the decoder worker to the runtime-injected content script.`);
  }

  const contentBundle = await readFile(resolve('.output', target, 'content-scripts', 'snipper.js'), 'utf8');
  if (!contentBundle.includes('runtime.getURL')) {
    throw new Error(`${target} content bundle does not resolve the decoder worker through runtime.getURL.`);
  }
}

console.log(`Verified least-privilege manifests for ${targets.join(' and ')}.`);
