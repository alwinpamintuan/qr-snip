import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const releaseDirectory = resolve('.output', 'releases');
const archiveNames = (await readdir(releaseDirectory)).filter((name) => name.endsWith('.zip')).sort();
if (archiveNames.length !== 3) throw new Error(`Expected three release archives, found ${archiveNames.length}.`);

for (const archiveName of archiveNames) {
  const archive = await readFile(join(releaseDirectory, archiveName));
  const entries = readEntries(archive);
  assertSafeNames(archiveName, entries);
  if (!archiveName.includes('-source.zip')) assertStoreArchive(archiveName, entries);
  assertNoSecrets(archiveName, archive, entries);
  console.log(`${archiveName}: ${entries.length} inspected entries.`);
}

const checksumLines = (await readFile(join(releaseDirectory, 'SHA256SUMS.txt'), 'utf8')).trim().split('\n');
for (const line of checksumLines) {
  const match = /^([a-f0-9]{64})  (.+)$/u.exec(line);
  if (!match) throw new Error(`Malformed checksum line: ${line}`);
  const actual = createHash('sha256').update(await readFile(join(releaseDirectory, match[2]))).digest('hex');
  if (actual !== match[1]) throw new Error(`Checksum mismatch for ${match[2]}.`);
}
console.log(`Verified ${checksumLines.length} release checksums.`);

function assertSafeNames(archiveName, entries) {
  for (const { name } of entries) {
    if (name.startsWith('/') || name.includes('..') || name.includes('\\')) {
      throw new Error(`${archiveName} contains unsafe path ${name}.`);
    }
    if (/(^|\/)(\.env(?:\.|$)|.*\.(?:pem|key|p12|pfx)|id_rsa|credentials?\.json)$/iu.test(name)) {
      throw new Error(`${archiveName} contains a secret-like filename ${name}.`);
    }
  }
}

function assertStoreArchive(archiveName, entries) {
  const names = entries.map(({ name }) => name);
  if (!names.includes('manifest.json') || !names.includes('background.js') || !names.includes('content-scripts/snipper.js')) {
    throw new Error(`${archiveName} is missing required runtime files.`);
  }
  const forbidden = names.filter((name) => /(^|\/)(tests?|e2e|src|docs|scripts|node_modules|\.github)(\/|$)|\.(?:ts|tsx|map)$/iu.test(name));
  if (forbidden.length > 0) throw new Error(`${archiveName} contains development files: ${forbidden.join(', ')}`);
}

function assertNoSecrets(archiveName, archive, entries) {
  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\bgh[oprsu]_[A-Za-z0-9_]{30,}\b/u,
    /\bAKIA[0-9A-Z]{16}\b/u,
  ];
  for (const entry of entries) {
    if (entry.uncompressedSize > 2_000_000) continue;
    const content = entryContent(archive, entry).toString('utf8');
    if (secretPatterns.some((pattern) => pattern.test(content))) {
      throw new Error(`${archiveName} contains secret-like content in ${entry.name}.`);
    }
  }
}

function readEntries(archive) {
  const endOffset = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endOffset < 0) throw new Error('ZIP end record is missing.');
  const count = archive.readUInt16LE(endOffset + 10);
  let offset = archive.readUInt32LE(endOffset + 16);
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP central directory.');
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    entries.push({
      name: archive.subarray(offset + 46, offset + 46 + nameLength).toString('utf8'),
      compression: archive.readUInt16LE(offset + 10),
      compressedSize: archive.readUInt32LE(offset + 20),
      uncompressedSize: archive.readUInt32LE(offset + 24),
      localOffset: archive.readUInt32LE(offset + 42),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function entryContent(archive, entry) {
  const nameLength = archive.readUInt16LE(entry.localOffset + 26);
  const extraLength = archive.readUInt16LE(entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = archive.subarray(start, start + entry.compressedSize);
  if (entry.compression === 0) return compressed;
  if (entry.compression === 8) return inflateRawSync(compressed);
  throw new Error(`Unsupported ZIP compression method ${entry.compression}.`);
}
