import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const targets = ['chrome-mv3', 'firefox-mv3'];
const expectedPermissions = ['activeTab', 'scripting', 'storage'];

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
  if ((manifest.web_accessible_resources ?? []).length > 0) {
    throw new Error(`${target} unexpectedly exposes extension resources to host pages.`);
  }

  const contentBundle = await readFile(resolve('.output', target, 'content-scripts', 'snipper.js'), 'utf8');
  if (!contentBundle.includes('createObjectURL') || !contentBundle.includes('Blob')) {
    throw new Error(`${target} content bundle does not contain the inline decoder worker bootstrap.`);
  }
  if (contentBundle.includes('/assets/qr-decoder.worker-')) {
    throw new Error(`${target} content bundle still references a cross-origin decoder worker asset.`);
  }
}

console.log(`Verified least-privilege manifests for ${targets.join(' and ')}.`);
