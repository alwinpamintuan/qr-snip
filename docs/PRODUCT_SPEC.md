# Product specification

## 1. Product statement

QR Snip lets a person decode a QR code already visible in their browser without reaching for a phone, uploading a screenshot, or granting an extension continuous access to every site.

### Primary job

> When I see a QR code in a web page, video, document, or image, let me draw around it and immediately use its contents.

### Target platforms

- Google Chrome and Chromium-derived browsers that support Manifest V3
- Microsoft Edge, Brave, Vivaldi, and Opera via the Chromium package
- Firefox 140+ via a dedicated MV3 package

Safari is not in the initial scope. The WebExtension architecture should keep a future port possible.

## 2. Users and scenarios

### Primary users

- Desktop users encountering mobile-oriented QR links
- Support and QA teams validating QR destinations
- Security-conscious users who do not want to upload screenshots
- Keyboard-heavy users who need a fast capture shortcut

### Core scenarios

1. Scan a URL from an image or paused video and open it in a new tab.
2. Scan plain text, Wi-Fi configuration, calendar data, or app-specific payloads and copy it.
3. Scan an email address or phone number and hand it to the operating system.
4. Retry a crop without taking a new screenshot.
5. Cancel at any moment with Escape.

## 3. MVP scope

### Included

- Toolbar action and configurable browser shortcut
- Visible-tab screenshot after an explicit user gesture
- Crosshair drag selection with dimensions and clear corner affordances
- Correct crop mapping across device pixel ratio, browser zoom, and viewport size
- In-browser QR decoding with normal and 2× retry passes
- URL, email, phone, and text classification
- Copy, open, scan-again, retry, and cancel actions
- Light, dark, increased-contrast, and reduced-motion adaptations
- Chromium and Firefox MV3 builds
- Unit tests and a manual compatibility matrix

### Explicitly deferred

- Full-page scrolling capture
- Scanning all QR codes automatically without a selection
- Barcode formats other than QR
- Scan history or cloud synchronization
- Camera input
- Image-file upload/drop
- Context-menu activation
- Localization beyond English
- Safari package

These are roadmap candidates, not incomplete MVP requirements.

## 4. Interaction model

### State A — idle

No scripts run on the page. The extension stores no page information.

### State B — preparing

After toolbar/shortcut activation, the background captures the visible tab and injects the runtime content bundle. On a restricted page, the action icon receives a red `!` badge for three seconds.

### State C — selecting

The captured frame is frozen and dimmed. A floating pill says “Drag around a QR code.” Pointer drag draws a rounded selection with a live width × height label. Escape and the close button cancel.

### State D — decoding

On pointer release, the top pill says “Scanning selection…” and communicates that processing remains on-device. The UI stays responsive.

### State E — success

A morphing result card shows payload type and exact decoded value. Copy is always offered. Open is offered only for allow-listed protocols. “Scan another” returns to selection on the same frozen frame.

### State F — no result

The card explains how to improve the crop and offers Try again or Cancel. It must never imply that the payload was uploaded or retained.

## 5. Material 3 Expressive direction

The UI uses Material 3 concepts rather than importing a component framework into the page:

- Purple seed palette with semantic surface/on-surface roles
- Large shape contrast: pill instruction bar, asymmetric result card, rounded-square icon containers
- Bold, compact type hierarchy using only system fonts (no remote font request)
- Spatial, short, emphasized motion for entrance and result transitions
- Tonal hover/focus states and at least 44 × 44 px action targets
- Dark theme from `prefers-color-scheme`
- Increased borders under `prefers-contrast: more`
- Effectively disabled animation under `prefers-reduced-motion`

Future design work should create a token source file and validate colors with the Material Theme Builder. Brand novelty must not reduce contrast or make selection handles hard to find.

## 6. Functional requirements

| ID | Requirement | MVP acceptance |
| --- | --- | --- |
| FR-01 | Explicit activation | Toolbar click and command start a scan on an ordinary HTTP(S) page |
| FR-02 | Screen capture | Capture occurs before overlay injection and contains only the visible tab |
| FR-03 | Selection | All drag directions work; crop is clamped to the viewport; tiny drags are rejected |
| FR-04 | Decode | Common black/white and inverted QR codes decode locally |
| FR-05 | Retry | A failed selection can be retried without dismissing or recapturing |
| FR-06 | Result safety | Script/data/file protocols never receive an Open button and are rejected again in background |
| FR-07 | Copy | Decoded content can be copied; a legacy fallback exists if Clipboard API fails |
| FR-08 | Cleanup | Close/Escape removes the host and screenshot references |
| FR-09 | Isolation | Host-page CSS does not restyle extension controls |
| FR-10 | Cross-browser | Production builds complete and smoke tests pass on current Chrome, Edge, and Firefox ESR/current |

## 7. Non-functional requirements

- No network request is made by runtime product code.
- No screenshot or payload is written to extension storage, IndexedDB, logs, or analytics.
- The unpacked extension should add no persistent content script to manifests.
- First usable overlay target: under 250 ms after `captureVisibleTab` resolves on a typical desktop.
- Decode target: under 300 ms for a 500 × 500 crop on a typical desktop.
- Peak memory must be measured on 4K and high-DPI captures before store release.
- All controls need accessible names and visible keyboard focus.

## 8. Success measures

For a public beta, collect only opt-in or store-level aggregate measures:

- At least 90% successful decode rate against the maintained fixture corpus
- Median activation-to-result under 2 seconds in usability sessions
- Fewer than 2% sessions blocked by unexplained platform restrictions
- No requested install permission beyond `activeTab` and `scripting`
- Zero screenshot/payload data in telemetry by design
