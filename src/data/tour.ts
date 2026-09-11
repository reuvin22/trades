export type TourStep = {
  id: string
  /** Route to be on before the step is shown. */
  route?: string
  /** Matches a data-tour attribute. Omitted means a centred card with no
   *  spotlight, which is also the fallback when a target is not on screen. */
  target?: string
  title: string
  body: string
}

/**
 * The guided tour a new account gets once.
 *
 * Ordered as a walk through the product rather than a list of features: the
 * shell first, then the screens in the order a trader would actually use them
 * — log a trade, review it, analyse it, ask about it.
 *
 * Steps whose target is hidden at the current screen size (the sidebar behind
 * the drawer, say) still run; they just lose the spotlight and centre instead.
 */
export const TOUR: TourStep[] = [
  {
    id: 'welcome',
    route: 'dashboard',
    title: 'Welcome to RagDex',
    body: 'I am your guide. This takes about a minute and shows you every part of the app. You can leave at any point — Skip tutorial is always in the corner.',
  },
  {
    id: 'nav',
    route: 'dashboard',
    target: 'nav',
    title: 'Getting around',
    body: 'Six screens, and this is how you reach them. On a narrow screen they live behind the menu button in the top bar.',
  },
  {
    id: 'quick-add',
    route: 'dashboard',
    target: 'quick-add',
    title: 'Log a trade',
    body: 'Everything starts here. Execution, context and how you felt — the last one is what turns a list of trades into a journal.',
  },
  {
    id: 'stats',
    route: 'dashboard',
    target: 'stats',
    title: 'Your numbers, live',
    body: 'Net P/L, win rate, average R and profit factor, recalculated on every fill you log. No spreadsheet to refresh.',
  },
  {
    id: 'chart',
    route: 'dashboard',
    target: 'chart',
    title: 'The equity curve',
    body: 'Your account over time. Hover anywhere on the line to read the exact balance on that day.',
  },
  {
    id: 'insights',
    route: 'dashboard',
    target: 'insights',
    title: 'What the journal noticed',
    body: 'The coach reads your trades and names the single most expensive habit it can find — revenge trading, size creep, winners cut early.',
  },
  {
    id: 'activity',
    route: 'dashboard',
    target: 'activity',
    title: 'Recent activity',
    body: 'The last few positions at a glance, open ones marked with a green dot.',
  },
  {
    id: 'filters',
    route: 'journal',
    target: 'filters',
    title: 'The journal',
    body: 'Every trade you have logged, filterable by setup, side, emotion and mistake. This is where you go looking for patterns.',
  },
  {
    id: 'journal-table',
    route: 'journal',
    target: 'journal-table',
    title: 'Trade by trade',
    body: 'The full record — entry, exit, result and the tags you attached. Sortable, paged, and exportable when you need it elsewhere.',
  },
  {
    id: 'metrics',
    route: 'analytics',
    target: 'metrics',
    title: 'Analytics',
    body: 'Expectancy, profit factor, drawdown and hold time. The four numbers that tell you whether an edge is real.',
  },
  {
    id: 'edge',
    route: 'analytics',
    target: 'edge',
    title: 'Which setup carries you',
    body: 'Your strategies ranked by what they actually returned, not by how good they felt at the time.',
  },
  {
    id: 'calendar-grid',
    route: 'calendar',
    target: 'calendar-grid',
    title: 'The calendar',
    body: 'Every day coloured by result, with the week totalled beside Sunday. Click any date to see that day in full.',
  },
  {
    id: 'coach',
    route: 'coach',
    target: 'coach',
    title: 'Ask the coach',
    body: 'It only talks about your journal — your results, your habits, your psychology. Ask it why a week went badly and it will tell you straight.',
  },
  {
    id: 'notifications',
    route: 'dashboard',
    target: 'notifications',
    title: 'Notifications',
    body: 'Fills, risk warnings and anything the coach spots while you are away.',
  },
  {
    id: 'messages',
    route: 'dashboard',
    target: 'messages',
    title: 'Messages',
    body: 'Message other traders in real time — add them by email, and see when they have read you. It follows you across every screen.',
  },
  {
    id: 'theme',
    route: 'dashboard',
    target: 'theme',
    title: 'Light or dark',
    body: 'Dark is the default because most traders sit in front of this for hours. Switch whenever you like.',
  },
  {
    id: 'account',
    route: 'dashboard',
    target: 'account',
    title: 'Your account',
    body: 'Profile, plan and sign-out live behind your avatar.',
  },
  {
    id: 'done',
    route: 'dashboard',
    title: 'That is the whole tour',
    body: 'Log your first trade whenever you are ready. The more you log, the more the coach has to work with.',
  },
]
