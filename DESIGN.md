---
name: Maido Book
description: CS follow-up CRM for a consumable product. A faintly plum-tinted paper ground, a deep plum shell rail, Inter set small with tabular figures, 1px ruled hairlines, flat pages, a WhatsApp-green send action, and green, yellow and red supply bands that carry run-out state only.
colors:
  background: '#faf5f7'
  foreground: '#241420'
  card: '#fffefe'
  ink: '#0f1419'
  primary: '#8c1f5e'
  primary-foreground: '#ffffff'
  primary-text: '#8c1f5e'
  secondary: '#f3eaf0'
  secondary-foreground: '#5c3f52'
  muted: '#f4ecf0'
  muted-foreground: '#68545d'
  hint-foreground: '#6f5f67'
  subtle: '#f8f2f6'
  subtle-foreground: '#3a2633'
  accent: '#f8e8f1'
  accent-foreground: '#5d1438'
  selected-ring: '#e7bcd4'
  border: '#e0d3da'
  rule: '#eadfe6'
  row-rule: '#efe6ec'
  input: '#908188'
  ring: '#b2457f'
  avatar: '#f1e5ec'
  avatar-foreground: '#5c3f52'
  sidebar: '#4e1038'
  sidebar-foreground: '#e9cfdd'
  sidebar-accent: '#6c1b4c'
  sidebar-accent-foreground: '#ffffff'
  sidebar-primary: '#f8e8f1'
  sidebar-primary-foreground: '#8c1f5e'
  whatsapp: '#12724b'
  whatsapp-foreground: '#ffffff'
  band-ok: '#7fd091'
  band-soon: '#f4cd4b'
  band-out: '#ef675c'
  status-overdue: '#b42318'
  status-today: '#8a5b00'
  status-waiting: 'oklch(0.48 0.11 250)'
  status-done: '#12724b'
  status-lead: 'oklch(0.48 0.13 285)'
  destructive: '#b42318'
  alert: '#fdecea'
  alert-border: '#f2b8b0'
  alert-foreground: '#7a1a12'
  warning: '#fff3d6'
  warning-foreground: '#5b4a00'
  success-tint: '#e1f3e9'
  handle: '#d6c8d0'
  scrim: 'rgb(36 20 32 / 0.45)'
typography:
  page-title:
    fontFamily: Inter Variable
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.03em
  page-title-form:
    fontFamily: Inter Variable
    fontSize: 22px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: -0.03em
  page-title-list:
    fontFamily: Inter Variable
    fontSize: 18px
    fontWeight: 700
    lineHeight: 22px
    letterSpacing: -0.02em
  empty-title:
    fontFamily: Inter Variable
    fontSize: 20px
    fontWeight: 700
    lineHeight: 24px
    letterSpacing: -0.02em
  supply-label:
    fontFamily: Inter Variable
    fontSize: 18px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: -0.3px
    fontFeature: '"tnum"'
  section-title:
    fontFamily: Inter Variable
    fontSize: 16px
    fontWeight: 700
    lineHeight: 24px
    letterSpacing: -0.02em
  name-phone:
    fontFamily: Inter Variable
    fontSize: 15px
    fontWeight: 600
    lineHeight: 18px
  body:
    fontFamily: Inter Variable
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
  input:
    fontFamily: Inter Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  ui:
    fontFamily: Inter Variable
    fontSize: 13px
    fontWeight: 400
    lineHeight: 16px
  label-sm:
    fontFamily: Inter Variable
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
  nav-micro:
    fontFamily: Inter Variable
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
rounded:
  swatch: 1px
  track: 2px
  sm: 3.6px
  badge: 4px
  md: 4.8px
  segment: 5px
  lg: 6px
  panel: 8px
  xl: 8.4px
  dialog: 10px
  tile: 12px
  fab: 15px
  sheet: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  4xl: 48px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.input}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '0 16px'
  button-primary-desk:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.ui}'
    rounded: '{rounded.lg}'
    height: 36px
    padding: '0 14px'
  button-outline:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '0 16px'
  button-whatsapp:
    backgroundColor: '{colors.whatsapp}'
    textColor: '{colors.whatsapp-foreground}'
    rounded: '{rounded.lg}'
    height: 44px
  button-secondary-chip:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.secondary-foreground}'
    typography: '{typography.ui}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '0 14px'
  wa-icon-button:
    backgroundColor: '{colors.card}'
    textColor: '{colors.whatsapp}'
    rounded: '{rounded.lg}'
    size: 44px
  outcome-cell:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.ui}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '6px 8px'
  outcome-cell-checked:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.primary-text}'
    typography: '{typography.ui}'
    rounded: '{rounded.lg}'
    height: 44px
  queue-row:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.name-phone}'
    height: 68px
    padding: '0 16px'
  queue-row-selected:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.foreground}'
    height: 68px
  group-header:
    backgroundColor: '{colors.subtle}'
    textColor: '{colors.avatar-foreground}'
    typography: '{typography.label-sm}'
    height: 44px
    padding: '0 20px'
  filter-tab-phone:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.ui}'
    rounded: '{rounded.md}'
    height: 44px
    padding: '0 14px'
  filter-tab-phone-active:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.ui}'
    rounded: '{rounded.md}'
    height: 44px
    padding: '0 14px'
  count-badge:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.badge}'
    padding: '1px 6px'
  avatar:
    backgroundColor: '{colors.avatar}'
    textColor: '{colors.avatar-foreground}'
    rounded: '{rounded.full}'
    size: 36px
  input-field:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.input}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '4px 12px'
  side-nav-item-active:
    backgroundColor: '{colors.sidebar-accent}'
    textColor: '{colors.sidebar-accent-foreground}'
    rounded: '{rounded.panel}'
    size: 44px
  bottom-nav-new-order:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.fab}'
    size: 48px
---

# Design System: Maido Book

## Overview

**Creative North Star: "The Supply Card"**

Maido Book is the working surface of a small Indonesian customer-service team that sells a consumable product and works a daily WhatsApp follow-up queue. Every order predicts when the customer will run out, and that prediction is drawn as the Supply Card: a horizontal track of green, yellow and red bands with a today tick and weekly rules. The CS agent reads the band under the cursor and knows at once whether this customer still has stock, is about to run out, or has already run out. The track ships on the queue twice. The follow-up card carries it large (12px high) with a run-out label, start and end dates and a legend. Each queue row carries a small track (6px high) with no label. The new-order preview shows the large track for the order being entered; the customer detail page draws supply history as a separate line chart (`SupplyChart`) in plum, not in bands.

Around the track, the interface is a set of ruled sheets on a faintly plum-tinted paper ground, with a deep plum shell rail on wider screens. The brand is plum so it never reads as "stock OK", the send action is a deep WhatsApp green, and the three band colours are reserved for supply state. Type is Inter, set small (11px to 26px) for scanning a dense list rather than reading prose, with tabular figures on every count, date and phone number. Page content is flat; depth appears only on layers that float above the page.

The palette and sizes follow the "Quiet xenops" Paper design file at desktop 1440, tablet 834 and phone 390, in light and dark.

**Key Characteristics:**

- Ground is paper faintly tinted toward the brand plum (`background`); sheets, rows and the queue column sit on the near-white `card`.
- The shell rail is deep plum (`sidebar`) from `md` up; phones get a bottom tab bar instead.
- Structure is drawn with 1px hairlines (`rule`, `row-rule`, `border`), not with shadows. Page content is flat.
- Corners are small (4.8px to 8px on controls and panels); round shapes are kept for avatars, icon circles and the today tick.
- Green, yellow and red bands carry supply state only. Healthy stock text is muted; colour appears only when stock is low or out.
- Every number, date and phone value uses tabular figures (`num`).
- Phone controls are 44px; the `desk` variant (wide and not touch-first) drops them to 32 to 38px.

## Colors

A quiet plum system: plum-tinted neutrals, one plum brand, a deep WhatsApp green for sending, and a strictly reserved set of supply and status colours. Values are hex (two status hues stay oklch) and come from the `:root` block of `src/routes/layout.css`; the `.dark` block redefines every token.

### Primary

- **Xenops Plum** (`primary`): The action colour. Default button fill, the phone filter tab's active fill, the active underline of desktop tabs, the queue count badge, the "+" new-order tile, the progress bar fill, text selection (22% mix), `accent-color` and `caret-color`. Hover mixes the fill 18% toward `foreground`.
- **Plum Text** (`primary-text`): Every text use of the brand colour (links like "show more", reset and save-template actions, empty-state icons, the checked outcome label). It lightens to `#e193b1` in dark mode, which `primary` cannot do and stay a fill. `text-primary` is not used.

### Secondary

- **Shell Plum** (`sidebar`): The rail and login panel. Items use `sidebar-foreground`; the active item fills `sidebar-accent` (`#6c1b4c`) with white text. The logo tile is `sidebar-primary` with plum text.
- **Plum Wash** (`accent`, text `accent-foreground`): The selected queue row and the checked outcome cell.
- **Selected Ring** (`selected-ring`): The 1px inset ring on the selected queue row.
- **Soft Plum** (`secondary`, text `secondary-foreground`): Snooze and date chips, empty-state icon circles, the segmented control track.

### Tertiary

- **WhatsApp Green** (`whatsapp`, text `whatsapp-foreground`): The send action. Filled on the follow-up card's "Kirim ke …" button and the customer header; as icon colour on the row's outlined WhatsApp button. In light mode it shares its value with `status-done`.
- **Band Green / Yellow / Red** (`band-ok`, `band-soon`, `band-out`): The three segments of the supply track and its legend swatches. Nothing else.
- **Status Red** (`status-overdue`): Stock that is out, overdue labels, the past-run-out today tick, error icon circles, sign-out text.
- **Status Amber** (`status-today`): Stock that is low (inside the lead days) and due-today labels.
- **Status Blue / Violet / Green** (`status-waiting`, `status-lead` at hue 285 to stay clear of the brand, `status-done`): Waiting, lead and active labels.
- **Destructive** (`destructive`): Destructive buttons. The outline variant uses a 45% destructive border and an `alert` hover.
- **Alert, Warning, Success tints** (`alert`/`alert-border`/`alert-foreground`, `warning`/`warning-foreground`, `success-tint`): The error toast and login error box; the last-attempt hint; success icon circles.

### Neutral

- **Paper** (`background`): The page ground behind sheets.
- **Card** (`card`): Sheets, the queue column, the detail aside, rows, outline buttons, fields and outcome cells.
- **Ink** (`foreground`): Body and heading text, and the today tick. `ink` (`#0f1419`) is a cooler black for the phone centred back link.
- **Muted ink** (`muted-foreground`): Meta lines, dates, counts, healthy stock text, inactive tabs. `hint-foreground` is one step softer for edit hints and the character counter.
- **Subtle** (`subtle`, text `subtle-foreground`): Group header bands, the message blockquote, section hints and outcome hints.
- **Muted** (`muted`): Hover fill on rows, outline and ghost buttons.
- **Rule** (`rule`) and **row rule** (`row-rule`): Section dividers inside the card and the page-header underline; row and group-header separators.
- **Border** (`border`) and **input** (`input`): Panel edges; control and field edges (input is darker so fields read as controls).
- **Ring** (`ring`): Focus. The global focus outline is 2px solid `ring` at a 2px offset; components use a 3px `ring/50` halo.
- **Avatar** (`avatar`, text `avatar-foreground`): Initials circles; `avatar-foreground` also colours group-header labels.
- **Handle** and **scrim**: The drawer grab handle and the drawer and dialog overlay.

Dark mode (`.dark`) keys for orientation: `background #160f13`, `card #20161b`, `foreground #ded4d8`, `primary #9a3e67`, `primary-text #e193b1`, `sidebar #14080f`, `whatsapp #2e6540`, bands `#377249` / `#a0832a` / `#b9463f`, `status-overdue #ef7f74`, `status-today #dcaf61`.

### Named Rules

**The Supply Band Rule.** `band-ok`, `band-soon` and `band-out` appear only inside the supply track and its legend. A band never fills a panel, a badge, a section marker or a left border.

**The Quiet Stock Rule.** Stock text that still has days left beyond the lead time is `muted-foreground`. Only low stock (`status-today`) and out-of-stock (`status-overdue`) take colour, so colour in a row always means "act".

**The Green Send Rule.** `whatsapp` is the colour of sending a message. Brand plum never sends; WhatsApp green never decorates.

## Typography

**Body Font:** Inter Variable (with `ui-sans-serif, system-ui, sans-serif`)

**Character:** One neutral grotesk across every role, carried by weight (400 to 700, 800 only for the rail's logo letter) and slight negative tracking on headings. Sizes stay in a tight 11px to 26px band because the reader scans a dense queue.

### Hierarchy

- **Page title** (700, 26px, line-height 1.1, -0.03em): The phone `h1` in `PageHeader`. From `md` it drops to 18px / 22px at -0.02em on list pages (`page-title-list`), or 22px / 28px at -0.03em on form pages with a back link (`page-title-form`). The phone centred header uses 16px / 20px bold.
- **Empty and error title** (700, 20px / 24px, -0.02em): Empty states and error states.
- **Supply label** (600, 18px / 22px, -0.3px, tabular): The run-out line above the large track ("12 hari lagi"), toned by the Quiet Stock Rule. Day-summary lines use 18px bold.
- **Section title** (700, 16px, -0.02em): `SectionHeading` default; the follow-up card's customer name is 16px / 20px bold. The small variant is 15px / 18px bold.
- **Name on phone** (600, 15px / 18px): Names in queue rows, customer and order lists, and `PersonSummary`; 14px from `md`. Phone list rows on Lainnya and the phone message editor (15px / 23px) use the same size.
- **Body** (400, 14px / 21px): The message blockquote, empty-state descriptions, toasts.
- **Input** (400, 16px): Fields and default-size buttons below `desk`, so iOS does not zoom on focus; 14px at `desk`.
- **UI** (`text-ui`, 13px / 16px): The workhorse. Meta lines, row details, card section labels (600), filter tabs, small and desk buttons, hints, page-header meta and back links.
- **Label small** (600, 12px): Group-header labels, count badges, track labels and legends, progress text.
- **Nav micro** (500, 11px / 14px; 600 when active): Bottom-tab labels.

Headline figures on Insights (22px, 30px from `md`) and Import review (28px) are bold, -0.03em and tabular.

### Named Rules

**The Tabular Figure Rule.** Any count, date, phone number or amount uses `num` (`font-variant-numeric: tabular-nums`). A figure that does not align with the figure above it is a defect.

**The No Eyebrow Rule.** Headings stand alone. No uppercase, letter-spaced kicker or eyebrow label sits above a title; context goes in the meta line under it.

## Layout

The shell is a fixed rail on the left from `md` (72px wide, 232px at `xl`) and a fixed bottom tab bar below `md`. Each page renders its own `PageHeader` in flow on `card`; there is no global top app bar. From `md` the header is at least 60px high with a 1px `rule` underline.

The standard body column is `page-frame`: 72rem maximum, centred, padded 14px / 16px / 32px (top / sides / bottom) on phones and 24px / 20px / 48px from `md`. The queue opts out and runs full width on `card`.

The queue at `lg` (1024px) is a two-column grid at full viewport height: `minmax(0, 1fr)` for the list and a 400px detail aside with a 1px `rule` on its left. Between `md` and `lg` the detail opens in a 430px right drawer; on phones it opens in a bottom drawer up to 92dvh. Queue rows are 68px on phones and 60px from `md`; group headers are bands across the full width.

Spacing follows a 4px step with 2px half-steps: 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32 and 48px are in use. The follow-up card pads its sections 20px horizontally and 16px vertically, separated by 1px `rule` lines.

Breakpoints: `md` 768px, `lg` 1024px, `xl` 1280px, and `desk` = 768px or wider and not `pointer: coarse`.

### Named Rules

**The Ruled Sheet Rule.** Structure is drawn with 1px hairlines: `rule` between sections, `row-rule` between rows, `border` and `input` on control edges. Layout regions are not boxed with a fill plus a border; tinted bands (`subtle`) carry group headers and hints.

**The Touch Floor Rule.** Every phone and tablet control is at least 44px: buttons, fields, filter tabs, outcome cells, snooze and date chips, the row's WhatsApp and "Kirim lagi" buttons, toggleable group headers, the card's Edit button and back links. The `desk` variant alone may shrink them (Edit and "Kirim lagi" to 32px, chips and icon buttons to 36px, outcome cells to 38px, fields to 36 to 40px).

## Elevation & Depth

Page content is flat: sheets, rows, sections, group headers and the follow-up card carry no shadow. Depth on the page comes from the paper/card surface change and hairlines. Shadows belong to things that float above the page, plus two small lifted controls.

### Shadow Vocabulary

- **Dialog** (`box-shadow: 0 20px 60px #24142040`): Dialogs.
- **Tablet drawer** (`box-shadow: -12px 0 40px #0F141929`): The 430px right drawer that holds the follow-up card between `md` and `lg`.
- **Toast** (`box-shadow: 0 12px 32px #2414204D`): The dark pill toast. The error toast uses `0 8px 24px #24142024`, as does the month-picker popover.
- **Menu** (`shadow-md` with a `ring-1 ring-foreground/10`): Popovers and dropdown menus.
- **New-order tile** (`box-shadow: 0 6px 16px` of `primary` at 30%): The raised "+" tile in the bottom bar.
- **Segment** (`box-shadow: 0 1px 2px` of `foreground` at 12%): The selected segment of the theme and language control on Lainnya.

### Named Rules

**The Flat-Page Rule.** No shadow on page content, cards, rows or sections. A layer that floats (dialog, drawer, toast, popover, menu) may carry its shadow; the only in-page lifts are the bottom bar's "+" tile and the selected segment.

## Shapes

Corners are small. The base `--radius` is 6px (`rounded-lg`), which buttons, fields, chips, outcome cells, the WhatsApp icon button and the Edit button all use. Derived steps are 3.6px (`sm`), 4.8px (`md`) and 8.4px (`xl`).

- 4.8px: phone filter tabs.
- 8px: the message blockquote, outcome hints, rail items, the segmented-control track and toasts.
- 4px: count badges and the progress bar. 5px: segments.
- 10px: dialogs. 12px: the login logo tile and the phone customers action. 15px: the bottom bar's "+" tile. 20px: drawer edges (top of the bottom sheet, left of the tablet drawer).
- 2px: the supply track and Insights legend swatches. 1px: supply-track legend swatches.
- Round: initials avatars, empty-state and error-state icon circles, activity and import icon circles, the import stepper dots, the switch, radio items and the 2px today tick on the track.

### Named Rules

**The Small Corner Rule.** Rectangles carry 4px to 8px corners; nothing that holds text becomes a pill. Round is for avatars, icon circles, switches and ticks, never for a badge, tag or button.

## Components

### Buttons

Plain and firm: semibold text, a 6px corner, and a 1px press on `active`.

- **Primary** (`button-primary`): `primary` fill, white text, 44px with 16px text below `desk`; 36px with 13px text at `desk`. Hover mixes 18% toward `foreground`.
- **WhatsApp** (`button-whatsapp`): `whatsapp` fill with its foreground; the card's send button stays 44px at every width and carries the WhatsApp glyph.
- **Outline**: `card` fill, `input` border, hover `muted` (`accent` in dark).
- **Secondary** (`button-secondary-chip`): `secondary` fill; used for snooze and date chips (44px, `desk` 36px). A chosen date chip switches to the primary variant.
- **Ghost**: transparent until hover, then `muted`; used for the queue stepper and drawer close.
- **Destructive outline / solid**: 45% destructive border on `card`, or a `destructive` fill.
- **Focus**: border goes to `ring` with a 3px `ring/50` halo.

### Chips and Tabs

- **Filter tabs, phone** (`filter-tab-phone`): 44px rectangles with a 4.8px corner and 14px side padding. Inactive: 1px `input` border, `foreground` text. Active: `primary` fill, white semibold text. The count follows the label in tabular figures.
- **Filter tabs, `md` and up**: the same items become underline tabs, 44px high, with no fill or border. Inactive: `muted-foreground`; active: `foreground` semibold with a 2px `primary` bar along the bottom edge.
- **Status labels** (`StatusBadge`): semibold coloured text with no box, toned by the status colours.

### Cards / Containers

- **Follow-up card**: one column on `card`. Header: a 44px avatar, 16px bold name linking to the customer, a 13px meta line. Then the large supply track, the message section, the outcome grid and snooze, each separated by a 1px `rule` and padded 16px by 20px. Section labels are 13px semibold. The message shows in an 8px `subtle` blockquote; editing swaps it for a textarea with a 2px `primary` border.
- **Outcome grid** (`outcome-cell`): two columns of 44px cells (38px at `desk`) with a 6px corner, 1px `rule` border on `card`, 13px semibold text. The checked cell (`outcome-cell-checked`) takes `accent`, a 1.5px `primary` border and `primary-text`.
- **Queue row** (`queue-row`): 68px (60px from `md`), 1px `row-rule` beneath, avatar, 15px semibold name, a 13px meta line with the order date and stock text, then the small track (phone, up to 160px wide) or a 150px track column with a dose line (`md`). A WhatsApp icon button or a "Kirim lagi" outline button sits at the end. Hover fills `muted`. **Selected** (`queue-row-selected`): `accent` fill with a 1px inset `selected-ring` ring.
- **Group header** (`group-header`): a full-width `subtle` band, 1px `row-rule` beneath, 12px semibold label in `avatar-foreground`, a muted count and a chevron. 44px when it toggles (36px at `desk`), 36px when static.
- **Empty state**: centred, a 56px round icon circle (`secondary` / `alert` / `success-tint`), a 20px bold title and a 14px muted description.

### Inputs / Fields

Fields are 44px (36px at `desk`), 6px corner, 1px `input` border on `card`, 16px text below `desk`, with no shadow. Focus moves the border to `ring` with a 3px `ring/50` halo. Invalid fields take a `destructive` border and a 3px `destructive/20` halo. The date picker in the outcome form is a field-styled box with a calendar icon over a transparent native input.

### Form pages

New customer, edit customer and new order share one pattern. Build new form pages from the same pieces (`fieldLabel`, `fieldStack` and `formColumn` in `src/lib/styles.ts`, `DoseField`, `FormActions`) rather than restyling fields per page.

- **Header**: `PageHeader` with `variant="centered"` and a `back` link that names the page it returns to.
- **Column**: `page-frame md:px-7`, so the fields share the header's left edge; the form is at most 560px wide from `md` and is never centred.
- **Fields**: 18px between fields, 6px between a label, its control and its hint or error. Labels are 13px semibold; hints are 13px muted; an optional field carries a 12px muted "Opsional" after its label. Controls keep their default sizes.
- **Choices**: gapped `choiceChip` chips; the selected chip takes `accent`, a `primary` border and `primary-text`.
- **Sections**: no boxed panels. A secondary group (a disclosure, the supply preview, a delete row) is set off by a 1px `rule`.
- **Actions** (`FormActions`): primary first, then an outline secondary. Inline and left-aligned from `md`; on phones a bar pinned to the bottom with a `rule` top edge that replaces the bottom nav.

### Navigation

- **Rail** (`md` and up): fixed, `sidebar` fill, 72px wide with 44px icon-only items, 232px at `xl` with 38px labelled items. Items use an 8px corner; hover is `sidebar-accent/70`; active is `sidebar-accent` with white semibold text. The queue count badge (4px, `primary`) shows at `xl`.
- **Bottom bar** (phone): `card` with a 1px `rule` top edge and five slots: Antrian, Pelanggan, the "+" new-order tile, Pesanan and Lainnya. Slots carry a 22px icon over an 11px label; the active slot is `foreground` semibold, inactive `muted-foreground`. The "+" is a 48px `primary` tile with a 15px corner, raised 18px above the bar with its plum shadow. The queue slot carries a 4px `primary` count badge.
- **Drawers**: bottom sheet with 20px top corners and a 36px by 4px `handle`; tablet right drawer 430px wide with a 20px left corner and the drawer shadow.

### The Supply Card (signature)

`SupplyTrack` spans from the order date to the run-out date plus a red tail (at least 7 days, or 20% of the supply). Bands: `band-ok` up to the run-out date minus the lead days, `band-soon` up to the run-out date, then `band-out`. Elapsed time is washed with `card` at 55%; what is left stays at full strength. Weekly rules are 1px lines of `card` at 85%. The today tick is 2px wide, round, `foreground`, overhanging the track by 4px above and below; once past the tail it pins to the end in `status-overdue`.

- **Large** (follow-up card, new-order preview): 12px high, 2px corner, with the 18px supply label above, a due tick (1px, `foreground/60`) under the track, the order and run-out dates in 12px tabular muted text, and a three-swatch legend.
- **Small** (queue rows): 6px high with no label (the row's meta line already carries the stock text). The component's small size can show a 12px tabular label below the track when a caller asks for it.

## Do's and Don'ts

### Do:

- **Do** use `band-ok`, `band-soon` and `band-out` only inside the supply track and its legend.
- **Do** leave healthy stock text `muted-foreground` and colour only low (`status-today`) and out (`status-overdue`) stock.
- **Do** use `whatsapp` for the send action and `primary-text` (not `text-primary`) for brand-coloured text.
- **Do** use `num` on every count, date, phone number and amount.
- **Do** draw dividers and edges with 1px `rule`, `row-rule`, `border` and `input`.
- **Do** keep phone and tablet controls at 44px and shrink them only through `desk`.
- **Do** set field text at 16px below `desk` and names at 15px on phones.
- **Do** place each page's `PageHeader` in flow on `card`, with its `rule` underline from `md`.

### Don't:

- **Don't** use a band colour as decoration, on a panel, a badge, a section marker or a left border.
- **Don't** put shadows on cards, rows, sections or the follow-up card; shadows are for floating layers, the "+" tile and the selected segment.
- **Don't** make a badge, tag or button a pill; round is for avatars, icon circles, switches and ticks.
- **Don't** add gradients, glass surfaces or thick coloured side borders.
- **Don't** add eyebrow or kicker labels above headings.
- **Don't** add a top app bar; navigation is the bottom bar on phones and the rail from `md`.
