import { createRequire } from 'node:module';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import packageMetadata from '../package.json' with { type: 'json' };

const releaseDirectory = resolve('.output', 'releases');
const components = new Map();
const dependencyGraph = new Map();

for (const dependency of Object.keys(packageMetadata.dependencies ?? {}).sort()) {
  await collectPackage(await realpath(resolve('node_modules', dependency, 'package.json')));
}

const rootRef = componentRef(packageMetadata.name, packageMetadata.version);
const timestamp = new Date(releaseEpoch() * 1000).toISOString();
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: {
    timestamp,
    tools: [{ vendor: 'QR Snip', name: 'generate-sbom.mjs', version: packageMetadata.version }],
    component: { type: 'application', name: packageMetadata.name, version: packageMetadata.version, 'bom-ref': rootRef },
  },
  components: [...components.values()].sort((a, b) => a['bom-ref'].localeCompare(b['bom-ref'])),
  dependencies: [
    { ref: rootRef, dependsOn: Object.keys(packageMetadata.dependencies ?? {}).sort().map((name) => {
      const component = [...components.values()].find((candidate) => candidate.name === name);
      if (!component) throw new Error(`SBOM component missing for ${name}.`);
      return component['bom-ref'];
    }) },
    ...[...dependencyGraph.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ref, dependencies]) => ({
      ref,
      dependsOn: [...dependencies].sort(),
    })),
  ],
};

await mkdir(releaseDirectory, { recursive: true });
await writeFile(join(releaseDirectory, 'sbom.cdx.json'), `${JSON.stringify(sbom, null, 2)}\n`);
console.log(`Generated CycloneDX SBOM with ${components.size} runtime components.`);

async function collectPackage(packageJsonPath) {
  const metadata = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const ref = componentRef(metadata.name, metadata.version);
  if (components.has(ref)) return ref;
  components.set(ref, {
    type: 'library',
    name: metadata.name,
    version: metadata.version,
    'bom-ref': ref,
    purl: ref,
    ...(metadata.license ? { licenses: [{ license: { id: metadata.license } }] } : {}),
  });
  const childRefs = new Set();
  dependencyGraph.set(ref, childRefs);
  const requireFromPackage = createRequire(packageJsonPath);
  for (const dependency of Object.keys(metadata.dependencies ?? {}).sort()) {
    let childPath;
    try {
      childPath = requireFromPackage.resolve(`${dependency}/package.json`);
    } catch {
      const entry = requireFromPackage.resolve(dependency);
      childPath = await findPackageJson(dirname(entry));
    }
    childRefs.add(await collectPackage(await realpath(childPath)));
  }
  return ref;
}

async function findPackageJson(start) {
  let directory = start;
  while (directory !== dirname(directory)) {
    const candidate = join(directory, 'package.json');
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      directory = dirname(directory);
    }
  }
  throw new Error(`Could not resolve package metadata from ${start}.`);
}

function componentRef(name, version) {
  return `pkg:npm/${name.replace('@', '%40')}@${version}`;
}

function releaseEpoch() {
  const configured = Number(process.env.SOURCE_DATE_EPOCH);
  if (Number.isInteger(configured) && configured > 0) return configured;
  return Number(execFileSync('git', ['show', '-s', '--format=%ct', 'HEAD'], { encoding: 'utf8' }).trim());
}
