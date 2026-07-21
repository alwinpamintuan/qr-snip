# QR Snip

QR Snip is a privacy-first browser extension for selecting and decoding a QR code anywhere in the visible browser tab. It targets Chromium browsers and Firefox from one TypeScript codebase and uses a Material 3 Expressive visual language.

The repository contains a functional MVP foundation: toolbar/shortcut activation, one-time screen capture, a snipping overlay, local QR decoding, safe result classification, copy/open actions, unit tests, and separate Chrome/Firefox builds.

## Product principles

- **One gesture to start.** Click the toolbar action or press `Ctrl+Shift+Q` (`Command+Shift+Q` on macOS).
- **No persistent browsing access.** `activeTab` grants temporary access only after the user invokes QR Snip.
- **Local by default.** Screenshots and QR payloads stay in memory and are never uploaded or persisted.
- **Safe actions.** Only `http`, `https`, `mailto`, and `tel` payloads can be opened. Everything else remains copyable text.
- **Expressive, not distracting.** Shape, color, hierarchy, and short motion cues follow Material 3 Expressive ideas while the page content remains the focus.

## Quick start

Prerequisites: Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

WXT opens a Chromium development profile with the unpacked extension installed. For Firefox:

```bash
pnpm dev:firefox
```

Build both targets and run all automated checks:

```bash
pnpm check
```

Generated extension directories are:

- `.output/chrome-mv3/`
- `.output/firefox-mv3/`

For manual loading, use `chrome://extensions` → **Developer mode** → **Load unpacked** for Chromium. In Firefox, use `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** and select the generated `manifest.json`.

## Repository map

```text
entrypoints/
  background.ts          Extension coordinator and privileged browser APIs
  snipper.content.ts     Runtime-injected selection and result experience
src/
  core/                  Browser-agnostic messages, geometry, decoding, safety
  ui/                    Material 3 Expressive tokens, components, and icons
tests/                   Fast unit tests for geometry and result safety
docs/
  PRODUCT_SPEC.md        Scope, UX states, requirements, and success measures
  ARCHITECTURE.md        Runtime boundaries, data flow, permissions, decisions
  IMPLEMENTATION_PLAN.md Detailed phased backlog and acceptance criteria
  PHASE1_VALIDATION.md   Automated evidence and manual alpha sign-off checklist
  SECURITY.md            Threat model, preview policy, and release review
  QA.md                  Browser, accessibility, performance, and release matrix
```

## Current MVP flow

1. The toolbar action grants temporary `activeTab` access.
2. The background captures the visible tab before any overlay is drawn.
3. A runtime-only content script is injected into that tab.
4. The screenshot is rendered behind a style-isolated snipping UI.
5. CSS selection coordinates are mapped to captured image pixels, including display scaling and page zoom.
6. `jsQR` decodes the selected pixels locally, with a second enlarged pass for small codes.
7. The result is classified and rendered as a preview with copy, retry, and protocol-limited open actions.
8. Suspicious links show their warning signals directly in the preview and use an explicit “Open anyway” action.
9. Closing the overlay releases all in-memory screenshot references.

## QR design compatibility

QR Snip decodes QR symbols from pixels, so it is not tied to a particular QR generator or application. Compatibility depends on whether the finished design still preserves enough of the QR structure, contrast, resolution, and error-correction data for the decoder to recover it.

“Tested” below means the design category is represented in the maintained automated fixture corpus; it is not a guarantee that every image from every generator will decode.

| Compatibility | QR design or condition |
| --- | --- |
| **Tested** | Standard square-module QR codes; normal and inverted colors; representative high-contrast brand colors; 90° rotation; moderate resampling, blur, and partial occlusion; QR versions 1, 5, 10, 20, and 40; error correction L, M, Q, and H; 1080p, 1440p, 4K, and high-DPI screen composites |
| **Best effort** | Rounded, dotted, connected, or gapped modules; gradients and multicolor designs; transparent backgrounds; small centered logos; decorated finder “eyes”; perspective/skew; stronger compression; QR codes captured from paused video |
| **Not supported** | Micro QR, Data Matrix, Aztec, PDF417, or 1D barcodes; reliably choosing among multiple QR codes in one selection; severely cropped or missing finder patterns; logos/decoration that cover more data than error correction can recover; very low-contrast or extremely small codes |

Styled QR codes are inherently less predictable across readers. Even QR-generation libraries that support rounded modules, gradients, and embedded images warn that styled output is not guaranteed to work with every scanner and recommend high error correction for embedded images. See the [python-qrcode styled image guidance](https://github.com/lincolnloop/python-qrcode#styled-image).

For the best result:

- Select one QR code at a time, including the complete code and a small border around it.
- Keep all three large corner finder patterns fully visible.
- If the code is small, zoom the page before invoking QR Snip.
- Pause animated content or video on its sharpest frame.
- Prefer strong light/dark contrast; color hue matters less than luminance contrast.
- For logo QR codes, use a small centered logo and a generator configured for high error correction.
- Treat a failed styled-code scan as a compatibility failure, not proof that the QR payload is invalid.

The decoder is [`jsQR`](https://github.com/cozmo/jsQR), configured to try both normal and inverted luminance. The repository currently gates releases against 145 positive and 30 negative deterministic fixtures, requiring at least a 90% positive decode rate and zero false positives. See [docs/PHASE1_VALIDATION.md](docs/PHASE1_VALIDATION.md) for the measured scope and [tests/fixtures/qr/manifest.json](tests/fixtures/qr/manifest.json) for the source-of-truth corpus.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run a Chromium development build with HMR |
| `pnpm dev:firefox` | Run a Firefox MV3 development build |
| `pnpm typecheck` | Strict TypeScript validation |
| `pnpm test` | Unit test suite |
| `pnpm build:all` | Production builds for Chromium and Firefox |
| `pnpm zip` | Package the Chromium store artifact |
| `pnpm zip:firefox` | Package the Firefox AMO artifact |
| `pnpm check` | Typecheck, test, and build both targets |

## Known platform limitations

- Browser-owned pages such as `chrome://`, `edge://`, extension stores, and some privileged Firefox pages block script injection. QR Snip shows a temporary action error badge on those pages.
- `captureVisibleTab` captures the visible viewport, not content outside the scroll position.
- Protected video/DRM surfaces may be blank in browser captures.
- A QR code must have enough pixels and most of its quiet zone visible. The UI recommends retrying with a wider selection.
- The browser reserves or rejects some keyboard shortcuts. Users can customize them in the browser extension shortcut settings.

## Developer handoff

Start with [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), then read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The ordered backlog, exact implementation notes, and definition of done are in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). Do not add persistent host permissions to solve a convenience problem; preserve the explicit-user-gesture model unless the product requirement is deliberately changed and reviewed.
