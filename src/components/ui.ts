/*
 * The recurring pieces of the interface, as utility strings.
 *
 * A card looks the same on eight pages, so the class list lives here once and
 * is composed at the call site — `className={`${CARD} ${CHART_CARD}`}`. This is
 * the Tailwind equivalent of the component classes the old stylesheets held,
 * with the difference that these are plain strings: nothing is generated, and
 * what an element renders with is always readable from the element itself.
 */

/* ------------------------------------------------------------------ cards */

export const CARD =
  'rounded-md border border-line bg-panel shadow-[var(--shadow-card)] backdrop-blur-[14px]'

/* Wraps rather than overflows: a title beside a segmented control has no room
   for both on a 320px phone, and without wrapping the control pushed the page
   23px wider than the screen. The row gap only applies once it has wrapped. */
export const CARD_HEAD =
  'flex flex-wrap items-start justify-between gap-x-20 gap-y-12'
export const CARD_TITLE = 'text-[16px] font-medium tracking-[-0.01em] text-fg-strong'
export const CARD_SUB = 'mt-4 text-[13px] text-fg-muted'

export const LINK =
  'inline-flex items-center gap-5 text-[12.5px] font-medium tracking-[0.04em] text-fg-dim transition-colors duration-150 hover:text-fg-strong'

/* -------------------------------------------------------------- page head */

export const PAGE_HEAD =
  'flex items-start justify-between gap-20 px-2 pt-6 pb-2 max-shell:flex-col'
export const PAGE_TITLE = 'text-[27px] font-semibold tracking-[-0.02em] text-fg-strong'
export const PAGE_SUB = 'mt-3 text-[13px] text-fg-muted'
export const PAGE_ACTIONS = 'flex flex-none gap-10'

/*
 * Shape only. Colour belongs to exactly one of the two state classes below,
 * never here: Tailwind settles bg-tint-1 against bg-accent by their order in
 * the stylesheet, not by the order they appear in a class attribute, and
 * bg-tint-1 comes later. A base colour here therefore beat PILL_ACCENT and
 * painted every primary button in the app — Save settings, Save profile, Log
 * trade — as a dim grey pill that read as disabled.
 */
export const PILL =
  'inline-flex items-center gap-8 rounded-sm border px-15 py-9 text-[12.5px] font-medium transition-[color,border-color,background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100'

export const PILL_IDLE =
  'border-line bg-tint-1 text-fg-dim hover:border-line-strong hover:bg-tint-2 hover:text-fg-strong'

export const PILL_ACCENT =
  'border-transparent bg-accent text-accent-ink shadow-[0_6px_18px_-8px_var(--color-accent)] hover:bg-accent-strong hover:text-accent-ink'

/* --------------------------------------------------------------- numerals */

export const POS = 'text-green'
export const NEG = 'text-red'
export const MONO = 'font-mono text-[13px] tracking-[-0.01em]'

/* -------------------------------------------------------------- stat row */

/**
 * The five headline figures, in a row that answers to its own width.
 *
 * `auto-fit` at every size rather than five columns until a viewport
 * breakpoint. The row lives inside a widget the trader can resize now, and
 * a viewport breakpoint cannot see that: dragged narrow on a wide screen it
 * would hold five columns and squash them to nothing.
 */
export const STAT_ROW =
  'grid h-full auto-rows-fr grid-cols-[repeat(auto-fit,minmax(142px,1fr))] gap-8'
export const STAT_CARD = 'flex min-h-118 flex-col gap-6 px-16 pt-15 pb-15'
export const STAT_LABEL =
  'text-[11px] font-medium tracking-[0.13em] text-fg-muted uppercase'
export const STAT_VALUE =
  'text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] text-fg-strong'
export const STAT_FOOT = 'mt-auto text-[12.5px] text-fg-muted'
export const DELTA = 'inline-flex items-center gap-6 text-green'

export const METER = 'h-4 overflow-hidden rounded-full bg-tint-3'
export const METER_FILL =
  'block h-full rounded-[inherit] bg-[linear-gradient(90deg,var(--color-accent-strong),var(--color-accent))]'

/* ------------------------------------------------------------ shared table */

export const TABLE_WRAP = 'mt-18 overflow-x-auto'
export const TABLE = 'w-full min-w-720 border-collapse'
export const TH =
  'border-b border-line px-16 pb-12 text-left text-[10.5px] font-medium tracking-[0.14em] text-fg-muted uppercase'
export const TD = 'border-b border-line px-16 py-15 align-middle'
/** An accent rail wipes in down the first cell on hover. */
export const ROW =
  'transition-colors duration-150 hover:bg-tint-1 last:[&>td]:border-b-0 ' +
  "[&>td:first-child]:relative [&>td:first-child]:before:absolute [&>td:first-child]:before:inset-y-0 [&>td:first-child]:before:left-0 [&>td:first-child]:before:w-2 [&>td:first-child]:before:origin-center [&>td:first-child]:before:scale-y-0 [&>td:first-child]:before:bg-accent [&>td:first-child]:before:transition-transform [&>td:first-child]:before:duration-[220ms] [&>td:first-child]:before:content-[''] hover:[&>td:first-child]:before:scale-y-100"

export const CHIP =
  'inline-block rounded-full border border-line bg-tint-1 px-12 py-5 text-[11.5px] font-medium text-fg-dim'

export const TICKER = 'block text-[15px] font-semibold text-fg-strong'
export const COMPANY = 'mt-1 block text-[11.5px] text-fg-muted'
export const DASH = 'text-fg-muted'

export const SIDE_BADGE =
  'inline-block min-w-58 rounded-[5px] px-10 py-4 text-center text-[10px] font-semibold tracking-[0.09em]'
export const SIDE_LONG = 'text-green bg-[color-mix(in_srgb,var(--color-green)_16%,transparent)]'
export const SIDE_SHORT = 'text-red bg-[color-mix(in_srgb,var(--color-red)_16%,transparent)]'

export const STATUS_DOT = 'inline-block size-8 rounded-full bg-fg-muted'
export const STATUS_OPEN =
  'bg-green shadow-[0_0_10px_color-mix(in_srgb,var(--color-green)_80%,transparent)]'

/* ------------------------------------------------------------- segmented */

export const SEGMENTED =
  'relative flex gap-4 rounded-sm border border-line bg-tint-1 p-4'
/*
 * The colour deliberately lives in the two state classes below, never here.
 * Tailwind resolves a conflict like text-fg-muted vs text-accent-ink by their
 * order in the stylesheet, not by the order they appear in a class attribute —
 * and text-fg-muted happens to come later, so a base colour here silently won
 * over the active one and painted the selected label muted grey on the accent
 * fill. Applying exactly one of them removes the conflict instead of
 * out-specifying it.
 */
/*
 * 6px, not rounded-sm, and that is nesting rather than a stray value: the
 * track around it is rounded-sm (10px) with 4px of padding, so the segment's
 * corner has to be 10 − 4 to sit concentrically inside it. Matching the
 * outer radius instead leaves a visible crescent of track in each corner.
 */
export const SEGMENT =
  'rounded-[6px] px-14 py-5 text-[12px] font-medium tracking-[0.04em] transition-[color,background-color] duration-150 active:scale-[0.97]'
export const SEGMENT_IDLE = 'text-fg-muted hover:text-fg'
export const SEGMENT_ACTIVE = 'bg-accent text-accent-ink'

/* ------------------------------------------------------------ empty state */

export const TABLE_EMPTY = 'px-20 pt-34 pb-30 text-center text-[13px] text-fg-muted'
export const DATA_ERROR =
  'rounded-sm border border-[color-mix(in_srgb,var(--color-red)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-red)_10%,transparent)] px-15 py-11 text-[12.5px] leading-[1.5] text-red'

/* ------------------------------------------------------------------ motion */

/*
 * The entrance staggers, which were structural selectors in the old motion
 * layer and are arbitrary variants on the parent here. Reading them off the
 * container is closer to the truth than the old stylesheet was: the delay
 * belongs to a child's position in a list, which only the list knows.
 */

/** Page sections, replayed on every route change by the key on <main>. */
export const CONTENT_STAGGER =
  '[&>*]:animate-rise [&>*:nth-child(1)]:[animation-delay:20ms] [&>*:nth-child(2)]:[animation-delay:80ms] [&>*:nth-child(3)]:[animation-delay:140ms] [&>*:nth-child(4)]:[animation-delay:200ms] [&>*:nth-child(n+5)]:[animation-delay:260ms]'

/** Second-level stagger for a row of cards inside a section. */
export const ROW_STAGGER =
  '[&>*]:animate-rise [&>*:nth-child(1)]:[animation-delay:60ms] [&>*:nth-child(2)]:[animation-delay:120ms] [&>*:nth-child(3)]:[animation-delay:180ms] [&>*:nth-child(4)]:[animation-delay:240ms] [&>*:nth-child(5)]:[animation-delay:300ms]'

/** Table rows, which come in after the card that holds them. */
export const ROWS_STAGGER =
  '[&>tr]:animate-rise [&>tr:nth-child(1)]:[animation-delay:140ms] [&>tr:nth-child(2)]:[animation-delay:200ms] [&>tr:nth-child(3)]:[animation-delay:260ms] [&>tr:nth-child(4)]:[animation-delay:320ms] [&>tr:nth-child(n+5)]:[animation-delay:380ms]'

/** Lift on hover, shared by every card that is also a target. */
export const CARD_HOVER =
  'transition-[transform,background-color,border-color,box-shadow,color] duration-[220ms] ease-out hover:-translate-y-3 hover:border-line-strong hover:shadow-[var(--shadow-lift)]'

/** Counting figures reserve digit width so the layout cannot twitch. */
export const TABULAR = 'tabular-nums'

/* ------------------------------------------------------------ insight card */

export const INSIGHT_CARD = 'px-20 pt-18 pb-20'
export const INSIGHT_KICKER =
  'flex items-center gap-8 text-[10.5px] font-medium tracking-[0.15em] text-fg-dim uppercase'
export const INSIGHT_TITLE =
  'mt-12 text-[18px] font-medium tracking-[-0.01em] text-fg-strong break-words hyphens-auto'
export const INSIGHT_BODY =
  'mt-8 text-[13.5px] leading-[1.55] text-fg-dim break-words hyphens-auto [&_strong]:font-medium'

/** Loading placeholder bars. */
export const SHIMMER =
  'h-10 animate-shimmer rounded-[4px] bg-[linear-gradient(90deg,var(--color-tint-1)_25%,var(--color-tint-3)_50%,var(--color-tint-1)_75%)] bg-[length:200%_100%]'

/* ----------------------------------------------------------------- charts */

/*
 * The tooltip overhangs the card's right edge, and `backdrop-blur` on CARD
 * makes the card a stacking context the tooltip cannot escape — so the card
 * itself has to outrank the ones beside it, or the tooltip is painted under
 * whichever card comes later in the DOM. Raising the card is safe: the grid
 * columns have a gap, so nothing but the tooltip ever overlaps.
 */
/**
 * The equity card, which fills whatever height the row turns out to be.
 *
 * A column, so the plot below the header can take the remaining space
 * rather than standing at a fixed 400px. The rail beside it holds cards
 * whose height depends on what the coach wrote, and a chart that could
 * not follow left a dead rectangle underneath it on exactly the days the
 * coach had most to say.
 */
export const CHART_CARD = 'relative z-20 flex h-full flex-col px-18 pt-17 pb-14'


/** The plot body. touch-action keeps vertical scrolling alive over the chart. */
/*
 * pl-46 reserves the Y axis; pr-10 keeps the last point off the card edge,
 * where the marker used to half-overhang and the curve looked sheared off.
 */
/**
 * Grows into the space the card has, never below a readable minimum.
 *
 * The SVG inside is `preserveAspectRatio="none"`, so it simply fills
 * whatever box it is given — the strokes already carry
 * `non-scaling-stroke` for precisely this reason.
 */
/** Everything about the plot box except how tall it is. */
export const PLOT_BASE = 'relative mt-4 touch-pan-y pl-46 pr-10'

/**
 * The dashboard plot: grows into the space its card has.
 *
 * Stated as its own constant rather than PLOT_BASE plus an override at
 * the call site. Two height utilities on one element are settled by the
 * order Tailwind happens to emit them in, not by the order they are
 * written — so an override like that works until a rebuild reorders it.
 */
export const PLOT =
  `${PLOT_BASE} min-h-270 flex-1 max-shell:min-h-250`

/*
 * The drawing area, and the containing block for everything positioned against
 * the curve. It has to be its own element: a percentage `left` resolves against
 * the containing block's PADDING box, so anchoring the marker to PLOT put every
 * point 46px too far left — the full gutter at the first point, tapering to
 * nothing at the last. Nesting an unpadded box inside the padded one makes 0%
 * and 100% mean the ends of the curve, which is what the geometry assumes.
 */
export const PLOT_AREA = 'relative h-full'
export const PLOT_SVG = 'block h-full w-full overflow-visible'

export const GRIDLINES =
  'animate-fade [&_line]:stroke-grid [&_line]:[stroke-width:1] [&_line]:[stroke-dasharray:2_7] [&_line]:[vector-effect:non-scaling-stroke]'

/**
 * The curve itself, drawn in by the `draw` keyframe.
 *
 * No `stroke-dasharray` here on purpose — it belongs to the animation and is
 * declared inside the keyframe. Left on the element it survived the animation
 * and truncated the line: see the note above @keyframes draw in index.css.
 * The path still needs `pathLength="1"` for the keyframe's dash to span it.
 */
export const EQUITY_LINE =
  'animate-draw stroke-chart-line [stroke-width:2] [stroke-linecap:round] [filter:drop-shadow(0_0_10px_var(--color-chart-glow))]'

export const CHART_AREA = '[animation:fade_0.9s_0.35s_ease_backwards]'
export const CROSSHAIR =
  '[animation:fade_0.4s_1.15s_ease_backwards] stroke-line-strong [stroke-width:1] [stroke-dasharray:3_4]'

export const PLOT_MARKER =
  'pointer-events-none absolute -mt-[4.5px] -ml-[4.5px] size-9 animate-pop rounded-full bg-chart-line shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] transition-[left,top] duration-[80ms] ease-linear [animation-delay:1.1s]'

export const TOOLTIP =
  'pointer-events-none absolute z-[2] flex animate-rise translate-x-[-50%] translate-y-[calc(-100%-18px)] flex-col gap-3 rounded-md border border-line-strong bg-panel-solid px-16 py-10 whitespace-nowrap shadow-[var(--shadow-pop)] transition-[left,top] duration-[80ms] ease-linear [animation-delay:1.15s] ' +
  /* The card is centred on the hovered point, so half of it sits outside the
     plot whenever that point is the first or last one — which on the dashboard
     is the default, and pushed the whole page 21px wider than the phone.
     EquityChart clamps `left` against this half-width; the cap and the clip
     keep that number honest if a formatted balance ever runs long. */
  'max-w-176 overflow-hidden [--tooltip-half:88px]'

export const TOOLTIP_DATE = 'text-[11.5px] text-fg-muted'
export const TOOLTIP_VALUE =
  'text-[19px] font-semibold tracking-[-0.01em] text-fg-strong tabular-nums'

export const Y_AXIS =
  'absolute inset-y-0 left-0 w-46 [&>span]:absolute [&>span]:right-12 [&>span]:-translate-y-1/2 [&>span]:text-[11px] [&>span]:whitespace-nowrap [&>span]:text-fg-muted'

export const X_AXIS =
  'relative mt-6 ml-46 mr-10 h-22 [&>span]:absolute [&>span]:-translate-x-1/2 [&>span]:text-[11px] [&>span]:whitespace-nowrap [&>span]:text-fg-muted'

export const CHART_EMPTY = 'px-10 py-46 text-center text-[13px] text-fg-muted'

/* ---------------------------------------------------------------- journal */

/**
 * The filter row sits above whatever follows it, because its dropdowns do.
 *
 * The lift has to be here rather than on the panel. CARD carries
 * `backdrop-blur`, and a backdrop-filter creates a stacking context — so a
 * panel inside a card is sealed into that card's context and its own z-index
 * counts for nothing outside it. However high the panel goes, the card as a
 * whole still paints in DOM order, which puts the summary cards below it on
 * top of any open dropdown.
 *
 * Raising the row is what actually moves those panels forward, and it fixes
 * all three filters at once rather than each one separately.
 */
export const FILTER_ROW =
  'relative z-30 grid grid-cols-4 gap-14 max-[1100px]:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]'
export const FILTER_CARD = 'flex cursor-pointer flex-col gap-10 px-18 pt-15 pb-16'

/**
 * A filter card that is entirely one button.
 *
 * The padding lives here rather than on the card so the click target fills
 * it: with the card padded and a small control inside, most of what looks
 * like a button isn't one, and finding the few pixels that open the menu is
 * a puzzle the trader has to solve every time.
 */
export const FILTER_SHELL = 'relative'
/**
 * Applied to the filter card whose menu is open.
 *
 * Every card carries backdrop-blur, and a backdrop-filter establishes its own
 * stacking context — so the panel's z-index only ordered it within its card,
 * and the cards after it in the row painted straight over the top. Raising the
 * card itself is what puts the menu above its neighbours.
 */
export const FILTER_SHELL_OPEN = 'z-50'
export const FILTER_TRIGGER =
  'flex w-full cursor-pointer flex-col gap-10 px-18 pt-15 pb-16 text-left'
export const FILTER_LABEL = 'text-[12.5px] font-medium text-fg-dim'
export const FILTER_FIGURE = 'text-[14.5px] font-medium tabular-nums'

export const SUMMARY_ROW =
  'grid grid-cols-3 gap-16 max-[1100px]:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]'
export const SUMMARY_CARD = 'relative overflow-hidden px-20 pt-18 pb-20'
export const SUMMARY_LABEL =
  'text-[10.5px] font-medium tracking-[0.14em] text-fg-muted uppercase'
export const SUMMARY_VALUE =
  'mt-8 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums'
export const SUMMARY_FOOT = 'mt-8 text-[11.5px] text-fg-muted'
export const SUMMARY_WATERMARK =
  'pointer-events-none absolute right-14 bottom-16 text-fg-muted opacity-12'

export const RESULT_BADGE = 'inline-block rounded-sm px-11 py-4 text-[11.5px] font-medium'
export const RESULT_WIN =
  'text-green bg-[color-mix(in_srgb,var(--color-green)_16%,transparent)]'
export const RESULT_LOSS = 'text-red bg-[color-mix(in_srgb,var(--color-red)_16%,transparent)]'

export const PAGER_BUTTON =
  'grid h-28 min-w-28 place-items-center rounded-sm px-8 text-[12.5px] text-fg-dim transition-[color,background-color] duration-150 hover:text-fg-strong hover:bg-tint-2 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-fg-dim active:not-disabled:scale-90'
export const PAGER_ACTIVE = 'bg-accent text-accent-ink'

/* ------------------------------------------------------------- form atoms */

/*
 * FIELD dresses its own inputs through descendant variants, the way the old
 * `.field input` rules did. Putting it on the wrapper keeps every text box,
 * select and textarea in the app identical without each one carrying twenty
 * utilities of its own.
 */
/* Controls are transparent: they sit on a card that already has a surface, and
   a second fill on top of it muddies both. The border carries the affordance,
   and accent-on-focus carries the state — outline-none means that border is the
   only focus indicator, so it must not be dropped. */
const CONTROL =
  '[&_input]:w-full [&_input]:rounded-sm [&_input]:border [&_input]:border-line [&_input]:bg-transparent [&_input]:px-13 [&_input]:py-10 [&_input]:text-fg [&_input]:outline-none [&_input]:transition-[border-color,background-color] [&_input]:duration-150 ' +
  '[&_textarea]:w-full [&_textarea]:min-h-68 [&_textarea]:resize-y [&_textarea]:rounded-sm [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-transparent [&_textarea]:px-13 [&_textarea]:py-10 [&_textarea]:font-[inherit] [&_textarea]:text-fg [&_textarea]:outline-none ' +
  '[&_select]:w-full [&_select]:cursor-pointer [&_select]:appearance-none [&_select]:rounded-sm [&_select]:border [&_select]:border-line [&_select]:bg-transparent [&_select]:py-10 [&_select]:pr-30 [&_select]:pl-13 [&_select]:text-fg [&_select]:outline-none ' +
  // No chevron here: <Select> renders a real one so it can animate. The
  // right padding reserves its space.
  '[&_option]:bg-panel-solid [&_option]:text-fg ' +
  '[&_input::placeholder]:text-fg-muted [&_textarea::placeholder]:text-fg-muted ' +
  '[&_input:focus-visible]:border-accent ' +
  '[&_select:focus-visible]:border-accent [&_textarea:focus-visible]:border-accent'

export const FIELD = `flex min-w-0 flex-col gap-7 ${CONTROL}`

export const FIELD_LABEL =
  'flex items-baseline justify-between gap-10 text-[11.5px] font-medium tracking-[0.02em] text-fg-dim [&_b]:font-medium [&_b]:text-accent-strong'
export const FIELD_ASIDE = 'text-[11px] font-normal text-fg-muted hover:text-accent-strong'
export const FIELD_HINT = 'text-[11.5px] leading-[1.5] text-fg-muted'

/*
 * Both halves take the same width, so a dropdown beside a text box reads as
 * one control rather than an input with something bolted to the end. The
 * span is <Select>'s wrapper; a bare button in the pair (the password reveal)
 * keeps its content width.
 */
export const INPUT_PAIR =
  'flex gap-8 [&>input]:min-w-0 [&>input]:flex-1 [&>span]:min-w-0 [&>span]:flex-1'

/*
 * The chevron lives on a wrapper rather than in the select's background, so
 * it can turn over when the list opens. `peer` on the select is what lets the
 * icon see the focus.
 */
export const SELECT_SHELL = 'relative flex w-full min-w-0 items-center'
export const SELECT_CHEVRON =
  'pointer-events-none absolute right-12 text-fg-muted transition-[transform,color] duration-200 ease-out peer-focus:rotate-180 peer-focus:text-accent-strong'

/* ----------------------------------------------------------------- modal */

/** Width is deliberately not set here: two w-* utilities on one element would
 *  resolve by stylesheet order rather than by which was written last, so each
 *  dialog picks MODAL_WIDE or MODAL_NARROW instead. */
/*
 * m-auto is load-bearing. A modal <dialog> is centred by the browser through
 * the `margin: auto` in its UA stylesheet, and Preflight zeroes the margin on
 * every element — without this the dialog pins to the top-left corner.
 */
export const MODAL =
  'm-auto max-h-[min(88vh,900px)] overflow-hidden rounded-lg border border-line-strong bg-panel-solid p-0 text-fg shadow-[var(--shadow-pop)] ' +
  'open:[animation:modal-in_0.28s_cubic-bezier(0.22,0.8,0.3,1)_backwards] ' +
  'backdrop:bg-[rgba(6,5,15,0.62)] backdrop:backdrop-blur-[3px] open:backdrop:[animation:fade_0.28s_ease_backwards]'

/**
 * Head, scrolling middle, pinned foot.
 *
 * The dialog caps its own height and hides its overflow, so something inside
 * has to be the thing that scrolls. Without this the tail of a long body is
 * simply clipped — and since the footer is the last child, what gets clipped
 * is the buttons.
 */
export const MODAL_SHELL = 'flex max-h-[inherit] flex-col'

export const MODAL_FORM = MODAL_SHELL
export const MODAL_HEAD =
  'flex items-start justify-between gap-20 border-b border-line px-26 pt-22 pb-18'
export const MODAL_TITLE = 'text-[21px] font-semibold tracking-[-0.02em] text-fg-strong'
export const MODAL_SUB = 'mt-4 max-w-[52ch] text-[12.5px] text-fg-muted'
/** No rotation: this used to be a PlusIcon turned 45 degrees into an X, which
 *  quietly renders as a plus for anything passing a real CloseIcon. */
export const MODAL_CLOSE =
  'grid size-32 flex-none place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'
export const MODAL_BODY = 'flex flex-col gap-22 overflow-y-auto px-26 pt-22 pb-26'
export const MODAL_FOOT =
  'flex flex-wrap items-center justify-between gap-16 border-t border-line bg-tint-1 px-26 py-15'
/** Turns red when it carries an alert, the way the old selector did. */
export const MODAL_NOTE = 'text-[11.5px] text-fg-muted [&[role=alert]]:text-red'
export const MODAL_BUTTONS = 'flex gap-10'

/* ---------------------------------------------------------- field groups */

export const FIELD_GROUP = 'm-0 border-none p-0'
export const FIELD_LEGEND =
  'flex items-center gap-8 pb-14 text-[10.5px] font-medium tracking-[0.15em] text-fg-dim uppercase'
export const GROUP_GLYPH =
  "text-[13px] [font-family:'Segoe_UI_Emoji','Apple_Color_Emoji',sans-serif]"
/** Four up, two on a tablet, one on a phone — two columns of inputs inside a
 *  360px screen leaves each about 150px, which is not an input. */
export const FIELD_GRID =
  'grid grid-cols-4 gap-14 max-[760px]:grid-cols-2 max-[480px]:grid-cols-1'

/* ---------------------------------------------------------------- toggles */

export const TOGGLE_GROUP = 'flex gap-8'
export const TOGGLE =
  'inline-flex flex-1 items-center justify-center gap-6 rounded-sm border border-line bg-tint-1 p-10 text-[13px] font-medium text-fg-dim transition-[color,background-color,border-color] duration-150'
export const TOGGLE_LONG =
  'text-green border-[color-mix(in_srgb,var(--color-green)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-green)_15%,transparent)]'
export const TOGGLE_SHORT =
  'text-red border-[color-mix(in_srgb,var(--color-red)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-red)_15%,transparent)]'

/**
 * A toggle whose selected state is the generic accent — for a choice that
 * carries no colour of its own, the way Long and Short do.
 *
 * Separate from TOGGLE rather than folded into it. Direction depends on TOGGLE
 * having *no* selected style, so that TOGGLE_LONG and TOGGLE_SHORT can supply
 * green and red; putting an `aria-pressed:` background on the shared base would
 * paint those two accent as well.
 *
 * Selected state rides on `aria-pressed` for the same reason TAG_TOGGLE does:
 * it is the attribute the button already has to set for screen readers, so the
 * styling cannot drift out of step with what is announced — and a variant is
 * generated after the base utility, so it reliably beats `bg-tint-1` instead
 * of winning or losing on stylesheet order.
 */
export const TOGGLE_CHOICE =
  TOGGLE +
  ' hover:border-line-strong hover:text-fg-strong' +
  ' aria-pressed:border-transparent aria-pressed:bg-accent aria-pressed:font-medium' +
  ' aria-pressed:text-accent-ink' +
  ' aria-pressed:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]' +
  ' aria-pressed:hover:bg-accent-strong aria-pressed:hover:text-accent-ink' +
  ' disabled:cursor-not-allowed disabled:opacity-45'

export const COMPLIANCE = 'flex flex-col overflow-hidden rounded-sm border border-line'
export const COMPLIANCE_ROW =
  'flex items-center justify-between gap-16 bg-tint-1 px-14 py-10 text-[12.5px] text-fg-dim [&+&]:border-t [&+&]:border-line max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-8'
export const YES_NO = 'flex flex-none gap-6'
export const ANSWER =
  'min-w-52 rounded-[6px] border border-line px-12 py-5 text-[11.5px] font-medium text-fg-muted transition-[color,background-color,border-color] duration-150'

export const TAG_CLOUD = 'flex flex-wrap gap-7'
/**
 * A pill that toggles. Selected state rides on `aria-pressed`, which the button
 * already has to set for screen readers — so the styling cannot drift out of
 * step with what is announced.
 *
 * It has to be a variant rather than a second class string appended by the
 * caller. `bg-tint-1` and `bg-accent` are both background utilities, and which
 * one wins is decided by their order in the generated stylesheet, not by the
 * order they appear in the class attribute — so the selected style was a coin
 * toss, and it landed wrong. A variant is generated after the base utility and
 * reliably beats it.
 */
export const TAG_TOGGLE =
  'rounded-full border border-line bg-tint-1 px-12 py-6 text-[11.5px] text-fg-dim ' +
  'transition-[color,background-color,border-color,box-shadow] duration-150 ' +
  'hover:border-line-strong hover:text-fg-strong ' +
  'aria-pressed:border-transparent aria-pressed:bg-accent aria-pressed:font-medium ' +
  'aria-pressed:text-accent-ink aria-pressed:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_22%,transparent)] ' +
  'aria-pressed:hover:bg-accent-strong aria-pressed:hover:text-accent-ink'

/* --------------------------------------------------------------- account */

export const AVATAR =
  '[&_svg]:transition-transform [&_svg]:duration-[220ms] [&_svg]:ease-spring hover:[&_svg]:scale-110 relative block size-36 overflow-hidden rounded-full border border-line-strong bg-tint-2 p-0 transition-[border-color,box-shadow] duration-150 hover:border-accent hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_24%,transparent)] aria-expanded:border-accent aria-expanded:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_24%,transparent)] [&_img]:block [&_img]:size-full [&_img]:rounded-[inherit] [&_img]:object-cover'

export const AVATAR_INITIALS =
  'grid size-full place-items-center text-[14px] font-semibold text-accent-ink bg-[linear-gradient(160deg,var(--color-accent-strong),var(--color-accent))]'

export const ACCOUNT_MENU =
  'absolute top-[calc(100%+10px)] right-0 z-40 w-244 overflow-hidden rounded-md border border-line-strong bg-panel-solid shadow-[var(--shadow-pop)] [animation:menu-in_0.16s_cubic-bezier(0.22,0.8,0.3,1)_backwards]'

export const ACCOUNT_HEAD =
  'flex items-center gap-11 border-b border-line bg-tint-1 px-15 py-14'
export const ACCOUNT_AVATAR =
  'block size-38 flex-none overflow-hidden rounded-full [&_img]:block [&_img]:size-full [&_img]:object-cover'
export const ACCOUNT_NAME =
  'overflow-hidden text-[13.5px] font-semibold text-ellipsis whitespace-nowrap text-fg-strong'
export const ACCOUNT_EMAIL =
  'overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-fg-muted'

export const ACCOUNT_ITEMS =
  'flex flex-col p-6 [&>button]:flex [&>button]:items-center [&>button]:gap-11 [&>button]:rounded-sm [&>button]:px-11 [&>button]:py-9 [&>button]:text-left [&>button]:text-[13.5px] [&>button]:text-fg-dim [&>button]:transition-[color,background-color] [&>button]:duration-150 [&>button:hover]:bg-tint-2 [&>button:hover]:text-fg-strong'

export const ACCOUNT_DANGER =
  'hover:!text-red hover:!bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)]'

/* --------------------------------------------------------- profile forms */

export const ACCOUNT_GRID = 'flex flex-col gap-16'
export const ACCOUNT_CARD = 'px-24 pt-22 pb-24'
/* CARD is surface only — border, background, shadow — and every page that uses
   it supplies its own padding (see CHART_CARD, SUMMARY_CARD). A form section
   needs the same, or its labels and inputs sit flush against the card edge. */
export const FORM_SECTION = 'px-24 pt-22 pb-24'

export const SECTION_TITLE =
  'mb-18 flex items-center gap-8 text-[11px] font-semibold tracking-[0.14em] text-fg-muted uppercase'
/**
 * Marks a section that is built but not yet connected to anything.
 *
 * Outlined rather than filled: a solid accent pill reads as a feature being
 * promoted, and this is the opposite — a heading that has to say "not yet"
 * before anyone fills the form underneath it in.
 */
export const SOON_BADGE =
  'rounded-full border border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] px-9 py-2 text-[9.5px] font-semibold tracking-[0.1em] text-accent-strong uppercase'

export const IDENTITY = 'mb-20 flex items-center gap-18'
export const IDENTITY_AVATAR =
  'block size-68 flex-none overflow-hidden rounded-full border border-line-strong [&_img]:block [&_img]:size-full [&_img]:object-cover [&_span]:text-[26px]'

export const ACCOUNT_ACTIONS =
  'flex flex-wrap items-center justify-between gap-16 px-20 py-14'
export const SAVE_NOTE = 'text-[12.5px] text-fg-muted'
/** The row a form is submitted from. The rule above it separates "still
 *  editing" from "done", which a bare button floating under the last field
 *  does not do. */
export const SAVE_BAR =
  'flex flex-wrap items-center gap-14 border-t border-line pt-20'
export const SAVE_ERROR = 'text-red'

export const META_LIST =
  'm-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-16 [&_dt]:flex [&_dt]:items-center [&_dt]:gap-7 [&_dt]:text-[11.5px] [&_dt]:text-fg-muted [&_dd]:mt-5 [&_dd]:mb-0 [&_dd]:ml-0 [&_dd]:text-[13.5px] [&_dd]:break-words [&_dd]:text-fg'

/* --------------------------------------------------------------- billing */

export const NOTICE =
  'px-18 py-14 text-[12.5px] leading-[1.6] text-fg-dim border-[color-mix(in_srgb,var(--color-amber)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] [&_strong]:font-semibold [&_strong]:text-fg-strong'

/** Two plans, so two columns — and capped, or each card stretches to half a
 *  very wide screen and the price floats alone in the middle of it. */
export const PLAN_ROW =
  'grid max-w-860 grid-cols-2 gap-16 max-[900px]:max-w-full max-[900px]:grid-cols-1'
export const PLAN_CARD =
  'relative flex flex-col px-22 pt-24 pb-22 transition-[transform,border-color] duration-[220ms] ease-out hover:-translate-y-3 hover:border-line-strong'
export const PLAN_CURRENT = 'border-accent shadow-[0_0_0_1px_var(--color-accent),var(--shadow-card)]'
export const PLAN_FLAG =
  'absolute -top-9 left-22 rounded-full bg-accent px-10 py-3 text-[10px] font-semibold tracking-[0.1em] text-accent-ink uppercase'
export const PLAN_NAME = 'text-[17px] font-semibold text-fg-strong'
export const PLAN_PRICE =
  'mt-8 text-[30px] font-semibold tracking-[-0.03em] text-fg-strong'
export const PLAN_CYCLE = 'text-[14px] font-normal text-fg-muted'
export const PLAN_BLURB = 'mt-6 text-[12.5px] leading-[1.55] text-fg-muted'
export const PLAN_FEATURES =
  'mt-20 mb-22 flex list-none flex-col gap-9 p-0 [&>li]:flex [&>li]:items-start [&>li]:gap-9 [&>li]:text-[12.5px] [&>li]:leading-[1.5] [&>li]:text-fg-dim [&_svg]:mt-2 [&_svg]:flex-none [&_svg]:text-green'
export const PLAN_ACTION = 'mt-auto justify-center py-11'

export const BILLING_GRID = 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-16'
export const EMPTY_BLOCK =
  'px-10 py-26 text-center [&>p]:text-[13.5px] [&>p]:text-fg-dim'
export const MUTED_NOTE = 'mt-5 !text-[12px] !text-fg-muted'

/* ------------------------------------------------------------------ login */

export const LOGIN_SHELL =
  'relative grid min-h-screen grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] overflow-hidden max-[900px]:grid-cols-1 ' +
  'bg-[radial-gradient(1100px_700px_at_12%_-10%,var(--color-glow-a),transparent_62%),radial-gradient(900px_620px_at_96%_108%,var(--color-glow-b),transparent_60%),linear-gradient(180deg,var(--color-bg-top)_0%,var(--color-bg-deep)_100%)]'

/**
 * The pitch beside the form: the name, the tagline, the three claims.
 *
 * Hidden entirely at one column. Stacked above the card it pushed the actual
 * sign-in below the fold, so arriving on a phone meant scrolling past a sales
 * pitch to reach a password field — worst of all for the returning trader, who
 * has read it already and only wants to get in. The same breakpoint the grid
 * collapses at: two columns shows both, one column shows the form.
 */
export const LOGIN_ASIDE =
  'relative z-[1] flex animate-fade flex-col justify-center border-r border-line px-52 py-46 backdrop-blur-[22px] bg-[color-mix(in_srgb,var(--color-sidebar-mid)_72%,transparent)] ' +
  'max-[900px]:hidden'

export const LOGIN_BRAND =
  'mt-0 mb-14 animate-rise text-[64px] leading-none font-bold tracking-[-0.045em] text-fg-strong max-[900px]:mb-10 max-[900px]:text-[42px]'

export const LOGIN_PITCH =
  'animate-rise text-[24px] leading-[1.35] font-medium tracking-[-0.02em] text-fg-dim [animation-delay:80ms] max-[900px]:text-[19px]'

export const LOGIN_POINTS =
  'mt-34 flex max-w-[42ch] list-none flex-col gap-20 p-0 [&>li]:flex [&>li]:items-start [&>li]:gap-13 [&>li]:animate-rise [&>li:nth-child(1)]:[animation-delay:160ms] [&>li:nth-child(2)]:[animation-delay:240ms] [&>li:nth-child(3)]:[animation-delay:320ms]'

export const POINT_GLYPH =
  'grid size-30 flex-none place-items-center rounded-sm border border-line text-accent-strong bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]'
export const POINT_TITLE = 'text-[13.5px] font-medium text-fg'
export const POINT_BODY = 'mt-2 text-[12.5px] leading-[1.5] text-fg-muted'

export const LOGIN_FOOT =
  'absolute bottom-40 left-52 text-[11.5px] tracking-[0.03em] text-fg-muted max-[900px]:hidden'

/** min-h-screen at one column, because it is then the only thing on the page
 *  and the card should sit centred rather than pinned to the top. */
export const LOGIN_MAIN =
  'relative z-[1] grid place-items-center px-32 py-46 ' +
  'max-[900px]:min-h-screen max-[900px]:px-20 max-[900px]:py-32'

export const LOGIN_CARD =
  'flex w-[min(400px,100%)] animate-card-in flex-col gap-15 px-30 pt-32 pb-30 ' +
  '[&>*]:animate-rise [&>*:nth-child(1)]:[animation-delay:140ms] [&>*:nth-child(2)]:[animation-delay:190ms] [&>*:nth-child(3)]:[animation-delay:240ms] [&>*:nth-child(4)]:[animation-delay:290ms] [&>*:nth-child(5)]:[animation-delay:340ms] [&>*:nth-child(n+6)]:[animation-delay:390ms]'

export const LOGIN_TITLE =
  'text-[25px] font-semibold tracking-[-0.025em] text-fg-strong'
export const LOGIN_SUB = '-mt-9 text-[12.5px] text-fg-muted'
export const LOGIN_FORM = 'flex flex-col gap-15'

export const GOOGLE_BUTTON =
  'flex items-center justify-center gap-10 rounded-sm border border-line-strong bg-tint-2 p-12 text-[14px] font-medium text-fg-strong transition-[background-color,border-color,transform] duration-150 hover:not-disabled:bg-tint-3 active:not-disabled:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50'

export const LOGIN_SUBMIT =
  'flex items-center justify-center gap-8 rounded-sm bg-accent p-13 text-[14.5px] font-medium text-accent-ink transition-[background-color,transform] duration-150 hover:not-disabled:bg-accent-strong active:not-disabled:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50'

export const REVEAL =
  'flex-none rounded-sm border border-line bg-tint-1 px-13 text-[11.5px] font-medium text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'

export const LOGIN_ERROR = 'animate-shake text-[12px] leading-[1.5] text-red'

export const LOGIN_DIVIDER =
  "flex items-center gap-12 text-[10.5px] tracking-[0.16em] text-fg-muted uppercase before:h-1 before:flex-1 before:bg-line before:content-[''] after:h-1 after:flex-1 after:bg-line after:content-['']"

export const LOGIN_SWITCH = 'text-center text-[12.5px] text-fg-muted'
export const LINK_BUTTON =
  'p-0 text-[inherit] font-medium text-accent-strong hover:underline'

export const SETUP_NOTICE =
  'flex flex-col gap-6 rounded-sm px-15 py-13 text-[12px] leading-[1.55] text-fg-dim border border-[color-mix(in_srgb,var(--color-amber)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_11%,transparent)] ' +
  '[&_code]:rounded-[4px] [&_code]:bg-tint-2 [&_code]:px-5 [&_code]:py-1 [&_code]:font-mono [&_code]:text-[11px]'
export const SETUP_TITLE = 'font-medium text-fg-strong'
export const SETUP_SKIP =
  'mt-4 self-start p-0 text-[12px] font-medium text-accent-strong hover:underline'
export const SETUP_LIST = 'mt-2 flex flex-col gap-3 pl-16 [&_code]:text-[10.5px]'
export const SETUP_STEPS =
  'mt-2 flex flex-col gap-5 pl-18 [&_a]:font-medium [&_a]:text-accent-strong [&_a]:underline'

/* ------------------------------------------------------------- verify gate */

export const VERIFY_MAIN =
  'relative z-[1] col-span-full grid min-h-screen place-items-center px-24 py-46'
export const VERIFY_GLYPH =
  'grid size-52 place-items-center rounded-[15px] border border-line text-accent-strong bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]'
export const VERIFY_STATUS = 'text-[12.5px] leading-[1.5] text-green'
export const VERIFY_HINT = 'text-center text-[11.5px] text-fg-muted'

/* ------------------------------------------------------------------ coach */

export const COACH_PAGE = 'mx-auto flex w-full max-w-860 flex-col gap-26 pt-18'
export const COACH_INTRO = 'mx-auto max-w-640 animate-rise text-center'
export const COACH_GREETING =
  'text-[34px] font-semibold tracking-[-0.03em] text-fg-strong max-[720px]:text-[26px]'
export const COACH_LEDE = 'mt-12 text-[14px] leading-[1.6] text-fg-dim'

export const THREAD =
  'flex flex-col gap-22 [&>*]:animate-rise [&>*:nth-child(1)]:[animation-delay:140ms] [&>*:nth-child(2)]:[animation-delay:300ms] [&>*:nth-child(3)]:[animation-delay:460ms]'
export const TURN = 'flex items-start gap-12'
export const TURN_TRADER = 'justify-end'

export const CHAT_AVATAR = 'grid size-30 flex-none place-items-center rounded-sm text-white'
export const CHAT_AVATAR_COACH =
  'bg-[linear-gradient(160deg,#4b6dff,#2a49df)] shadow-[0_6px_16px_rgba(42,73,223,0.4)]'
export const CHAT_AVATAR_TRADER = 'border border-line bg-tint-2 text-fg-dim'

export const BUBBLE = 'rounded-[14px] px-18 py-16 text-[13.5px] leading-[1.65]'
export const BUBBLE_COACH =
  'max-w-full border border-line bg-panel text-fg-dim shadow-[var(--shadow-card)] [&>div+div]:mt-14 [&_p+p]:mt-10'
export const BUBBLE_TRADER =
  'max-w-[62%] text-white bg-[linear-gradient(160deg,#3f6bff,#2a55ef)] shadow-[0_10px_26px_rgba(42,85,239,0.32)] max-[720px]:max-w-[78%]'

export const TYPING =
  'flex gap-4 [&>i]:size-5 [&>i]:animate-typing [&>i]:rounded-full [&>i]:bg-fg-muted [&>i:nth-child(2)]:[animation-delay:160ms] [&>i:nth-child(3)]:[animation-delay:320ms]'

export const LANGUAGE_GATE =
  'flex animate-rise items-start gap-12 [animation-delay:100ms]'
export const LANGUAGE_GRID =
  'mt-14 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-8'
export const LANGUAGE_CHIP =
  'flex flex-col gap-1 rounded-sm border border-line bg-tint-1 px-13 py-10 text-left text-fg transition-[color,background-color,border-color,transform] duration-150 hover:not-disabled:-translate-y-1 hover:not-disabled:border-accent hover:not-disabled:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-50'
export const LANGUAGE_SAVING =
  '!opacity-100 border-accent bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]'
export const LANGUAGE_NATIVE = 'text-[13.5px] font-medium'
export const LANGUAGE_LABEL = 'text-[10.5px] text-fg-muted'

export const COACH_ERROR =
  'rounded-sm border border-[color-mix(in_srgb,var(--color-red)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-red)_9%,transparent)] px-15 py-11 text-[12.5px] leading-[1.5] text-red'
export const COACH_WARNING =
  'rounded-sm border border-[color-mix(in_srgb,var(--color-amber)_34%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] px-14 py-10 text-[12px] leading-[1.5] text-fg-dim'

/** Sticky so it stays reachable as a long conversation scrolls. */
export const COMPOSER =
  'sticky bottom-16 flex animate-rise [animation-delay:500ms] transition-[border-color,box-shadow] duration-200 focus-within:border-accent  items-center gap-10 rounded-full border border-line bg-panel py-7 pr-7 pl-18 shadow-[var(--shadow-card)] ' +
  '[&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-none [&_input]:bg-transparent [&_input]:outline-none [&_input::placeholder]:text-fg-muted ' +
  '[&_button]:grid [&_button]:size-36 [&_button]:flex-none [&_button]:place-items-center [&_button]:rounded-full [&_button]:text-white [&_button]:bg-[linear-gradient(160deg,#4b6dff,#2a49df)] [&_button]:transition-[opacity,transform] [&_button]:duration-150 ' +
  '[&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-40 [&_button:not(:disabled):hover]:scale-105'

export const SUGGESTION_ROW = 'mt-14 flex flex-wrap gap-7'
export const SUGGESTION =
  'rounded-full border border-line bg-tint-1 px-13 py-7 text-[12.5px] text-fg-dim transition-[color,background-color,border-color] duration-150 hover:not-disabled:border-accent hover:not-disabled:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] hover:not-disabled:text-fg-strong disabled:cursor-not-allowed disabled:opacity-50'

/* --------------------------------------------------------------- calendar */

export const CAL_TOOLBAR =
  'flex flex-wrap items-center justify-between gap-16 max-[760px]:items-stretch'
export const CAL_FILTERS = 'flex flex-wrap items-center gap-8'

/*
 * A native select sits invisible over the whole chip so the entire thing is
 * the hit target, while the label beside it keeps its styling.
 */
export const CAL_FILTER =
  'relative inline-flex cursor-pointer items-center gap-7 rounded-sm border border-line bg-tint-1 px-11 py-7 text-[12.5px] text-fg-dim transition-[color,border-color,background-color] duration-150 hover:border-line-strong hover:text-fg-strong ' +
  '[&_select]:absolute [&_select]:inset-0 [&_select]:size-full [&_select]:cursor-pointer [&_select]:opacity-0 ' +
  /*
   * The select is invisible, but its native popup still inherits colour from
   * this chip — and an active chip is white on accent, so the options came out
   * white on white. Naming both explicitly, the way the form controls do,
   * keeps the list readable whatever the chip is doing.
   */
  '[&_select]:bg-panel-solid [&_select]:text-fg [&_option]:bg-panel-solid [&_option]:text-fg ' +
  '[&_svg]:pointer-events-none [&_svg]:flex-none [&_svg]:text-fg-muted ' +
  // Turns over while the list is open, like every other dropdown.
  '[&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out [&:focus-within_svg]:rotate-180'
export const CAL_FILTER_ACTIVE =
  'border-transparent bg-accent text-accent-ink [&_svg]:text-accent-ink'

export const CAL_CLEAR =
  'rounded-sm px-11 py-7 text-[12.5px] text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'
export const CAL_ADD =
  'inline-flex items-center gap-7 rounded-sm bg-green px-16 py-9 text-[13px] font-semibold text-[#04140c] transition-[filter,transform] duration-150 hover:brightness-[1.08] active:scale-[0.97] max-[760px]:justify-center'

export const CAL_HEAD = 'flex flex-wrap items-center gap-14'
export const CAL_TODAY =
  'rounded-sm border border-line bg-tint-1 px-15 py-7 text-[12.5px] font-medium text-fg-dim transition-[color,border-color] duration-150 hover:border-line-strong hover:text-fg-strong'
export const CAL_NAV =
  'flex gap-2 [&>button]:grid [&>button]:size-28 [&>button]:place-items-center [&>button]:rounded-sm [&>button]:text-fg-muted [&>button]:transition-[color,background-color] [&>button]:duration-150 [&>button:hover]:bg-tint-2 [&>button:hover]:text-fg-strong'
export const CAL_MONTH =
  'text-[18px] font-semibold tracking-[-0.01em] text-fg-strong max-[760px]:text-[16px]'
export const CAL_MONTH_TOTAL = 'text-[14px] font-semibold tabular-nums'
export const CAL_MONTH_COUNT = 'text-[12px] text-fg-muted'

export const CAL_GRID = 'overflow-x-auto p-10'
/** Seven days plus a slightly narrower weekly summary column. */
export const CAL_ROW =
  'grid min-w-820 grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,0.8fr)] gap-6 [&+&]:mt-6'
export const CAL_WEEKDAYS = 'mb-2'
export const CAL_WEEKDAY =
  'py-6 text-center text-[10px] font-semibold tracking-[0.14em] text-fg-muted uppercase'

export const CAL_DAY =
  'flex min-h-92 flex-col items-center gap-3 rounded-sm border border-line bg-tint-1 px-8 py-9 transition-[border-color,transform] duration-150 hover:-translate-y-1 hover:border-line-strong'
/** Profit and loss days are tinted rather than filled, so the numbers stay
 *  legible in both themes. */
export const CAL_DAY_POS =
  'border-[color-mix(in_srgb,var(--color-green)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-green)_12%,transparent)] [&_[data-pl]]:text-green'
export const CAL_DAY_NEG =
  'border-[color-mix(in_srgb,var(--color-red)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] [&_[data-pl]]:text-red'
export const CAL_DAY_OUTSIDE = 'opacity-40'
export const CAL_DAY_TODAY =
  '[&_[data-date]]:rounded-full [&_[data-date]]:bg-accent [&_[data-date]]:px-7 [&_[data-date]]:py-1 [&_[data-date]]:text-accent-ink'

export const CAL_DATE = 'text-[11px] font-medium text-fg-muted'
export const CAL_PL = 'mt-auto text-[14px] font-semibold tabular-nums'
export const CAL_COUNT = 'mb-auto text-[11px] text-fg-muted'

export const CAL_WEEK =
  'flex flex-col items-end justify-center gap-3 rounded-sm bg-tint-1 px-12 py-9'
export const CAL_WEEK_PL = 'text-[14px] font-semibold tabular-nums text-fg-muted'

/* ------------------------------------------------------------------ admin */

export const ADMIN_STAT_ROW =
  'grid grid-cols-4 gap-16 max-[1180px]:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'
export const ADMIN_STAT = 'flex flex-col gap-4 px-18 pt-16 pb-18'
export const ADMIN_STAT_HEAD = 'mb-12 flex items-center justify-between gap-12'
export const STAT_GLYPH =
  'grid size-34 place-items-center rounded-sm border border-line bg-tint-2 text-fg-dim'
export const TAG = 'rounded-full bg-tint-2 px-9 py-3 text-[10.5px] font-medium text-fg-dim'
export const TAG_POS =
  'text-green bg-[color-mix(in_srgb,var(--color-green)_15%,transparent)]'
export const ADMIN_STAT_LABEL =
  'text-[9.5px] font-medium tracking-[0.14em] text-fg-muted uppercase'
export const ADMIN_STAT_VALUE =
  'text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] tabular-nums'
export const ADMIN_STAT_NOTE =
  'mt-auto flex items-center gap-7 pt-12 text-[11px] text-fg-muted'

/** Bars grow from the baseline, staggered off an inline --i index. */
export const SPARKBARS =
  'mt-auto flex h-34 items-end gap-3 pt-12 [&>span]:min-h-3 [&>span]:flex-1 [&>span]:rounded-t-[2px] [&>span]:origin-bottom [&>span]:animate-grow-up [&>span]:[animation-delay:calc(0.25s+var(--i)*40ms)]'
export const SPARKBARS_ACCENT =
  '[&>span]:bg-[color-mix(in_srgb,var(--color-accent)_62%,transparent)] [&>span:last-child]:bg-accent-strong'
export const SPARKBARS_WARM =
  '[&>span]:bg-[color-mix(in_srgb,#e2755c_62%,transparent)] [&>span:last-child]:bg-[#e2755c]'

export const METER_TALL = 'mt-auto h-6'

export const ADMIN_GRID =
  'grid items-start gap-16 grid-cols-[minmax(0,1fr)_320px] max-[1180px]:grid-cols-[minmax(0,1fr)]'

export const CARD_TITLE_SMALL = 'text-[16px] font-semibold'

export const X_AXIS_MONTHS =
  'relative mt-6 ml-46 flex h-auto justify-between px-[3%] [&>span]:static [&>span]:translate-x-0 [&>span]:text-[11px] [&>span]:whitespace-nowrap [&>span]:text-fg-muted'

/* ---------------------------------------------------------- activity feed */

export const ACTIVITY_FEED = 'flex flex-col px-18 pt-18 pb-16'
export const FEED =
  'mt-8 flex list-none flex-col p-0 [&>li]:animate-slide-right [&>li:nth-child(1)]:[animation-delay:160ms] [&>li:nth-child(2)]:[animation-delay:240ms] [&>li:nth-child(3)]:[animation-delay:320ms] [&>li:nth-child(n+4)]:[animation-delay:400ms] [&>li]:grid [&>li]:grid-cols-[auto_minmax(0,1fr)_auto] [&>li]:gap-12 [&>li]:border-b [&>li]:border-line [&>li]:py-14 [&>li:last-child]:border-b-0'
export const FEED_GLYPH =
  'grid size-30 place-items-center rounded-sm bg-tint-2 text-fg-dim transition-transform duration-[240ms] ease-spring group-hover:scale-110 group-hover:-rotate-4'
export const FEED_GLYPH_TONE: Record<string, string> = {
  signup: 'text-green bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)]',
  error: 'text-red bg-[color-mix(in_srgb,var(--color-red)_14%,transparent)]',
  upgrade:
    'text-accent-strong bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]',
  audit: 'text-cyan bg-[color-mix(in_srgb,var(--color-cyan)_14%,transparent)]',
}
export const FEED_TITLE = 'text-[13px] font-medium text-fg'
export const FEED_TEXT =
  'mt-3 text-[11.5px] leading-[1.5] text-fg-muted [&_strong]:font-medium'
export const FEED_ACTION =
  'mt-6 inline-block text-[11.5px] font-medium text-accent-strong hover:underline'
export const FEED_AGE = 'text-[10.5px] whitespace-nowrap text-fg-muted'
export const FEED_MORE =
  'mt-14 rounded-md border border-line bg-tint-1 p-11 text-[10.5px] font-medium tracking-[0.14em] text-fg-dim uppercase transition-[color,background-color,transform] duration-150 hover:bg-tint-2 hover:text-fg-strong active:scale-[0.97]'

/* -------------------------------------------------------------- brokers */

export const BROKER_CARD = 'px-22 pt-20 pb-22'
export const BROKER_GRID =
  'mt-16 grid grid-cols-3 gap-14 max-[1180px]:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]'
export const BROKER_TILE =
  'rounded-md border border-line bg-tint-1 px-16 pt-14 pb-16'
export const BROKER_HEAD =
  'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-10'
export const BROKER_LOGO =
  'grid size-30 place-items-center rounded-sm text-[11px] font-bold text-white'
export const BROKER_NAME = 'text-[13px] font-medium'
export const BROKER_PROTOCOL = 'text-[10.5px] text-fg-muted'
export const BROKER_METRICS =
  'mt-14 [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-12 [&>div]:py-5 [&_dt]:text-[11.5px] [&_dt]:text-fg-muted [&_dd]:m-0 [&_dd]:text-[11.5px] [&_dd]:text-fg'

export const DOT =
  'size-7 flex-none rounded-full'
export const DOT_UP =
  'bg-green shadow-[0_0_8px_color-mix(in_srgb,var(--color-green)_70%,transparent)]'
export const DOT_WARN =
  'bg-amber shadow-[0_0_8px_color-mix(in_srgb,var(--color-amber)_70%,transparent)]'

export const CRUMBS =
  'text-[10px] font-medium tracking-[0.16em] text-fg-muted uppercase [&_span]:mx-5 [&_span]:opacity-60'

/* ------------------------------------------------------------ day detail */

/** The trade form, which needs room for a four-column field grid. */
export const MODAL_WIDE = 'w-[min(920px,calc(100vw-32px))]'

/** Narrower than the trade form: this one reads rather than collects. */
export const MODAL_NARROW = 'w-[min(560px,calc(100vw-32px))]'

/**
 * The trade detail. Between the two: it reads rather than collects, but it has
 * a dozen short figures to show.
 *
 * A `<dialog>` shrink-wraps its content, so with no width at all this one
 * collapsed to a single column of labels — twelve rows tall, which pushed its
 * own footer past the height cap and out of sight. At this width the detail
 * grid's auto-fit columns actually get to fit.
 */
/* Wide enough for the record and the chart drawn from it to sit side by side.
   Below 900px the two columns stack (see MODAL_SPLIT) and the dialog simply
   runs out of viewport before it runs out of this. */
export const MODAL_DETAIL = 'w-[min(1120px,calc(100vw-32px))]'

/** The day cell is a button, so it needs the affordances one has. */
export const CAL_DAY_BUTTON =
  'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export const DAY_SUMMARY =
  'grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-px overflow-hidden rounded-md border border-line bg-line'
export const DAY_SUMMARY_CELL = 'flex flex-col gap-4 bg-panel-solid px-14 py-12'
export const DAY_SUMMARY_LABEL =
  'text-[9.5px] font-medium tracking-[0.14em] text-fg-muted uppercase'
export const DAY_SUMMARY_VALUE =
  'text-[18px] font-semibold tracking-[-0.02em] tabular-nums'

/** Rows arrive one after another under the summary. */
export const DAY_TRADES =
  'flex list-none flex-col gap-8 p-0 [&>li]:animate-rise [&>li:nth-child(1)]:[animation-delay:120ms] [&>li:nth-child(2)]:[animation-delay:170ms] [&>li:nth-child(3)]:[animation-delay:220ms] [&>li:nth-child(4)]:[animation-delay:270ms] [&>li:nth-child(n+5)]:[animation-delay:320ms]'

export const DAY_TRADE =
  'flex flex-col gap-8 rounded-sm border border-line bg-tint-1 px-14 py-12'
export const DAY_TRADE_HEAD = 'flex items-center gap-9'
export const DAY_TRADE_META =
  'flex flex-wrap items-center gap-x-16 gap-y-4 text-[11.5px] text-fg-muted'
export const DAY_EMPTY =
  'rounded-sm border border-dashed border-line px-16 py-26 text-center text-[13px] text-fg-muted'

/* --------------------------------------------------------------- combobox */

/*
 * Anchored to the control with left-0 right-0, so the panel is exactly the
 * width of the input above it — the thing a <datalist> would not do. It drops
 * straight down, and animates on the way.
 */
export const COMBO_PANEL =
  'absolute top-full right-0 left-0 z-20 mt-4 flex max-h-220 animate-drop flex-col overflow-y-auto rounded-sm border border-line-strong bg-panel-solid p-4 shadow-[var(--shadow-pop)] origin-top'

export const COMBO_OPTION =
  'shrink-0 rounded-[6px] px-11 py-8 text-left text-[13.5px] text-fg-dim transition-colors duration-100'
export const COMBO_OPTION_ACTIVE = 'bg-tint-2 text-fg-strong'
export const COMBO_EMPTY = 'px-11 py-10 text-[12px] leading-[1.5] text-fg-muted'

/* --------------------------------------------------------- notifications */

export const NOTIFY_MENU =
  'absolute top-[calc(100%+10px)] right-0 z-40 flex w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-md border border-line-strong bg-panel-solid shadow-[var(--shadow-pop)] [animation:menu-in_0.16s_cubic-bezier(0.22,0.8,0.3,1)_backwards] ' +
  /* The bell is ~120px in from the right edge, so a menu anchored to it but
     sized against the viewport hangs 88px off the left on a phone. Below 520px
     it stops being a dropdown and spans the screen with even gutters. The
     topbar's only animation is opacity, so nothing there creates a containing
     block that would capture this `fixed`. */
  'max-[520px]:fixed max-[520px]:top-76 max-[520px]:right-16 max-[520px]:left-16 max-[520px]:w-auto'

export const NOTIFY_HEAD =
  'flex items-center justify-between gap-12 border-b border-line bg-tint-1 px-15 py-12'
export const NOTIFY_TITLE =
  'text-[11px] font-semibold tracking-[0.14em] text-fg-muted uppercase'
export const NOTIFY_ACTION =
  'text-[11.5px] font-medium text-accent-strong transition-opacity duration-150 hover:underline disabled:opacity-40 disabled:no-underline'

/* Capped against the viewport too: a fixed 360px runs off the bottom of a
   landscape phone, where the whole screen is barely taller than that. */
export const NOTIFY_LIST =
  'flex max-h-[min(360px,calc(100vh-160px))] flex-col overflow-y-auto p-6'

export const NOTIFY_ITEM =
  'flex w-full shrink-0 gap-11 rounded-sm px-9 py-10 text-left transition-colors duration-150 hover:bg-tint-2'
export const NOTIFY_GLYPH =
  'mt-1 grid size-28 flex-none place-items-center rounded-sm bg-tint-2 text-fg-dim'
export const NOTIFY_GLYPH_TONE: Record<string, string> = {
  fill: 'text-green bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)]',
  risk: 'text-red bg-[color-mix(in_srgb,var(--color-red)_14%,transparent)]',
  coach: 'text-accent-strong bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]',
  system: 'text-cyan bg-[color-mix(in_srgb,var(--color-cyan)_14%,transparent)]',
}
export const NOTIFY_ITEM_TITLE = 'text-[13px] font-medium text-fg'
export const NOTIFY_ITEM_BODY = 'mt-2 text-[11.5px] leading-[1.5] text-fg-muted'
export const NOTIFY_AGE = 'ml-auto shrink-0 text-[10.5px] whitespace-nowrap text-fg-muted'
/** The dot that marks a notification as still unread. */
export const NOTIFY_UNREAD = 'mt-6 size-6 shrink-0 rounded-full bg-accent'
export const NOTIFY_EMPTY =
  'flex flex-col items-center gap-8 px-20 py-34 text-center text-[12.5px] text-fg-muted'

/* -------------------------------------------------------------- chat dock */

/*
 * Bottom-right, where nothing else lives — the sidebar and its Quick Add
 * button own the other corner, so this one needs no offset and can sit at the
 * screen edge at every width.
 */
/*
 * Offsets go through `max()` against the safe-area insets, so the button clears
 * a rounded corner, a notch, and the gesture bar at the bottom of a phone.
 * Without it the tap target sits partly under the system UI on exactly the
 * devices where it is hardest to hit.
 */
export const DOCK_LAUNCHER =
  'fixed z-40 grid size-52 place-items-center rounded-full bg-accent text-accent-ink shadow-[var(--shadow-pop)] transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-accent-strong active:scale-[0.97] ' +
  /* calc, not max: with max() a 48px nav bar swallows the gap entirely and the
     button sits flush against it. Adding the inset keeps the same visual
     clearance above whatever the device reserves. */
  'right-[calc(24px+env(safe-area-inset-right))] bottom-[calc(24px+env(safe-area-inset-bottom))] ' +
  'max-shell:right-[calc(16px+env(safe-area-inset-right))] max-shell:bottom-[calc(16px+env(safe-area-inset-bottom))]'

export const DOCK_LAUNCHER_BADGE =
  'absolute -top-2 -right-2 grid size-20 place-items-center rounded-full bg-red text-[10px] font-semibold text-white shadow-[0_0_0_2px_var(--color-bg-deep)]'

export const DOCK_PANEL =
  'fixed z-40 flex origin-bottom-right animate-dock overflow-hidden rounded-lg border border-line-strong bg-panel-solid shadow-[var(--shadow-pop)] ' +
  /* `dvh`, not `vh`. On a phone `100vh` is the tallest the viewport ever gets —
     the height with the browser's address bar hidden — so a panel sized against
     it runs off under the chrome that is actually on screen. `dvh` tracks what
     is visible now. */
  'h-[min(520px,calc(100dvh-140px))] w-[min(680px,calc(100vw-40px))] ' +
  /* Only the offsets change below the shell breakpoint. The width must not:
     `min(680px, 100vw-40px)` already narrows on a phone, and overriding it with
     a bare `100vw-40px` threw the 680px cap away, so on a 960px screen the
     panel stretched to 920px instead of staying a dock. */
  'right-[max(24px,env(safe-area-inset-right))] bottom-88 ' +
  'max-shell:right-[max(16px,env(safe-area-inset-right))] ' +
  'max-shell:bottom-[calc(76px+max(16px,env(safe-area-inset-bottom)))]'

/** Contacts left, conversation right. One column once there is no room. */
export const DOCK_BODY = 'grid min-h-0 w-full grid-cols-[224px_1fr] max-[620px]:grid-cols-1'

export const DOCK_ASIDE =
  'flex min-h-0 flex-col border-r border-line bg-tint-1 max-[620px]:border-r-0'
export const DOCK_ASIDE_HEAD =
  'flex items-center justify-between gap-8 border-b border-line px-14 py-12'
export const DOCK_ASIDE_TITLE = 'text-[13px] font-semibold text-fg-strong'
export const DOCK_CONTACTS = 'flex min-h-0 flex-col gap-2 overflow-y-auto p-6'

export const DOCK_CONTACT =
  'flex w-full shrink-0 items-center gap-10 rounded-sm px-9 py-9 text-left transition-colors duration-150 hover:bg-tint-2'
export const DOCK_CONTACT_ACTIVE = 'bg-tint-3 hover:bg-tint-3'
/* The circle is two layers: the face clips a photo to a round crop, and the
   wrapper stays unclipped so the presence dot can overhang its edge. */
export const DOCK_AVATAR = 'relative size-32 flex-none'
/** Initials on the contact's `accent`; a photo, when set, covers them. */
export const DOCK_AVATAR_FACE =
  'grid size-full place-items-center overflow-hidden rounded-full text-[11.5px] font-semibold text-white [&_img]:block [&_img]:size-full [&_img]:object-cover'
/** Presence dot, ringed in the panel colour so it reads as a cutout. */
export const DOCK_ONLINE =
  'absolute -right-1 -bottom-1 size-9 rounded-full bg-green shadow-[0_0_0_2px_var(--color-panel-solid)]'
export const DOCK_CONTACT_NAME =
  'truncate text-[12.5px] font-medium text-fg-strong'
export const DOCK_CONTACT_ROLE = 'truncate text-[10.5px] text-fg-muted'
export const DOCK_UNREAD =
  'ml-auto grid size-18 flex-none place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-ink'

/* ------------------------------------------------------ adding a contact */

/** Sits beside the close button in the head; pressed state mirrors the dock. */
export const DOCK_ADD =
  'grid size-28 flex-none place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong aria-expanded:bg-accent aria-expanded:text-accent-ink'

/* The search row anchors the results, so it carries the positioning context
   and a stacking order above the contact list beneath it. */
export const DOCK_SEARCH = 'relative z-20 shrink-0 border-b border-line px-10 py-9'
export const DOCK_SEARCH_FIELD =
  'flex items-center gap-7 rounded-full border border-line bg-tint-2 px-10 py-6 transition-colors duration-150 focus-within:border-accent ' +
  '[&_svg]:flex-none [&_svg]:text-fg-muted ' +
  '[&_input]:min-w-0 [&_input]:flex-1 [&_input]:bg-transparent [&_input]:text-[12px] [&_input]:text-fg [&_input]:outline-none [&_input::placeholder]:text-fg-muted'
export const DOCK_SEARCH_CLOSE =
  'grid size-18 flex-none place-items-center rounded-full text-fg-muted transition-colors duration-150 hover:bg-tint-3 hover:text-fg-strong'

/*
 * Wider than the 224px contact column it hangs from: an address and a name
 * need the room, and overhanging the thread costs nothing while open.
 */
export const DOCK_RESULTS =
  'absolute top-[calc(100%-4px)] left-8 z-20 max-h-232 w-284 max-w-[calc(100vw-72px)] overflow-y-auto overflow-x-hidden rounded-md border border-line-strong bg-panel-solid p-5 shadow-[var(--shadow-pop)] [animation:menu-in_0.14s_cubic-bezier(0.22,0.8,0.3,1)_backwards]'

/**
 * One match. Details lead, avatar closes the row on the right — the mirror of
 * the contact list below, which is what marks these out as not-yet-contacts.
 */
export const DOCK_RESULT =
  'flex w-full items-center gap-10 rounded-sm px-9 py-8 text-left transition-colors duration-150 hover:bg-tint-2 aria-selected:bg-tint-2'
/** Name over email, one column, each line clipped rather than wrapped. */
export const DOCK_RESULT_DETAILS = 'grid min-w-0 flex-1 gap-1'
export const DOCK_RESULT_NAME = 'truncate text-[12.5px] font-medium text-fg-strong'
export const DOCK_RESULT_EMAIL = 'truncate text-[10.5px] text-fg-muted'

/** Searching, no matches, or the reason the lookup failed. */
export const DOCK_RESULT_NOTE =
  'flex items-center gap-7 px-10 py-9 text-[11.5px] text-fg-muted'
export const DOCK_RESULT_ERROR = 'text-red'

export const DOCK_MAIN = 'flex min-h-0 min-w-0 flex-col'
export const DOCK_MAIN_HEAD =
  'flex items-center gap-10 border-b border-line px-16 py-12'
export const DOCK_THREAD = 'flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-16 py-16'

export const DOCK_BUBBLE =
  'max-w-[78%] shrink-0 rounded-[14px] px-14 py-10 text-[13px] leading-[1.55]'
export const DOCK_BUBBLE_THEM = 'self-start border border-line bg-tint-1 text-fg-dim'
export const DOCK_BUBBLE_ME =
  'self-end text-white bg-[linear-gradient(160deg,#3f6bff,#2a55ef)]'
export const DOCK_TIME = 'mt-4 block text-[10px] opacity-70'

/**
 * The read receipt, under the last sent message the other person has reached.
 * Right-aligned to sit beneath its own bubble, and only ever shown once —
 * marking every seen message would be noise, since seeing one means seeing
 * everything before it.
 */
export const DOCK_SEEN =
  'flex shrink-0 items-center justify-end gap-4 pr-2 text-[10px] text-fg-muted [&_svg]:text-accent-strong'
/** Cancels the thread's row gap, so the receipt reads as part of the bubble. */
export const DOCK_SEEN_ROW = '-mt-8'

export const DOCK_COMPOSER =
  'flex shrink-0 items-center gap-8 border-t border-line px-12 py-10 ' +
  '[&_input]:min-w-0 [&_input]:flex-1 [&_input]:rounded-full [&_input]:border [&_input]:border-line [&_input]:bg-tint-1 [&_input]:px-14 [&_input]:py-9 [&_input]:text-[13px] [&_input]:text-fg [&_input]:outline-none [&_input::placeholder]:text-fg-muted [&_input:focus-visible]:border-accent'
export const DOCK_SEND =
  'grid size-34 flex-none place-items-center rounded-full bg-accent text-accent-ink transition-[opacity,transform] duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100'

export const DOCK_EMPTY =
  'grid flex-1 place-items-center px-24 text-center text-[12.5px] text-fg-muted'

/** An empty contact list, which is where every new account starts. */
export const DOCK_CONTACTS_EMPTY =
  'px-10 py-14 text-center text-[11.5px] leading-[1.6] text-fg-muted'

/** A send that did not land, or a database that is not reachable. */
export const DOCK_ERROR =
  'shrink-0 border-t border-line bg-[color-mix(in_srgb,var(--color-red)_10%,transparent)] px-14 py-8 text-[11px] text-red'

/** Only shown in one-column mode, to get back to the contact list. */
export const DOCK_BACK =
  'hidden text-[11.5px] font-medium text-accent-strong hover:underline max-[620px]:block'

/** A nav tab that is visible but not reachable. Kept in place rather than
 *  hidden, so the shape of the product still reads. */
export const NAV_DISABLED = 'cursor-not-allowed opacity-40'

/* ----------------------------------------------------------------- toasts */

/*
 * Bottom-centre: clear of the top bar's menus, clear of the chat dock in the
 * corner, and in the one place a trader is not reading numbers. Above the dock
 * so an outcome is never hidden behind an open conversation.
 */
export const TOAST_VIEWPORT =
  'pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-10 max-shell:bottom-84'

export const TOAST =
  'pointer-events-auto flex items-start gap-11 overflow-hidden rounded-md border bg-panel-solid px-14 py-12 shadow-[var(--shadow-pop)]'

export const TOAST_ENTER = 'animate-toast-in'
export const TOAST_LEAVE = 'animate-toast-out'

/** The tone is carried by the border and the glyph — the surface stays the
 *  panel colour, so a toast reads as part of the app rather than an alert. */
export const TOAST_TONE: Record<string, string> = {
  success: 'border-[color-mix(in_srgb,var(--color-green)_45%,transparent)]',
  error: 'border-[color-mix(in_srgb,var(--color-red)_45%,transparent)]',
  info: 'border-line-strong',
}

export const TOAST_GLYPH = 'mt-1 grid size-24 flex-none place-items-center rounded-full'
export const TOAST_GLYPH_TONE: Record<string, string> = {
  success: 'text-green bg-[color-mix(in_srgb,var(--color-green)_16%,transparent)]',
  error: 'text-red bg-[color-mix(in_srgb,var(--color-red)_16%,transparent)]',
  info: 'text-accent-strong bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)]',
}

export const TOAST_TITLE = 'text-[13px] font-medium text-fg-strong'
export const TOAST_BODY = 'mt-3 text-[11.5px] leading-[1.5] text-fg-muted'
export const TOAST_CLOSE =
  'mt-1 grid size-22 flex-none place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'

/* ------------------------------------------------------------------- tour */

/*
 * The spotlight. One element with an enormous spread shadow, so the page is
 * dimmed everywhere except the cut-out — cheaper and smoother than four
 * masking panels, and it animates as the rect moves between steps.
 */
export const TOUR_SPOTLIGHT =
  'pointer-events-none fixed z-[90] rounded-md shadow-[0_0_0_9999px_rgba(6,5,15,0.72)] ring-2 ring-accent transition-[top,left,width,height] duration-300 ease-out'

/** Used when a step has no target, or its target is not on screen at this
 *  size: dim everything and centre the card. */
export const TOUR_VEIL = 'fixed inset-0 z-[90] bg-[rgba(6,5,15,0.72)]'

/*
 * The card. Fixed, positioned in script, and clamped to the viewport on both
 * axes — below 520px it stops trying to follow the target and becomes a sheet
 * across the bottom, which is the only thing that reliably fits.
 */
export const TOUR_CARD =
  'fixed z-[92] flex w-[min(360px,calc(100vw-32px))] flex-col gap-12 rounded-lg border border-line-strong bg-panel-solid p-18 shadow-[var(--shadow-pop)] animate-toast-in ' +
  'max-[520px]:right-16 max-[520px]:bottom-16 max-[520px]:left-16 max-[520px]:w-auto max-[520px]:!top-auto max-[520px]:!left-16'

export const TOUR_HEAD = 'flex items-start gap-12'

/** The guide. Bobs gently so it reads as a companion rather than an icon. */
export const TOUR_AVATAR =
  'grid size-40 flex-none place-items-center rounded-full text-accent-ink animate-guide bg-[linear-gradient(160deg,var(--color-accent-strong),var(--color-accent))] shadow-[0_6px_18px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]'

export const TOUR_TITLE = 'text-[16px] font-semibold tracking-[-0.01em] text-fg-strong'
export const TOUR_BODY = 'mt-4 text-[12.5px] leading-[1.6] text-fg-dim'

export const TOUR_FOOT = 'flex flex-wrap items-center gap-10'
export const TOUR_COUNT = 'text-[11px] font-medium tracking-[0.12em] text-fg-muted uppercase'
export const TOUR_SKIP =
  'text-[12px] font-medium text-fg-muted transition-colors duration-150 hover:text-fg-strong'
export const TOUR_NEXT =
  'ml-auto inline-flex items-center gap-7 rounded-sm bg-accent px-16 py-9 text-[13px] font-medium text-accent-ink transition-[background-color,transform] duration-150 hover:bg-accent-strong active:scale-[0.97]'

/*
 * Previous sits above the card, as its own control. Absolute against the card
 * so it travels with it, and it flips inside on small screens where there may
 * be nothing above the sheet.
 */
export const TOUR_PREV =
  'absolute -top-42 left-0 inline-flex items-center gap-6 rounded-full border border-line-strong bg-panel-solid px-12 py-7 text-[12px] font-medium text-fg-dim shadow-[var(--shadow-pop)] transition-[color,transform] duration-150 hover:-translate-y-1 hover:text-fg-strong disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0'

/** Always reachable, whatever the card is doing. */
export const TOUR_EXIT =
  'fixed top-18 right-18 z-[93] inline-flex items-center gap-7 rounded-full border border-line-strong bg-panel-solid px-14 py-8 text-[12px] font-medium text-fg-dim shadow-[var(--shadow-pop)] transition-colors duration-150 hover:text-fg-strong'

/** Progress along the bottom of the card. */
export const TOUR_TRACK = 'h-3 overflow-hidden rounded-full bg-tint-2'
export const TOUR_FILL =
  'block h-full rounded-full bg-accent transition-[width] duration-300 ease-out'

/* ------------------------------------------------- editing a sent message */

/**
 * The menu raised by holding a message.
 *
 * Positioned by the caller against the bubble, because where it belongs
 * depends on which side of the thread the message sits on.
 */
export const DOCK_MSG_MENU =
  'absolute z-30 flex min-w-120 flex-col overflow-hidden rounded-md border border-line-strong bg-panel-solid p-4 shadow-[var(--shadow-pop)] [animation:menu-in_0.12s_cubic-bezier(0.22,0.8,0.3,1)_backwards] ' +
  '[&>button]:flex [&>button]:items-center [&>button]:gap-9 [&>button]:rounded-sm [&>button]:px-10 [&>button]:py-7 [&>button]:text-left [&>button]:text-[12.5px] [&>button]:text-fg-dim [&>button]:transition-colors [&>button]:duration-150 [&>button:hover]:bg-tint-2 [&>button:hover]:text-fg-strong'

export const DOCK_MSG_DELETE =
  'hover:!text-red hover:!bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)]'

/** Held messages dim slightly, so it is obvious which one the menu belongs to. */
export const DOCK_BUBBLE_HELD = 'opacity-70'

/**
 * A deleted message. It keeps its place in the thread rather than closing the
 * gap — quietly rewriting the conversation for the other person would be worse
 * than admitting something was removed.
 */
export const DOCK_BUBBLE_GONE =
  'max-w-[78%] shrink-0 rounded-[14px] border border-dashed border-line px-14 py-9 text-[12px] italic text-fg-muted'

/** The "edited" marker, above the text it applies to. */
export const DOCK_EDITED = 'mb-3 block text-[10px] tracking-[0.04em] opacity-70'

/** The banner shown over the composer while a message is being rewritten. */
export const DOCK_EDITING =
  'flex shrink-0 items-center gap-8 border-t border-line bg-tint-1 px-14 py-7 text-[11px] text-fg-muted'
export const DOCK_EDITING_CANCEL =
  'ml-auto font-medium text-accent-strong hover:underline'

/* --------------------------------------------------------- splash screen */

/**
 * The first thing anyone sees, so it carries the product rather than a spinner:
 * an equity curve plotting itself, with the name and the promise under it.
 *
 * The same background wash as the app shell, so the splash does not flash a
 * different colour and then hand over to something else.
 */
export const SPLASH =
  'grid min-h-dvh content-center justify-items-center gap-24 px-24 ' +
  'bg-[radial-gradient(1100px_700px_at_78%_-12%,var(--color-glow-a),transparent_62%),' +
  'radial-gradient(900px_620px_at_108%_42%,var(--color-glow-b),transparent_60%),' +
  'linear-gradient(180deg,var(--color-bg-top)_0%,var(--color-bg-deep)_100%)]'

/** Caps the chart on a phone without letting it grow silly on a monitor. */
export const SPLASH_CHART = 'w-[min(340px,72vw)] animate-fade'

/** Drawn with a round cap so the leading edge meets the marker cleanly. */
export const SPLASH_LINE =
  'animate-splash-draw fill-none stroke-[2.5] [stroke-dasharray:1] ' +
  '[stroke-linecap:round] [stroke-linejoin:round] [vector-effect:non-scaling-stroke]'

export const SPLASH_AREA = 'animate-splash-fill'

/** Rides the same path as the line, so it sits exactly on the drawing tip. */
export const SPLASH_MARKER = 'animate-splash-travel [offset-rotate:0deg]'

export const SPLASH_BRAND =
  'animate-rise text-[34px] leading-none font-bold tracking-[-0.04em] text-fg-strong ' +
  '[animation-delay:120ms]'

export const SPLASH_TAGLINE =
  'animate-rise text-center text-[13.5px] leading-[1.5] font-medium tracking-[-0.01em] ' +
  'text-fg-dim [animation-delay:220ms]'

/** Sits apart from the tagline: one is the product, the other is a status. */
export const SPLASH_STATUS =
  'animate-fade text-[11.5px] tracking-[0.04em] text-fg-muted uppercase ' +
  '[animation-delay:360ms]'

/**
 * The control that reopens the language picker.
 *
 * The choice used to be a one-time gate: once `coachLanguage` was on the
 * profile the picker never rendered again, so a language picked once was
 * permanent. This is the way back to it.
 */
export const LANGUAGE_CHANGE =
  'mt-14 inline-flex items-center gap-7 rounded-full border border-line bg-tint-1 px-13 py-7 text-[11.5px] text-fg-dim transition-[color,border-color] duration-150 hover:border-accent hover:text-fg'
export const LANGUAGE_CHANGE_NAME = 'font-medium text-fg'

/**
 * Scroll targets in the coach thread.
 *
 * The composer is sticky at the foot of the page, so it floats over the last
 * stretch of the conversation. Scrolling the end of the thread flush to the
 * bottom of the screen therefore parks the final line behind it — the answer
 * arrived, the page scrolled, and the last thing the coach said was still not
 * readable. The margin is the composer's height plus its offset plus air.
 */
export const THREAD_ANCHOR = 'scroll-mb-86'

/** The matching clearance at the top, for a reply too tall to take in at once
 *  and aligned to the top of the screen instead of the bottom. */
export const THREAD_REPLY = 'scroll-mt-20'

/**
 * The behavioural leak card's cost row and recommendation.
 *
 * Both sit in a 320px rail and both hold model-written text, which is a
 * combination that has to be assumed hostile. The cost label is allowed 60
 * characters by the API and used to be laid out as one unbreakable monospace
 * line opposite its own label — "-$3,706 over 15 rule-breaking trades" wants
 * about 500px and had 280, so it ran straight out of the card.
 *
 * So the row wraps instead of overflowing: the two halves sit side by side
 * while they fit and stack when they do not.
 */
export const INSIGHT_COST =
  'mt-14 flex flex-wrap items-baseline justify-between gap-x-12 gap-y-2 border-t border-line pt-12 text-[11.5px] text-fg-muted'
export const INSIGHT_COST_VALUE =
  'min-w-0 font-mono text-[13px] font-medium break-words'

export const INSIGHT_ACTION =
  'mt-12 flex items-start gap-8 rounded-sm bg-tint-1 px-12 py-10 text-[12px] leading-[1.55] text-fg-dim [&>svg]:mt-2 [&>svg]:flex-none [&>svg]:text-accent-strong'
/** min-w-0 so a long recommendation wraps inside the flex row rather than
 *  forcing the box wider than the rail. */
export const INSIGHT_ACTION_TEXT = 'min-w-0 break-words'

/**
 * Step lists inside a coach reply.
 *
 * Hanging indent via padding plus a negative text-indent on the marker, so a
 * step that wraps onto a second line stays aligned under the first word rather
 * than sliding back under its own number. `tabular-nums` keeps 9. and 10. the
 * same width, which is what stops a long list looking ragged down the left.
 */
export const REPLY_STEPS =
  'mt-10 flex list-decimal flex-col gap-8 pl-22 marker:font-medium marker:tabular-nums marker:text-fg-muted'
export const REPLY_POINTS =
  'mt-10 flex list-disc flex-col gap-8 pl-22 marker:text-fg-muted'
export const REPLY_ITEM = 'pl-2 leading-[1.55]'

/**
 * Attaching a chart to a coach message.
 *
 * The preview sits above the composer rather than inside it: a thumbnail in a
 * pill-shaped input either squashes the text field or stretches the pill, and
 * both look like a mistake.
 */
export const CHART_TRAY =
  'flex items-center gap-10 rounded-sm border border-line bg-panel px-10 py-9 shadow-[var(--shadow-card)]'
export const CHART_THUMB =
  'size-44 flex-none rounded-xs border border-line object-cover'
export const CHART_TRAY_NAME = 'min-w-0 flex-1 text-[12px] text-fg-dim'
export const CHART_TRAY_NOTE = 'block truncate text-[10.5px] text-fg-muted'
/**
 * Charts attached to a trade, listed by name.
 *
 * A name rather than a thumbnail: six charts rendered at any useful size
 * push the rest of the form off screen, and the trader picked these files
 * seconds ago — what they need is confirmation that each one arrived, which
 * a filename gives and a postage-stamp crop of a candle chart doesn't.
 */
export const SHOT_LIST = "mt-8 flex flex-col gap-6"
export const SHOT_ROW =
  'flex items-center gap-9 rounded-sm border border-line bg-tint-1 px-10 py-8 text-[12.5px] text-fg-dim [&_svg]:flex-none [&_svg]:text-fg-muted'
/** Breaks anywhere, because a storage key has no spaces to break at. */
export const SHOT_NAME = "min-w-0 flex-1 truncate"
export const SHOT_DROP =
  'grid size-24 flex-none place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'

/**
 * The file input itself.
 *
 * Bounded, because the control sizes itself to its button and filename and
 * a bare one stretches its border the full width of the form — a long empty
 * box that reads as a text field the trader is meant to type into.
 */
export const SHOT_FILE = "block w-full max-w-420"
export const CHART_DROP =
  'grid size-34 flex-none place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:not-disabled:bg-tint-2 hover:not-disabled:text-fg-strong disabled:cursor-not-allowed disabled:opacity-40'

/** The chart as it appears in the trader's own bubble, once sent. */
export const CHART_SENT =
  'mt-8 max-h-320 w-full rounded-sm border border-[color-mix(in_srgb,#fff_28%,transparent)] object-contain'

/**
 * A picture in a chat message, and the tray for one waiting to be sent.
 *
 * The dock is 380px wide, so a tall screenshot rendered at its natural size
 * would push the rest of the conversation off screen. It is capped and
 * clickable instead — full size opens in a tab.
 */
export const DOCK_IMAGE =
  'mb-6 block max-h-260 w-full cursor-zoom-in rounded-xs border border-[color-mix(in_srgb,#fff_22%,transparent)] object-contain'

export const DOCK_TRAY =
  'flex items-center gap-9 border-t border-line px-13 py-9 text-[11.5px] text-fg-dim'
export const DOCK_TRAY_THUMB =
  'size-34 flex-none rounded-xs border border-line object-cover'
export const DOCK_TRAY_NAME = 'min-w-0 flex-1 truncate'
export const DOCK_ATTACH =
  'grid size-32 flex-none place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:not-disabled:bg-tint-2 hover:not-disabled:text-fg-strong disabled:cursor-not-allowed disabled:opacity-40'

/* ------------------------------------------------------- date range picker */

/*
 * The popover sits under the segmented control it belongs to. Anchored right,
 * because the control sits at the right end of the card header and a
 * left-anchored panel would hang off the card on a narrow screen.
 */
export const RANGE_POP =
  'absolute top-[calc(100%+8px)] right-0 z-40 w-[min(320px,calc(100vw-32px))] rounded-md border border-line-strong bg-panel-solid p-14 shadow-[var(--shadow-pop)] [animation:menu-in_0.16s_cubic-bezier(0.22,0.8,0.3,1)_backwards] ' +
  'max-[520px]:fixed max-[520px]:top-auto max-[520px]:bottom-16 max-[520px]:right-16 max-[520px]:left-16 max-[520px]:w-auto'

export const RANGE_HEAD = 'mb-12 flex items-center justify-between gap-8'
export const RANGE_MONTH = 'text-[13px] font-semibold text-fg-strong tabular-nums'
export const RANGE_NAV =
  'grid size-28 place-items-center rounded-sm text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

export const RANGE_WEEKDAYS =
  'grid grid-cols-7 [&>span]:py-4 [&>span]:text-center [&>span]:text-[10px] [&>span]:font-semibold [&>span]:tracking-[0.08em] [&>span]:text-fg-muted [&>span]:uppercase'

/** No gap: the selected band has to run unbroken from one day to the next. */
export const RANGE_GRID = 'grid grid-cols-7'

/*
 * Each day is a band cell wrapping a circular button. The band paints the
 * range and the button paints the two ends, which is what lets a continuous
 * highlight still have round caps.
 */
export const RANGE_CELL = 'relative flex h-34 items-center justify-center'
export const RANGE_BAND = 'bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)]'
export const RANGE_BAND_START = 'rounded-l-full'
export const RANGE_BAND_END = 'rounded-r-full'

export const RANGE_DAY =
  'relative z-[1] grid size-30 place-items-center rounded-full text-[12px] tabular-nums text-fg-dim transition-[color,background-color] duration-150 hover:bg-tint-3 hover:text-fg-strong disabled:cursor-not-allowed disabled:text-fg-muted disabled:opacity-35 disabled:hover:bg-transparent'
export const RANGE_DAY_OUTSIDE = 'text-fg-muted opacity-45'
/** A ring rather than a fill, so today never competes with a selected end. */
export const RANGE_DAY_TODAY = 'shadow-[inset_0_0_0_1px_var(--color-line-strong)]'
export const RANGE_DAY_EDGE =
  'bg-accent font-semibold text-accent-ink hover:bg-accent-strong hover:text-accent-ink'

export const RANGE_FOOT =
  'mt-12 flex items-center justify-between gap-10 border-t border-line pt-12 text-[11.5px] text-fg-muted'
export const RANGE_CLEAR =
  'font-medium text-accent-strong transition-opacity duration-150 hover:underline disabled:opacity-40 disabled:no-underline'

/**
 * The searchable filter select.
 *
 * The closed state is a plain button rather than a `<select>`, so it inherits
 * the page's type and colours instead of the operating system's.
 */
export const SELECT_VALUE =
  'flex w-full min-w-0 cursor-pointer items-center justify-between gap-8 text-left text-[14.5px] text-fg'

/** The search field pinned inside the panel, above the options. */
export const COMBO_SEARCH =
  'sticky top-0 z-10 -m-4 mb-4 flex items-center gap-7 border-b border-line bg-panel-solid px-11 py-9 text-fg-muted ' +
  '[&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-none [&_input]:bg-transparent [&_input]:text-[13px] [&_input]:text-fg [&_input]:outline-none [&_input::placeholder]:text-fg-muted'

/* ------------------------------------------------- trade detail & confirm */

export const DETAIL_HEAD = 'flex min-w-0 flex-wrap items-center gap-10'
export const DETAIL_TICKER =
  'text-[21px] font-semibold tracking-[-0.02em] text-fg-strong'
export const DETAIL_PL = 'text-[17px] font-semibold tabular-nums'

/*
 * Label above value, in as many columns as the width allows. A definition list
 * rather than a table: this is one record's fields, not rows of records, and a
 * table would promise a structure the content does not have.
 */
export const DETAIL_GRID =
  'm-0 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-20 gap-y-16 px-26 py-22 ' +
  '[&_dt]:text-[11px] [&_dt]:font-semibold [&_dt]:tracking-[0.1em] [&_dt]:text-fg-muted [&_dt]:uppercase ' +
  '[&_dd]:mt-4 [&_dd]:mb-0 [&_dd]:ml-0 [&_dd]:text-[13.5px] [&_dd]:break-words [&_dd]:text-fg'

/*
 * The confirmation replaces the footer rather than stacking a second dialog on
 * the first. A modal over a modal buries the thing being confirmed, which is
 * the one thing worth reading before answering.
 */
export const CONFIRM_CARD =
  'border-t border-line bg-[color-mix(in_srgb,var(--color-red)_7%,transparent)] px-26 pt-20 pb-22'
export const CONFIRM_TITLE = 'text-[14.5px] font-semibold text-fg-strong'
export const CONFIRM_BODY = 'mt-6 text-[12.5px] leading-[1.55] text-fg-dim'
export const CONFIRM_FOOT = 'mt-18 flex flex-wrap items-center justify-end gap-10'

/** Destructive. Paired with PILL, like the other two states. */
export const PILL_DANGER =
  'border-transparent bg-red text-white shadow-[0_6px_18px_-8px_var(--color-red)] hover:bg-[color-mix(in_srgb,var(--color-red)_85%,black)] hover:text-white'

/** A journal row that opens. Focus is visible because a row has no outline of
 *  its own once it becomes a control. */
export const ROW_CLICKABLE =
  'cursor-pointer outline-none focus-visible:bg-tint-2 focus-visible:[&>td:first-child]:before:scale-y-100'

/**
 * A chosen item with its own remove button — a list you edit, not a set you
 * toggle. TAG_TOGGLE next door is for a fixed set of options; this is for a
 * list whose contents the person owns.
 */
export const EDIT_CHIP =
  'inline-flex items-center gap-7 rounded-full border border-line-strong bg-tint-2 py-6 pr-6 pl-13 text-[12.5px] text-fg'
export const EDIT_CHIP_REMOVE =
  'grid size-18 place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-3 hover:text-red'

/**
 * A dropdown hung off a page-header action.
 *
 * Right-aligned, because these sit at the end of a header row and a
 * left-aligned panel would hang off the edge of the page.
 */
export const ACTION_MENU =
  'absolute top-[calc(100%+6px)] right-0 z-40 flex max-w-[calc(100vw-32px)] min-w-180 flex-col overflow-hidden rounded-md border border-line-strong bg-panel-solid p-4 shadow-[var(--shadow-pop)] [animation:menu-in_0.14s_cubic-bezier(0.22,0.8,0.3,1)_backwards] ' +
  '[&>button]:rounded-[6px] [&>button]:px-11 [&>button]:py-9 [&>button]:text-left [&>button]:text-[13.5px] [&>button]:text-fg-dim [&>button]:transition-colors [&>button]:duration-100 ' +
  '[&>button:hover]:bg-tint-2 [&>button:hover]:text-fg-strong [&>button[aria-current]]:bg-tint-2 [&>button[aria-current]]:font-medium [&>button[aria-current]]:text-fg-strong'

/** For a menu whose trigger sits at the left of its row: anchored right, a
 *  180px panel runs off the left edge of a phone. */
export const ACTION_MENU_LEFT = 'right-auto left-0'

/** The thumbnail slot before there is a thumbnail — a spinner in its place,
 *  so the tray keeps its shape rather than jumping when the image lands. */
export const DOCK_TRAY_THUMB_EMPTY =
  'grid size-34 flex-none place-items-center rounded-xs border border-line bg-tint-1 text-fg-muted'

/* ---------------------------------------------------------- image viewer */

/**
 * The lightbox: a dialog that fills the screen rather than sitting in it.
 *
 * `max-w-none`/`max-h-none` because the shared MODAL caps its own size, and a
 * picture being examined wants every pixel available. The backdrop is darker
 * than a normal modal's for the same reason — what is being looked at is the
 * image, and the app behind it is a distraction.
 */
export const VIEWER =
  'fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-fg ' +
  'open:[animation:fade_0.2s_ease_backwards] ' +
  'backdrop:bg-[rgba(4,3,10,0.86)] backdrop:backdrop-blur-[2px] open:backdrop:[animation:fade_0.2s_ease_backwards]'

/** Fills the dialog; clicks landing here, on nothing, close the viewer. */
export const VIEWER_STAGE =
  'relative grid h-full w-full place-items-center overflow-hidden select-none'

/**
 * The image itself.
 *
 * No transition on the transform: a zoom that eases looks considered until it
 * is chasing a drag, at which point the picture lags behind the cursor.
 */
export const VIEWER_IMAGE =
  'max-h-[86vh] max-w-[92vw] object-contain will-change-transform [transform-origin:center]'

export const VIEWER_BAR =
  'absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-8 p-16'

/** The controls, floating on their own panel so they read over any picture. */
export const VIEWER_TOOLS =
  'flex items-center gap-4 rounded-full border border-line-strong bg-panel-solid/95 p-6 shadow-[var(--shadow-pop)] backdrop-blur-[6px]'

export const VIEWER_BUTTON =
  'grid size-34 place-items-center rounded-full text-fg-dim transition-[color,background-color] duration-150 hover:not-disabled:bg-tint-2 hover:not-disabled:text-fg-strong disabled:cursor-not-allowed disabled:opacity-35'

/** Reads out the zoom level, and doubles as the reset button. */
export const VIEWER_LEVEL =
  'min-w-52 rounded-full px-10 py-7 text-center text-[12px] font-medium tabular-nums text-fg-dim transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'

export const VIEWER_CLOSE =
  'absolute top-16 right-16 z-10 grid size-36 place-items-center rounded-full border border-line-strong bg-panel-solid/95 text-fg-dim shadow-[var(--shadow-pop)] transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'

/** Which of several, top left, opposite the close button. */
export const VIEWER_COUNT =
  'absolute top-16 left-16 z-10 max-w-[50vw] truncate rounded-full border border-line-strong bg-panel-solid/95 px-14 py-9 text-[12px] text-fg-dim shadow-[var(--shadow-pop)]'

/** Step to the next picture. Centred vertically, clear of the toolbar. */
export const VIEWER_STEP =
  'absolute top-1/2 z-10 grid size-40 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-panel-solid/95 text-fg-dim shadow-[var(--shadow-pop)] transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'

/* ------------------------------------------------- pictures on a trade */

/**
 * Charts attached to a trade, as the detail view shows them back.
 *
 * Thumbnails here rather than filenames: in the form a name confirms the right
 * file went up, but reading an entry back the picture *is* the content — and
 * it is the one field a trader opens the row to look at.
 */
export const SHOT_STRIP = 'mt-8 flex flex-wrap gap-8'
export const SHOT_TILE =
  'relative size-72 cursor-zoom-in overflow-hidden rounded-sm border border-line bg-tint-1 transition-[border-color,transform] duration-150 hover:border-line-strong hover:scale-[1.03]'
export const SHOT_TILE_IMAGE = 'size-full object-cover'
/** A tile whose image has not resolved yet, or is a link we cannot render. */
export const SHOT_TILE_EMPTY =
  'grid size-full place-items-center text-fg-muted [&_svg]:opacity-60'

/* ------------------------------------------------------- dashboard panels */

/**
 * The greeting above the dashboard.
 *
 * Named rather than styled inline because it is the first thing on the page
 * and sets the scale everything under it is read against.
 */
export const GREETING_ROW = 'mb-20 flex flex-wrap items-end justify-between gap-12'
export const GREETING = 'text-[22px] font-medium tracking-[-0.02em] text-fg-strong'
export const GREETING_SUB = 'mt-4 text-[13px] text-fg-dim'
/** What the figures below are measured over. Small, and to the right. */
export const GREETING_SPAN =
  'rounded-full border border-line bg-tint-1 px-12 py-7 text-[11.5px] text-fg-dim'

/** A panel with a heading, for the sections that are not single figures. */
export const PANEL = 'px-20 pt-18 pb-20'
export const PANEL_HEAD = 'mb-14 flex items-baseline justify-between gap-12'
export const PANEL_TITLE =
  'text-[11px] font-medium tracking-[0.13em] text-fg-muted uppercase'
/** The sample size, beside the title. Always present where a mean is shown. */
export const PANEL_NOTE = 'text-[11px] text-fg-muted tabular-nums'
export const PANEL_EMPTY = 'py-14 text-[13px] leading-[1.55] text-fg-muted'

/* ---- consistency: a gauge, and the three parts behind it ---- */

/**
 * Gauge beside its own breakdown, rather than stacked.
 *
 * A score out of ten on its own is a number nobody can act on. The three
 * parts are what say which of them to go and fix, so they sit next to the
 * figure, not under a disclosure. Wraps to a column on a narrow card.
 */
export const GAUGE_SPLIT = 'flex flex-wrap items-center gap-x-28 gap-y-18'
export const GAUGE_DIAL = 'grid size-124 flex-none place-items-center rounded-full'
export const GAUGE_FACE =
  'grid size-104 place-items-center rounded-full bg-panel-solid text-center'
export const GAUGE_VALUE = 'text-[28px] font-semibold leading-none'
export const GAUGE_OUT_OF = 'text-[13px] font-normal text-fg-muted'
export const GAUGE_CAPTION = '-mt-18 text-[10px] text-fg-muted'

/** What sits beside the dial: the two figures behind it, then the sentence. */
export const GAUGE_PARTS = 'flex min-w-200 flex-1 flex-col gap-14'
export const GAUGE_PART_ABOUT = 'text-[11px] leading-[1.5] text-fg-muted'

/** The inputs to the ratio, shown so the percentage can be checked by eye. */
export const GAUGE_READING_ROW = 'flex flex-wrap gap-x-32 gap-y-12'
export const GAUGE_READING = 'flex flex-col gap-3'
export const GAUGE_READING_LABEL =
  'text-[10px] font-medium tracking-[0.11em] text-fg-muted uppercase'
export const GAUGE_READING_VALUE =
  'text-[17px] font-semibold tabular-nums text-fg-strong'

/* ---- setup performance: a table, because it is one ---- */

export const SETUP_TABLE = 'w-full border-collapse text-[13px]'
export const SETUP_HEAD =
  '[&>tr>th]:pb-9 [&>tr>th]:text-left [&>tr>th]:text-[10.5px] [&>tr>th]:font-medium [&>tr>th]:tracking-[0.1em] [&>tr>th]:text-fg-muted [&>tr>th]:uppercase [&>tr>th:not(:first-child)]:text-right'
export const SETUP_BODY =
  '[&>tr]:border-t [&>tr]:border-line [&>tr>td]:py-10 [&>tr>td]:tabular-nums [&>tr>td:not(:first-child)]:text-right'
export const SETUP_NAME = 'max-w-160 truncate font-medium text-fg not-tabular-nums'

/* ---- risk health ---- */

export const RISK_GRID = 'grid grid-cols-2 gap-x-16 gap-y-14'
export const RISK_ITEM = 'flex flex-col gap-4'
export const RISK_LABEL = 'text-[11.5px] text-fg-muted'
export const RISK_VALUE = 'text-[17px] font-medium tabular-nums text-fg-strong'
/** The trader's own limit, under the figure it should be compared against. */
export const RISK_AGAINST = 'text-[11px] text-fg-muted tabular-nums'

/* ---- discipline ---- */

export const SCORE_VALUE =
  'text-[34px] leading-none font-medium tracking-[-0.02em] tabular-nums'
export const SCORE_ROW = 'mt-16 flex flex-col gap-11'
export const SCORE_LINE = 'flex items-center gap-10 text-[12.5px]'
export const SCORE_NAME = 'w-104 flex-none text-fg-dim'
export const SCORE_TRACK = 'h-6 flex-1 overflow-hidden rounded-full bg-tint-2'
export const SCORE_FILL = 'block h-full rounded-full transition-[width] duration-500 ease-out'
export const SCORE_PCT = 'w-40 flex-none text-right tabular-nums text-fg-dim'

/* ------------------------------------------- keeping a long finding in hand */

/**
 * A body of text trimmed to a few lines, with the rest a click away.
 *
 * The coach writes as much as the finding warrants, and some findings warrant
 * a paragraph. In a 320px rail that paragraph is what turns a summary card
 * into a column twice the height of the chart beside it — leaving a void on
 * one side of the row and pushing everything below it down.
 *
 * Clamping rather than scrolling: a scrollbar inside a card on a dashboard is
 * a thing nobody finds, and the first few lines are where the coach puts the
 * point anyway.
 */
export const INSIGHT_CLAMP = 'line-clamp-6'

export const INSIGHT_MORE =
  'mt-8 text-[12px] font-medium text-accent-strong transition-opacity duration-150 hover:opacity-80'

/* ------------------------------------------------------------- analytics */

/**
 * The tab strip that replaces one very long page.
 *
 * Seven sections stacked vertically is a page nobody scrolls to the bottom of.
 * As tabs, each one is a question the trader chose to ask.
 */
export const TABS =
  'flex flex-wrap gap-6 rounded-full border border-line bg-tint-1 p-5 max-[720px]:rounded-sm'
export const TAB =
  'rounded-full px-14 py-8 text-[12.5px] font-medium text-fg-dim transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'
export const TAB_ON = 'bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink'

/** A question the section answers, above the numbers that answer it. */
export const SECTION_ASK = 'mb-14 text-[13px] leading-[1.55] text-fg-dim'

/** Two panels side by side, stacking on a narrow screen. */
export const SPLIT =
  'grid items-start gap-18 grid-cols-2 max-[900px]:grid-cols-[minmax(0,1fr)]'

/* ---- the shared slice table ---- */

export const SLICE_WRAP = 'overflow-x-auto'
export const SLICE_TABLE = 'w-full border-collapse text-[13px]'
export const SLICE_HEAD =
  '[&>tr>th]:pb-9 [&>tr>th]:text-left [&>tr>th]:text-[10.5px] [&>tr>th]:font-medium [&>tr>th]:tracking-[0.1em] [&>tr>th]:text-fg-muted [&>tr>th]:uppercase [&>tr>th:not(:first-child)]:text-right [&>tr>th]:whitespace-nowrap'
export const SLICE_BODY =
  '[&>tr]:border-t [&>tr]:border-line [&>tr>td]:py-10 [&>tr>td]:tabular-nums [&>tr>td:not(:first-child)]:text-right [&>tr>td]:whitespace-nowrap'
export const SLICE_LABEL = 'max-w-200 truncate font-medium text-fg not-tabular-nums'
/** Sortable heading. A button, so it is reachable without a mouse. */
export const SLICE_SORT =
  'inline-flex items-center gap-4 text-inherit transition-opacity duration-150 hover:opacity-75'

/* ---- a horizontal bar, for distributions ---- */

export const BAR_LIST = 'flex flex-col gap-10'
export const BAR_LINE = 'flex items-center gap-10 text-[12.5px]'
export const BAR_NAME = 'w-112 flex-none truncate text-fg-dim'
export const BAR_TRACK = 'relative h-16 flex-1 overflow-hidden rounded-xs bg-tint-1'
/** Positive grows right of centre, negative left. See the zero rule below. */
export const BAR_FILL = 'absolute inset-y-0 rounded-xs transition-[width] duration-500'
export const BAR_ZERO = 'absolute inset-y-0 w-px bg-line-strong'
export const BAR_VALUE = 'w-84 flex-none text-right tabular-nums'

/* ---- the "not enough data" note that every section can need ---- */

export const SECTION_EMPTY =
  'rounded-sm border border-dashed border-line px-16 py-20 text-center text-[13px] leading-[1.6] text-fg-muted'

/* -------------------------------------------------- broker connections */

/**
 * The panel where a trader will hand over a broker credential.
 *
 * Styled to carry its own explanation rather than to look sleek. This is the
 * one place in the app that asks for something belonging to another company,
 * and the wording around the field does more for trust than anything else
 * here — a trader who understands that the investor password is read-only can
 * decide to share it; one who is not told simply will not.
 */
export const CONNECT_NOTE =
  'mb-16 rounded-sm border border-line bg-tint-1 px-14 py-12 text-[12.5px] leading-[1.6] text-fg-dim [&_strong]:font-medium [&_strong]:text-fg'

/* --------------------------------------------------------- csv importer */

/**
 * What the formatter decided, shown before anything is imported.
 *
 * The decisions worth surfacing are the ones that ruin data quietly: whether a
 * comma was a decimal point, and whether 03/04 was March or April. Both are
 * settled from the whole file rather than guessed per value, and both are
 * printed here so a person can overrule them before the journal is written to.
 */
export const CSV_READING = 'mb-14 flex flex-wrap gap-8'
export const CSV_FACT =
  'rounded-full border border-line bg-tint-1 px-11 py-6 text-[11.5px] text-fg-dim [&_strong]:font-medium [&_strong]:text-fg'

/** One row per field, so a wrong guess can be corrected without leaving. */
export const CSV_MAP = 'flex flex-col gap-8'
export const CSV_MAP_ROW = 'flex items-center gap-10 text-[12.5px]'
export const CSV_MAP_NAME = 'w-104 flex-none text-fg-dim'
export const CSV_MAP_PICK = 'min-w-0 flex-1'
/** A field nothing was found for. Not an error — most files lack several. */
export const CSV_MAP_EMPTY = 'text-[11px] text-fg-muted'

export const CSV_PREVIEW = 'mt-4 max-h-260 overflow-auto rounded-sm border border-line'
export const CSV_TABLE = 'w-full border-collapse text-[12px]'
export const CSV_HEAD =
  'sticky top-0 bg-panel-solid [&>tr>th]:px-10 [&>tr>th]:py-8 [&>tr>th]:text-left [&>tr>th]:text-[10.5px] [&>tr>th]:font-medium [&>tr>th]:tracking-[0.08em] [&>tr>th]:text-fg-muted [&>tr>th]:uppercase [&>tr>th]:whitespace-nowrap'
export const CSV_BODY =
  '[&>tr]:border-t [&>tr]:border-line [&>tr>td]:px-10 [&>tr>td]:py-7 [&>tr>td]:whitespace-nowrap [&>tr>td]:tabular-nums'

/** Rows that could not be read, listed rather than dropped in silence. */
export const CSV_PROBLEMS =
  'mt-12 max-h-140 overflow-y-auto rounded-sm border border-[color-mix(in_srgb,var(--color-amber)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] px-12 py-10 text-[12px] leading-[1.6] text-fg-dim'

export const CSV_DROP =
  'flex cursor-pointer flex-col items-center gap-10 rounded-sm border border-dashed border-line px-16 py-28 text-center text-[13px] text-fg-muted transition-[border-color,background-color] duration-150 hover:border-line-strong hover:bg-tint-1'

/* ------------------------------------------- checking an import first */

/**
 * What stands between a guessed column and a damaged journal.
 *
 * Import is the one place in this app where a mistake is invisible
 * afterwards. A wrong trade is indistinguishable from a real one, and every
 * figure built on it — win rate, expectancy, risk, the coach's reading — is
 * quietly wrong with nothing to show for it. So the warnings here are loud,
 * and the ones that indicate a mis-mapped column stop the import rather than
 * decorating it.
 */
export const CSV_ALERT =
  'mt-12 rounded-sm border px-13 py-11 text-[12.5px] leading-[1.6] [&_strong]:font-medium'
export const CSV_ALERT_STOP =
  'border-[color-mix(in_srgb,var(--color-red)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-red)_10%,transparent)] text-fg-dim'
export const CSV_ALERT_CHECK =
  'border-[color-mix(in_srgb,var(--color-amber)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] text-fg-dim'
export const CSV_ALERT_TITLE = 'mb-6 flex items-center gap-7 font-medium text-fg'
export const CSV_ALERT_ITEM = 'mt-4 flex gap-7 before:content-["·"] before:text-fg-muted'

/** The glance-check: what is about to land, in one line per fact. */
export const CSV_SUMMARY =
  'mt-12 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-16 gap-y-12 rounded-sm border border-line bg-tint-1 px-14 py-12'
export const CSV_SUMMARY_ITEM = 'flex flex-col gap-3'
export const CSV_SUMMARY_LABEL = 'text-[10.5px] tracking-[0.1em] text-fg-muted uppercase'
export const CSV_SUMMARY_VALUE = 'text-[13px] text-fg break-words'

/** A field the analyser is unsure about, needing a look before importing. */
export const CSV_UNSURE = 'text-[11px] font-medium text-amber'

/* -------------------------------------------------------- widget layout */

/**
 * The grid a trader can rearrange.
 *
 * Twelve columns and a small row unit, with `dense` packing so a widget made
 * narrow leaves a gap the next one can fill rather than a hole. Columns are
 * set in the style attribute from the layout model; only what does not vary
 * lives here.
 */
export const WIDGET_GRID = 'grid grid-flow-row-dense items-stretch'

/**
 * One widget, and the surface its handles live on.
 *
 * A column whose card is the column, which is what makes a height drag do
 * anything at all. `height: 100%` was the first attempt and is the fragile
 * version — it only resolves when the parent's height is definite, so the
 * card sat at its natural height at the top of a taller empty box, leaving a
 * gap with a resize handle floating in it. `flex-1` needs no such thing.
 *
 * The handles are absolutely positioned and so take no part in the flex.
 * `min-w-0` keeps a wide table from pushing the column wider than the grid
 * gave it, and `group` lets the handles appear on hover without JavaScript
 * deciding when.
 */
export const WIDGET =
  'group relative flex min-w-0 flex-col [&>*:first-child]:min-h-0 [&>*:first-child]:flex-1'
/** The frame while it is being dragged or resized — lifted, and on top. */
export const WIDGET_ACTIVE =
  'z-30 [&>*]:pointer-events-none shadow-[var(--shadow-pop)] ring-1 ring-accent'

/** Where a dragged widget would land. */
export const WIDGET_TARGET =
  'rounded-lg border-2 border-dashed border-accent bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'

/**
 * A resize handle.
 *
 * Invisible until the widget is hovered, and larger than it looks: the hit
 * area is ten pixels but the visible line is two, because a four-pixel target
 * is a target people miss. Pointer events stay on so the handle still works
 * before it fades in.
 */
export const HANDLE =
  'absolute z-20 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 touch-none'
export const HANDLE_N = 'top-[-5px] right-10 left-10 h-10 cursor-ns-resize'
export const HANDLE_S = 'bottom-[-5px] right-10 left-10 h-10 cursor-ns-resize'
export const HANDLE_E = 'top-10 right-[-5px] bottom-10 w-10 cursor-ew-resize'
export const HANDLE_W = 'top-10 bottom-[-5px] left-[-5px] w-10 cursor-ew-resize'
export const HANDLE_NE = 'top-[-5px] right-[-5px] size-14 cursor-nesw-resize'
export const HANDLE_NW = 'top-[-5px] left-[-5px] size-14 cursor-nwse-resize'
export const HANDLE_SE = 'right-[-5px] bottom-[-5px] size-14 cursor-nwse-resize'
export const HANDLE_SW = 'bottom-[-5px] left-[-5px] size-14 cursor-nesw-resize'

/** The mark inside a corner handle, so it can be seen as well as found. */
export const HANDLE_CORNER_MARK =
  'absolute right-4 bottom-4 size-7 rounded-[2px] border-r-2 border-b-2 border-accent'

/** Picking a widget up to move it. Sits in the corner, out of the content. */
export const WIDGET_GRIP =
  'absolute top-7 right-7 z-20 grid size-24 cursor-grab place-items-center rounded-sm text-fg-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-tint-2 hover:text-fg-strong active:cursor-grabbing touch-none'

/** The one control the whole feature needs: put it back how it was. */
export const LAYOUT_RESET =
  'text-[11.5px] font-medium text-fg-muted transition-colors duration-150 hover:text-fg-strong'

/* ------------------------------------------------------------ templates */

/** One page's widgets, as a block on the Templates screen. */
export const TPL_PAGE = 'mb-24'
export const TPL_PAGE_HEAD = 'mb-12 flex flex-wrap items-baseline justify-between gap-10'
export const TPL_PAGE_NAME = 'text-[15px] font-medium text-fg-strong'
export const TPL_PAGE_COUNT = 'text-[12px] text-fg-muted tabular-nums'

export const TPL_LIST = 'grid gap-12 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]'

/**
 * One widget, with its switch.
 *
 * The whole row is the control rather than a toggle at the end of it: a
 * 20-pixel switch beside 280 pixels of card is a target people miss, and there
 * is nothing else on the row to click by mistake.
 */
export const TPL_ITEM =
  'flex w-full cursor-pointer items-start gap-12 rounded-sm border border-line bg-tint-1 px-14 py-12 text-left transition-[border-color,background-color,opacity] duration-150 hover:border-line-strong'
/** Switched off: dimmed, so the list still reads as one set. */
export const TPL_ITEM_OFF = 'opacity-45'

export const TPL_ITEM_BODY = 'min-w-0 flex-1'
export const TPL_ITEM_NAME = 'text-[13.5px] font-medium text-fg'
export const TPL_ITEM_ABOUT = 'mt-3 text-[11.5px] leading-[1.5] text-fg-muted'

/** The switch. A span, because the row around it is the button. */
export const TPL_SWITCH =
  'relative mt-2 h-18 w-32 flex-none rounded-full transition-colors duration-150'
export const TPL_SWITCH_ON = 'bg-accent'
export const TPL_SWITCH_OFF = 'bg-tint-2'
export const TPL_KNOB =
  'absolute top-3 size-12 rounded-full bg-white transition-[left] duration-150'

/**
 * Waiting for a page's code to arrive.
 *
 * Deliberately quiet — a bar, not a spinner, and no text. Most of these
 * resolve in under a hundred milliseconds on a warm connection, and a message
 * that appears and vanishes in that time is noticed only as a flicker. It has
 * a delay before it fades in for the same reason.
 */
export const PAGE_PENDING =
  'mx-auto mt-80 h-2 w-160 overflow-hidden rounded-full bg-tint-2 opacity-0 [animation:fade_0.3s_0.25s_ease_forwards]'
export const PAGE_PENDING_BAR =
  'block h-full w-1/4 rounded-full bg-accent [animation:slide-through_1.1s_ease-in-out_infinite]'

/* ---------------------------------------------------------- landing page */

/*
 * The landing page has one look, whatever theme the app itself is set to.
 *
 * It is the first thing a visitor sees, before they have any preference to
 * remember, so it is designed as a single deep-indigo surface rather than a
 * pair of themes. The colours are the app's own dark palette written out
 * literally — accent #7c6cf6 / #8f83ff, cyan #3fd8ee — so it cannot flip when
 * a returning trader's saved light theme is applied to the document.
 */
export const LAND_PAGE =
  'relative min-h-screen overflow-x-clip bg-[#05041a] text-white [color-scheme:dark]'

/*
 * The moving background: fixed behind everything, so it stays put while the
 * page scrolls over it and the motion reads as atmosphere rather than as
 * content. Every piece moves by transform alone — the blobs reuse the drift
 * keyframes the login screen already runs, and the grid pans by translating an
 * oversized sheet — so the compositor animates it without repainting a
 * full-screen layer on every frame.
 */
export const LAND_BG =
  'pointer-events-none fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,#0b0929_0%,#05041a_100%)]'
/* No filter: blur. The blobs are radial gradients and already soft at the edge,
   and a 90px blur on three screen-sized layers measured at a 400ms median
   frame — the blur was being recomputed as they moved. */
export const LAND_BG_BLOB = 'absolute rounded-full will-change-transform'
export const LAND_BG_BLOB_A =
  'animate-orb-a -top-[22%] -left-[14%] size-[64vmax] bg-[radial-gradient(circle,rgba(99,78,240,0.55),transparent_70%)]'
export const LAND_BG_BLOB_B =
  'animate-orb-b top-[18%] -right-[20%] size-[58vmax] bg-[radial-gradient(circle,rgba(63,106,255,0.4),transparent_70%)]'
export const LAND_BG_BLOB_C =
  'animate-orb-c -bottom-[30%] left-[18%] size-[68vmax] bg-[radial-gradient(circle,rgba(160,46,203,0.34),transparent_70%)]'
/** One tile larger than the screen on every side, so the loop has no seam. */
export const LAND_BG_GRID =
  'absolute -inset-64 [animation:land-grid-pan_18s_linear_infinite] ' +
  'bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] ' +
  '[mask-image:radial-gradient(ellipse_at_50%_35%,#000_0%,transparent_72%)]'

/*
 * The hero's container. Deliberately invisible: no border, no background, no
 * shadow and no clipping. A boxed frame put a hard edge between the hero and
 * the moving background; without one, the sphere and the drifting colour run
 * together, and overflow-x-clip on the page stops the sphere widening it.
 */
export const LAND_FRAME = 'relative mx-auto max-w-1240'

/*
 * The sphere. A radial gradient rather than an image, so it scales cleanly and
 * costs nothing to load; it breathes on transform and opacity only, which the
 * compositor animates without touching layout.
 */
export const LAND_ORB =
  'pointer-events-none absolute top-[11%] left-[47%] size-560 rounded-full opacity-90 ' +
  'bg-[radial-gradient(circle_at_34%_30%,#e2dbff_0%,#a391ff_16%,#6c52ea_40%,#2d1d88_66%,transparent_71%)] ' +
  '[animation:land-breathe_9s_ease-in-out_infinite] max-shell:left-[16%] max-shell:size-460 max-[620px]:top-[40%] max-[620px]:left-[-18%] max-[620px]:size-380'
export const LAND_HALO =
  'pointer-events-none absolute -top-120 left-[26%] size-800 rounded-full bg-[radial-gradient(circle,rgba(124,108,246,0.34),transparent_70%)] blur-[40px]'

export const LAND_NAV =
  'relative z-10 flex animate-fade items-center gap-20 px-40 pt-28 max-shell:px-24 max-[620px]:px-18 max-[620px]:pt-20'
export const LAND_BRAND = 'flex items-center gap-10 text-[17px] font-semibold tracking-[0.04em] text-white'
export const LAND_BRAND_MARK =
  'grid size-30 place-items-center rounded-sm bg-[linear-gradient(140deg,#a99dff,#3fd8ee)] text-[14px] font-bold text-[#0b0930]'
export const LAND_LINKS =
  'mx-auto flex items-center gap-32 text-[13px] text-white/65 max-shell:hidden [&>button]:transition-colors [&>button]:duration-150 [&>button:hover]:text-white'
export const LAND_LOGIN =
  'rounded-full bg-white px-18 py-8 text-[13px] font-semibold text-[#0b0930] transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97] max-shell:ml-auto'

export const LAND_HERO =
  'relative z-10 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-24 px-40 pt-60 pb-36 ' +
  'max-shell:grid-cols-1 max-shell:gap-40 max-shell:px-24 max-shell:pt-44 max-[620px]:px-18'

export const LAND_HEADLINE =
  'animate-rise text-[62px] leading-[1.02] font-semibold tracking-[-0.035em] text-white max-shell:text-[48px] max-[520px]:text-[37px]'
/** The second line fades toward the accent, so the promise reads as the payoff. */
export const LAND_HEADLINE_SOFT =
  'block bg-[linear-gradient(95deg,#ffffff_10%,#ddd6ff_55%,#b3a8ff)] bg-clip-text text-transparent'
export const LAND_LEAD =
  'mt-18 max-w-[42ch] animate-rise text-[16px] leading-[1.6] text-white/68 [animation-delay:120ms] max-[520px]:text-[14.5px]'
export const LAND_ACTIONS =
  'mt-28 flex animate-rise flex-wrap items-center gap-18 [animation-delay:220ms]'

/** White pill with a round accent button inside it — the one thing to press. */
export const LAND_CTA =
  'group inline-flex items-center gap-12 rounded-full bg-white py-5 pr-5 pl-20 text-[14px] font-semibold text-[#0b0930] ' +
  'shadow-[0_12px_40px_-12px_rgba(143,131,255,0.9)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]'
export const LAND_CTA_DOT =
  'grid size-34 place-items-center rounded-full bg-[linear-gradient(140deg,#9a8cff,#5b46e8)] text-white transition-transform duration-300 ease-out group-hover:-rotate-45'
export const LAND_TEXT_LINK =
  'text-[13.5px] font-medium text-white/70 underline-offset-4 transition-colors duration-150 hover:text-white hover:underline'

/* ------------------------------------------------ landing: floating cards */

/** A fixed-height stage the cards are placed on by percentage, so the whole
 *  arrangement scales with the column instead of reflowing card by card. */
export const LAND_STAGE =
  'relative h-460 max-shell:mx-auto max-shell:w-full max-shell:max-w-540 max-[620px]:h-420'

/*
 * Each card is two elements: the slot plays the entrance once, the glass
 * inside floats forever. Both animate `transform`, and one element can only
 * run one of them — stacking them on the same node would cancel the float the
 * moment the entrance finished.
 */
export const LAND_SLOT = 'absolute animate-pop'
export const LAND_SLOT_EQUITY = 'top-[1%] left-[14%] w-[56%] [animation-delay:260ms]'
export const LAND_SLOT_TAGS = 'top-[13%] right-0 w-[40%] [animation-delay:420ms] max-[620px]:top-[3%]'
export const LAND_SLOT_LIMIT = 'top-[43%] left-[3%] w-[64%] [animation-delay:560ms]'
export const LAND_SLOT_BARS = 'bottom-[1%] left-0 w-[47%] [animation-delay:700ms]'
export const LAND_SLOT_SETUP = 'right-[1%] bottom-[7%] w-[47%] [animation-delay:840ms]'

export const LAND_FLOAT_A = '[animation:land-float_7s_ease-in-out_infinite]'
export const LAND_FLOAT_B = '[animation:land-float_8.5s_ease-in-out_-2.5s_infinite]'
export const LAND_FLOAT_C = '[animation:land-float_6.5s_ease-in-out_-4s_infinite]'

/*
 * Glass without backdrop-filter. A backdrop blur is cached while what sits
 * behind it is still, but the background now moves, so every card would
 * re-blur it on every frame — measured, dropping it took the desktop hero from
 * a 50ms to a 33ms median frame. A darker tinted fill with a faint top-lit
 * gradient carries the glass look instead.
 */
export const LAND_GLASS =
  'rounded-[18px] border border-white/12 p-14 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] max-[520px]:p-11 ' +
  'bg-[linear-gradient(160deg,rgba(255,255,255,0.13),rgba(255,255,255,0.04))] bg-[rgba(20,16,56,0.55)]'
export const LAND_GLASS_TOP = 'flex items-center gap-10'
export const LAND_GLASS_ICON =
  'grid size-28 flex-none place-items-center rounded-sm bg-white/10 text-white max-[520px]:size-24'
export const LAND_GLASS_FIGURE = 'text-[14px] leading-tight font-semibold text-white tabular-nums max-[520px]:text-[12px]'
/** The figure as a card's title line, on a row of its own. */
export const LAND_GLASS_NAME = `${LAND_GLASS_FIGURE} block`
export const LAND_GLASS_CAPTION = 'text-[10.5px] text-white/55 max-[520px]:text-[9.5px]'
export const LAND_GLASS_MORE = 'ml-auto self-start text-[12px] leading-none tracking-[0.12em] text-white/40'

export const LAND_SPARK = 'mt-8 block h-70 w-full overflow-visible max-[520px]:h-54'
/** pathLength=1 on the path makes the draw keyframe's one dash span the curve. */
export const LAND_SPARK_LINE =
  'animate-draw fill-none stroke-[#b8acff] [stroke-width:2.4] [stroke-linecap:round] [animation-delay:520ms] [filter:drop-shadow(0_0_6px_rgba(143,131,255,0.9))]'
export const LAND_SPARK_AREA = 'animate-fade [animation-delay:900ms]'

export const LAND_TAG =
  'flex w-max max-w-full items-center gap-8 rounded-sm border border-white/12 bg-white/[0.09] px-10 py-7 text-[10.5px] whitespace-nowrap text-white/85 max-[520px]:text-[9.5px] [&+&]:mt-7'
export const LAND_TAG_SHIFT = 'ml-18'
export const LAND_DOT = 'size-6 flex-none rounded-full'
export const LAND_DOT_RED = 'bg-[#f2555a] shadow-[0_0_8px_#f2555a]'
export const LAND_DOT_GREEN = 'bg-[#4ade80] shadow-[0_0_8px_#4ade80]'
export const LAND_DOT_VIOLET = 'bg-[#a99dff] shadow-[0_0_8px_#a99dff]'

export const LAND_LIMIT_ROW = 'flex items-center justify-between gap-10 text-[12px] text-white/85 max-[520px]:text-[10.5px]'
export const LAND_TRACK = 'mt-11 h-6 overflow-hidden rounded-full bg-white/10'
export const LAND_TRACK_FILL =
  'h-full origin-left rounded-full bg-[linear-gradient(90deg,#8f83ff,#3fd8ee)] [animation:land-fill_1.4s_1s_cubic-bezier(0.22,0.8,0.3,1)_backwards]'

export const LAND_BARS = 'mt-10 flex h-74 items-end gap-3 max-[520px]:h-56'
export const LAND_BAR = 'flex-1 origin-bottom animate-grow-up rounded-t-[2px]'
export const LAND_BAR_WIN = 'bg-[linear-gradient(180deg,#a99dff,#4b3bd6)]'
export const LAND_BAR_LOSS = 'bg-[linear-gradient(180deg,#8a7fb8,#3b3466)]'
export const LAND_AXIS = 'mt-6 flex justify-between text-[9.5px] text-white/45'

export const LAND_CANDLES = 'mt-10 flex h-66 items-center justify-between px-2 max-[520px]:h-50'
export const LAND_CANDLE = 'flex animate-grow-up flex-col items-center'
export const LAND_WICK = 'w-px bg-white/35'
export const LAND_BODY_UP = 'w-6 rounded-full bg-white/90'
export const LAND_BODY_DOWN = 'w-6 rounded-full bg-[#8f83ff]'
export const LAND_SETUP_FOOT = 'mt-8 flex items-baseline gap-6'
export const LAND_UP = 'text-[10.5px] font-medium text-[#4ade80]'

/* The three figures along the bottom of the frame, divided like a spec sheet. */
export const LAND_STATS =
  'relative z-10 mx-40 grid grid-cols-3 border-t border-white/10 py-30 max-shell:mx-24 max-[620px]:mx-18 max-[620px]:py-22 ' +
  '[&>*]:px-32 [&>*:first-child]:pl-0 [&>*+*]:border-l [&>*+*]:border-white/12 max-[620px]:[&>*]:px-12'
export const LAND_STAT_VALUE =
  'text-[40px] leading-none font-semibold tracking-[-0.03em] text-white tabular-nums max-shell:text-[32px] max-[520px]:text-[23px]'
export const LAND_STAT_LABEL = 'mt-9 text-[13px] text-white/58 max-[520px]:text-[10.5px]'

/* ----------------------------------------------- landing: below the frame */

export const LAND_BODY = 'relative mx-auto max-w-1240 px-24 max-[620px]:px-6'
export const LAND_SECTION = 'pt-110 max-shell:pt-80 max-[620px]:pt-64'
export const LAND_HEAD_CENTER = 'flex flex-col items-center text-center'

export const LAND_EYEBROW =
  'inline-flex items-center gap-8 rounded-full border border-white/12 bg-white/[0.05] px-12 py-5 text-[11px] font-medium tracking-[0.12em] text-[#cfc6ff] uppercase'
export const LAND_H2 =
  'mt-16 max-w-[22ch] text-[42px] leading-[1.08] text-balance font-semibold tracking-[-0.03em] text-white max-shell:text-[34px] max-[520px]:text-[28px]'
export const LAND_P = 'mt-14 max-w-[58ch] text-[15px] leading-[1.65] text-white/60'

export const LAND_BENTO = 'mt-44 grid grid-cols-3 gap-16 max-shell:grid-cols-2 max-[620px]:grid-cols-1'
/** A wide tile spans two columns; on one column there is nothing to span. */
export const LAND_SPAN_2 = 'col-span-2 max-[620px]:col-span-1'

export const LAND_FEATURE =
  'group relative h-full overflow-hidden rounded-[22px] border border-white/10 p-26 transition-[border-color,translate] duration-300 hover:-translate-y-3 hover:border-white/22 ' +
  'bg-[linear-gradient(160deg,rgba(255,255,255,0.075),rgba(255,255,255,0.015))] ' +
  "before:pointer-events-none before:absolute before:-top-70 before:-right-70 before:size-220 before:rounded-full before:bg-[radial-gradient(circle,rgba(143,131,255,0.4),transparent_70%)] before:opacity-0 before:transition-opacity before:duration-500 before:content-[''] hover:before:opacity-100"
export const LAND_FEATURE_ICON =
  'relative grid size-44 place-items-center rounded-[13px] border border-white/12 text-white transition-transform duration-300 ease-spring group-hover:scale-110 ' +
  'bg-[linear-gradient(140deg,rgba(143,131,255,0.38),rgba(63,216,238,0.12))]'
export const LAND_FEATURE_TITLE = 'relative mt-20 text-[17px] font-semibold text-white'
export const LAND_FEATURE_BODY = 'relative mt-8 text-[14px] leading-[1.6] text-white/60'

export const LAND_STEPS = 'mt-44 grid grid-cols-3 gap-16 max-shell:grid-cols-1'
export const LAND_STEP = 'relative h-full rounded-[22px] border border-white/10 bg-white/[0.03] p-26'
export const LAND_STEP_NUM =
  'grid size-34 place-items-center rounded-full border border-[rgba(143,131,255,0.5)] text-[13px] font-semibold text-[#cfc6ff] tabular-nums'

/* ---------------------------------------------------- landing: pricing */

export const LAND_PLANS =
  'mt-50 grid grid-cols-4 items-stretch gap-14 max-[1180px]:grid-cols-2 max-[620px]:grid-cols-1'

/*
 * Shape only. Border and background are in exactly one of the two state
 * classes below, never both: the same stylesheet-order trap that once turned
 * every primary button grey would otherwise decide which card looks chosen.
 */
export const LAND_PLAN =
  'relative flex h-full flex-col rounded-[22px] border p-24 transition-[border-color,translate] duration-300 hover:-translate-y-3'
export const LAND_PLAN_IDLE = 'border-white/10 bg-white/[0.04] hover:border-white/22'
export const LAND_PLAN_FEATURED =
  'border-[rgba(169,157,255,0.6)] shadow-[0_30px_80px_-30px_rgba(124,108,246,0.95)] ' +
  'bg-[linear-gradient(165deg,rgba(143,131,255,0.32),rgba(40,28,120,0.38))]'
export const LAND_PLAN_BADGE =
  'absolute -top-11 left-24 rounded-full bg-[linear-gradient(90deg,#a99dff,#3fd8ee)] px-11 py-4 text-[10px] font-semibold tracking-[0.1em] text-[#0b0930] uppercase'
export const LAND_PLAN_NAME = 'text-[15px] font-semibold text-white'
export const LAND_PLAN_BLURB = 'mt-6 min-h-40 text-[13px] leading-[1.5] text-white/55'
export const LAND_PLAN_PRICE =
  'mt-18 flex min-h-38 items-baseline gap-4 text-[38px] leading-none font-semibold tracking-[-0.03em] text-white tabular-nums'
export const LAND_PLAN_PER = 'text-[13px] font-normal tracking-normal text-white/50'
/*
 * A tier whose features are still being built: the list's place on the card,
 * with blurred placeholder lines and a label over them. The blur is only the
 * look — the lines are empty shapes, so there is nothing underneath to read.
 */
export const LAND_PLAN_LOCKED = 'relative mt-20 flex flex-1 flex-col border-t border-white/10 pt-20'
export const LAND_PLAN_BLURRED = 'pointer-events-none flex flex-col gap-17 opacity-75 blur-[2.5px] select-none'
export const LAND_PLAN_SKELETON_ROW = 'flex items-center gap-9'
/** Stands in for the price: about the width of "$25/month", blurred the same way. */
export const LAND_PLAN_PRICE_HIDDEN =
  'h-34 w-128 rounded-sm bg-white/45 opacity-80 blur-[5px] select-none'
export const LAND_PLAN_SKELETON_DOT = 'size-9 flex-none rounded-full bg-[rgba(169,157,255,0.7)]'
export const LAND_PLAN_SKELETON_BAR = 'h-8 rounded-full bg-white/40'
export const LAND_PLAN_LOCK_BADGE =
  'absolute top-[calc(50%+10px)] left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-7 rounded-full border border-white/15 bg-[rgba(12,10,40,0.85)] px-12 py-6 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-white uppercase shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]'

/** Tags a tier line that is promised but not built yet. */
export const LAND_PLAN_SOON =
  'ml-7 inline-block rounded-full border border-[rgba(169,157,255,0.45)] bg-[rgba(143,131,255,0.14)] px-6 py-1 align-[1px] text-[9px] leading-[1.4] font-semibold tracking-[0.08em] text-[#cfc6ff] uppercase'
export const LAND_PLAN_FEATURES =
  'mt-20 flex flex-1 list-none flex-col gap-10 border-t border-white/10 p-0 pt-20 text-[13px] leading-[1.45] text-white/75 ' +
  '[&>li]:flex [&>li]:gap-9 [&>li>svg]:mt-2 [&>li>svg]:flex-none [&>li>svg]:text-[#a99dff]'
export const LAND_PLAN_CTA =
  'mt-24 inline-flex w-full items-center justify-center rounded-full py-11 text-[13.5px] font-semibold transition-[background-color,scale] duration-200 active:scale-[0.98]'
export const LAND_PLAN_CTA_IDLE = 'bg-white/10 text-white hover:bg-white/16'
export const LAND_PLAN_CTA_FEATURED = 'bg-white text-[#0b0930] hover:bg-[#ece9ff]'
/** A tier that cannot be chosen yet. Its own colours, never layered on the others. */
export const LAND_PLAN_CTA_DISABLED = 'cursor-not-allowed bg-white/[0.06] text-white/40 active:scale-100'
export const LAND_PLAN_NOTE = 'mt-24 text-center text-[12.5px] text-white/45'

/* ------------------------------------------------- landing: closing band */

export const LAND_CLOSER =
  'relative mt-110 overflow-hidden rounded-[30px] border border-white/10 px-40 py-68 text-center max-shell:mt-80 max-[620px]:px-22 max-[620px]:py-46 ' +
  'bg-[linear-gradient(135deg,#1d1454,#0d0a2e)]'
export const LAND_CLOSER_ORB =
  'pointer-events-none absolute -bottom-220 left-[calc(50%-240px)] size-480 rounded-full bg-[radial-gradient(circle,rgba(143,131,255,0.6),transparent_68%)] blur-[18px] [animation:land-breathe_9s_ease-in-out_infinite]'
export const LAND_CLOSER_INNER = 'relative flex flex-col items-center'
export const LAND_CLOSER_ACTIONS = 'mt-28 flex justify-center'

export const LAND_FOOT =
  'mt-60 flex flex-wrap items-center gap-x-22 gap-y-10 border-t border-white/10 py-28 text-[12.5px] text-white/45 [&_button]:transition-colors [&_button:hover]:text-white'
export const LAND_FOOT_END = 'ml-auto'

/* The sections below the fold arrive as they are scrolled to — a card that
   animated while off screen has already finished by the time it is read. */
export const SCROLL_REVEAL =
  'translate-y-18 opacity-0 transition-[opacity,translate] duration-[650ms] ease-out'
export const SCROLL_REVEAL_SHOWN = 'translate-y-0 opacity-100'

/* ------------------------------------------------------- palette picker */

/*
 * The chooser a new trader sees once, and the same grid reused inside
 * Settings.
 *
 * The veil is translucent rather than opaque, and that is the whole idea: a
 * palette applies the moment it is clicked, so the app has to stay visible
 * behind the card for the choice to mean anything. An opaque scrim would
 * make this a form about colours instead of a preview of them.
 */
export const PICK_VEIL =
  'fixed inset-0 z-[95] grid place-items-center overflow-y-auto p-20 bg-[color-mix(in_srgb,var(--color-bg-deep)_72%,transparent)] backdrop-blur-[10px] animate-fade'

export const PICK_CARD =
  'flex w-[min(720px,100%)] flex-col gap-20 rounded-lg border border-line-strong bg-panel-solid p-24 shadow-[var(--shadow-pop)] animate-pop max-[560px]:p-18'

export const PICK_KICKER =
  'text-[11px] font-medium tracking-[0.14em] text-accent uppercase'
export const PICK_TITLE =
  'mt-6 text-[22px] font-semibold tracking-[-0.02em] text-fg-strong'
export const PICK_BODY = 'mt-6 text-[13px] leading-[1.6] text-fg-dim'

/* Three across, then two, then one. The tile has to stay wide enough for the
   preview to read as a miniature screen rather than a colour chip. */
export const PICK_GRID =
  'grid grid-cols-3 gap-12 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1'

export const PICK_TILE =
  'group relative flex flex-col gap-10 rounded-md border border-line bg-tint-1 p-10 text-left transition-[border-color,transform,background-color] duration-150 hover:-translate-y-2 hover:border-line-strong hover:bg-tint-2'
export const PICK_TILE_ON =
  'border-transparent bg-tint-2 ring-2 ring-accent ring-offset-2 ring-offset-panel-solid'

/*
 * The miniature. Painted from the palette's own hex values rather than from
 * tokens — a tile has to show the palette it offers, not the one currently
 * applied, and tokens would give every tile the same colours.
 */
/* `block` is load-bearing: this renders as a span (it lives inside a button,
   where a div would be invalid), and height does nothing on an inline box. */
export const PICK_PREVIEW =
  'relative block h-58 overflow-hidden rounded-sm border border-line'
export const PICK_PREVIEW_PANEL =
  'absolute inset-x-8 bottom-8 h-26 rounded-[6px] border border-white/10'
export const PICK_PREVIEW_LINE =
  'absolute top-10 left-8 h-4 w-34 rounded-full'
export const PICK_PREVIEW_DOT = 'absolute top-9 right-8 size-7 rounded-full'

export const PICK_NAME = 'text-[13px] font-medium text-fg-strong'
export const PICK_BLURB = 'mt-3 text-[11.5px] leading-[1.5] text-fg-muted'

/** The tick on the chosen tile. Sits over the preview's top-right corner. */
export const PICK_CHECK =
  'absolute top-16 right-16 grid size-20 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_2px_8px_rgba(0,0,0,0.3)]'

export const PICK_FOOT =
  'flex flex-wrap items-center justify-between gap-14 border-t border-line pt-18'
export const PICK_FOOT_LABEL = 'text-[12px] text-fg-muted'
export const PICK_DONE =
  'inline-flex items-center gap-7 rounded-sm bg-accent px-20 py-10 text-[13px] font-medium text-accent-ink transition-[background-color,transform] duration-150 hover:bg-accent-strong active:scale-[0.97]'

/* --------------------------------------------------------- sidebar groups */

/*
 * A category and the children it discloses.
 *
 * The sidebar opens as a rail of icons, so a category has two jobs: name
 * itself when there is room, and expand the rail when there is not. The
 * disclosure is click-only — deliberately not hover — because a sub-menu that
 * springs open while the pointer is crossing the rail on its way somewhere
 * else is the thing that makes icon rails unpleasant to use.
 */

/** The caret on a category. Rotates rather than swapping glyph. */
export const NAV_CARET =
  'ml-auto flex-none opacity-60 transition-transform duration-200 ease-out'
export const NAV_CARET_OPEN = 'rotate-90'

/*
 * The open/shut animation, done with grid rows rather than max-height.
 *
 * A group has no fixed height, so a max-height would have to be a guess:
 * too small clips the last child, too large leaves the transition hanging
 * after the list has already finished moving. `grid-rows-[0fr]` to `[1fr]`
 * animates to the content's real height, whatever it turns out to be.
 */
export const NAV_SUB = 'grid transition-[grid-template-rows,opacity] duration-200 ease-out'
export const NAV_SUB_OPEN = 'grid-rows-[1fr] opacity-100'
export const NAV_SUB_SHUT = 'grid-rows-[0fr] opacity-0'
/** The row that actually clips. Children cannot overflow it while shut. */
export const NAV_SUB_INNER = 'overflow-hidden'

/*
 * A child link. Indented to start where the parent's *label* starts, not
 * where its icon does, so the two levels read as a hierarchy rather than as
 * two lists. The pseudo-element is a segment of rule: stacked, they draw one
 * continuous line down the group, and the active child lights its own segment.
 */
export const NAV_SUB_ITEM =
  'relative flex w-full items-center py-9 pr-32 pl-64 text-left text-[14.5px] ' +
  'transition-[color,background-color] duration-150 ' +
  "before:absolute before:inset-y-0 before:left-43 before:w-1 before:content-['']"
export const NAV_SUB_IDLE =
  'font-normal text-fg-muted before:bg-line hover:bg-tint-1 hover:text-fg'
export const NAV_SUB_ACTIVE = 'font-medium text-fg-strong bg-tint-1 before:bg-accent'

/* ------------------------------------------------------------ trade chart */

/*
 * The position chart in the trade modal, and the two-column body around it.
 *
 * The split collapses below 900px rather than at the shell breakpoint: this
 * is a dialog with its own width, so what matters is whether *it* has room
 * for two columns, not whether the page does.
 */
export const MODAL_SPLIT =
  'grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] overflow-hidden ' +
  'max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto'

/** The data side. Scrolls on its own so the chart beside it stays put. */
export const MODAL_SPLIT_DATA =
  'min-h-0 overflow-y-auto max-[900px]:overflow-visible'

/* A rule between the columns that becomes a rule above the chart once they
   stack — same separation, redrawn on the axis the layout is using. */
export const MODAL_SPLIT_CHART =
  'flex min-h-0 flex-col border-l border-line p-18 max-[900px]:border-t max-[900px]:border-l-0'

export const TV_WRAP = 'flex min-h-0 flex-1 flex-col gap-10'

/*
 * The chart box. `relative` because the zone bands are positioned against it,
 * and an explicit height because Lightweight Charts measures its container —
 * given an auto-height parent it would measure zero and render nothing.
 * Taller when the columns stack, where it has the full dialog width.
 */
export const TV_CANVAS =
  'relative min-h-0 flex-1 overflow-hidden rounded-sm border border-line bg-panel-inset ' +
  'h-[clamp(240px,42vh,380px)] max-[900px]:h-[clamp(220px,38vh,300px)]'

/*
 * The target and stop zones, as the position tool draws them: the ground
 * between entry and each level, tinted and left behind the line. `inset-x-0`
 * — they span the whole plot, because there is one trade on the chart and
 * nothing either side of it to bound them.
 */
const TV_BAND = 'pointer-events-none absolute inset-x-0 z-[1]'
export const TV_BAND_TARGET =
  `${TV_BAND} bg-[color-mix(in_srgb,var(--color-green)_13%,transparent)]`
export const TV_BAND_STOP =
  `${TV_BAND} bg-[color-mix(in_srgb,var(--color-red)_13%,transparent)]`

export const TV_KEY = 'flex flex-wrap items-center gap-x-16 gap-y-6'
export const TV_KEY_ROW = 'inline-flex items-center gap-6 text-[11px] text-fg-muted'
export const TV_KEY_DOT = 'inline-block size-7 flex-none rounded-full'

export const TV_EMPTY =
  'grid h-[clamp(240px,42vh,380px)] place-items-center rounded-sm border border-line bg-panel-inset px-24 text-center text-[12.5px] leading-[1.6] text-fg-muted'

/** Stands in for the chart while its library loads, at the same height so
 *  nothing below it moves when the real one arrives. */
export const TV_PENDING =
  'h-[clamp(240px,42vh,380px)] animate-pulse rounded-sm border border-line bg-panel-inset max-[900px]:h-[clamp(220px,38vh,300px)]'

/** Says why the chart is showing a position and no candles. Stated plainly,
 *  because an unconfigured provider is a decision rather than a fault. */
export const TV_NOTE = 'text-[11px] leading-[1.5] text-fg-muted'

/* ------------------------------------------------------------- community */

/*
 * Three columns: what to read, the reading itself, and who is around.
 *
 * The centre column is capped rather than fluid. A feed is prose with pictures
 * in it, and prose set the full width of a 1400px shell is unreadable — the
 * eye loses the line on the way back. The rails collapse before the column
 * narrows, so the last thing to give way is the thing being read.
 */
export const COMM_SHELL =
  'grid grid-cols-[176px_minmax(0,1fr)_268px] items-start gap-18 ' +
  'max-[1180px]:grid-cols-[176px_minmax(0,1fr)] max-[860px]:grid-cols-[minmax(0,1fr)]'

/** Both rails stick; only the feed scrolls under them. */
export const COMM_RAIL =
  'sticky top-14 flex flex-col gap-2 max-[860px]:static max-[860px]:flex-row ' +
  'max-[860px]:flex-wrap max-[860px]:gap-8'
/** Hidden a breakpoint earlier than the left rail: "who is around" is the
 *  first thing worth losing, and the feed is the last. */
export const COMM_ASIDE = 'sticky top-14 flex flex-col gap-14 max-[1180px]:hidden'

export const COMM_RAIL_ITEM =
  'flex items-center gap-10 rounded-sm px-12 py-10 text-left text-[13px] font-medium text-fg-dim transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'
export const COMM_RAIL_ACTIVE = 'bg-tint-2 text-fg-strong'
export const COMM_RAIL_COUNT =
  'ml-auto text-[11px] font-semibold tabular-nums text-fg-muted'

export const COMM_MAIN = 'flex min-w-0 flex-col gap-14'

/* -------------------------------------------------------------- composer */

export const COMM_COMPOSER = 'flex flex-col gap-12 px-18 pt-16 pb-14'
export const COMM_COMPOSER_ROW = 'flex items-start gap-12'
/**
 * Grows with what is typed, up to a point.
 *
 * `field-sizing: content` does this without a resize observer and without the
 * scroll-height dance that reads back layout on every keystroke. Where it is
 * unsupported the textarea simply keeps its height — the feature degrades to
 * the old behaviour rather than to a broken one.
 */
export const COMM_COMPOSER_INPUT =
  'max-h-220 min-h-44 w-full resize-none rounded-sm border border-line bg-tint-1 px-14 py-12 text-[13.5px] leading-[1.55] text-fg outline-none transition-[border-color,background-color] duration-150 [field-sizing:content] placeholder:text-fg-muted focus:border-accent focus:bg-panel-solid'
export const COMM_COMPOSER_FOOT =
  'flex flex-wrap items-center justify-between gap-10 border-t border-line pt-12'
export const COMM_COMPOSER_TOOLS = 'flex flex-wrap items-center gap-6'
export const COMM_TOOL =
  'inline-flex items-center gap-7 rounded-sm px-10 py-7 text-[12px] font-medium text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong aria-pressed:bg-tint-2 aria-pressed:text-accent-strong'

/* ------------------------------------------------------------------ post */

export const COMM_POST = 'flex flex-col px-18 pt-16 pb-4'
export const COMM_POST_HEAD = 'flex items-start gap-12'
export const COMM_POST_WHO = 'flex min-w-0 flex-col'
export const COMM_POST_NAME =
  'flex flex-wrap items-center gap-8 text-[13.5px] font-semibold text-fg-strong'
export const COMM_POST_META = 'mt-2 text-[11.5px] text-fg-muted'
/** Account type, not plan. Says what someone is here as — student, coach —
 *  which is what gives a reply its weight. */
export const COMM_POST_BADGE =
  'rounded-full border border-line bg-tint-1 px-8 py-2 text-[9.5px] font-semibold tracking-[0.08em] text-fg-muted uppercase'
export const COMM_POST_BADGE_COACH =
  'border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-accent-strong'

export const COMM_POST_TEXT =
  'mt-12 text-[13.5px] leading-[1.62] whitespace-pre-line text-fg'
export const COMM_POST_TAGS = 'mt-10 flex flex-wrap gap-6'
export const COMM_TAG =
  'rounded-full bg-tint-2 px-9 py-3 text-[11px] font-medium text-fg-dim'

/** The attachment is drawn, not fetched — see PostChart in the page. */
export const COMM_POST_CHART =
  'mt-13 overflow-hidden rounded-sm border border-line bg-panel-inset'
export const COMM_CHART_SVG = 'block h-160 w-full'
export const COMM_CHART_CAPTION =
  'flex items-center justify-between gap-10 border-t border-line px-13 py-9 text-[11.5px] text-fg-muted'

export const COMM_POST_COUNTS =
  'mt-13 flex items-center gap-12 text-[11.5px] text-fg-muted'
export const COMM_POST_ACTIONS =
  'mt-8 flex items-center gap-2 border-t border-line pt-4'
export const COMM_ACTION =
  'inline-flex flex-1 items-center justify-center gap-8 rounded-sm py-10 text-[12.5px] font-medium text-fg-dim transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'
/** Liked. Weight changes as well as colour, because colour alone is not a
 *  state every reader can see. */
export const COMM_ACTION_ON = 'font-semibold !text-accent-strong'

export const COMM_COMMENTS = 'flex flex-col gap-12 border-t border-line px-18 py-14'
export const COMM_COMMENT = 'flex items-start gap-10'
export const COMM_COMMENT_BODY =
  'min-w-0 rounded-md rounded-tl-[4px] bg-tint-1 px-13 py-9'
export const COMM_COMMENT_NAME = 'text-[12px] font-semibold text-fg-strong'
export const COMM_COMMENT_TEXT = 'mt-2 text-[12.5px] leading-[1.5] text-fg-dim'
export const COMM_COMMENT_FORM = 'flex items-center gap-10'
export const COMM_COMMENT_INPUT =
  'h-38 w-full rounded-full border border-line bg-tint-1 px-15 text-[12.5px] text-fg outline-none transition-[border-color,background-color] duration-150 placeholder:text-fg-muted focus:border-accent focus:bg-panel-solid'

/* ---------------------------------------------------------------- people */

export const COMM_ASIDE_CARD = 'px-15 pt-14 pb-12'
export const COMM_ASIDE_HEAD =
  'mb-12 flex items-center justify-between gap-10 text-[11px] font-semibold tracking-[0.14em] text-fg-muted uppercase'
export const COMM_PEOPLE = 'flex flex-col gap-2'
export const COMM_PERSON =
  'flex w-full items-center gap-11 rounded-sm px-8 py-8 text-left transition-colors duration-150 hover:bg-tint-2'
export const COMM_PERSON_BODY = 'flex min-w-0 flex-col'
export const COMM_PERSON_NAME =
  'overflow-hidden text-[12.5px] font-medium text-ellipsis whitespace-nowrap text-fg-strong'
export const COMM_PERSON_ROLE =
  'overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-fg-muted'
export const COMM_PERSON_TAIL = 'ml-auto flex flex-none items-center gap-7'
/** Unread count on a recent conversation. */
export const COMM_PERSON_UNREAD =
  'grid min-w-18 place-items-center rounded-full bg-accent px-6 py-1 text-[10px] font-semibold text-accent-ink'

/**
 * The presence dot, on the avatar's corner.
 *
 * Bordered in the panel colour so it reads as punched out of the avatar
 * rather than floating over it — the same trick the chat dock uses.
 */
export const COMM_ONLINE =
  'absolute right-0 bottom-0 size-9 rounded-full border-2 border-panel-solid bg-green'

/** Avatar with room for the presence dot. The size comes from the call site. */
export const COMM_AVATAR = 'relative flex-none'
export const COMM_AVATAR_FACE =
  'grid size-full place-items-center overflow-hidden rounded-full font-semibold text-white'

/* ------------------------------------------------------------ university */

/**
 * The roster header: who you teach, at a glance.
 *
 * A band rather than a card, because the figures under it are the cards — and
 * two stacked panels of the same weight make neither one the headline.
 */
export const UNI_BAND =
  'flex flex-wrap items-center gap-18 px-22 pt-20 pb-20 ' +
  'bg-[linear-gradient(120deg,color-mix(in_srgb,var(--color-accent)_10%,transparent),transparent_58%)]'
export const UNI_BAND_BODY = 'flex min-w-0 flex-col gap-5'
export const UNI_BAND_NAME =
  'text-[19px] font-semibold tracking-[-0.015em] text-fg-strong'
export const UNI_BAND_SUB = 'text-[12.5px] text-fg-muted'
export const UNI_BAND_ACTIONS = 'ml-auto flex flex-wrap gap-10 max-[620px]:ml-0'

export const UNI_TABS = 'flex flex-wrap gap-2 border-b border-line'
export const UNI_TAB =
  'relative -mb-1 px-14 py-11 text-[12.5px] font-medium text-fg-muted transition-colors duration-150 hover:text-fg-strong'
export const UNI_TAB_ACTIVE =
  'text-fg-strong after:absolute after:inset-x-3 after:-bottom-1 after:h-2 after:rounded-full after:bg-accent after:content-[""]'

export const UNI_STUDENT = 'flex items-center gap-12'
export const UNI_STUDENT_NAME = 'block text-[13.5px] font-medium text-fg-strong'
export const UNI_STUDENT_MAIL = 'mt-1 block text-[11.5px] text-fg-muted'

/** Where a student is in the programme. The tone carries the stage. */
export const UNI_LEVEL =
  'inline-block rounded-full px-10 py-3 text-[10.5px] font-semibold tracking-[0.06em]'
export const UNI_LEVEL_TONE: Record<string, string> = {
  foundation: 'bg-[color-mix(in_srgb,var(--color-cyan)_16%,transparent)] text-cyan',
  developing: 'bg-[color-mix(in_srgb,var(--color-amber)_18%,transparent)] text-amber',
  consistent: 'bg-[color-mix(in_srgb,var(--color-green)_16%,transparent)] text-green',
  funded:
    'bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-accent-strong',
}

export const UNI_PROGRESS_CELL = 'flex items-center gap-10'
export const UNI_PROGRESS = 'h-4 w-88 overflow-hidden rounded-full bg-tint-3'
export const UNI_PROGRESS_PCT = 'text-[11.5px] tabular-nums text-fg-muted'

export const UNI_ROW_ACTIONS = 'flex justify-end gap-6'
export const UNI_GHOST =
  'inline-flex items-center gap-7 rounded-sm border border-line px-11 py-7 text-[11.5px] font-medium text-fg-dim transition-[color,border-color,background-color] duration-150 hover:border-line-strong hover:bg-tint-2 hover:text-fg-strong'

/** The student's view: one coach, rather than a roster. */
export const UNI_COACH_CARD = 'flex flex-wrap items-center gap-16 px-22 pt-20 pb-20'
export const UNI_COACH_BODY = 'flex min-w-0 flex-col gap-4'
export const UNI_COACH_ROLE =
  'text-[10.5px] font-semibold tracking-[0.14em] text-accent-strong uppercase'
export const UNI_COACH_NAME = 'text-[17px] font-semibold text-fg-strong'
export const UNI_COACH_NOTE = 'text-[12.5px] leading-[1.55] text-fg-muted'

/** Padding included: the grid sits inside a card that supplies none, and a
 *  call site that appends its own would be inline Tailwind. */
export const UNI_PEER_GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(216px,1fr))] gap-12 px-22 pb-22'
export const UNI_PEER = 'flex items-center gap-12 px-15 py-13'
