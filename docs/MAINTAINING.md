# Maintainer guide

This guide covers repository administration and releases that cannot be completed through source changes alone.

## GitHub About section

Open the repository page, select the gear beside **About**, and use:

**Description**

> Privacy-first browser extension to snip, decode, and safely preview on-screen QR codes locally. Supports Chromium and Firefox.

Leave **Website** blank until a store listing or product page exists. When both browser stores are available, prefer a small landing page that links to each listing rather than choosing one store as the canonical project URL.

Add these topics:

```text
qr-code
qr-scanner
browser-extension
webextensions
chromium-extension
firefox-addon
manifest-v3
typescript
wxt
privacy
security
local-first
material-design-3
brave-browser
screen-capture
```

Enable **Releases** in the About section. Leave **Packages** and **Deployments** disabled unless the project later publishes a package or hosted application.

## Social preview

Export `docs/assets/github-social-preview.svg` to a 1280 × 640 PNG, then upload the PNG under **Settings → General → Social preview**. Keep the committed SVG as the editable source; GitHub's uploader accepts PNG, JPG, or GIF rather than SVG.

After uploading, share the repository URL in a private message or preview tool and confirm the title and artwork remain legible against both light and dark surrounding interfaces.

## Repository labels

Keep GitHub's useful default labels and add:

| Label | Purpose |
| --- | --- |
| `accessibility` | Keyboard, screen-reader, contrast, text-scaling, or motion work |
| `breaking-change` | Change requiring migration or a major-version note |
| `browser-chromium` | Chrome, Edge, Brave, Vivaldi, or Opera behavior |
| `browser-firefox` | Firefox or Firefox ESR behavior |
| `dependencies` | Dependency and lockfile updates |
| `github-actions` | Workflow and automation updates |
| `good first issue` | Small, bounded contribution with clear acceptance criteria |
| `help wanted` | Maintainer-reviewed work ready for contribution |
| `qr-compatibility` | Fixture-backed decoder compatibility work |
| `security` | Security hardening that is safe to discuss publicly |
| `skip-changelog` | Maintenance change omitted from generated release notes |

The issue forms use the standard `bug` and `enhancement` labels. Dependabot and release-note grouping additionally expect `dependencies`, `github-actions`, `breaking-change`, `security`, and `skip-changelog`.

## Security settings

Under **Settings → Security and analysis**:

1. Enable Dependabot alerts.
2. Enable Dependabot security updates.
3. Enable private vulnerability reporting.
4. Enable secret scanning and push protection when GitHub offers them for the repository.
5. Watch the repository for security-alert notifications.

Private reporting is required because `.github/SECURITY.md`, `SUPPORT.md`, the issue-form contact link, and the Code of Conduct route sensitive reports to the repository advisory form.

## Actions settings

Under **Settings → Actions → General**:

1. Allow actions from GitHub and verified creators used by the committed workflows.
2. Confirm workflow permissions allow the tagged release workflow to request `contents: write`.
3. Keep pull-request workflows from forks on the default restricted token and approval policy.

The CI workflow runs `pnpm check:full` on Ubuntu and Windows. The release workflow runs only for `v*` tags, rebuilds and verifies the source, creates both browser archives and SHA-256 checksums, and opens a draft GitHub release. It never publishes the draft automatically.

## Main-branch ruleset

After the first CI run succeeds, create a ruleset targeting `main`:

- block force pushes and branch deletion;
- require a pull request before merging when more than one maintainer is active;
- require the `Quality (ubuntu-latest)` and `Quality (windows-latest)` status checks;
- require branches to be up to date before merging;
- dismiss stale approvals after new commits when review is required; and
- allow an explicit maintainer bypass for repository recovery.

A solo maintainer can initially allow direct pushes while still requiring the two CI checks. Tighten review requirements when another maintainer joins.

## Release preparation

GitHub releases distribute unsigned development archives until browser-store signing and publication are established. Chromium users unzip and load the Chromium directory as an unpacked extension. Regular Firefox installs generally require a signed package; the unsigned Firefox archive is for temporary loading and review.

Before tagging a release:

1. Choose a semantic version and update `package.json`; `wxt.config.ts` reads that version into both generated manifests.
2. Move relevant entries from `[Unreleased]` in `CHANGELOG.md` into a dated version section and restore an empty `[Unreleased]` section.
3. Run `pnpm install --frozen-lockfile` and `pnpm check:full` from a clean checkout.
4. Complete the manual browser, accessibility, performance, memory, and security checks in [QA.md](QA.md).
5. Load the production Chromium build in Chrome or Brave and the Firefox build as a temporary add-on.
6. Confirm the generated manifests, version, icon assets, permissions, and archive contents.
7. Commit the release preparation and ensure CI is green.

Create and push an annotated tag:

```bash
git tag -a v0.1.0 -m "QR Snip v0.1.0"
git push origin v0.1.0
```

The tag workflow creates a draft release containing the Chromium archive, Firefox archive, Firefox source archive required for review, and `SHA256SUMS.txt`. Review the generated notes, installation wording, file names, checksums, and known limitations. Mark `v0.x` releases as pre-releases and publish the draft manually when satisfied.

## Release notes checklist

Each release should state:

- supported browser targets and minimum Firefox version;
- headline features and meaningful fixes;
- tested QR compatibility and known unsupported formats;
- `activeTab`, `scripting`, and settings-only `storage` permissions;
- local-only screenshot and payload behavior;
- unpacked Chromium and temporary Firefox installation steps;
- security-relevant changes;
- known limitations and outstanding manual validation; and
- a link to the full changelog and SHA-256 checksums.

Do not describe unsigned archives as store-ready or one-click installers.

## Store publication

When store listings exist:

- add verified Chrome Web Store and Firefox Add-ons links to the README;
- replace the About website with a neutral landing page if both stores are supported;
- record store artifact hashes against the corresponding Git tag;
- update `SUPPORT.md` with the supported release channels; and
- keep store privacy disclosures aligned with `docs/SECURITY.md` and the generated manifest.
