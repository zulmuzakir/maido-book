---
name: Maido Book
description: CS follow-up CRM for a consumable product, in the ROOVE palette. A faintly purple-grey ground, a light shell with a hairline edge, Inter with tabular figures, 1px ruled hairlines, flat pages, ROOVE purple for actions and selection, WhatsApp green for sending, and a grey / amber / vermilion scale where grey means fine and vermilion means overdue.
colors:
  background: '#f5f3f6'
  foreground: '#26212d'
  card: '#fcfbfc'
  ink: '#26212d'
  primary: '#592c82'
  primary-foreground: '#ffffff'
  primary-text: '#592c82'
  secondary: '#f0edf2'
  secondary-foreground: '#5e5868'
  muted: '#f0edf2'
  muted-foreground: '#5e5868'
  hint-foreground: '#5e5868'
  subtle: '#f0edf2'
  subtle-foreground: '#26212d'
  accent: '#eee8f5'
  accent-foreground: '#3f1f5e'
  selected: '#f5f1fa'
  selected-ring: '#cbbce0'
  border: '#d8d3de'
  rule: '#e5e1e9'
  row-rule: '#e5e1e9'
  input: '#878191'
  ring: '#cbbce0'
  avatar: '#eee8f5'
  avatar-foreground: '#3f1f5e'
  sidebar: '#fcfbfc'
  sidebar-foreground: '#26212d'
  sidebar-muted: '#5e5868'
  sidebar-accent: '#eee8f5'
  sidebar-accent-foreground: '#3f1f5e'
  sidebar-primary: '#592c82'
  sidebar-primary-foreground: '#ffffff'
  sidebar-border: '#e5e1e9'
  whatsapp: '#2a6e50'
  whatsapp-foreground: '#ffffff'
  whatsapp-text: '#2a6e50'
  wa-bubble: '#e4f3ea'
  track: '#e7e1ef'
  band-ok: '#918b99'
  band-soon: '#ad7e2b'
  band-out: '#c4573d'
  status-overdue: '#a9462a'
  status-today: '#7a5714'
  status-waiting: '#592c82'
  status-done: '#5e5868'
  status-lead: '#592c82'
  destructive: '#a9462a'
  destructive-border: '#ebc7b8'
  alert: '#fbeee8'
  alert-border: '#ebc7b8'
  alert-foreground: '#8a3a22'
  note: '#fbf1dc'
  note-foreground: '#5c4310'
  warning: '#fbf1dc'
  warning-foreground: '#5c4310'
  success-tint: '#f0edf2'
  chart-1: '#3f1f5e'
  chart-2: '#7e5baa'
  chart-3: '#b9a3d6'
  chart-4: '#c9c3cf'
  chart-5: '#8d8696'
  chart-bar: '#d9ccea'
  chart-axis: '#5e5868'
  gridline: '#e5e1e9'
  dropzone: '#fcfbfc'
  dropzone-border: '#cbbce0'
  disabled-foreground: '#b4aebb'
  shadow-tint: '#26212d'
  handle: '#d8d3de'
  scrim: 'rgb(38 33 45 / 0.45)'
typography:
  login-hero:
    fontFamily: Inter Variable
    fontSize: 44px
    fontWeight: 700
    lineHeight: 52px
    letterSpacing: -0.03em
  supply-headline:
    fontFamily: Inter Variable
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.03em
    fontFeature: '"tnum"'
  login-title:
    fontFamily: Inter Variable
    fontSize: 26px
    fontWeight: 700
    lineHeight: 32px
    letterSpacing: -0.02em
  page-title:
    fontFamily: Inter Variable
    fontSize: 24px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: -0.02em
  page-title-phone:
    fontFamily: Inter Variable
    fontSize: 22px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: -0.02em
  empty-title:
    fontFamily: Inter Variable
    fontSize: 21px
    fontWeight: 700
    lineHeight: 26px
    letterSpacing: -0.015em
  card-title:
    fontFamily: Inter Variable
    fontSize: 18px
    fontWeight: 700
    lineHeight: 22px
    letterSpacing: -0.02em
  subpage-title:
    fontFamily: Inter Variable
    fontSize: 17px
    fontWeight: 700
    lineHeight: 22px
  section-title:
    fontFamily: Inter Variable
    fontSize: 16px
    fontWeight: 700
    lineHeight: 24px
    letterSpacing: -0.02em
  name:
    fontFamily: Inter Variable
    fontSize: 15px
    fontWeight: 600
    lineHeight: 18px
  input:
    fontFamily: Inter Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  message:
    fontFamily: Inter Variable
    fontSize: 14.5px
    fontWeight: 400
    lineHeight: 22px
  body:
    fontFamily: Inter Variable
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
  button:
    fontFamily: Inter Variable
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  link:
    fontFamily: Inter Variable
    fontSize: 13.5px
    fontWeight: 600
    lineHeight: 18px
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
  bar: 3px
  sm: 3.6px
  md: 4.8px
  lg: 6px
  panel: 8px
  badge: 9px
  toast: 10px
  card: 12px
  tile: 14px
  fab: 10.8px
  sheet: 16px
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
    typography: '{typography.button}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '0 16px'
  button-primary-desk:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.button}'
    rounded: '{rounded.lg}'
    height: 40px
    padding: '0 16px'
  button-outline:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.button}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '0 16px'
  button-whatsapp:
    backgroundColor: '{colors.whatsapp}'
    textColor: '{colors.whatsapp-foreground}'
    typography: '{typography.button}'
    rounded: '{rounded.lg}'
    height: 44px
  send-button:
    backgroundColor: '{colors.card}'
    textColor: '{colors.whatsapp-text}'
    typography: '{typography.button}'
    rounded: '{rounded.lg}'
    height: 44px
    width: 100px
  choice-chip:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
    height: 44px
    padding: '0 16px'
  choice-chip-checked:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.primary-text}'
    rounded: '{rounded.lg}'
    height: 44px
  outcome-option:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.button}'
    rounded: '{rounded.lg}'
    height: 46px
    padding: '0 14px'
  outcome-option-checked:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-foreground}'
    rounded: '{rounded.lg}'
    height: 46px
  queue-row:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.name}'
    height: 80px
    padding: '10px 16px'
  queue-row-selected:
    backgroundColor: '{colors.selected}'
    textColor: '{colors.foreground}'
    height: 72px
  section-band:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.accent-foreground}'
    typography: '{typography.ui}'
    height: 36px
    padding: '0 16px'
  filter-chip-phone:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.full}'
    height: 38px
    padding: '0 14px'
  filter-chip-phone-active:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.full}'
    height: 38px
    padding: '0 14px'
  count-badge:
    backgroundColor: '{colors.sidebar-primary}'
    textColor: '{colors.sidebar-primary-foreground}'
    typography: '{typography.nav-micro}'
    rounded: '{rounded.badge}'
    height: 18px
    padding: '0 5px'
  avatar:
    backgroundColor: '{colors.avatar}'
    textColor: '{colors.avatar-foreground}'
    rounded: '{rounded.full}'
    size: 44px
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
    rounded: '{rounded.lg}'
    height: 44px
  bottom-nav-new-order:
    backgroundColor: '{colors.sidebar-primary}'
    textColor: '{colors.sidebar-primary-foreground}'
    rounded: '{rounded.fab}'
    size: 52px
  toast:
    backgroundColor: '{colors.foreground}'
    textColor: '{colors.background}'
    typography: '{typography.body}'
    rounded: '{rounded.toast}'
    height: 48px
---

# Design System: Maido Book

## Overview

**Creative North Star: "The Supply Card"**

Maido Book is the working surface of a small Indonesian customer-service team that sells a consumable product and works a daily WhatsApp follow-up queue. Every order predicts when the customer will run out, and the interface keeps that prediction in view. On the follow-up card it is the Supply Card: a large 34px "days left" figure over a banded track with a today tick, dates and a legend. On every queue row it is a stock bar whose length is the days left. The customer detail page draws supply history as a line chart (`SupplyChart`).

The palette is **ROOVE**: brand purple `#592C82` from home.roove.co.id on a faintly purple-grey paper ground. The shell is light (a `card` surface with a hairline edge), not a dark rail. Four colour rules hold everywhere:

- **Green is only for WhatsApp.** Sending a message is green; nothing else is.
- **The purple tint is only for selected or active items.** The active nav item, the selected row, a checked chip or outcome.
- **Grey means fine.** Healthy stock, done and contacted states, and the "ok" band are grey, not green.
- **Vermilion means overdue.** Out of stock, overdue labels, errors and destructive actions. Amber sits between them for "due today" and "running low".

Type is Inter with tabular figures on every count, date and phone number. Page content is flat; depth is kept for layers that float and for bars pinned to the bottom of the screen.

The values come from the ROOVE design canvas, with boards at desktop 1440, tablet 834 and phone 390 in light and dark. The earlier plum "Quiet xenops" design is retired.

**Key Characteristics:**

- Ground is `background`; sheets, rows, headers and the shell sit on the near-white `card`.
- The shell is a light rail (tablet) or sidebar (desktop) with a `sidebar-border` right edge; phones get a bottom tab bar.
- Structure is drawn with 1px hairlines (`rule`, `row-rule`, `border`), not with shadows.
- Controls have a 6px corner; panels 8 to 14px. Round is for avatars, icon circles, phone filter chips and count badges.
- Every number, date and phone value uses tabular figures (`num`).
- Phone and tablet controls are 44px (the one big phone action 48px); the `desk` variant (wide and not touch-first) drops them to 40px.
- Icons are lucide at a 1.7 stroke (`setLucideProps` in `src/routes/+layout.svelte`), 1.9 inside buttons, 2 on the active bottom tab and 2.2 on the "+".

## Colors

Values are hex and come from the `:root` block of `src/routes/layout.css`; the `.dark` block redefines every token. Never hardcode a hex in a component: the only literals left are the login hero gradient.

### Primary

- **ROOVE Purple** (`primary`): The action colour. Default button fill, the active phone filter chip, the 2px underline of active tabs, the "+" tile and the count badges (as `sidebar-primary`), the supply chart line, text selection (22% mix), `accent-color` and `caret-color`. Hover mixes the fill 18% toward `foreground`. Dark: `#6e3e9a`.
- **Purple Text** (`primary-text`): Every text use of the brand colour: back links, "Ubah" and other inline actions, the active bottom tab, the selected row's 3px left bar, counts on the active tab. It lightens to `#bb93e1` in dark mode, which `primary` cannot do and stay a fill. Do not use `text-primary`.

### Purple tints (selected and active only)

- **Soft tint** (`accent`, text `accent-foreground`): The active nav item (`sidebar-accent`), checked choice chips and outcome options, outline-button hover. Section-band titles use `accent-foreground` (`primary-text` in dark).
- **Selected row** (`selected`): The selected queue row, with a 3px inset `primary-text` bar on its left edge.
- **Ring** (`ring`, `selected-ring`): Focus. `#cbbce0` light, `#cfb6e7` dark.
- **Avatar** (`avatar`, text `avatar-foreground`): Initials circles and the brand empty-state circle.

### WhatsApp

- **WhatsApp Green** (`whatsapp`, text `whatsapp-foreground`): Filled send buttons ("Kirim ke …" on the follow-up card, the selected row's Kirim, "Chat WA" on the customer page).
- **WhatsApp text** (`whatsapp-text`): The outlined Kirim button's border, icon and label, and the WhatsApp glyph on icon buttons. `#7bc495` in dark.
- **Bubble** (`wa-bubble`): The message preview bubble in Pengaturan.

### Status scale

- **Overdue** (`status-overdue`, `destructive`): Out of stock, overdue labels and counts, the past-run-out today tick, error icons, destructive buttons. `alert` / `alert-border` / `alert-foreground` fill the error toast, the login error box and error circles; `destructive-border` edges destructive outlines.
- **Today** (`status-today`): Due today and running low (inside the lead days). `note` / `warning` with their foregrounds fill notes and the last-attempt hint.
- **Waiting and lead** (`status-waiting`, `status-lead`): Purple text labels.
- **Done** (`status-done`): Grey. Contacted and active are fine, so they do not take colour. `success-tint` is grey too.
- **Supply bands** (`band-ok` grey, `band-soon` amber, `band-out` vermilion): The large track's three segments, its legend swatches and the stock bar's fill. Nothing else. `track` is the empty groove behind the stock bar.

### Neutral

- **Paper** (`background`): The page ground; also the inset fill of the message box, side panels, the order preview and the import notes.
- **Card** (`card`, `popover`, `sidebar`, `dropzone`): Sheets, headers, rows, the shell, outline buttons, fields.
- **Ink** (`foreground`, `ink`, `subtle-foreground`): Text and the today tick. The toast is a `foreground` pill with `background` text.
- **Muted ink** (`muted-foreground`, `hint-foreground`, `secondary-foreground`, `sidebar-muted`, `chart-axis`): Meta lines, dates, healthy stock, inactive tabs and nav items, axis labels.
- **Secondary** (`secondary`, `muted`, `subtle`): Section bands, the segmented-control track, neutral icon circles; `muted` is the hover fill on rows and ghost buttons.
- **Hairlines** (`rule`, `row-rule`, `gridline`, `sidebar-border`): Section dividers, row separators, the header underline, chart gridlines, the shell edge.
- **Edges** (`border`, `input`, `dropzone-border`): Button and panel edges; field edges (`input` is darker so fields read as controls); the dashed import dropzone.
- **Charts** (`chart-1` to `chart-5`, `chart-bar`): Insights bars and series, from deep purple to grey.
- **Other**: `disabled-foreground`, `handle` (sheet grab handle), `scrim` (overlay), `shadow-tint` (the colour every shadow mixes from; black in dark).
- **Mode roles** (aliases that point at a different token in dark, so components need no `dark:` variants): `band-title` (section-band and day-band titles: `accent-foreground`, `primary-text` in dark), `inset` (hint boxes and side panels on `card`: `background`, `secondary` in dark), `field-active` (the message editor's edge: `primary`, `selected-ring` in dark), `thumb` (switch thumb: white, `card` in dark), `tab-active` (line-tab underline: `primary`, `accent-foreground` in dark).

Dark mode keys for orientation: `background #130f16`, `card #1b1620`, `foreground #d9d4de`, `muted-foreground #aca2b5`, `primary #6e3e9a`, `primary-text #bb93e1`, `accent #332341`, `selected #241a2e`, `whatsapp #2e6540`, bands `#58515e` / `#a0832a` / `#b9563a`, `status-overdue #f08a6a`, `status-today #dcaf61`.

### Named Rules

**The Green Send Rule.** `whatsapp` and `whatsapp-text` mean "send a WhatsApp message". Purple never sends; green never decorates or means "ok".

**The Tint Means Selected Rule.** `accent`, `selected` and `sidebar-accent` mark the one item that is selected, checked or current. They are not a section background or a highlight.

**The Quiet Stock Rule.** Stock with days left beyond the lead time is `muted-foreground` and its bar `band-ok` grey. Only running low (`status-today`) and out (`status-overdue`) take colour, so colour in a row always means "act".

**The Supply Band Rule.** `band-ok`, `band-soon` and `band-out` appear only in the supply track, its legend and the stock bar. A band never fills a panel, a badge, a section marker or a side border.

## Typography

**Font:** Inter Variable (with `ui-sans-serif, system-ui, sans-serif`), loaded from `@fontsource-variable/inter`.

**Character:** One neutral grotesk carried by weight (400 to 700; 800 for initials, the logo letter and badge counts) and slight negative tracking on headings.

### Hierarchy

- **Page title** (700, 24px / 30px, -0.02em from `md`; 22px / 28px on phones): The `h1` in `PageHeader`. The `subpage` variant shows a 17px / 22px bold title beside a bare back chevron on phones.
- **Supply headline** (700, 34px, -0.03em, tabular): The "days left" figure on the follow-up card, toned by the Quiet Stock Rule, with a 14px muted line after it. The large track's own label is 18px semibold.
- **Login** (700): hero 44px / 52px at -0.03em; panel title 26px / 32px.
- **Empty and error title** (700, 21px / 26px, -0.015em), with a 15px / 23px muted description.
- **Card and dialog title** (700, 18px / 22px, -0.02em): The follow-up card's customer name, dialog and sheet titles.
- **Section title** (700, 16px, -0.02em): `SectionHeading`; its small variant is 15px / 18px.
- **Name** (600, 15px / 18px): Names in queue rows and lists. Lainnya's account name is 17px.
- **Input** (400, 16px; 15px at `desk`): Fields, so iOS does not zoom on focus.
- **Message** (400, 14.5px / 22px): The WhatsApp message on the follow-up card and its editor.
- **Body and button** (14px): Body copy at 400 / 21px, toasts, buttons at 600.
- **Link** (600, 13.5px): Back links and inline purple actions ("Ubah", "Simpan").
- **UI** (`text-ui`, 13px / 16px): Meta lines, field labels (600), card section labels (600), section-band titles (700), hints. Phone queue-row meta is 12.5px.
- **Label small** (600, 12px): Track dates, legends, chart labels.
- **Nav micro** (11px bottom tabs, 11.5px rail labels; 500, bold when active): Nav labels and badge counts.

Headline figures on Ringkasan and Impor are bold, about -0.03em, and tabular.

### Named Rules

**The Tabular Figure Rule.** Any count, date, phone number or amount uses `num` (`font-variant-numeric: tabular-nums`). A figure that does not align with the figure above it is a defect.

**The No Eyebrow Rule.** Headings stand alone. No uppercase, letter-spaced kicker sits above a title; context goes in the meta line beside or under it.

## Layout

The app frame (`src/routes/(app)/+layout.svelte`) changes per device:

|            | Phone (base)                          | Tablet (`md`, 768px)               | Desktop (`xl`, 1280px)                    |
| ---------- | ------------------------------------- | ---------------------------------- | ----------------------------------------- |
| Navigation | 72px bottom tab bar with a centre "+" | 84px rail, labels under icons      | 232px sidebar, labelled rows, queue count |
| Header     | 56px, 22px title, no underline        | 68px, 24px title, `rule` underline | as tablet                                 |
| Gutters    | 16px                                  | 24px                               | 32px                                      |
| Controls   | 44px, 48px for the one big action     | 44px                               | 40px (`desk`)                             |

Each page renders its own `PageHeader` in flow on `card`; there is no global top app bar. The standard body column is `page-frame`: 72rem maximum, centred, padded 14px / 16px / 32px (top / sides / bottom) on phones, 24px / 24px / 48px from `md`, and 32px sides from `xl`.

Per-screen layout:

|            | Phone                                         | Tablet                                         | Desktop                                     |
| ---------- | --------------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| Queue      | List; detail full screen with a sticky Kirim  | Full list; detail in a 480px slide-in sheet    | List + fixed 400px detail panel (from `lg`) |
| Data lists | One-column rows, filter chips, "Muat lainnya" | Two-line rows; search on its own row           | Table with column headers                   |
| Detail     | Stacked sections; Chat WA / Order baru sticky | One column; equal-width actions under the name | Main column + 360px side column             |
| Forms      | Full-width fields; action bar above the nav   | One 600px column; sticky bottom action bar     | 560px form + 360px panel beside it          |

The queue from `lg` (1024px) is a full-height grid: `minmax(0, 1fr)` for the list and a 400px detail panel with a 1px `rule` on its left. Between `md` and `lg` the detail opens in a 480px right sheet, flush with no corner, with ✕ and previous/next in its header. On phones it fills the screen above the bottom bar.

Spacing follows a 4px step with 2px half-steps. Card sections are padded 24px horizontally and 18px vertically, separated by 1px `rule` lines.

Breakpoints: `md` 768px, `lg` 1024px, `xl` 1280px, and `desk` = 768px or wider and not `pointer: coarse`.

### Named Rules

**The Ruled Sheet Rule.** Structure is drawn with 1px hairlines: `rule` between sections, `row-rule` between rows, `border` and `input` on control edges. Group headings are tinted section bands, not boxed panels.

**The Touch Floor Rule.** Every phone and tablet control is at least 44px: buttons, fields, chips, toggling section bands, back links and the Kirim button. Phone filter chips (38px) sit in a scrolling row with gaps. Only `desk` may shrink controls, to 40px (small buttons to 32px, section toggles to 36px).

## Elevation & Depth

Page content is flat: sheets, rows, sections, section bands and the follow-up card carry no shadow. Every shadow mixes from `shadow-tint`.

### Shadow Vocabulary

- **Dialog** (`0 20px 60px`, 25%): Centred dialogs.
- **Tablet sheet** (`-12px 0 40px`, 16%): The queue's 480px right sheet.
- **Toast** (`0 12px 32px`, 30%): The ink pill. The error toast and the month-picker popover use `0 8px 24px`, 14%.
- **Bottom bar** (`0 -6px 16px`, 5%): Bars pinned to the bottom of a phone screen: `FormActions`, the follow-up card's sticky send bar, the customer page's Chat WA / Order baru bar.
- **Menu** (shadcn `shadow-md` with a `ring-1 ring-foreground/10`): Popovers and dropdown menus.
- **"+" tile** (`0 6px 16px` of `sidebar-primary` at 35%): The raised new-order tile in the bottom bar.
- **Segment** (`0 1px 2px` of `foreground` at 12%, or `shadow-sm`): The selected segment of the theme and language controls.
- **Login panel** (`0 20px 50px` black at 25%): The sign-in card over the phone and tablet hero.

### Named Rules

**The Flat-Page Rule.** No shadow on page content, cards, rows or sections. Floating layers (dialog, sheet, toast, popover, menu), pinned bottom bars, the "+" tile, the selected segment and the login panel may carry theirs.

## Shapes

The base `--radius` is 6px (`rounded-lg`): buttons, fields, chips, outcome options and nav rows. Derived steps are 3.6px (`sm`), 4.8px (`md`), 8.4px (`xl`) and 10.8px (`2xl`).

- 1 to 3px: legend swatches (1px), the large track (2px), the stock bar and its groove (3px).
- 8px: the message box and its editor, hints, segments.
- 9 to 10px: count badges (pill-shaped at their height), toasts, the segmented-control track, the logo tile.
- 12px: side panels, the order preview, the month picker, the login card.
- 14px: import cards and the dropzone.
- 10.8px (`rounded-2xl`): the bottom bar's "+" tile and the rail's active pill.
- 16px: the top of phone bottom sheets.
- Round: initials avatars, empty-state and error-state circles, phone filter chips, the switch, radio items and the today tick.
- The WhatsApp preview bubble is 10px with a 3px bottom-left corner.

### Named Rules

**The Small Corner Rule.** Buttons and fields keep the 6px corner; nothing that holds an action becomes a pill. Round is for avatars, icon circles, switches, ticks, count badges and the phone filter chips.

## Components

### Buttons

Semibold 14px text, a 6px corner, a 1px press on `active`, icons at 16px with a 1.9 stroke, and 45% opacity when disabled.

- **Sizes**: `default` 44px (40px at `desk`); `lg` 48px for the one big action on a phone screen (40px at `desk`); `sm` 36px (32px at `desk`) with 13px text; `icon` 44px (40px).
- **Primary**: `primary` fill, white text. Hover mixes 18% toward `foreground`.
- **WhatsApp**: `whatsapp` fill; the card's send button stays 44px at every width.
- **Outline**: `card` fill, `border` edge, hover `accent`.
- **Secondary**: `secondary` fill; snooze and date chips. A chosen date chip switches to primary.
- **Ghost**: transparent until hover, then `muted`; sheet close, the queue's previous/next, inline purple actions (`text-primary-text`, hover `accent`).
- **Destructive outline / solid**: 45% `destructive` edge on `card` with an `alert` hover, or a `destructive` fill.
- **Focus**: a 3px `ring` halo; invalid controls take a `destructive` edge and a 3px `destructive/20` halo. The global `:focus-visible` outline is 2px `ring` at a 2px offset.

### Send button (`WaIconButton`)

With a label it is the queue's Kirim: 44px, a `whatsapp-text` outline on `card` with a speech-bubble icon, 100px wide with the word "Kirim" from `md` (icon only on phones). On the selected row it turns into a solid `whatsapp` fill. Without a label it is a 44px (40px `desk`) `input`-edged square with the WhatsApp glyph. After a message is sent, the row shows an outline "Kirim lagi" button instead.

### Chips and Tabs

- **Phone filter chips** (`FilterTabs`): 38px round pills, 14px side padding, 13.5px semibold. Inactive: `border` edge on `card`. Active: `primary` fill, white text. Counts follow the label in tabular figures. The row scrolls horizontally and keeps the active chip in view.
- **Tabs** (`md` and up, or `underline`): 44px text tabs 26px apart, no fill or edge. Inactive: 500 `muted-foreground`; active: 600 `foreground` with a 2px `primary` bar along the bottom and its count in `primary-text`.
- **Choice chips** (`choiceChip` in `src/lib/styles.ts`): 44px, 15px semibold, `input` edge on `card`. Checked: `accent` fill, `primary` edge plus a 1px inset `primary` ring, `primary-text` label. Used for dose, quantity and similar choices.
- **Status labels** (`StatusBadge`): semibold coloured text with no box.

### Queue

- **Section band** (`GroupHeader`): a full-width `secondary` band, 36px, with a 1px `rule` above and below, on the 16/24/32px gutters. A 13px bold title in `accent-foreground` (`primary-text` in dark) and a 13px semibold count: `status-overdue` for overdue, `status-today` for due today, muted otherwise. A section that folds is 44px (36px at `desk`) with a chevron.
- **Queue row** (`QueueRow`): at least 80px on phones and 72px from `md`, with a 1px `row-rule` beneath and a 44px avatar (16px extra-bold initials).
  - Phone: name, a 12.5px meta line (order date · quantity), then the stock bar; icon-only send.
  - Tablet: name and "order · quantity · dose", a 150px status column (stock text over the bar), Kirim.
  - Desktop: an extra 160px dose column.
  - Hover fills `muted`. **Selected**: `selected` fill with a 3px inset `primary-text` bar on the left.
- **Stock bar** (small `SupplyTrack`): 6px on a `track` groove with 3px corners. Its length is the days left (full at 14 days or more, and full when out), its fill the band colour. In rows it is decorative; the text beside it carries the state.
- **Empty detail panel**: a centred 52px `avatar` circle, a 15px semibold line and a 14px muted hint.

### Follow-up card

One column on `card`:

- **Header**: 24px side padding, avatar, 18px bold name linking to the customer, a 13px tabular meta line and a purple "Ubah" link.
- **Supply section**: the 34px headline (days left, toned) with a 14px muted line, then the large track.
- **Message**: a 13px semibold label with an "Ubah" ghost action. The message shows in an 8px `background` box at 14.5px / 22px. Editing swaps it for a 132px textarea with a `primary` edge and a 3px `ring`, a character count and Batal / Simpan.
- **Outcome** (`FollowUpOutcome`): full-width 46px options with a 6px corner, `border` edge and 14px semibold text; "Sudah order" links to a new order with an arrow icon. On the tablet sheet the options sit in two columns until one is picked. Checked: `accent` fill, `primary` edge plus a 1px inset ring, `accent-foreground` text and a check icon. Then the hint (on `background`, or amber for the last attempt), date chips and a field-styled date picker.
- Sections are separated by 1px `rule` and padded 18px by 24px. The send button sits in a sticky bottom bar with the bottom-bar shadow.

### The Supply Card (signature)

The large `SupplyTrack` spans from the order date to the run-out date plus a vermilion tail (at least 7 days, or 20% of the supply). Bands: `band-ok` up to the run-out date minus the lead days, `band-soon` up to the run-out date, then `band-out`. Elapsed time is washed with `card` at 55%; what is left stays at full strength. Weekly rules are 1px lines of `card` at 85%. The today tick is 2px wide, round, `foreground`, overhanging the track by 4px above and below; once past the tail it pins to the end in `status-overdue`.

- **Large** (follow-up card, new-order preview): 12px high, 2px corner, an 18px semibold label when shown, a due tick (1px, `foreground/60`) under the track, the order and run-out dates in 12px tabular muted text, and a three-swatch legend.
- **Small**: the stock bar (see Queue), optionally with a 13px semibold toned label above it.
- **Supply chart** (customer detail): a `primary` line with a `primary/12` area fill over `gridline` rules, with dated peaks and labelled gaps; run-outs are marked in `status-overdue`.

### Inputs / Fields

Fields are 44px (40px at `desk`), 6px corner, 1px `input` edge on `card`, 16px text (15px at `desk`), with no shadow. Focus moves the edge to `primary` with a 3px `ring` halo. Invalid fields take a `destructive` edge and a 3px `destructive/20` halo. Placeholders are `muted-foreground`.

### Form pages

New customer, edit customer and new order share one pattern. Build new form pages from the same pieces (`fieldLabel`, `fieldStack` and `choiceChip` in `src/lib/styles.ts`, `DoseField`, `FormActions`) rather than restyling fields per page.

- **Header**: `PageHeader` with `variant="subpage"` and a `back` link: a 13.5px semibold `primary-text` link above the title from `md`, a bare chevron and a 17px title on phones.
- **Column**: one centred column up to 600px on phones and tablets; from `xl` a 560px form beside a 360px side panel (estimate, preview or customer summary) on a 12px `background` panel.
- **Fields**: 18px between fields, 6px between a label, its control and its hint or error. Labels are 13px semibold; hints are 13px muted.
- **Sections**: no boxed panels in the form itself. A secondary group (a disclosure, a delete row or danger zone) is set off by a 1px `rule`.
- **Actions** (`FormActions`): pass the primary first; it shows last, on the right.
  - Phone: a bar fixed just above the bottom nav, with a `rule` top edge and the bottom-bar shadow; the primary is about 1.6× the secondary's width.
  - Tablet: a sticky bar at the bottom of the form.
  - Desktop: inline and right-aligned.
  - An optional `note` (error summary, "what happens on save") sits above the buttons on phones and to their left from `md`.

### Navigation

- **Rail** (`md`): 84px, `sidebar` with a `sidebar-border` right edge. Each item is a 20px icon over an 11.5px label. The active item puts a 56×32 `sidebar-accent` pill behind the icon and bolds the label. The queue count badge sits at the icon's top right.
- **Sidebar** (`xl`): 232px. The logo (a 30px `sidebar-primary` tile with the "M", then the app name), then 44px rows with a 19px icon and a 14px label, 6px corner. Hover `sidebar-accent/60`; active `sidebar-accent` with `sidebar-accent-foreground` semibold text. The queue count is an inline badge. Secondary items and the user menu sit at the bottom above a hairline.
- **Count badge**: `sidebar-primary` fill, white extra-bold 11px tabular figures, 18px high (20px in the sidebar) and rounded to a pill.
- **Bottom bar** (phone): `sidebar` with a `sidebar-border` top edge, 66px slots plus the home-indicator inset, five slots: Antrian, Pelanggan, the "+" tile, Order and Lainnya. Each slot is a 22px icon over an 11px label. The active slot is bold `primary-text` with a 2-stroke icon; inactive `sidebar-muted`. The "+" is a 52px `sidebar-primary` tile with a 10.8px corner, lifted 24px with its purple shadow.
- **Sub-page header**: on phones, Ringkasan, Pengaturan, Impor and forms show a bare 44px back chevron and a 17px title.

### Dialogs, sheets and toasts

- **Dialogs** (`ResponsiveDialog`): centred, 480px wide on tablet and 440px on desktop, 18px bold title, 14px muted description. On phones they become bottom sheets with 16px top corners, a 36×4px `handle` and safe-area padding.
- **Toasts**: bottom centre of the content area (offset by the rail or sidebar, above the bottom bar on phones). A 48px `foreground` pill with `background` text, a 10px corner, a leading check and the undo action in a soft grey chip. Errors are a 376px `alert` box with an `alert-border` edge and `alert-foreground` text.
- **Empty and error states**: centred, a 72px round icon circle (`secondary`, `avatar`, `alert` or `success-tint` by tone) with a 30px icon, the 21px title, the 15px description, and actions that stack at 48px full width on phones and sit side by side at 44px from `md`.

### Login and Lainnya

- **Login** (`/login`): a ROOVE purple gradient hero (170°, `#592C82` → `#3F1F5E`; `#6E3E9A` → `#3F1F5E` in dark) with white text. From `xl` the hero fills the left and a 560px `card` column holds the sign-in panel; below it the sign-in card (12px corner, login-panel shadow) sits over the hero. A segmented language switch (42px track, 10px corner) and an `alert` error box.
- **Lainnya** (`/more`): the account (44px avatar, 17px name) and grouped list bands on `card`, separated by 8px `background` gaps with hairlines, preference rows with icons, and an outlined sign-out. From `md` the list sits in a bordered panel up to 36rem.

## Do's and Don'ts

### Do:

- **Do** use `whatsapp` / `whatsapp-text` for sending and nothing else.
- **Do** keep the purple tints (`accent`, `selected`, `sidebar-accent`) for the selected, checked or current item.
- **Do** leave fine states grey: healthy stock, done, contacted. Colour only running low (`status-today`) and overdue (`status-overdue`).
- **Do** use `primary-text` (not `text-primary`) for brand-coloured text.
- **Do** use `num` on every count, date, phone number and amount.
- **Do** draw dividers and edges with 1px `rule`, `row-rule`, `border` and `input`.
- **Do** keep phone and tablet controls at 44px and shrink them only through `desk`.
- **Do** use theme tokens; mix shadows from `shadow-tint`.

### Don't:

- **Don't** use green for "ok", "done" or "active"; grey means fine.
- **Don't** use a band colour as decoration, on a panel, a badge, a section marker or a side border.
- **Don't** put shadows on cards, rows or sections; shadows are for floating layers and pinned bottom bars.
- **Don't** make a button or field a pill; round is for avatars, icon circles, switches, ticks, count badges and phone filter chips.
- **Don't** add gradients or glass surfaces. The login hero is the one gradient.
- **Don't** hardcode hex values or `text-white` on themed surfaces.
- **Don't** add eyebrow or kicker labels above headings.
- **Don't** add a top app bar; navigation is the bottom bar on phones and the rail or sidebar from `md`.
