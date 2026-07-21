# Security policy

QR Snip processes screenshots and untrusted QR payloads inside the browser, so security and privacy regressions are treated as release blockers.

## Supported versions

Security fixes are applied to the latest published release and current development branch. Older development snapshots and unpacked builds are not maintained after a newer release is available.

## Reporting a vulnerability

Use GitHub's [private vulnerability reporting form](https://github.com/alwinpamintuan/qr-snip/security/advisories/new). Do not disclose a suspected vulnerability through a public issue, discussion, pull request, or social-media post before coordinated disclosure.

Include:

- affected release or commit;
- browser and operating-system versions;
- synthetic reproduction steps;
- security or privacy impact;
- whether explicit user activation is required; and
- a proposed mitigation, if known.

Do not attach screenshots or QR payloads containing credentials, identity data, private URLs, tickets, Wi-Fi secrets, or other sensitive information. Create a synthetic fixture that demonstrates the same behavior whenever possible.

## Scope

Relevant reports include automatic or bypassed navigation, unsafe protocol handling, payload injection, permission escalation, cross-origin exposure, unintended persistence or network transmission, message spoofing, denial of service through decoder inputs, and dependency compromise.

Compatibility failures that only prevent a QR code from decoding are normally bugs rather than vulnerabilities unless they cause a false payload, resource exhaustion, or another security impact.

The implemented threat model and release-review checklist are documented in [docs/SECURITY.md](../docs/SECURITY.md).
