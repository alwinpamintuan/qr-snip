# Detailed implementation plan

This is the ordered handoff plan from the current functional foundation to a store-ready release. Each task names the implementation approach and acceptance criteria so a developer can pick it up without re-deriving the architecture.

## Current baseline (completed)

- WXT/TypeScript repository and MV3 build scripts for Chromium and Firefox
- Explicit toolbar/shortcut activation under `activeTab`
- Runtime-only content script injection
- Frozen-screen drag selector with zoom/DPI-aware crop mapping
- Local `jsQR` decoder with inverted-code support and a 2× small-code retry
- Preview-first result card; no automatic navigation
- Protocol allow list enforced in content and background
- Link-risk assessment rendered directly in suspicious-destination previews
- Material 3 Expressive light/dark/high-contrast/reduced-motion UI
- Pure unit tests for geometry, classification, and link warnings
- Product, architecture, security, and QA documentation

## Engineering principles

Apply these rules to every phase:

- **Single responsibility:** browser coordination, selection gestures, presentation, decoding, geometry, and security policy live in separate modules.
- **Open/closed:** add decoders or result interpreters behind interfaces/registries rather than expanding one switch-heavy controller.
- **Liskov substitution:** test adapters against shared contracts; a replacement decoder must preserve outcome semantics.
- **Interface segregation:** pass narrow callbacks and data types, not the browser API or a god-object service.
- **Dependency inversion:** application orchestration depends on `SelectionDecoder` and view contracts; privileged APIs stay at entrypoints/adapters.
- **DRY:** security validation has one shared implementation, design values use tokens, and repeated test cases use fixtures/tables.
- **Self-documenting code:** prefer exact domain names (`snapshotDimensions`, `requiresConfirmation`, `toPixelCrop`), discriminated unions, small functions, and explicit return types. Comments explain non-obvious constraints or tradeoffs, not syntax.
- **No speculative abstraction:** extract a reusable layer only when it expresses a real boundary or removes proven duplication.

## Phase 1 — harden the MVP

Target: internal alpha.

### 1.1 Decoder fixture corpus

Implementation:

1. Create `tests/fixtures/qr/manifest.json` with fixture path, expected payload, QR version, error correction, quiet zone, transform, and source/license.
2. Generate synthetic fixtures with a pinned development tool; commit deterministic outputs or generation seeds.
3. Add composited screen fixtures at 1080p, 1440p, and 4K with device-scale variants.
4. Extract the canvas-independent decode pipeline so Node tests can provide RGBA arrays directly.
5. Table-test black/white, inverted, colored, rotated, compressed, blurred, occluded, and negative images.

Acceptance:

- At least 100 positive and 30 negative cases.
- At least 90% of the documented supported corpus decodes.
- No false positive in the negative corpus.
- Failures print fixture IDs, not image binary data.

### 1.2 Worker-based decoding and resource limits

Implementation:

1. Record baseline time/heap using the QA matrix.
2. Define `QrDecoder` with an abortable `decode(image, crop, signal)` contract.
3. Move pixel decoding to a WXT worker/unlisted worker entrypoint.
4. Transfer an `ArrayBuffer`; do not clone full RGBA buffers repeatedly.
5. Enforce maximum crop dimensions/pixel count. Downscale in staged attempts while preserving crisp modules.
6. Terminate the worker and release canvas/image references on close, navigation, and extension invalidation.

Acceptance:

- No main-thread task over 100 ms for the representative 4K selection set.
- Escape cancels an in-flight decode.
- Five repeated scans return within 10% of the initial post-cleanup heap.
- Accuracy does not regress more than the agreed corpus threshold.

### 1.3 Activation and error reliability

Implementation:

1. Replace console warning with typed, non-sensitive error categories.
2. Differentiate restricted page, permission expiry, capture failure, injection failure, navigation race, and extension invalidation.
3. Add an extension-owned error page or action popup only if a badge cannot explain recovery accessibly.
4. Detect navigation/tab closure between capture, injection, and send.
5. Add an invocation ID so late responses cannot update a newer scan.

Acceptance:

- Every expected failure has a user-facing recovery path.
- Error logs contain category and browser version but no URL, title, screenshot, or payload.
- Two rapid activations leave one usable overlay.

### 1.4 Security hardening

Implementation:

1. Convert security cases in `docs/SECURITY.md` into table-driven tests.
2. Normalize leading/trailing Unicode whitespace and reject control characters before URL classification.
3. Add a maximum displayed/copied payload size with explicit truncation policy; preserve access to the exact value safely.
4. Show the parsed hostname in a dedicated high-emphasis row for HTTP(S) previews.
5. Display both ASCII/punycode and Unicode hostname forms using a reviewed IDNA implementation.
6. Move or remove the legacy copy fallback so untrusted page MutationObservers cannot see its temporary element.
7. Add automated generated-manifest permission assertions.

Acceptance:

- No navigation occurs in tests until the explicit Open action.
- Warned links expose every detected signal before the single explicit “Open anyway” navigation action.
- Dangerous schemes fail in both layers.
- A security reviewer signs off on the threat table and residual risks.

## Phase 2 — automated browser coverage and design system

Target: closed beta.

### 2.1 End-to-end browser tests

Implementation:

1. Add Playwright for Chromium extension tests and web-ext/Firefox automation where supported.
2. Serve a local fixture gallery containing static images, canvas, video, transformed elements, hostile CSS, and DOM mutation.
3. Provide deterministic screenshot API mocks for tests that cannot grant real capture permission.
4. Exercise action activation, selection, decode, preview, copy, warning confirmation, open, retry, Escape, and reinvocation.
5. Run browser tests in CI on Windows and Linux; retain screenshots only from synthetic fixtures.

Acceptance:

- Critical happy path and suspicious-link flow run on Chromium and Firefox.
- CI fails on added manifest permissions or automatic navigation.
- Flake rate remains below 1% over 100 consecutive runs.

### 2.2 Material 3 Expressive token system

Implementation:

1. Move colors, typography, shapes, elevation, state layers, and motion into typed token modules/CSS custom properties.
2. Validate the purple seed palette in Material Theme Builder; document source values and contrast results.
3. Split reusable primitives: icon button, filled/tonal/text button, status icon, pill, result surface, and toast.
4. Replace raw SVG strings with a typed, sanitized internal icon factory or static bundled assets.
5. Create a local component gallery extension page for visual regression snapshots.

Acceptance:

- No duplicated color literal outside tokens except screenshots/tests.
- All text/control states meet the documented contrast target.
- Visual snapshots cover light, dark, increased contrast, narrow viewport, and 200% text.

### 2.3 Keyboard-accessible selection

Implementation:

1. On activation, provide a visible “Keyboard selection” action or initial centered rectangle.
2. Arrow keys move; Shift+Arrow resizes; documented modifier increases step size.
3. Enter scans and Escape cancels. Announce position/dimensions through a throttled live region.
4. Keep geometry in the existing pure selection module and share it with pointer behavior.
5. Add focus containment to the modal result while preserving Escape.

Acceptance:

- The entire scan flow is operable without a pointer.
- Screen-reader announcements are useful without becoming noisy.
- Focus returns predictably when retrying and never escapes into the frozen page while a modal is shown.

### 2.4 Internationalization foundation

Implementation:

1. Move visible strings into WebExtension `_locales/en/messages.json`.
2. Add a typed message-key wrapper with substitution support.
3. Test long pseudo-localized strings and right-to-left layout.
4. Externalize store listing copy separately from runtime strings.

Acceptance:

- No user-facing English literal remains in application modules.
- Missing keys fail development checks.
- Selection and result surfaces remain usable with 40% longer strings and RTL direction.

## Phase 3 — product completion

Target: public beta.

### 3.1 Options and onboarding

Implementation:

1. Add an extension-owned options page; do not put settings in arbitrary host pages.
2. Limit MVP settings to proven needs: theme override, close-after-copy, and decoder diagnostics opt-in.
3. Store only settings through `storage.local`; request the permission only when this feature ships.
4. Add concise first-run education about activation, privacy, link previews, and restricted pages.
5. Avoid opening onboarding on every update.

Acceptance:

- Defaults preserve preview-first behavior and local processing.
- No setting can enable automatic opening.
- Settings schema is versioned and migrations are tested.

### 3.2 Result interpreter registry

Implementation:

1. Define a narrow `ResultInterpreter` interface: `matches(payload)` and `present(payload)`.
2. Keep generic URL/email/phone/text interpreters and add Wi-Fi, vCard, calendar, and geo summaries only as inactive previews.
3. Never execute, connect to, download, or import a structured payload automatically.
4. Make each interpreter independently testable and prioritize through an explicit registry.

Acceptance:

- Unknown and malformed payloads fall back to exact text.
- Interpreter display is a pure transformation with no side effects.
- Actions remain allow-listed and preview-first.

### 3.3 Packaging and CI/CD

Implementation:

1. Pin Node/pnpm versions and use frozen lockfile installs.
2. Add CI jobs for typecheck, unit tests, browser tests, both builds, permission assertion, bundle budget, audit, and archive inspection.
3. Generate Chromium and Firefox ZIPs from the same tagged commit.
4. Produce checksums, SBOM, provenance metadata, and release notes.
5. Configure Chrome Web Store/Edge Add-ons/Firefox AMO submission as separate manual-approval jobs.

Acceptance:

- A tag produces reproducible, traceable artifacts.
- No publish credential is available to pull-request jobs.
- Store archives contain no tests, source fixtures, development configs, or secrets.

## Phase 4 — optional roadmap (separate product decisions)

Each item requires its own privacy/security review and must not delay a secure core release:

Detailed sequencing and promotion gates for styled QR and barcode compatibility are maintained in [ROADMAP.md](ROADMAP.md).

- Image file/drop scanning on an extension-owned page
- Scan all visible QR codes using a bounded worker pipeline
- Additional 1D/2D barcode formats through a decoder adapter
- Context-menu activation
- Full-page scrolling capture with page-mutation safeguards
- Safari conversion and signing
- Explicitly enabled local history with retention/clear controls

Do not add remote reputation lookup by default. If proposed, specify provider, data transmitted, retention, legal basis, false-positive behavior, consent UI, failure behavior, and a local-only opt-out before implementation.

## Definition of done for 1.0

- Product requirements FR-01 through FR-10 pass on the supported browser matrix.
- QR fixture success and false-positive thresholds are met.
- Pointer and keyboard workflows pass accessibility review.
- Security assessment has no unresolved critical/high issue.
- Runtime performs no remote request and asks only reviewed permissions.
- Both generated packages pass store validation and manual smoke tests.
- Privacy policy, support route, vulnerability reporting, changelog, and release record are published.
- Artifact hashes map to a signed Git tag and green CI run.
