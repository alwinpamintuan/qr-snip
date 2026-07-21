# Quality assurance plan

## Automated gates

Every pull request should run:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm build:firefox
```

Add bundle-size reporting and browser E2E tests in Phase 2 of the implementation plan. A production branch must not rely only on the Chromium build.

## Manual browser matrix

Test the current stable and the previous stable where practical:

| Platform | Browsers |
| --- | --- |
| Windows 11 | Chrome, Edge, Firefox, Firefox ESR |
| macOS current/previous | Chrome, Edge, Firefox |
| Ubuntu LTS | Chrome/Chromium, Firefox |

Smoke-test Brave, Vivaldi, and Opera before major releases. Their extension stores and toolbar behavior can differ even when the bundle is Chromium-compatible.

## QR fixture matrix

Maintain redistributable fixtures in `tests/fixtures/qr/` with a manifest containing expected payload, generation parameters, and license/source. Cover:

- versions 1, 5, 10, 20, and 40;
- error correction L, M, Q, and H;
- black-on-white, inverted, and representative brand colors;
- 64 px through 1200 px rendered sizes;
- 0°, 90°, 180°, 270°, slight skew, and perspective distortion;
- quiet zone sizes from invalid/no zone through the recommended four modules;
- JPEG artifacts, blur, screen glare simulation, and partial occlusion;
- URL, Unicode text, email, phone, Wi-Fi, vCard, and binary-like payloads;
- deliberately invalid/non-QR images.

Each fixture must be tested as a direct crop and inside 1080p, 1440p, 4K, and high-DPI composite screenshots.

## Interaction checks

- Drag from every corner direction.
- Begin or end at each viewport edge.
- Click without dragging and make a 19 px selection.
- Retry after no result; scan another after success.
- Activate twice on the same page and verify there is one overlay/listener behavior.
- Scroll or resize between invocations.
- Test at browser zoom 50%, 80%, 100%, 125%, 175%, and 200%.
- Test Windows display scaling 100%, 125%, 150%, and 200%.
- Pause a video on a QR code; verify protected video limitation messaging if blank.
- Try browser settings, new tab, extension store, PDF viewer, local files, and privileged Firefox pages.
- Switch tab or navigate while the overlay is open; verify clean failure/no stale UI.

## Accessibility checks

- Keyboard: Escape closes; all result controls are reachable in a logical order.
- Screen readers: NVDA + Firefox/Chrome, VoiceOver + Chrome/Firefox.
- Focus is visible and moves into the result dialog.
- Control target sizes are at least 44 × 44 CSS px.
- Validate normal/dark semantic color pairs at WCAG AA for text.
- With 200% text scaling, the result remains operable and scrollable.
- Increased contrast strengthens boundaries.
- Reduced motion removes meaningful animation.
- Pointer capture works with mouse, pen, and touch emulation.

The drag-only selection gesture needs a keyboard alternative before claiming full WCAG 2.2 AA conformance. Phase 3 adds a movable/resizable keyboard selection rectangle.

## Performance and memory

Profile on a mid-range machine with DevTools:

- time from action click to interactive overlay;
- time per decode pass at representative crop sizes;
- peak heap for a 4K capture at 200% display scale;
- memory after five retry cycles and after `destroy()`;
- background worker wake/start latency;
- content bundle compressed/uncompressed size.

Investigate if decode exceeds 300 ms or causes a long task over 100 ms. The recommended mitigation is a dedicated worker with transferable pixel buffers, not arbitrary downscaling that harms decode accuracy.

## Release smoke test

1. Start from a clean clone and frozen install.
2. Run `pnpm check`.
3. Load each generated unpacked target into its browser.
4. Test one URL, one text, one inverted, and one failed selection fixture.
5. Confirm the generated manifest has only `activeTab` and `scripting` permissions.
6. Search built output for remote URLs and debugging logs.
7. Generate store archives and inspect their contents.
8. Verify privacy policy/support links and store screenshots.
9. Sign Firefox output and test the signed artifact.
10. Record browser versions, commit SHA, artifact hashes, and tester.

