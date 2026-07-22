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
- Motion uses short emphasized easing for state changes and is eliminated by `prefers-reduced-motion`.
- Every actionable target is at least 44 by 44 CSS pixels and has a three-pixel focus indicator.
- Warning colors communicate caution only alongside an icon, heading, and explanatory text.
- The system font stack avoids remote font requests and preserves the local-only runtime model.

## Visual gallery

Build the extension and open `gallery.html`. Query parameters make deterministic visual-regression states available without changing application state:

- `?theme=light` or `?theme=dark`
- `?contrast=more`
- `?viewport=narrow`
- `?scale=2`
- `?dir=rtl`

The browser test suite snapshots the required light, dark, increased-contrast, narrow, and 200% text combinations.
