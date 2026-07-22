# Product specification

This document defines QR Snip's current product behavior and the requirements that changes must preserve. Candidate work belongs in the [implementation plan](IMPLEMENTATION_PLAN.md) or [post-1.0 roadmap](ROADMAP.md) until it is promoted into product scope.

## 1. Product statement

QR Snip lets a person decode a QR code already visible in the browser without reaching for a phone, uploading a screenshot, or granting continuous access to every site.

### Primary job

> When I see a QR code on a web page, video, document, or image, let me draw around it, inspect its contents, and choose a safe next action.

### Product principles

- **Explicit activation:** no page access or capture occurs until the toolbar or shortcut gesture.
- **Preview first:** decoded content is never opened automatically.
- **Local processing:** screenshots and payloads are not uploaded, persisted, or sent to telemetry.
- **Least privilege:** the extension uses temporary `activeTab` access and runtime injection instead of persistent site access.
- **Evidence-backed compatibility:** supported QR conditions are defined by the maintained fixture corpus.
- **Expressive clarity:** Material 3 Expressive styling reinforces state and hierarchy without obscuring page content or security information.

### Target platforms

- Google Chrome and Chromium-derived browsers that support Manifest V3
- Microsoft Edge, Brave, Vivaldi, and Opera through the Chromium package
- Firefox 140+ through the Firefox Manifest V3 package

Safari is not currently supported. The WebExtension architecture should preserve the possibility of a future port without constraining current browser behavior.

## 2. Users and scenarios

### Primary users

- Desktop users encountering QR-first links or instructions
- Support and QA teams validating QR destinations
- Security-conscious users who want to inspect links without uploading screenshots
- Keyboard-heavy users who need a shortcut-driven, pointer-free scan workflow

### Core scenarios

1. Scan a URL from an image or paused video, review the destination, and optionally open it.
2. Scan plain text, Wi-Fi configuration, calendar data, vCard data, or an app-specific payload and copy the exact value.
3. Scan an email address or phone number and explicitly hand it to the browser or operating system.
4. Review warning signals for an HTTP(S) destination before deciding whether to continue.
5. Retry a selection or scan another area without taking a new screenshot.
6. Cancel at any moment with Escape.

## 3. Current product scope

### Available capabilities

- Toolbar action and configurable browser shortcut
- Visible-tab PNG capture after an explicit user gesture
- Runtime-only content-script injection
- Frozen-screen pointer or keyboard selection with dimensions and clear corner affordances
- Crop mapping across device pixel ratio, browser zoom, and viewport size
- Worker-based local QR decoding with normal, inverted, bounded-downscale, and small-code retry behavior
- URL, email, phone, and text classification
- Full payload preview, Copy, allow-listed Open, Scan another, Try again, Cancel, and Escape actions
- Deterministic warnings for HTTP, credentials, punycode, IP addresses, private/local destinations, and unusual ports
- Display truncation for very large values while Copy preserves the complete accepted payload
- Light, dark, increased-contrast, and reduced-motion adaptations
- Chromium and Firefox Manifest V3 builds
- Extension-owned onboarding and settings for theme, close-after-copy, and local decoder diagnostics
- Unit, security, geometry, message, decoder, and fixture-corpus tests

### Not currently supported

- Full-page scrolling capture
- Automatic scanning of every visible QR code
- Multiple-code result selection
- Micro QR, rMQR, Data Matrix, Aztec, PDF417, or 1D barcodes
- Scan history, cloud synchronization, or remote reputation lookup
- Camera input
- Image-file upload or drop
- Context-menu activation
- Localization beyond the English foundation
- Safari packaging

These are separate product decisions, not defects in the current workflow. Styled-QR and barcode proposals are detailed in [ROADMAP.md](ROADMAP.md).

## 4. Interaction model

### State A — idle

No QR Snip content script or overlay runs on the page. The extension stores no page information.

On first installation only, an extension-owned onboarding page explains activation, local processing,
preview-first safety, and restricted pages. The options page stores only the versioned preferences.

### State B — preparing

After toolbar or shortcut activation, the background starts the visible-tab capture while it probes for an existing runtime listener and injects the dormant content bundle only when needed. The overlay is never mounted until capture finishes, so QR Snip remains absent from its own screenshot. On a restricted or failed page, the toolbar receives a temporary red `!` badge and a recovery message.

### State C — selecting

The captured frame is frozen and dimmed. A floating instruction pill gives “Drag around a QR code” primary emphasis and offers a compact “Select with keyboard” action with a separate K keycap. Pointer drag reveals a rounded selection with a live width × height label. Pressing K or activating the text action creates a centered rectangle and removes the now-redundant action; arrows move, Shift+Arrow resizes, Alt increases the step, Enter scans, and a throttled live region announces geometry. Escape and the close button cancel.

### State D — decoding

On pointer release, the instruction changes to “Scanning selection…” and states that processing remains on the device. The selected RGBA buffer is transferred to a worker, and the interface remains responsive and cancellable.

### State E — result preview

A morphing result card shows the payload type and exact decoded value. Copy is always available. Open is available only for valid allow-listed protocols. “Scan another” returns to selection on the same frozen frame.

HTTP(S) results show the parsed hostname. If warning signals exist, the first result preview also shows the scanned value, normalized destination when different, each warning in a readable list, a cautionary disclaimer, and an explicit **Open anyway** action.

### State F — no result or local failure

The card distinguishes no QR found, unreadable capture, and resource-limit cases; explains how to improve the crop; and offers Try again or Cancel. It never implies that the payload was uploaded or retained.

## 5. Material 3 Expressive direction

The UI uses Material 3 concepts without importing a component framework into arbitrary pages:

- Purple seed palette with semantic surface and on-surface roles
- Large shape contrast across the instruction pill, selection, icon containers, and result card
- Bold, compact type hierarchy using system fonts only
- Short, spatial motion for capture, selection, result, warning, and action transitions
- Tonal hover, active, and focus states with at least 44 × 44 CSS pixel targets
- Dark theme through `prefers-color-scheme`
- Stronger boundaries through `prefers-contrast: more`
- Effectively disabled non-essential animation through `prefers-reduced-motion`

Design changes must preserve decoded-value readability, destination emphasis, focus visibility, text scaling, and reduced-motion behavior. Brand novelty must not reduce contrast or make selection affordances hard to find.

## 6. Functional requirements

| ID | Requirement | Acceptance |
| --- | --- | --- |
| FR-01 | Explicit activation | Toolbar click and command start a scan on an ordinary HTTP(S) page; no persistent content script is declared |
| FR-02 | Screen capture | Capture completes before the overlay mounts and contains only the visible tab; a concurrently prepared content listener performs no DOM mutation before `START_CAPTURE` |
| FR-03 | Selection | Every pointer drag direction works; crop is clamped to the viewport; tiny drags are rejected |
| FR-04 | Decode | The documented fixture corpus decodes locally at or above the release threshold with zero negative-corpus false positives |
| FR-05 | Retry | A failed selection can be retried and another area can be scanned without dismissing or recapturing |
| FR-06 | Result safety | No result opens automatically; script/data/file protocols never receive an Open button and are rejected again in the background |
| FR-07 | Link review | The exact value and parsed hostname appear before Open; suspicious signals appear directly in the first preview |
| FR-08 | Copy | The exact decoded content can be copied; fallback copy remains inside the closed Shadow Root |
| FR-09 | Cleanup | Close, Escape, reinvocation, and cancellation remove the host and release screenshot, canvas, and worker references |
| FR-10 | Isolation | Host-page CSS does not restyle controls, and the page cannot directly access the closed Shadow Root |
| FR-11 | Cross-browser | Production builds and smoke tests pass on supported Chromium browsers and Firefox 140+ |
| FR-12 | Least privilege | Generated manifests contain only reviewed `activeTab`, `scripting`, and settings-only `storage` permissions and expose no persistent content script or external messaging surface |

## 7. Non-functional requirements

- Runtime product code makes no network request.
- Screenshots and payloads are not written to extension storage, IndexedDB, logs, analytics, or crash reporting.
- The unpacked extension declares no persistent content script or broad host permission.
- First usable overlay target: under 250 ms after `captureVisibleTab` resolves on a representative desktop.
- Decode target: under 300 ms for a 500 × 500 crop on a representative desktop.
- Decoder input is bounded to 4,096 pixels per dimension and 4,000,000 total pixels.
- Decode cancellation terminates the worker and releases the transferred buffer.
- Peak memory is measured on 4K and high-DPI captures before store release.
- Controls have accessible names, visible focus, 44 × 44 CSS pixel targets, and usable 200% text scaling.
- Security-critical modules remain deterministic and side-effect free where possible.

## 8. Success measures

Release quality is evaluated without collecting screenshot or payload telemetry:

- At least 90% successful decode rate against the maintained positive fixture corpus
- Zero decoded results from the maintained negative fixture corpus
- Median activation-to-result under two seconds in synthetic usability sessions
- Fewer than 2% of representative sessions blocked by unexplained platform restrictions
- No install permission beyond the reviewed `activeTab`, `scripting`, and settings-only `storage` set
- No screenshot or payload data in telemetry by design
- No unresolved critical or high-severity security finding at release sign-off

## 9. Document ownership

Contributors changing product behavior must update this specification, the affected tests, and any corresponding architecture, security, QA, or compatibility documentation in the same change. Historical evidence belongs in validation records; future proposals belong in the implementation plan or roadmap.
