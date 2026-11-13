---
name: Kartu Persediaan
description: Posyandu KMS growth-card supply tracker. A faintly plum-tinted card-stock ground, a deep plum-berry shell rail, 1px ruled hairlines, flat pages, and green, yellow and red bands that carry supply state only.
colors:
  background: 'oklch(0.974 0.006 345)'
  foreground: 'oklch(0.24 0.03 350)'
  card: 'oklch(0.997 0.002 345)'
  card-foreground: 'oklch(0.24 0.03 350)'
  primary: 'oklch(0.43 0.14 355)'
  primary-foreground: 'oklch(0.985 0.01 350)'
  secondary: 'oklch(0.945 0.015 350)'
  muted: 'oklch(0.95 0.01 345)'
  muted-foreground: 'oklch(0.47 0.03 350)'
  accent: 'oklch(0.93 0.035 355)'
  accent-foreground: 'oklch(0.33 0.11 355)'
  destructive: 'oklch(0.53 0.19 27)'
  border: 'oklch(0.89 0.016 345)'
  rule: 'oklch(0.92 0.012 345)'
  input: 'oklch(0.84 0.02 345)'
  ring: 'oklch(0.55 0.13 355)'
  sidebar: 'oklch(0.32 0.1 355)'
  sidebar-foreground: 'oklch(0.94 0.02 350)'
  sidebar-accent: 'oklch(0.39 0.11 355)'
  sidebar-accent-foreground: 'oklch(0.99 0.005 350)'
  sidebar-primary: 'oklch(0.975 0.01 350)'
  sidebar-primary-foreground: 'oklch(0.32 0.1 355)'
  band-ok: 'oklch(0.79 0.12 150)'
  band-soon: 'oklch(0.86 0.15 92)'
  band-out: 'oklch(0.68 0.17 27)'
  status-overdue: 'oklch(0.52 0.19 27)'
  status-today: 'oklch(0.5 0.11 65)'
  status-waiting: 'oklch(0.48 0.11 250)'
  status-done: 'oklch(0.45 0.1 155)'
  status-lead: 'oklch(0.48 0.13 285)'
typography:
  display-lg:
    fontFamily: Public Sans Variable
    fontSize: 24px
    fontWeight: 600
    lineHeight: 30px
    letterSpacing: -0.025em
  headline:
    fontFamily: Public Sans Variable
    fontSize: 18px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.025em
  title-sm:
    fontFamily: Public Sans Variable
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  body-md:
    fontFamily: Public Sans Variable
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-input:
    fontFamily: Public Sans Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  label-md:
    fontFamily: Public Sans Variable
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  label-sm:
    fontFamily: Public Sans Variable
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
  label-xs:
    fontFamily: Public Sans Variable
    fontSize: 11px
    fontWeight: 500
    lineHeight: 16px
rounded:
  md: 4.8px
  lg: 6px
  tag: 3px
  tile: 4px
  track: 2px
  swatch: 1px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 32px
  3xl: 48px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.label-md}'
    rounded: '{rounded.md}'
    height: 36px
    padding: '0 10px'
  button-outline:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.label-md}'
    rounded: '{rounded.md}'
    height: 36px
    padding: '0 10px'
  status-tag-overdue:
    backgroundColor: '{colors.card}'
    textColor: '{colors.status-overdue}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.tag}'
    height: 20px
    padding: '0 6px'
  status-tag-today:
    backgroundColor: '{colors.card}'
    textColor: '{colors.status-today}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.tag}'
    height: 20px
    padding: '0 6px'
  queue-row-selected:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    typography: '{typography.body-md}'
  outcome-choice:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.label-md}'
    rounded: '{rounded.md}'
    height: 44px
    padding: '0 12px'
  outcome-choice-checked:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-foreground}'
    typography: '{typography.label-md}'
    rounded: '{rounded.md}'
    height: 44px
    padding: '0 12px'
  side-nav-item-active:
    backgroundColor: '{colors.sidebar-accent}'
    textColor: '{colors.sidebar-accent-foreground}'
    typography: '{typography.label-xs}'
    rounded: '{rounded.md}'
    padding: '8px 4px'
---

# Design System: Kartu Persediaan

## Overview

**Creative North Star: "The Supply Card"**

Kartu Persediaan is the working surface of a Posyandu KMS growth-card supply tracker. Each customer's supply run-out is drawn as a horizontal track of green, yellow and red bands, with a today tick and weekly rules. The interface is a set of printed sheets on a card-stock ground with a plum-berry brand shell, so the supply state reads at a glance from the same visual language a health worker already knows from paper cards, and the brand colour never competes with the supply greens.

Key characteristics:

- Ground is a card stock faintly tinted toward the brand plum (`background`), with content on a slightly lighter `card` surface.
- The shell rail is a deep plum berry (`sidebar`) that holds navigation on desktop and stays out of the content area.
- Structure is drawn with 1px ruled hairlines (`rule`, `border`), not with shadows. Page content is flat.
- Radii are small: 3px for tags, 4 to 6px for controls and tiles. Nothing is pill-shaped.
- Green, yellow and red bands carry supply state only. Every number, date and phone value uses tabular figures (`num`).

The build diverges from the direction contract in one place. The contract's first viewport describes a phone top app bar with a title and a "+ Order" action. The build has no top app bar. Each page renders its own `PageHeader` in flow, with a back link where needed. On phones, navigation is a bottom tab bar (Antrian, Pelanggan, + Order, Pesanan, and a Lainnya sheet). On desktop, navigation is a left rail (`side-nav`, 76px wide, widening to 240px at `xl`). The contract's exact labels are not used.

## Colors

The brand is plum berry (hue ≈355); neutrals are tinted faintly toward it so the page reads as one printed sheet. Green, yellow and red are reserved for supply and status meaning, and plum was chosen so the brand never reads as "stock OK". Colour values are oklch and are taken directly from the `:root` block in `src/routes/layout.css`. Dark-mode values are recorded in the sidecar.

### Primary

- **Plum berry** (`primary`, `oklch(0.43 0.14 355)`): The action colour. Used for the default button fill, the active bottom-tab indicator, the selected-item badge, the progress bar, text selection, and the WhatsApp action outline (`border-primary/35`, text `primary`, hover fill `primary`).
- **Ink on plum** (`primary-foreground`, `oklch(0.985 0.01 350)`): Text on `primary` fills.

### Secondary

- **Shell plum** (`sidebar`, `oklch(0.32 0.1 355)`): The desktop rail and login panel background. Its text is `sidebar-foreground`. The active item uses `sidebar-accent` (`oklch(0.39 0.11 355)`) with `sidebar-accent-foreground`. The "New order" action and the count badge use `sidebar-primary` (`oklch(0.975 0.01 350)`) on the rail.
- **Accent wash** (`accent`, `oklch(0.93 0.035 355)`): The checked state of an outcome choice in the follow-up card. Its text is `accent-foreground`.

### Tertiary

- **Band green** (`band-ok`, `oklch(0.79 0.12 150)`): Stock that lasts beyond the threshold.
- **Band yellow** (`band-soon`, `oklch(0.86 0.15 92)`): Stock that runs out soon, and the "today" queue section.
- **Band red** (`band-out`, `oklch(0.68 0.17 27)`): Stock that is out or overdue, and the "overdue" queue section.
- **Status red** (`status-overdue`, `oklch(0.52 0.19 27)`): Overdue text and the overdue tag. Lighter in dark mode.
- **Status amber** (`status-today`, `oklch(0.5 0.11 65)`): Today text and the today tag.
- **Status blue, violet and green** (`status-waiting`, `status-lead` at hue 285 so it stays clear of the brand plum, `status-done`): Waiting, lead and handled tags. Each is a text colour on a `card` tag with a 30% current-colour border.
- **Destructive** (`destructive`, `oklch(0.53 0.19 27)`): Destructive text and the sign-out action. Used on a 10% red wash.

### Neutral

- **Card-stock ground** (`background`, `oklch(0.974 0.006 345)`): The page background and the selected queue row's inset ring field.
- **Card** (`card`, `oklch(0.997 0.002 345)`): Sheets, tags, outline buttons, input fields and outcome choices.
- **Ink** (`foreground`, `oklch(0.24 0.03 350)`): Body and heading text.
- **Muted ink** (`muted-foreground`, `oklch(0.47 0.03 350)`): Dates, meta lines, helper text and section counts.
- **Rule** (`rule`, `oklch(0.92 0.012 345)`): Page-header underline, section dividers and row separators.
- **Border** (`border`, `oklch(0.89 0.016 345)`) and **input** (`input`, `oklch(0.84 0.02 345)`): Control and field edges.
- **Ring** (`ring`, `oklch(0.55 0.13 355)`): Focus outline.

### Named Rules

**The Supply Band Rule.** Band colours (`band-ok`, `band-soon`, `band-out`) and the status tints that follow them carry supply state only. A band never decorates a non-data surface. Queue sections are the only other place a band appears, as a swatch next to the section name.

## Typography

The face is Public Sans Variable with the system sans fallback chain. Sizes are small and set in a narrow range (11px to 24px), because the reader is scanning a dense card rather than reading prose. Every number, date, phone number and money value sets `font-variant-numeric: tabular-nums` through the `num` utility, so columns of values align.

### Hierarchy

- **Page title** (`display-lg`): 24px, weight 600, line-height 1.25, tracking -0.025em. Used for the page `h1`. A muted date line sits above it at 14px.
- **Supply label, large** (`headline`): 18px, weight 600, tabular, used on the supply track in the detail card.
- **Section heading** (`title-sm`): 14px, weight 600. Section headers in the queue are collapsible `h2` buttons.
- **Body** (`body-md`): 14px, weight 400, line-height 20px. The default for lists, meta, and the follow-up card.
- **Input text** (`body-input`): 16px on phones, so iOS does not zoom when a field is focused.
- **Label** (`label-md`): 14px, weight 500. Buttons and outcome choices.
- **Tag and meta** (`label-sm`, 12px, weight 500): Tags, due-date labels in rows, and the detail line under a name (`text-xs num`).
- **Navigation micro label** (`label-xs`, 11px, weight 500): Bottom-tab labels and the narrow rail. The rail uses 14px at `xl`.

### Named Rules

**The Tabular Figure Rule.** Any value that is a count, a date, a phone number or a currency amount uses `num`. A figure that does not align with the figure above it is a defect.

## Layout

The standard working column is `page-frame`: 72rem maximum, centred, with 20px horizontal padding on phones and 32px at `md`. The queue opts out and uses the full width.

On desktop (`lg` and up), the queue is a two-column grid: `minmax(0, 1fr)` for the list and `minmax(360px, 420px)` for the detail aside. The aside sits on `card` with a 1px rule on its left edge. On phones, the detail opens in a bottom drawer (`max-h-[92dvh]`).

Spacing uses a 4px step, and the values in use are 4, 6, 8, 10, 12, 16, 20, 32 and 48px. Gaps between follow-up card fields are 20px (`gap-5`). Page headers pad their bottom edge by 16px above their 1px `rule` underline.

Touch targets are 44px on phones and tablets. The `desk` breakpoint (wide and not `pointer: coarse`) drops controls to 32 or 36px, so a mouse user is not handed a phone-sized button.

### Named Rules

**The Ruled Sheet Rule.** Structure is drawn with 1px hairlines (`rule` for dividers, `border` for control edges) and content sits on `card`. Boxes with a fill and a border are used only for controls, not for layout regions.

## Elevation & Depth

Page content is flat. Sheets, rows, sections and the follow-up card have no shadow. Depth is shown with a border and a surface change, never with a shadow.

Floating layers are the only exception. Popovers, dropdowns and dialogs use `shadow-md` or `shadow-lg` with a 10% `ring-1 ring-foreground/10`. Switches, inputs and textareas carry `shadow-xs`, which is a hairline control edge.

### Named Rules

**The Flat-Page Rule.** No shadow on page content, cards or rows. A layer that floats above the page (popover, dropdown, dialog, sheet) may carry `shadow-md` or `shadow-lg` plus its 10% ring. Nothing else does.

## Shapes

Corners are small. The base radius token is 6px, and every derived radius is a fraction of it.

- Buttons, fields, outcome choices and sidebar items: `rounded-md` (4.8px).
- Logo and avatar tiles: 4px. Bottom-nav "+" tile: 5px.
- Status tags and the count badge: 3px.
- Supply track: 2px. Legend swatches: 1px.
- Full rounding is used only for the settings switch track and knob, and for the 2px today tick on the supply track.

### Named Rules

**The No-Pill Rule.** Status tags are rectangles with a 3px radius, not pills. Badges never use `rounded-full`. The only `rounded-full` shapes in the build are the settings switch and the 2px today tick.

## Components

### Buttons

- **Primary** (`button-primary`): `primary` fill, `primary-foreground` text, `rounded-md`, 36px high on desktop and 44px on phones (`h-11 desk:h-9`), 14px medium text. Hover mixes the fill 18% toward `foreground` (`color-mix(in oklch, primary, foreground 18%)`).
- **Outline** (`button-outline`): `card` fill, `input` border, `foreground` text. Hover fills `muted`.
- **Ghost**: transparent until hover, then `muted`.
- **Destructive**: `destructive` text on a 10% red wash (`bg-destructive/10`). Used for sign-out.
- Buttons are `text-base` on phones and `text-sm` on desktop, and they press down 1px on `active`.

### Cards / Containers

The follow-up card is a single column with 20px gaps between its groups. Its outcome choices are 44px high on phones and 36px on desktop, with a 1px `input` border and a `card` fill. The checked choice takes `accent` with `accent-foreground` text and a `primary` border.

The queue row is a grid of a name column (`minmax(0, 1fr)`) and a fixed due-label column (3.5rem on phones, 7.5rem from `sm`). The selected row takes `background` with a 1px inset `foreground/25` ring. Hover fills `muted` at 70%.

The supply track (`SupplyTrack`) is 6px high in lists and 12px high on the detail card, with a 2px radius. Bands run green, yellow and red. A `card` overlay at 55% opacity marks the used portion. Weekly rules are 1px lines at 85% `card`. The today tick is 2px wide with a `foreground` fill, and it turns `status-overdue` once past. The due tick is 1px wide at `foreground/60`.

### Inputs / Fields

Fields are 44px high (`h-11`), `rounded-md`, with a 1px `input` border on a transparent fill and `shadow-xs`. Focus sets the border to `ring` and adds a 3px `ring/50` halo. Invalid fields take a `destructive` border with a 3px `destructive/20` halo.

### Navigation

The desktop rail is fixed, full height, and 76px wide (240px at `xl`). Its items use `rounded-md`, 11px medium text (14px at `xl`), and an active fill of `sidebar-accent`. The count badge on an item is `sidebar-primary` with `sidebar-foreground`, 3px radius, and tabular figures.

The phone bottom bar is 56px high (`min-h-14`) and holds five slots. Its active slot is `primary` text with a 2px `primary` bar along the top edge, inset 16px on each side. The "+" slot is a 32px `primary` tile with a 5px radius. The Lainnya sheet holds the theme and language controls as a segmented control (`muted` track, `card` selected segment with a `input` ring).

### Named Rules

**The Stamp Tag Rule.** Status tags are ruled 20px-high rectangles with a 3px radius, 12px medium text, a 1px border at 30% of the tag's own colour, and a `card` fill. The tag colour carries the status; the tag shape does not change with status.

## Do's and Don'ts

### Do:

- Do use the band colours (`band-ok`, `band-soon`, `band-out`) only where a supply state is shown, and label them in text beside the track.
- Do use `num` on every count, date, phone number and currency value.
- Do draw dividers and control edges with the 1px `rule` and `border` tokens.
- Do keep page content flat. Use `shadow-md` or `shadow-lg` only on floating layers, with a 10% ring.
- Do keep phone controls at 44px and desktop controls at 32 to 36px, so the `desk` query picks the right size.
- Do place each page's `PageHeader` in flow, with its `rule` underline, rather than adding a top app bar.

### Don't:

- Don't use a band colour as decoration, on a panel, or as a left border.
- Don't use shadows on cards, rows, sections or the follow-up card.
- Don't use `rounded-full` on badges or tags, and don't use pill shapes.
- Don't add gradients, glass surfaces, or thick coloured side borders.
- Don't add eyebrow or kicker labels above headings.
- Don't use a hero-metric template for the queue summary. The count is a plain `text-sm` line.
- Don't use a fixed-width phone top bar. Navigation is the bottom tab bar on phones and the rail on desktop.

## Paper alignment (file `file_b1spy05lmw95zx84`)

The shipped build now follows the Paper file at desktop 1440 (`xl:` and `desk:`), tablet 834 (`md:`) and phone 390, in light and dark. Tablet follows Paper's sizes, including controls under 44px. Phone inputs stay at 16px below `md` to avoid iOS focus zoom.

### Tokens added from Paper

| Token                            | Light                  | Dark                  | Use                                                                |
| -------------------------------- | ---------------------- | --------------------- | ------------------------------------------------------------------ |
| `ink`                            | `#0f1419`              | `#ded4d8`             | back links, `/` kbd, chart today label                             |
| `subtle-foreground`              | `#3a2633`              | `#ded4d8`             | text on `bg-subtle`                                                |
| `hint-foreground`                | `#6f5f67`              | `#b5a2aa`             | Edit pesan counter and note                                        |
| `primary-text`                   | `#8c1f5e`              | `#e193b1`             | every text use of the brand colour (use instead of `text-primary`) |
| `chart-axis`                     | `#6b7280`              | `#6b7280`             | chart axis labels                                                  |
| `toast-action`                   | `#f3b6d6`              | `#8c1f5e`             | toast action text                                                  |
| `warning` / `warning-foreground` | `#fff3d6` / `#5b4a00`  | `#3a2f12` / `#f5dfa6` | last-attempt box                                                   |
| `dropzone` / `dropzone-border`   | `#fbf7f9` / `#c9aebf`  | `#292025` / `#74636c` | import drop zone                                                   |
| `destructive-border`             | `#e9a59d`              | `#5a2a26`             | Hapus pelanggan border                                             |
| `disabled-foreground`            | `#b8a8b2`              | `#5e4f57`             | future months in the month grid                                    |
| `handle`                         | `#d6c8d0`              | `#4a3a42`             | drawer grab handle                                                 |
| `scrim`                          | `rgb(36 20 32 / 0.35)` | `rgb(0 0 0 / 0.6)`    | drawer and dialog overlay                                          |

Focus rings are 3px at 50% (`ring-ring/50`). Paper radii other than 6px are arbitrary values (`rounded-[8px]`, `[12px]`, `[20px]`); `rounded-xl` is not used for Paper's 8px.

### Behaviour drawn by Paper

- Queue: after "Simpan hasil" the same customer stays open in the saved state ("Hasil tersimpan"). Kirim there logs a `wa_sent` activity through `?/resend`. The tablet detail is a 430px right drawer; the phone detail is a bottom drawer.
- Edit pesan: edits apply to one message; "Simpan jadi template" reverses `{nama}`, `{produk}`, `{cs}` with a single-pass substitution in `src/lib/domain/template.ts`. `{nama}` is the full customer name.
- Detail Pelanggan: orders cap at 50 and activities at 100, with the cap line shown only when the server fetched one more row.
- Phone header search is an icon that opens the search row. Phone numbers display as `+62 811 1305 6420`.

### Kept beyond Paper

The "7 hari ke depan" queue tab, custom date in "Tunda ke", Ringkasan in Lainnya, the copy-phone button, tel link and order-row menu on Detail Pelanggan, the phone note composer, the phone add button on Pelanggan, the tablet card layout of Lainnya, the phone month picker on Ringkasan, the queue badge on the phone bar, and the settings unit and servings hints. The "Data contoh" note artboards are designer notes and are not built.
