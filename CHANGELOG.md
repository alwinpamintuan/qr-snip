# Changelog

Notable changes to QR Snip are documented here. The project follows [Semantic Versioning](https://semver.org/) and keeps unreleased work at the top.

## [Unreleased]

### Added

- Keyboard-controlled selection with accelerated movement, resizing, live geometry announcements, and dialog focus containment
- Typed WebExtension localization foundation, external English catalog, pseudo-long/RTL tests, and separate store copy
- Typed Material 3 Expressive tokens, reusable DOM primitives, sanitized icon factory, and local visual component gallery
- Playwright Chromium/Firefox flow coverage, real Chromium action activation, synthetic hostile-page fixtures, Firefox package validation, and Windows/Linux CI browser gates

### Changed

- Refined the overlay with stronger expressive shape contrast, state hierarchy, elevation, and responsive behavior
- Promoted browser automation and locale validation into the required `pnpm check` gate

## [0.1.0] - 2026-07-22

### Added

- Visible-tab QR selection through a frozen snipping interface
- Local worker-based decoding with normal, inverted, bounded large-image, and small-code retry paths
- Preview-first URL, email, phone, and text handling
- Deterministic warnings for insecure, credential-bearing, internationalized, IP-address, private-network, and unusual-port destinations
- Material 3 Expressive light, dark, increased-contrast, and reduced-motion UI
- Chromium and Firefox Manifest V3 builds
- Deterministic positive and negative QR compatibility corpus
- Contributor, architecture, security, QA, delivery, and post-1.0 roadmap documentation

### Changed

- Raised the development runtime minimum to Node.js 22.13 to match the pinned pnpm release

### Security

- Navigation requires an explicit action and is restricted to `http`, `https`, `mailto`, and `tel`
- Screenshots and payloads remain in memory and are not uploaded or persisted
- Generated manifests are checked for least-privilege permissions and exposed runtime surfaces

[Unreleased]: https://github.com/alwinpamintuan/qr-snip/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/alwinpamintuan/qr-snip/releases/tag/v0.1.0
