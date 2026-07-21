# Quality assurance plan

This plan defines the automated and manual evidence expected for QR Snip changes and releases. Compatibility claims must point to an enforced test or a recorded manual result; planned coverage must not be described as implemented coverage.

## Automated gates

Run the complete local gate with:

```bash
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` performs:

1. strict TypeScript validation;
2. all Vitest unit and fixture tests;
3. a Chromium Manifest V3 production build;
4. a Firefox Manifest V3 production build; and
5. generated-manifest and inline-worker packaging assertions.

The manifest assertion requires exactly `activeTab` and `scripting`, no host permissions, no persistent content scripts, no external messaging, and no web-accessible runtime assets. A production change must not be accepted based on the Chromium build alone.

Browser end-to-end automation, bundle-size budgets, archive inspection, dependency review, SBOM generation, and store submission checks are tracked in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and should be added to the required gate when implemented.

## Test ownership

| Concern | Primary automated evidence |
| --- | --- |
| Pointer and crop geometry | `tests/selection.test.ts` |
| RGBA validation and resource limits | `tests/decode-pipeline.test.ts` |
| QR compatibility and negative corpus | `tests/fixture-corpus.test.ts` |
| Payload normalization and protocol allow list | `tests/result.test.ts` |
| Link warning heuristics | `tests/link-security.test.ts` |
| Runtime message shape guards | `tests/messages.test.ts` |
| Generated browser permissions and worker packaging | `scripts/assert-manifest.mjs` |

Add tests at the narrowest deterministic boundary. Browser behavior that cannot be represented faithfully in Vitest belongs in the manual matrix until browser automation covers it.

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
- Result controls are reachable in a logical order and focus moves into the dialog.
- Focus indicators remain visible on all surfaces.
- Screen-reader output is checked with NVDA on Firefox/Chrome and VoiceOver on Chrome/Firefox.
- Control targets are at least 44 × 44 CSS pixels.
- Text and controls meet documented WCAG AA contrast targets in light and dark modes.
- The result remains readable, scrollable, and operable at 200% text scaling.
- `prefers-contrast: more` strengthens boundaries.
- `prefers-reduced-motion` removes non-essential animation.
- Pointer capture works with mouse, pen, and touch emulation.

Pointer dragging is currently required to define the selection. Do not claim complete WCAG 2.2 AA operability until keyboard-controlled selection is implemented and tested.

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
- dangerous protocols fail in classification and at the background boundary;
- no preview, warning, or decode path triggers navigation;
- screenshots and payloads do not appear in logs or storage;
- runtime bundles contain no unreviewed network or analytics code;
- generated permissions match the documented set; and
- dependency and lockfile changes are understood.

## Release smoke test

1. Start from a clean clone and frozen dependency install.
2. Run `pnpm check`.
3. Load `.output/chrome-mv3/` in a supported Chromium browser.
4. Load `.output/firefox-mv3/manifest.json` as a Firefox temporary add-on.
5. Test one conventional URL, one suspicious URL, one text value, one inverted code, and one failed selection fixture.
6. Test Copy, allow-listed Open, Open anyway, Scan another, Try again, and Escape.
7. Confirm generated manifests and archives contain no unreviewed permission, remote code, source fixture, test, debug log, or secret.
8. Generate the Chromium and Firefox archives and inspect their contents.
9. Verify privacy, support, security-reporting, and store-listing material.
10. Test the signed Firefox artifact when signing is part of the release.
11. Record browser versions, commit SHA, artifact hashes, reviewer, failures, accepted residual risk, and date.
