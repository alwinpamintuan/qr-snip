# Changelog

Notable changes to QR Snip are documented here. The project follows [Semantic Versioning](https://semver.org/) and keeps unreleased work at the top.

## [Unreleased]

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

[Unreleased]: https://github.com/alwinpamintuan/qr-snip/commits/main
