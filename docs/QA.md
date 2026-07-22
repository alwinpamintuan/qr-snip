# Quality assurance plan

This plan defines the automated and manual evidence expected for QR Snip changes and releases. Compatibility claims must point to an enforced test or a recorded manual result; planned coverage must not be described as implemented coverage.

## Automated gates

Run the fast development gate with:

```bash
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` performs strict TypeScript validation, deterministic Vitest unit tests, and typed locale-catalog validation. The slower image corpus stays outside the edit loop. Run the complete pre-submit and CI gate with:

```bash
pnpm check:full
```

`pnpm check:full` adds:

1. decoder accuracy and false-positive fixture-corpus validation;
2. Chromium and Firefox Manifest V3 production builds;
3. generated-manifest and inline-worker packaging assertions;
4. deterministic browser-harness generation and Firefox `web-ext` validation; and
5. Playwright tests for the real Chromium extension plus Chromium and Firefox application flows.

The manifest assertion requires exactly `activeTab`, `scripting`, and settings-only `storage`, no host permissions, no persistent content scripts, no external messaging, no web-accessible runtime assets, and a runtime content bundle no larger than 220,000 bytes. The size budget prevents worker-only decoder code from returning to the page-executed startup path. A production change must not be accepted based on the Chromium build alone.

Archive inspection, dependency review, SBOM generation, and store submission checks remain tracked in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Current validation status

The repository currently provides reproducible automated evidence for:

- 145 positive and 30 negative deterministic QR fixtures;
- QR versions 1, 5, 10, 20, and 40 with L, M, Q, and H error correction;
- normal, inverted, colored, 90° rotated, resampled, blurred, and partially occluded symbols;
- 1080p, 1440p, 4K, and 2× device-scale screen composites with explicit crop metadata;
- a corpus gate of at least 90% exact positive decodes and zero negative-corpus false positives;
- protocol rejection, Unicode edge whitespace, control characters, private destinations, punycode, credentials, unusual ports, display truncation, and runtime-message guards;
- successful Chromium and Firefox MV3 builds with only `activeTab`, `scripting`, and settings-only `storage`; and
- inline decoder-worker packaging with transferable RGBA buffers and no exposed worker asset.
- real Chromium action activation, capture/injection, Escape, and rapid reinvocation;
- Chromium and Firefox happy, suspicious-link, copy, explicit-open, retry, keyboard, focus-containment, long-string, and RTL flows;
- static image, canvas, paused-video poster, transformed element, hostile CSS, and DOM-mutation fixture surfaces; and
- light, dark, increased-contrast, narrow, and 200% text component-gallery screenshots generated only from synthetic content.

The following release evidence still requires a real browser and representative hardware:

- profile 4K selections and confirm page main-thread tasks stay below 100 ms;
- compare heap after the first and fifth repeated scan, targeting no more than 10% post-cleanup growth;
- cancel an active decode with Escape in current Chrome, Edge, Firefox, and Firefox ESR;
- repeat rapid reinvocation in Chrome, Edge, Firefox, and Firefox ESR outside the automated Chromium target;
- exercise restricted-page recovery messages on browser-owned pages and extension stores; and
- complete security-reviewer sign-off for the threat table and residual risks in [SECURITY.md](SECURITY.md).

Do not describe browser coverage, performance, memory behavior, or security review as complete until the result is recorded with browser and operating-system versions, commit SHA, reviewer, and date.

## Test ownership

| Concern | Primary automated evidence |
| --- | --- |
| Pointer and crop geometry | `tests/selection.test.ts` |
| RGBA validation and resource limits | `tests/decode-pipeline.test.ts` |
| QR compatibility and negative corpus | `tests/fixture-corpus.test.ts` |
| Payload normalization and protocol allow list | `tests/result.test.ts` |
| Link warning heuristics | `tests/link-security.test.ts` |
| Runtime message shape guards | `tests/messages.test.ts` |
| Typed locale registry and pseudo/RTL behavior | `tests/i18n.test.ts`, `scripts/assert-locales.mjs` |
| Keyboard movement and resize semantics | `tests/selection.test.ts`, `tests/keyboard-selection.test.ts` |
| Generated browser permissions and worker packaging | `scripts/assert-manifest.mjs` |
| Settings defaults, validation, and migration | `tests/settings.test.ts` |
| First-run education and options persistence | `e2e/tests/extension.spec.ts` |
| Result registry, structured summaries, and malformed fallback | `tests/result-interpreters.test.ts` |
| Chromium extension action/reinvocation and component states | `e2e/tests/extension.spec.ts` |
| Chromium/Firefox critical and accessibility flows | `e2e/tests/flow.spec.ts` |
| Hostile and mutating page surfaces | `e2e/tests/fixture-gallery.spec.ts` |

Add tests at the narrowest deterministic boundary. Browser behavior not represented faithfully by Vitest or the deterministic Playwright harness remains in the manual matrix.

## Phase 2 automated validation record

| Date | Platform | Engines | Commit | Result | Operator |
| --- | --- | --- | --- | --- | --- |
| 2026-07-22 | Windows | Playwright Chromium 149, Firefox 151 | `8f1bdb1` | Normal gate: 12/12 passed. Stress gate: 398/400 first attempts passed; one process crash per engine under four-worker load, 0.5% combined flake rate. | Codex implementation run |

The `web-ext` validator reports one Firefox Android compatibility warning because Firefox Android added `data_collection_permissions` after the declared desktop minimum. Android is not a supported target; desktop Firefox packaging has zero validator errors. The normal CI suite uses up to two retries for browser-process recovery and uploads only synthetic Playwright evidence on failure.

## Manual browser matrix

Test the current stable and previous stable where practical:

| Platform | Required browsers |
| --- | --- |
| Windows 11 | Chrome, Edge, Firefox, Firefox ESR |
| Current and previous macOS | Chrome, Edge, Firefox |
| Ubuntu LTS | Chrome or Chromium, Firefox |

Smoke-test Brave, Vivaldi, and Opera before major releases. Their toolbar behavior, shortcut settings, extension management, and store packaging may differ even though they consume the Chromium bundle.

Record the operating system, browser version, build target, commit SHA, fixture IDs, and result. Mark an untested combination explicitly rather than assuming parity.

## QR fixture coverage

The committed corpus in `tests/fixtures/qr/` currently contains 145 positive and 30 negative deterministic fixtures. Its enforced coverage includes:

- QR versions 1, 5, 10, 20, and 40;
- error correction L, M, Q, and H;
- normal, inverted, representative colored, 90° rotated, resampled, blurred, and partially occluded symbols;
- direct QR crops;
- 1080p, 1440p, 4K, and 2× device-scale screen composites; and
- deliberately invalid or non-QR images.

The gate requires at least 90% exact-payload success in the positive corpus and zero decoded results in the negative corpus.

Coverage still to add before promoting additional compatibility claims includes:

- 180° and 270° rotation, slight skew, and perspective distortion;
- invalid, reduced, and irregular quiet zones;
- JPEG/WebP artifacts and patterned backgrounds;
- rounded, dotted, gapped, gradient, logo, transparent, and decorated-eye styles;
- broader Unicode, Wi-Fi, vCard, calendar, and binary-like payloads; and
- combined transforms at several rendered sizes and display densities.

The post-1.0 styled-code corpus is specified in [ROADMAP.md](ROADMAP.md). Every fixture requires deterministic generation inputs or a documented redistributable source and license.

## Interaction checks

- Activate from the toolbar and configured shortcut.
- Drag from every corner direction.
- Begin or end at each viewport edge.
- Click without dragging and make a 19-pixel selection; both must be rejected.
- Retry after no result and scan another area after success.
- Activate twice rapidly and verify only the latest invocation remains usable.
- Reinject on the same document and verify one application/message-listener behavior.
- Scroll or resize between invocations.
- Test browser zoom at 50%, 80%, 100%, 125%, 175%, and 200%.
- Test Windows display scaling at 100%, 125%, 150%, and 200%.
- Pause a video on a QR code and verify protected-video limitation messaging when the capture is blank.
- Try browser settings, new-tab pages, extension stores, built-in PDF viewers, local files, and privileged Firefox pages.
- Switch tabs, reload, navigate, or close the tab during startup and decoding; verify clean recovery with no stale UI.
- Exercise ordinary HTTPS, each suspicious-link warning, email, phone, text, oversized text, and dangerous protocols.
- Confirm no result opens until an explicit action and that warned destinations say **Open anyway**.

## Accessibility checks

- Escape closes the selection and result states.
- The drag-first selection surface receives focus after activation; K or the compact keyboard text action enters keyboard mode, arrows move, Shift+Arrow resizes, Alt changes the step, and Enter scans.
- Selection geometry announcements are understandable and throttled with NVDA and VoiceOver.
- Result controls are reachable in a logical order and focus moves into the dialog.
- Tab and Shift+Tab remain contained within the result dialog, and retry returns focus to the active selection mode.
- Focus indicators remain visible on all surfaces.
- Screen-reader output is checked with NVDA on Firefox/Chrome and VoiceOver on Chrome/Firefox.
- Control targets are at least 44 × 44 CSS pixels.
- Text and controls meet documented WCAG AA contrast targets in light and dark modes.
- The result remains readable, scrollable, and operable at 200% text scaling.
- `prefers-contrast: more` strengthens boundaries.
- `prefers-reduced-motion` removes non-essential animation.
- Pointer capture works with mouse, pen, and touch emulation.

Keyboard-controlled selection is implemented and covered at the pure geometry and adapter boundaries. Do not claim complete WCAG 2.2 AA conformance until the screen-reader and supported-browser checks above are recorded manually.

## Performance and memory

Profile a production build on a representative mid-range machine. Record:

- action click to interactive overlay;
- main-thread time for image load, crop draw, and RGBA extraction;
- worker startup and each decode attempt;
- peak heap for 1080p, 1440p, 4K, and high-DPI captures;
- memory after five retry cycles and after `destroy()`;
- background-worker wake latency;
- content, worker, and total archive size; and
- cancellation time during an active decode.

Investigate a representative 500 × 500 decode above 300 ms, a page main-thread task above 100 ms, growth above 10% after repeated cleanup, or any resource-limit bypass. Keep additional preprocessing bounded and in a worker; do not trade away fixture accuracy through arbitrary downscaling.

## Security checks

Follow the full checklist in [SECURITY.md](SECURITY.md). At minimum, each release must confirm:

- decoded values use inactive text rendering;
- dangerous protocols fail in interpretation and at the background boundary;
- no preview, warning, or decode path triggers navigation;
- screenshots and payloads do not appear in logs or storage;
- runtime bundles contain no unreviewed network or analytics code;
- generated permissions match the documented set; and
- dependency and lockfile changes are understood.

## Release smoke test

1. Start from a clean clone and frozen dependency install.
2. Run `pnpm check:full`.
3. Load `.output/chrome-mv3/` in a supported Chromium browser.
4. Load `.output/firefox-mv3/manifest.json` as a Firefox temporary add-on.
5. Test one conventional URL, one suspicious URL, one text value, one inverted code, and one failed selection fixture.
6. Test Copy, allow-listed Open, Open anyway, Scan another, Try again, and Escape.
7. Confirm generated manifests and archives contain no unreviewed permission, remote code, source fixture, test, debug log, or secret.
8. Generate the Chromium and Firefox archives and inspect their contents.
9. Verify privacy, support, security-reporting, and store-listing material.
10. Test the signed Firefox artifact when signing is part of the release.
11. Record browser versions, commit SHA, artifact hashes, reviewer, failures, accepted residual risk, and date.
