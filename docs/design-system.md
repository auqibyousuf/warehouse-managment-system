# BatchIQ Design System

Single source of truth for how BatchIQ looks. It mirrors the Stitch project
**"BatchIQ Warehouse Operations Manager"** (project `2815155283243332533`). When Stitch and this file
disagree, update this file and `src/theme/tokens/` together.

## Principles

1. **Industrial clarity.** Flat surfaces, 1px borders, soft shadows only on cards. Data is the hero.
2. **Mono for data, grotesk for words.** Labels, figures and codes are JetBrains Mono; headlines and
   reading text are Hanken Grotesk.
3. **One primary action per screen.** Everything else is secondary or ghost.
4. **Automatic light and dark.** The app follows the device appearance. Nothing is hard-wired to a mode.
5. **No baked-in business data.** Names, units and currency come from the editable profile.

## Appearance (light and dark)

Colors are read with `useColors()` (from `src/theme`). Never import a color value directly and never
hard-code a hex in a component. Both palettes live in `src/theme/tokens/colors.ts`.

| Role | Light | Dark |
| --- | --- | --- |
| Brand primary (fills, active) | `#004ac6` | `#f59e0b` |
| Brand accent text | `#003ea8` | `#ffc174` |
| Text on brand | `#ffffff` | `#472a00` |
| Canvas | `#faf8ff` | `#0f141b` |
| Surface (cards) | `#ffffff` | `#171c23` |
| Surface secondary (insets, segmented bg) | `#f2f3ff` | `#1b2027` |
| Surface tertiary (tracks) | `#eaedff` | `#252a32` |
| Text primary | `#131b2e` | `#dee2ec` |
| Text secondary | `#434655` | `#d8c3ad` |
| Text muted | `#5f6373` | `#b3a08a` |
| Border default | `#c3c6d7` | `#3a3f47` |
| Border subtle | `#e2e7ff` | `#252a32` |
| Success | `#006243` | `#4edea3` |
| Warning | `#904d00` | `#ffc174` |
| Error | `#ba1a1a` | `#ffb4ab` |
| Info | `#004ac6` | `#54ddfc` |

Semantic groups: `colors.brand`, `colors.background`, `colors.text`, `colors.border`,
`colors.status.{success,warning,error,info,neutral}` (each with `text/bg/border/icon`),
`colors.accent` (solid fills for charts and bars), `colors.overlay`.

PanelUI components follow the same palettes through the CSS variables in `global.css`.

## Typography

Fonts are loaded in `src/app/_layout.tsx` and mapped per weight in `src/theme/tokens/typography.ts`
(custom fonts ignore `fontWeight`, so the family name carries the weight).

| Variant | Stitch token | Font | Size / line | Weight |
| --- | --- | --- | --- | --- |
| `display` | headline-xl | Hanken Grotesk | 36 / 44 | 700 |
| `h1` | headline-xl-mobile | Hanken Grotesk | 28 / 36 | 700 |
| `h2` | headline-lg-mobile | Hanken Grotesk | 22 / 30 | 600 |
| `h3` | headline-md | Hanken Grotesk | 20 / 28 | 600 |
| `title` | title-sm | Hanken Grotesk | 16 / 24 | 600 |
| `bodyLarge` | body-lg | Hanken Grotesk | 16 / 24 | 400 |
| `body`, `bodyMedium` | body-md | Hanken Grotesk | 14 / 20 | 400 |
| `bodySmall`, `caption` | body-sm | Hanken Grotesk | 12 / 16 | 400 / 500 |
| `label` | label-caps | JetBrains Mono | 11 / 16, +0.06em, uppercase | 600 |
| `dataLarge` | label-data-lg | JetBrains Mono | 18 / 24 | 600 |
| `dataMedium` | label-data-md | JetBrains Mono | 14 / 20 | 500 |
| `metric` | key figures | Hanken Grotesk | 22 / 30 | 700 |
| `badgeText` | badge | JetBrains Mono | 10 / 13, uppercase | 600 |

Use `<Typography variant="…">`. Money and quantities use `tabular` so digits align.

## Shape, spacing, elevation

| Token | Value |
| --- | --- |
| Radii | `xs 2`, `sm 4`, `md 8`, `lg 8`, `xl 12`, `xxl 16`, `full 9999` |
| Cards, buttons, inputs, chips | `md` (8). Badges `sm` (4). Avatars and dots `full`. |
| Spacing scale | 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64 (`theme.spacing.*`) |
| Touch targets | min 44. Buttons: sm 36, md 44, lg 52. Tab bar 64. |
| Elevation | `shadows.card` is 1px offset, 5% opacity. Depth comes from borders and fills. |

Inline `padding`, `margin`, `gap` and `fontSize` must use these tokens.

## Components

| Component | Notes |
| --- | --- |
| `AppTopBar` | Brand row, page title, editable business name, avatar to `/settings`. |
| `TabBar` | Dashboard, Production, Inventory, Procure, Ledger. Active = brand color, filled icon. |
| `Button` | `primary` filled brand; `secondary` surface with border; `subtle`; `ghost`; `danger`; `success`. |
| `ChipPicker` | Segmented control on a tinted track. Selected = brand fill. Wraps on narrow screens. |
| `Card` | Surface, 1px border, radius 8. Variants: `elevated`, `flat`, `accent`, `outlined`. |
| `InsetStats` | Caps label over mono figure, in a tinted box. Use for quantity/value pairs. |
| `ProgressBar` | One fill or colored segments. Used for stock level, settlement, formulation. |
| `Badge` | Mono caps, radius 4, status colors. |
| `Modal` | Bottom sheet, radius 16 top. Multi-step forms use `StepIndicator`. |
| `ScreenList` | Virtualized lists with the screen header as list header. |

## Information architecture

`Dashboard` · `Production` (recipes, batches) · `Inventory` (balances, movements) ·
`Procure` (purchase bills, suppliers) · `Ledger` (invoices, payments, customers, expenses).
Business profile, backup and sample data live in **Settings** (avatar). Sheets are routes:
`/sheets/<name>?<params>`.

## Rules for contributors

- Read colors with `useColors()`; build style sheets with `createStyles(colors)` + `useMemo`.
- Use `Typography`, never raw `Text` with a hard-coded font.
- Use tokens for spacing, radii and sizes. No hex colors in screens.
- Show real data only. Do not add decorative telemetry, fake machines or placeholder numbers.
- Check both appearances before shipping a screen (device setting, or `colorScheme` in the browser).
- Changing a token means updating this file in the same commit.

## Not in the app (Stitch screens that need data BatchIQ does not have)

Equipment and machinery setup, facility and shift setup, storage bins and pallets, live line
telemetry, QA gates and operator checklists, plant data-flow map. Add them only together with the
data model and workflows behind them.
