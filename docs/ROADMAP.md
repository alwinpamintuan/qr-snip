# Post-1.0 Roadmap

This roadmap records possible features for releases after 1.0. It is directional, not a delivery commitment. Every initiative requires product validation, a privacy and security review, measurable fixture coverage, and browser-parity testing before it enters a release plan.

The 1.0 release remains focused on selecting one conventional QR code from the visible tab, decoding it locally, and previewing the untrusted payload before any action.

## Guiding constraints

- Keep decoding local. Do not upload screenshots or payloads.
- Never open or execute a decoded value automatically.
- Preserve the exact decoded value and clearly label its symbology.
- Keep the fast path responsive and move expensive fallback work to a bounded, cancellable worker.
- Enable only the formats being deliberately tested; do not search every supported format by default.
- Treat decoder success as evidence of readable pixels, never as evidence that the content is safe.
- Publish compatibility from maintained fixtures instead of claiming support based only on a decoder library's feature list.

## Recommended sequence

### R1 — Styled QR compatibility corpus

**Goal:** Establish a repeatable benchmark before changing decoder behavior.

Add deterministic and appropriately licensed fixtures for:

- rounded, dotted, connected, and gapped modules;
- decorated finder eyes;
- centered logos at several coverage ratios;
- linear, radial, and multicolor gradients;
- transparent backgrounds rendered over light, dark, and patterned pages;
- low-contrast brand colors;
- browser scaling plus JPEG and WebP compression;
- perspective, rotation, blur, clipping, and missing quiet zones;
- representative combinations such as a gradient, logo, and rounded modules.

Vary symbol size, QR version, error-correction level, display density, and screen resolution. Record results per design category so a strong result in conventional fixtures cannot hide a weak styled-code result.

**Exit gate:** The corpus is reproducible, source and licensing metadata are recorded, negative fixtures produce no decoded result, and the README reports measured compatibility by category.

### R2 — Layered QR decoding

**Goal:** Improve recovery of styled QR codes without slowing ordinary scans.

Implement decoding as ordered strategies behind the existing decoder contract:

1. Run the current `jsQR` normal/inverted fast path.
2. Retry a tightly cropped selection with a synthetic quiet-zone border.
3. Apply bounded luminance normalization and local/adaptive threshold variants for gradients and uneven backgrounds.
4. Retry at a small set of measured scales, preserving hard pixel and memory budgets.
5. Lazily invoke a QR-only ZXing-C++ WebAssembly fallback with rotation, inversion, downscaling, alternative binarizers, and its harder search mode enabled only when needed.
6. Attempt perspective correction only when trustworthy corner geometry is available.

Avoid unbounded combinations and aggressive morphology that could invent or merge modules. If valid decoding strategies disagree, return an ambiguous result instead of silently selecting one payload.

Package the WebAssembly binary with the extension; never download executable code at runtime. Adding WebAssembly requires a reviewed Manifest V3 `content_security_policy` containing `'wasm-unsafe-eval'`, build verification for Chromium and Firefox, dependency pinning, license review, and bundle-size tracking.

**Exit gate:** Existing QR compatibility does not regress, newly supported styled categories meet the documented success threshold, negative fixtures remain false-positive free, cancellation releases worker and image resources, and fallback latency stays within the QA performance budget.

### R3 — Additional QR-family formats

**Goal:** Extend the familiar QR workflow before introducing unrelated symbologies.

Evaluate Micro QR and rectangular Micro QR (rMQR) through the decoder adapter. Keep the same preview, safety analysis, Copy, and guarded Open behavior. Display the detected format rather than presenting every result as a conventional QR code.

**Exit gate:** Each enabled format has positive, damaged, ambiguous, and negative fixtures; results behave consistently in supported Chromium browsers and Firefox; and the UI communicates format and payload without adding steps to conventional QR scanning.

### R4 — Opt-in matrix barcode mode

**Goal:** Support high-value screen-based formats without increasing ambiguity in the default QR scan.

Evaluate formats in this order:

1. Data Matrix
2. Aztec
3. PDF417

Introduce an explicit **Barcode mode** or format selector. Do not make the default QR action search all formats. The result model should include `format`, exact raw text or bytes, display interpretation, corner points when available, and non-sensitive decoder diagnostics.

PDF417 and ticket/identity payloads may contain personal information. They must remain in memory, must not be logged or added to history, and should default to Copy unless the existing protocol allow-list permits a reviewed action.

**Exit gate:** Every enabled format has a documented user need, maintained fixtures, zero false positives in the negative corpus, accessible format labeling, and a completed privacy/security review.

### R5 — Optional linear barcode mode

**Goal:** Determine whether 1D codes provide enough local value to justify their product and test surface.

Start with Code 128, followed only when validated by EAN-13, EAN-8, UPC-A, and UPC-E. Shipping and inventory identifiers may be useful as exact copyable values. Retail barcodes are less useful without product lookup, so validate demand before expanding the format list.

Do not add automatic product, shipment, or reputation lookup. Such lookup would transmit scanned identifiers and change the extension's local-only privacy model. If proposed later, it requires a separate opt-in design, provider and retention review, failure behavior, and a local-only mode.

The preview must identify the symbology, preserve leading zeroes, show human-readable text without changing the raw value, and explain that a number alone does not establish product identity or authenticity.

**Exit gate:** User research demonstrates value without remote lookup, each enabled format has checksum and negative coverage, format detection does not degrade QR accuracy, and the mode can be disabled without affecting the default scan.

## Decoder architecture direction

Evolve the QR-specific return type into a format-neutral result while keeping orchestration dependent on interfaces rather than decoder libraries:

- `SymbolDecoder`: decodes pixels for an explicit allow-list of formats.
- `CompositeSymbolDecoder`: runs ordered fast and fallback strategies.
- `DecodeResult`: contains format, exact payload, location, and strategy metadata.
- `PayloadInterpreter`: turns an untrusted payload into a display model and allow-listed actions.
- `CompatibilityRegistry`: maps release claims to fixture-backed format and design categories.

The native browser `BarcodeDetector` API may be evaluated as an optional fast path only. It must not become the sole decoder until Chromium and Firefox behavior is available and proven equivalent by the same corpus.

## Explicit non-goals

- Automatically opening, navigating to, or executing decoded content
- Remote decoder, product lookup, tracking lookup, or reputation requests by default
- Claiming compatibility with every output from a named QR generator
- Enabling every library-supported barcode format without a product use case and fixture contract
- Persisting screenshots, decoded payloads, identity data, or scan history by default
- Unbounded preprocessing retries or multi-symbol scanning on the main thread

## Promotion checklist

A roadmap item can move into a scheduled release only when it has:

- a written user problem and success measure;
- an architecture decision covering dependencies, permissions, CSP, and browser support;
- deterministic positive, negative, damaged, and ambiguous fixtures;
- explicit accuracy, false-positive, latency, memory, and bundle-size budgets;
- accessible preview and failure states;
- privacy and security threat-model updates;
- Chromium and Firefox automated builds plus manual smoke coverage;
- README compatibility changes that distinguish tested, best-effort, and unsupported behavior.
