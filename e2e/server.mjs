import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const types = new Map([
  ['.css', 'text/css'], ['.html', 'text/html'], ['.js', 'text/javascript'],
  ['.json', 'application/json'], ['.png', 'image/png'], ['.svg', 'image/svg+xml'],
]);

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const requestedPath = url.pathname.startsWith('/harness/')
    ? join('.output/e2e-harness', url.pathname.slice('/harness/'.length))
    : url.pathname.slice(1);
  const relativePath = normalize(requestedPath || 'e2e/fixtures/gallery.html');
  const absolutePath = resolve(root, relativePath);
  const rootRelativePath = relative(root, absolutePath);
  if (rootRelativePath.startsWith('..') || rootRelativePath.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const info = await stat(absolutePath);
    const filePath = info.isDirectory() ? join(absolutePath, 'index.html') : absolutePath;
    response.writeHead(200, {
      'content-type': `${types.get(extname(filePath)) ?? 'application/octet-stream'}; charset=utf-8`,
      'cache-control': 'no-store',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
}).listen(4174, '127.0.0.1', () => console.log('QR Snip fixtures: http://127.0.0.1:4174'));
