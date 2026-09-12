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
  'rounded-lg border border-line bg-panel shadow-[var(--shadow-card)] backdrop-blur-[14px]'

/* Wraps rather than overflows: a title beside a segmented control has no room
   for both on a 320px phone, and without wrapping the control pushed the page
   23px wider than the screen. The row gap only applies once it has wrapped. */
export const CARD_HEAD =
  'flex flex-wrap items-start justify-between gap-x-20 gap-y-12'
export const CARD_TITLE = 'text-[22px] font-semibold tracking-[-0.01em] text-fg-strong'
export const CARD_SUB = 'mt-4 text-[13px] text-fg-muted'

export const LINK =
  'inline-flex items-center gap-5 text-[12.5px] font-medium tracking-[0.04em] text-fg-dim transition-colors duration-150 hover:text-fg-strong'

/* -------------------------------------------------------------- page head */

export const PAGE_HEAD =
  'flex items-start justify-between gap-20 px-2 pt-6 pb-2 max-shell:flex-col'
export const PAGE_TITLE = 'text-[27px] font-semibold tracking-[-0.02em] text-fg-strong'
export const PAGE_SUB = 'mt-3 text-[13px] text-fg-muted'
export const PAGE_ACTIONS = 'flex flex-none gap-10'

export const PILL =
  'inline-flex items-center gap-8 rounded-[9px] border border-line bg-tint-1 px-15 py-9 text-[12.5px] font-medium text-fg-dim transition-[color,border-color,background-color,transform] duration-150 hover:border-line-strong hover:bg-tint-2 hover:text-fg-strong active:scale-[0.97]'

export const PILL_ACCENT =
  'border-transparent bg-accent text-accent-ink hover:bg-accent-strong hover:text-accent-ink'

/* --------------------------------------------------------------- numerals */

export const POS = 'text-green'
export const NEG = 'text-red'
export const MONO = 'font-mono text-[13px] tracking-[-0.01em]'

/* -------------------------------------------------------------- stat row */

export const STAT_ROW = 'grid grid-cols-5 gap-18 max-[1280px]:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]'
export const STAT_CARD = 'flex min-h-132 flex-col gap-8 px-22 pt-20 pb-22'
export const STAT_LABEL =
  'text-[11px] font-medium tracking-[0.13em] text-fg-muted uppercase'
export const STAT_VALUE =
  'text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-fg-strong'
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
  'flex gap-4 rounded-[10px] border border-line bg-tint-1 p-4'
/*
 * The colour deliberately lives in the two state classes below, never here.
 * Tailwind resolves a conflict like text-fg-muted vs text-accent-ink by their
 * order in the stylesheet, not by the order they appear in a class attribute —
 * and text-fg-muted happens to come later, so a base colour here silently won
 * over the active one and painted the selected label muted grey on the accent
 * fill. Applying exactly one of them removes the conflict instead of
 * out-specifying it.
 */
export const SEGMENT =
  'rounded-[7px] px-14 py-5 text-[12px] font-medium tracking-[0.04em] transition-[color,background-color] duration-150 active:scale-[0.97]'
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
  'mt-12 text-[18px] font-medium tracking-[-0.01em] text-fg-strong'
export const INSIGHT_BODY =
  'mt-8 text-[13.5px] leading-[1.55] text-fg-dim [&_strong]:font-medium'

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
export const CHART_CARD = 'relative z-20 px-26 pt-24 pb-20'

export const AXIS_LEGEND =
  'mt-10 text-right text-[9.5px] leading-[1.5] tracking-[0.05em] text-fg-muted'

/** The plot body. touch-action keeps vertical scrolling alive over the chart. */
export const PLOT = 'relative mt-4 h-400 touch-pan-y pl-46 max-shell:h-300'
export const PLOT_SVG = 'block h-full w-full overflow-visible'

export const GRIDLINES =
  'animate-fade [&_line]:stroke-grid [&_line]:[stroke-width:1] [&_line]:[stroke-dasharray:2_7] [&_line]:[vector-effect:non-scaling-stroke]'

/** pathLength="1" on the path makes one dash unit span the whole line. */
export const EQUITY_LINE =
  'animate-draw [stroke-dasharray:1] stroke-chart-line [stroke-width:2] [stroke-linecap:round] [filter:drop-shadow(0_0_10px_var(--color-chart-glow))]'

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
  'relative mt-6 ml-46 h-22 [&>span]:absolute [&>span]:-translate-x-1/2 [&>span]:text-[11px] [&>span]:whitespace-nowrap [&>span]:text-fg-muted'

export const CHART_EMPTY = 'px-10 py-46 text-center text-[13px] text-fg-muted'

/* ---------------------------------------------------------------- journal */

export const FILTER_ROW =
  'grid grid-cols-4 gap-14 max-[1100px]:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]'
export const FILTER_CARD = 'flex cursor-pointer flex-col gap-10 px-18 pt-15 pb-16'
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
const CONTROL =
  '[&_input]:w-full [&_input]:rounded-sm [&_input]:border [&_input]:border-line [&_input]:bg-tint-1 [&_input]:px-13 [&_input]:py-10 [&_input]:text-fg [&_input]:outline-none [&_input]:transition-[border-color,background-color] [&_input]:duration-150 ' +
  '[&_textarea]:w-full [&_textarea]:min-h-68 [&_textarea]:resize-y [&_textarea]:rounded-sm [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-tint-1 [&_textarea]:px-13 [&_textarea]:py-10 [&_textarea]:font-[inherit] [&_textarea]:text-fg [&_textarea]:outline-none ' +
  '[&_select]:w-full [&_select]:cursor-pointer [&_select]:appearance-none [&_select]:rounded-sm [&_select]:border [&_select]:border-line [&_select]:bg-tint-1 [&_select]:py-10 [&_select]:pr-30 [&_select]:pl-13 [&_select]:text-fg [&_select]:outline-none ' +
  // No chevron here: <Select> renders a real one so it can animate. The
  // right padding reserves its space.
  '[&_option]:bg-panel-solid [&_option]:text-fg ' +
  '[&_input::placeholder]:text-fg-muted [&_textarea::placeholder]:text-fg-muted ' +
  '[&_input:focus-visible]:border-accent [&_input:focus-visible]:bg-[color-mix(in_srgb,var(--color-accent)_9%,transparent)] ' +
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
  'open:[animation:modal-in_0.28s_cubic-bezier(0.22,0.8,0.3,1)] ' +
  'backdrop:bg-[rgba(6,5,15,0.62)] backdrop:backdrop-blur-[3px] open:backdrop:[animation:fade_0.28s_ease]'

export const MODAL_FORM = 'flex max-h-[inherit] flex-col'
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
  'absolute top-[calc(100%+10px)] right-0 z-40 w-244 overflow-hidden rounded-md border border-line-strong bg-panel-solid shadow-[var(--shadow-pop)] [animation:menu-in_0.16s_cubic-bezier(0.22,0.8,0.3,1)]'

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
export const SECTION_TITLE =
  'mb-18 flex items-center gap-8 text-[11px] font-semibold tracking-[0.14em] text-fg-muted uppercase'
export const IDENTITY = 'mb-20 flex items-center gap-18'
export const IDENTITY_AVATAR =
  'block size-68 flex-none overflow-hidden rounded-full border border-line-strong [&_img]:block [&_img]:size-full [&_img]:object-cover [&_span]:text-[26px]'

export const ACCOUNT_ACTIONS =
  'flex flex-wrap items-center justify-between gap-16 px-20 py-14'
export const SAVE_NOTE = 'text-[12.5px] text-fg-muted'
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

export const LOGIN_ASIDE =
  'relative z-[1] flex animate-fade flex-col justify-center border-r border-line px-52 py-46 backdrop-blur-[22px] bg-[color-mix(in_srgb,var(--color-sidebar-mid)_72%,transparent)] ' +
  'max-[900px]:border-r-0 max-[900px]:border-b max-[900px]:px-28 max-[900px]:pt-38 max-[900px]:pb-32'

export const LOGIN_BRAND =
  'mt-0 mb-14 animate-rise text-[64px] leading-none font-bold tracking-[-0.045em] text-fg-strong max-[900px]:mb-10 max-[900px]:text-[42px]'

export const LOGIN_PITCH =
  'animate-rise text-[24px] leading-[1.35] font-medium tracking-[-0.02em] text-fg-dim [animation-delay:80ms] max-[900px]:text-[19px]'

export const LOGIN_POINTS =
  'mt-34 flex max-w-[42ch] list-none flex-col gap-20 p-0 [&>li]:flex [&>li]:items-start [&>li]:gap-13 [&>li]:animate-rise [&>li:nth-child(1)]:[animation-delay:160ms] [&>li:nth-child(2)]:[animation-delay:240ms] [&>li:nth-child(3)]:[animation-delay:320ms]'

export const POINT_GLYPH =
  'grid size-30 flex-none place-items-center rounded-[9px] border border-line text-accent-strong bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]'
export const POINT_TITLE = 'text-[13.5px] font-medium text-fg'
export const POINT_BODY = 'mt-2 text-[12.5px] leading-[1.5] text-fg-muted'

export const LOGIN_FOOT =
  'absolute bottom-40 left-52 text-[11.5px] tracking-[0.03em] text-fg-muted max-[900px]:hidden'

export const LOGIN_MAIN =
  'relative z-[1] grid place-items-center px-32 py-46 max-[900px]:px-20 max-[900px]:pt-32 max-[900px]:pb-44'

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

export const CHAT_AVATAR = 'grid size-30 flex-none place-items-center rounded-[9px] text-white'
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
  'relative inline-flex cursor-pointer items-center gap-7 rounded-[8px] border border-line bg-tint-1 px-11 py-7 text-[12.5px] text-fg-dim transition-[color,border-color,background-color] duration-150 hover:border-line-strong hover:text-fg-strong ' +
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
  'rounded-[8px] px-11 py-7 text-[12.5px] text-fg-muted transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong'
export const CAL_ADD =
  'inline-flex items-center gap-7 rounded-[8px] bg-green px-16 py-9 text-[13px] font-semibold text-[#04140c] transition-[filter,transform] duration-150 hover:brightness-[1.08] active:scale-[0.97] max-[760px]:justify-center'

export const CAL_HEAD = 'flex flex-wrap items-center gap-14'
export const CAL_TODAY =
  'rounded-[8px] border border-line bg-tint-1 px-15 py-7 text-[12.5px] font-medium text-fg-dim transition-[color,border-color] duration-150 hover:border-line-strong hover:text-fg-strong'
export const CAL_NAV =
  'flex gap-2 [&>button]:grid [&>button]:size-28 [&>button]:place-items-center [&>button]:rounded-[7px] [&>button]:text-fg-muted [&>button]:transition-[color,background-color] [&>button]:duration-150 [&>button:hover]:bg-tint-2 [&>button:hover]:text-fg-strong'
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
  'flex min-h-92 flex-col items-center gap-3 rounded-[9px] border border-line bg-tint-1 px-8 py-9 transition-[border-color,transform] duration-150 hover:-translate-y-1 hover:border-line-strong'
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
  'flex flex-col items-end justify-center gap-3 rounded-[9px] bg-tint-1 px-12 py-9'
export const CAL_WEEK_PL = 'text-[14px] font-semibold tabular-nums text-fg-muted'

/* ------------------------------------------------------------------ admin */

export const ADMIN_STAT_ROW =
  'grid grid-cols-4 gap-16 max-[1180px]:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'
export const ADMIN_STAT = 'flex flex-col gap-4 px-18 pt-16 pb-18'
export const ADMIN_STAT_HEAD = 'mb-12 flex items-center justify-between gap-12'
export const STAT_GLYPH =
  'grid size-34 place-items-center rounded-[10px] border border-line bg-tint-2 text-fg-dim'
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
  'grid size-30 place-items-center rounded-[9px] bg-tint-2 text-fg-dim transition-transform duration-[240ms] ease-spring group-hover:scale-110 group-hover:-rotate-4'
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
  'grid size-30 place-items-center rounded-[8px] text-[11px] font-bold text-white'
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
  'absolute top-[calc(100%+10px)] right-0 z-40 flex w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-md border border-line-strong bg-panel-solid shadow-[var(--shadow-pop)] [animation:menu-in_0.16s_cubic-bezier(0.22,0.8,0.3,1)] ' +
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
  'mt-1 grid size-28 flex-none place-items-center rounded-[9px] bg-tint-2 text-fg-dim'
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
  'absolute top-[calc(100%-4px)] left-8 z-20 max-h-232 w-284 max-w-[calc(100vw-72px)] overflow-y-auto overflow-x-hidden rounded-md border border-line-strong bg-panel-solid p-5 shadow-[var(--shadow-pop)] [animation:menu-in_0.14s_cubic-bezier(0.22,0.8,0.3,1)]'

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
  'absolute z-30 flex min-w-120 flex-col overflow-hidden rounded-md border border-line-strong bg-panel-solid p-4 shadow-[var(--shadow-pop)] [animation:menu-in_0.12s_cubic-bezier(0.22,0.8,0.3,1)] ' +
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
