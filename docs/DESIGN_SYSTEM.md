# QR Snip design system

QR Snip uses a purple Material 3 seed palette expressed through typed roles in `src/ui/theme-tokens.ts`. The runtime overlay and the extension-owned component gallery consume the same CSS custom properties; application modules do not choose colors, shapes, elevation, or motion directly.

## Palette source

The palette was reviewed as a Material Theme Builder-style custom theme using purple seed `#76558F`. QR Snip keeps the generated role relationships but slightly strengthens several foreground roles to meet the product's overlay contrast needs on arbitrary captured pages.

| Theme | Role pair | Values | Contrast |
| --- | --- | --- | ---: |
| Light | primary / on-primary | `#76558F` / `#FFFFFF` | 6.06:1 |
| Light | primary-container / on-primary-container | `#F0DBFF` / `#2D0B43` | 13.13:1 |
| Light | surface / on-surface | `#FFF7FF` / `#1E1A20` | 16.34:1 |
| Light | surface / on-surface-variant | `#FFF7FF` / `#4C454F` | 8.81:1 |
| Light | warning / on-warning | `#815500` / `#FFFFFF` | 6.50:1 |
| Dark | primary / on-primary | `#DCB9F5` / `#422255` | 7.73:1 |
| Dark | primary-container / on-primary-container | `#593A6D` / `#F0DBFF` | 7.23:1 |
| Dark | surface / on-surface | `#161217` / `#F3E9F2` | 15.67:1 |
| Dark | surface / on-surface-variant | `#161217` / `#D6CAD6` | 11.72:1 |
| Dark | warning / on-warning | `#FFB95C` / `#452B00` | 7.72:1 |

Contrast values use WCAG 2 relative luminance. Text and icons use role pairs at or above 4.5:1. Large non-text boundaries target at least 3:1, and `prefers-contrast: more` adds explicit two-pixel outline boundaries.

## Expressive rules

- Shape contrast identifies hierarchy: circular icon actions, asymmetric status containers, pill guidance, and a large asymmetric result surface.
- Motion uses short, bounded springs for state changes and is eliminated by `prefers-reduced-motion`.
- Every actionable target is at least 44 by 44 CSS pixels and has a three-pixel focus indicator.
- Warning colors communicate caution only alongside an icon, heading, and explanatory text.
- The system font stack avoids remote font requests and preserves the local-only runtime model.

## Motion hierarchy

Motion follows the interaction hierarchy rather than decorating every update:

1. **Functional state transitions** use a short spring entrance or exit for the overlay, result surface, retry, toast, and dismissal. The result contents reveal in a small stagger so the heading and primary action remain easy to locate.
2. **Interaction feedback** uses a firmer spring for button presses, selection start/completion, toggle-thumb changes, saved/reset status, and warning icons. Pointer-drag and keyboard selection geometry is written directly every frame; transforms never interpolate the crop coordinates.
3. **Ambient progress** is limited to the active scan. A low-opacity outline pulse and narrow moving highlight sit around or lightly over the selection without masking the QR modules.

The typed presets and spring sampler live in `src/ui/motion.ts`; timing and spring characteristics are centralized with the other design tokens in `src/ui/theme-tokens.ts`. A new animation replaces any motion already owned by that element.

When `prefers-reduced-motion: reduce` matches, Web Animations immediately apply their final keyframe and CSS ambient effects run for no meaningful duration or repetition. Focus changes, live-region announcements, and control state changes are always synchronous in both modes.

Performance limits:

- Persistent effects are allowed only while decoding and stop when busy state ends.
- Direct-manipulation coordinates are never animated.
- Runtime motion is restricted to compositor-friendly `transform` and `opacity`; color, border, and theme continuity remain short CSS transitions.
- Staggers stay below 55 ms per item, overshoot is bounded by the selected spring token, and settling completes within 480 ms.

## Visual gallery

Build the extension and open `gallery.html`. Query parameters make deterministic visual-regression states available without changing application state:

- `?theme=light` or `?theme=dark`
- `?contrast=more`
- `?viewport=narrow`
- `?scale=2`
- `?dir=rtl`

The browser test suite snapshots the required light, dark, increased-contrast, narrow, and 200% text combinations.
