import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import packageMetadata from '../package.json' with { type: 'json' };

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

const releaseDirectory = resolve('.output', 'releases');
const sourceEpoch = releaseEpoch();
await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(releaseDirectory, { recursive: true });

const archives = [
  {
    name: `qr-snip-${packageMetadata.version}-chrome-mv3.zip`,
    files: await directoryFiles(resolve('.output', 'chrome-mv3')),
  },
  {
    name: `qr-snip-${packageMetadata.version}-firefox-mv3.zip`,
    files: await directoryFiles(resolve('.output', 'firefox-mv3')),
  },
  {
    name: `qr-snip-${packageMetadata.version}-firefox-source.zip`,
    files: trackedSourceFiles(),
  },
];

for (const archive of archives) {
  const output = join(releaseDirectory, archive.name);
  await writeFile(output, await createZip(archive.files, sourceEpoch));
  console.log(`Created ${relative(process.cwd(), output)} (${archive.files.length} files).`);
}

async function directoryFiles(root) {
  const absoluteFiles = await walk(root);
  return absoluteFiles.map((path) => ({ path, name: relative(root, path).replaceAll('\\', '/') }));
}

function trackedSourceFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
  return output.split('\0').filter(Boolean).sort().map((name) => ({ path: resolve(name), name }));
}

async function walk(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

async function createZip(files, epoch) {
  const localRecords = [];
  const centralRecords = [];
  let offset = 0;
  const { date, time } = dosTimestamp(epoch);

  for (const file of files) {
    const data = await readFile(file.path);
    const compressed = deflateRawSync(data, { level: 9 });
    const name = Buffer.from(file.name, 'utf8');
    const checksum = crc32(data);
    const mode = (await stat(file.path)).mode & 0xffff;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localRecords.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE((mode << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralRecords.push(central, name);
    offset += local.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralRecords);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localRecords, centralDirectory, end]);
}

function releaseEpoch() {
  const configured = Number(process.env.SOURCE_DATE_EPOCH);
  if (Number.isInteger(configured) && configured > 0) return configured;
  try {
    return Number(execFileSync('git', ['show', '-s', '--format=%ct', 'HEAD'], { encoding: 'utf8' }).trim());
  } catch {
    return 315532800;
  }
}

function dosTimestamp(epoch) {
  const date = new Date(Math.max(epoch * 1000, Date.UTC(1980, 0, 1)));
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    date: ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
}

function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
