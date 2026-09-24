# DESIGN.md — TRINETRA (Anthropic Light-Mode Editorial Design System)

> Source & Inspiration: Anthropic.com / Claude Product Design System  
> Theme: Warm Cream Canvas, Editorial Typography, Terracotta Accent, Minimalist Light Mode  
> Application: TRINETRA Disaster Response & Situational Awareness Platform (SIH 26206)

---

## 1. Visual Philosophy & Tone

TRINETRA departs from typical dark-mode, neon-accented, gaming-dashboard aesthetics. Disasters and emergency operations require **clarity, calm authority, high legibility, and intellectual trust**. 

The design system anchors on:
1. **Warm Cream Canvas (`#FAF9F5`)**: An off-white, paper-like warmth that eliminates stark glare while maintaining high contrast.
2. **Editorial Typography (Anthropic Sans + Serif accents)**: Clear, functional neo-grotesk sans-serif for UI telemetry, paired with elegant serif display hierarchy for disaster titles and official directives.
3. **Restrained Color Voltage**: No oversaturated neon hues. Interactive elements use Anthropic's signature warm terracotta/coral (`#CC785C`).
4. **Subdued Status Tokens**: Emergency severities are communicated through refined, desaturated, high-readability tokens on soft tinted backgrounds.
5. **Hairline Geometry**: Crisp, hairline 1px borders (`#E6DFD8`) and subtle 1px surface shadows (`shadow-[0_1px_2px_rgba(0,0,0,0.04)]`).

---

## 2. Color Palette & Design Tokens

```css
:root {
  /* Canvas & Backgrounds */
  --color-canvas: #FAF9F5;              /* Primary page floor (warm cream) */
  --color-surface-card: #FFFFFF;        /* Clean card background */
  --color-surface-soft: #F5F0E8;        /* Subtle secondary container / hover */
  --color-surface-muted: #EFE9DE;       /* Disabled or inset container */
  
  /* Text & Ink */
  --color-ink: #141413;                 /* Headings & primary typography (near black) */
  --color-body: #3D3D3A;                /* Secondary body text */
  --color-muted: #6C6A64;               /* Metadata, timestamps, captions */
  --color-muted-soft: #8E8B82;          /* Subtle placeholders & icons */

  /* Hairlines & Dividers */
  --color-hairline: #E6DFD8;            /* Primary card & divider border */
  --color-hairline-soft: #EBE6DF;       /* Secondary divider */

  /* Anthropic Signature Accent */
  --color-primary: #CC785C;             /* Signature terracotta / coral */
  --color-primary-hover: #B5654A;       /* Darker coral on hover */
  --color-primary-active: #A9583E;      /* Active state */
  --color-primary-subtle: #FDF4F0;      /* Tinted coral badge / pill background */
  --color-primary-border: #F1CEC2;      /* Border for coral containers */

  /* Status Tokens (Restrained, Editorial, High Contrast) */
  /* CRITICAL / SEVERE */
  --color-critical-text: #9E2A2B;
  --color-critical-bg: #FDF2F2;
  --color-critical-border: #F5C2C2;
  --color-critical-dot: #C64545;

  /* HIGH / WARNING */
  --color-high-text: #92400E;
  --color-high-bg: #FFFBEB;
  --color-high-border: #FDE68A;
  --color-high-dot: #D97706;

  /* MODERATE / ADVISORY */
  --color-moderate-text: #78350F;
  --color-moderate-bg: #FEF3C7;
  --color-moderate-border: #FCD34D;
  --color-moderate-dot: #B45309;

  /* LOW / SAFE */
  --color-safe-text: #166534;
  --color-safe-bg: #F0FDF4;
  --color-safe-border: #BBF7D0;
  --color-safe-dot: #22C55E;

  /* INFO / DISPATCHED */
  --color-info-text: #1E40AF;
  --color-info-bg: #EFF6FF;
  --color-info-border: #BFDBFE;
  --color-info-dot: #3B82F6;
}
```

---

## 3. Typography Hierarchy

Anthropic typography balances human warmth with technical precision.

| Token | Family | Size | Weight | Line Height | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Serif / Editorial | 36px | 400 | 1.15 | `-0.02em` | Hero situational titles, disaster declarations |
| `display-md` | Serif / Editorial | 28px | 400 | 1.2 | `-0.015em` | Major page section headlines |
| `title-lg` | Anthropic Sans | 20px | 600 | 1.3 | `-0.01em` | Card titles, dashboard module headers |
| `title-md` | Anthropic Sans | 16px | 600 | 1.4 | `0` | Sub-section headers, modal titles |
| `body-md` | Anthropic Sans | 15px | 400 | 1.55 | `0` | Primary reading copy, reports, messages |
| `body-sm` | Anthropic Sans | 13px | 400 | 1.5 | `0` | Secondary descriptions, list items |
| `caption-caps`| Anthropic Sans | 11px | 600 | 1.4 | `+0.08em` | Category tags, uppercase metadata, status headers |
| `mono-code` | JetBrains Mono / Space Mono | 13px | 500 | 1.6 | `0` | Tracking codes (`RPT-2026-0001`), GPS coordinates, metrics |

---

## 4. Component Design Patterns

### 1. Primary Button (`button-primary`)
- Background: `#CC785C` (Terracotta)
- Hover: `#B5654A`
- Text: `#FFFFFF`
- Radius: `8px` (`rounded-lg`)
- Font: `13px font-semibold`
- Shadow: `shadow-sm`

### 2. Secondary Button (`button-secondary`)
- Background: `#FFFFFF`
- Border: `1px solid #E6DFD8`
- Hover: `#FAF9F5`
- Text: `#141413`
- Radius: `8px`

### 3. Surface Cards (`card-editorial`)
- Background: `#FFFFFF`
- Border: `1px solid #E6DFD8`
- Radius: `12px` (`rounded-xl`)
- Shadow: `shadow-[0_1px_3px_rgba(0,0,0,0.03)]`
- Padding: `20px` to `24px`

### 4. Status Badges (`badge-editorial`)
- Pill-shaped (`rounded-full`)
- Subtle tinted background, 1px border, 6px solid colored indicator dot on left.
- Never shouting; immediately informative.

### 5. Maps & GIS
- Base Tile Layer: CartoDB Positron / Voyager Light tile server (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`).
- Clean, crisp vector pins with muted fills and fine hairline borders.
