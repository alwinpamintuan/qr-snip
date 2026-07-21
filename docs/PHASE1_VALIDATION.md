# Phase 1 validation record

Phase 1 hardening was implemented on 2026-07-21. This record separates automated evidence from browser and reviewer checks that require a release test environment.

## Automated evidence

- Deterministic corpus: 144 positive fixtures and 30 negative fixtures.
- Coverage: QR versions 1, 5, 10, 20, and 40; L/M/Q/H error correction; normal, inverted, colored, rotated, resampled, blurred, and partially occluded images.
- Screen composites: 1080p, 1440p, 4K, and a 2× device-scale variant with explicit crop metadata.
- Corpus gate: at least 90% successful positive decodes and zero false positives; failures report fixture IDs only.
- Security tables: protocol rejection, Unicode edge whitespace, control characters, private destinations, punycode, credentials, unusual ports, display truncation, and message guards.
- Packaging gate: Chromium MV3 and Firefox MV3 build successfully; generated manifests declare only `activeTab` and `scripting`, no host permissions, no persistent content scripts, and no external messaging.
- Worker artifact: both builds emit a dedicated decoder worker and transfer the RGBA `ArrayBuffer` into it.

Run the complete automated gate with:

```bash
pnpm check
```

## Manual alpha checks

The following checks cannot be certified by a headless unit/build run and remain part of the internal-alpha sign-off:

- Profile representative 4K selections and confirm main-thread tasks stay below 100 ms.
- Compare heap after the first and fifth repeated scan; post-cleanup heap should remain within 10%.
- Smoke-test Escape during an active decode in current Chrome, Edge, Firefox, and Firefox ESR.
- Reinvoke twice rapidly and confirm only the latest overlay remains usable.
- Exercise each restricted-page recovery message on browser-owned pages and extension stores.
- Complete the security-reviewer sign-off for the threat table and residual risks in `SECURITY.md`.

Do not describe Phase 1 as browser-validated or security-signed-off until these checks are recorded with browser versions, reviewer, commit, and date.
