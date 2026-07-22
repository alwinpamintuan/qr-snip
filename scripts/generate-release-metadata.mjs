import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import packageMetadata from '../package.json' with { type: 'json' };

const releaseDirectory = resolve('.output', 'releases');
await mkdir(releaseDirectory, { recursive: true });
const commit = git('rev-parse', 'HEAD');
const tag = process.env.GITHUB_REF_NAME || `v${packageMetadata.version}`;
if (process.env.GITHUB_REF_TYPE === 'tag' && tag !== `v${packageMetadata.version}`) {
  throw new Error(`Tag ${tag} does not match package version ${packageMetadata.version}.`);
}

const changelog = await readFile(resolve('CHANGELOG.md'), 'utf8');
const notesBody = changelogSection(changelog, packageMetadata.version)
  || changelogSection(changelog, 'Unreleased')
  || 'See CHANGELOG.md for release details.';
const releaseNotes = `# QR Snip ${tag}\n\n${notesBody}\n\n## Release assurances\n\n- Chromium and Firefox Manifest V3 packages are built from commit \`${commit}\`.\n- Processing remains local and preview-first.\n- Reviewed permissions: \`activeTab\`, \`scripting\`, and settings-only \`storage\`.\n- Verify downloads with \`SHA256SUMS.txt\` and the GitHub artifact attestation.\n`;
await writeFile(join(releaseDirectory, 'RELEASE_NOTES.md'), releaseNotes);

const artifactFiles = (await readdir(releaseDirectory)).filter((name) => name.endsWith('.zip') || name === 'sbom.cdx.json').sort();
const subjects = await Promise.all(artifactFiles.map(async (name) => ({
  name,
  sha256: hash(await readFile(join(releaseDirectory, name))),
})));
const provenance = {
  schemaVersion: 1,
  name: packageMetadata.name,
  version: packageMetadata.version,
  source: packageMetadata.repository.url,
  commit,
  tag,
  sourceDateEpoch: Number(git('show', '-s', '--format=%ct', 'HEAD')),
  builder: process.env.GITHUB_WORKFLOW_REF || 'local',
  runId: process.env.GITHUB_RUN_ID || null,
  subjects,
};
await writeFile(join(releaseDirectory, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);

const checksumFiles = (await readdir(releaseDirectory)).filter((name) => name !== 'SHA256SUMS.txt').sort();
const checksums = await Promise.all(checksumFiles.map(async (name) => `${hash(await readFile(join(releaseDirectory, name)))}  ${basename(name)}`));
await writeFile(join(releaseDirectory, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`);
console.log(`Generated release notes, provenance metadata, and ${checksums.length} checksums.`);

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function changelogSection(changelog, heading) {
  const marker = `## [${heading}]`;
  const start = changelog.indexOf(marker);
  if (start < 0) return '';
  const next = changelog.indexOf('\n## [', start + marker.length);
  return changelog.slice(start + marker.length, next < 0 ? undefined : next).trim();
}
