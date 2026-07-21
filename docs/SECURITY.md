# Security model and assessment

## Security posture

QR Snip treats both the host page and every decoded QR payload as untrusted. It is a local viewing tool, not a trust signal. A successful decode means only that pixels formed a valid QR code; it says nothing about the safety of the destination.

The default behavior is deliberately preview-first:

1. QR Snip decodes the selected pixels.
2. It displays the complete payload as selectable text.
3. It never navigates automatically.
4. The user must explicitly choose Open.
5. Links with suspicious signals show the reasons directly in the first preview and use an explicit “Open anyway” action.
6. The background validates the protocol again before creating a tab.

## Current controls

### Least privilege

Only `activeTab` and `scripting` are declared. Firefox additionally declares the special `data_collection_permissions` value `none`; this is a no-collection disclosure, not access to user data. The extension has no persistent host permission, browsing history, tabs metadata, clipboard permission, storage permission, downloads permission, or remote host access. Access starts after the toolbar/shortcut gesture and ends with the browser's `activeTab` lifetime.

### Local-only processing

The browser generates the screenshot and `jsQR` processes selected RGBA pixels locally. Product runtime code makes no network request. Screenshots and decoded payloads are not persisted. Closing the overlay removes DOM nodes and releases application references.

### Safe rendering

Decoded values are written with `textContent`, never interpreted as HTML. The screenshot is used only as an image data URL and canvas source. Page styles are isolated from the overlay by a closed Shadow Root.

### Navigation allow list

Only these protocols can be handed to the browser:

- `https:`
- `http:`
- `mailto:`
- `tel:`

`javascript:`, `data:`, `file:`, browser-internal schemes, extension schemes, and malformed values remain plain text. The allow list is enforced independently in result classification and again in the background message handler.

### Suspicious-link confirmation

HTTP(S) links are assessed for understandable, deterministic warning signals:

- unencrypted HTTP;
- embedded username/password fields;
- punycode/internationalized domain encoding;
- direct IP-address destinations;
- localhost, `.local`, loopback, link-local, and RFC 1918-style private IPv4 destinations; and
- explicit non-default ports.

These heuristics do not claim to detect phishing. They add understandable context around common ambiguity and local-network risks. A warned destination immediately shows the scanned value, canonical destination when different, every detected signal, and an explicit **Open anyway** action. There is no information-free intermediate step.

## Threat analysis

| Threat | Impact | Existing mitigation | Residual risk / next step |
| --- | --- | --- | --- |
| Malicious QR opens phishing or malware | User leaves trusted context | Full preview; no automatic open; warning heuristics; explicit click | Safe-looking HTTPS can still be malicious. Consider optional reputation checks only with separate consent and a clear privacy tradeoff. |
| `javascript:` or `data:` execution | Code execution/navigation | Protocol allow list in two runtime boundaries | Maintain regression tests for encoded/mixed-case variants. |
| QR payload injects HTML | UI/script injection | All untrusted values use `textContent` | Add DOM-focused tests before any rich preview renderer. |
| QR points to router/admin/private service | CSRF-like or network probing after navigation | Local/private targets receive an inline warning and explicit “Open anyway” action | Navigation itself can still make a GET request. Never prefetch destination metadata. |
| Internationalized-domain homograph | Credential theft | Punycode warning and exact destination preview | Consider showing both Unicode and ASCII domain forms with a vetted library. |
| Host page imitates QR Snip | User confusion | QR Snip asks for no credentials and keeps a consistent toolbar-initiated flow | Page overlays cannot be made impossible. Store copy should tell users the extension never asks them to sign in. |
| Host page interferes with overlay | Incorrect selection or spoofing | Isolated content world, closed Shadow Root, frozen captured image, maximum z-index | Browser/page accessibility layers may still conflict; test hostile CSS/DOM mutation fixtures. |
| Screenshot contains sensitive data | Privacy exposure | In-memory only; no logs/storage/network; explicit activation | Other extensions or a compromised browser are outside this boundary. Minimize lifetime and consider worker transfer after measurement. |
| Oversized 4K/high-DPI image causes memory pressure | Tab instability | Visible viewport only; selected-crop decode | Add dimension/memory budgets and worker-based decoding before release. |
| Message spoofing by another extension/page | Unauthorized navigation | WebExtension runtime messaging is isolated; message shape and protocol are checked | If external messaging is ever added, authenticate sender and keep it disabled by default. |
| Dependency compromise | Build/runtime compromise | Small dependency set, lockfile, review gates | Enable automated dependency review, pin CI runtime, inspect lockfile changes, and produce SBOM/provenance. |
| Clipboard fallback leaks value into page | Sensitive payload exposure | Temporary hidden textarea, immediately removed | Prefer Clipboard API; test that page MutationObservers cannot capture isolated-root fallback. Current fallback is in page DOM and should move inside the closed root or be removed after support review. |

## Important design prohibitions

Developers must not:

- automatically navigate after decoding;
- fetch a URL for title, favicon, redirect, reputation, or preview without separate informed consent;
- send screenshots or payloads to analytics, crash reporting, logs, or AI services;
- add `<all_urls>` merely to avoid explicit activation;
- render decoded HTML, SVG, Markdown, or data URLs as active content;
- treat HTTPS or the absence of warnings as proof of safety;
- hide, truncate, or visually de-emphasize the actual destination host;
- persist scan history by default; or
- weaken background validation because the content layer already validates.

## Security review checklist

Before every store release:

1. Inspect the generated manifests for permissions and externally connectable endpoints.
2. Search runtime bundles for `fetch`, XHR, WebSocket, analytics SDKs, and remote URLs.
3. Fuzz result classification with mixed case, whitespace, control characters, long inputs, encoded URLs, Unicode domains, IPv4 variants, IPv6, and malformed mail/tel values.
4. Confirm every navigation passes through `isAllowedOpenUrl` in the background.
5. Confirm no code path opens a result during decode or initial preview render.
6. Run dependency audit/review and inspect every lockfile change.
7. Test restricted browser pages and confirm errors disclose no page data.
8. Verify source maps and logs do not embed screenshots or fixture secrets.
9. Re-run content-security-policy and store-policy checks for both packages.
10. Record findings, accepted residual risk, reviewer, commit, and artifact hashes.

## Reporting vulnerabilities

Before public release, replace this section with a monitored security contact or a repository security-advisory URL. Reports should include the affected version, browser, reproduction steps, and impact. Do not ask reporters to attach sensitive real-world screenshots; provide synthetic QR fixtures.
