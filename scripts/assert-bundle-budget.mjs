import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const targets = ['chrome-mv3', 'firefox-mv3'];
const budgets = {
  'content-scripts/snipper.js': 220_000,
  'background.js': 40_000,
  total: 325_000,
};

for (const target of targets) {
  const root = resolve('.output', target);
  const files = await listFiles(root);
  const sizes = new Map(await Promise.all(files.map(async (file) => [
    relative(root, file).replaceAll('\\', '/'),
    (await stat(file)).size,
  ])));
  for (const [path, budget] of Object.entries(budgets)) {
    const actual = path === 'total'
      ? [...sizes.values()].reduce((sum, size) => sum + size, 0)
      : sizes.get(path);
    if (actual === undefined) throw new Error(`${target} is missing budgeted asset ${path}.`);
    if (actual > budget) throw new Error(`${target} ${path} is ${actual} bytes; budget is ${budget}.`);
  }
  const sourceMaps = [...sizes.keys()].filter((path) => path.endsWith('.map'));
  if (sourceMaps.length > 0) throw new Error(`${target} contains source maps: ${sourceMaps.join(', ')}`);
  console.log(`${target}: ${sizes.size} files, ${[...sizes.values()].reduce((sum, size) => sum + size, 0)} bytes.`);
}

async function listFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}
