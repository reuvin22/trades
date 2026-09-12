/**
 * The coach's reply, split into the blocks it should be rendered as.
 *
 * Replies used to be split on newlines and every line rendered as its own
 * paragraph. That was fine while the coach answered in prose, and wrong as
 * soon as it started giving steps: "1. Set an alarm" arrived as a paragraph
 * beginning with the characters "1." — no indent, no hanging alignment, the
 * number running into the text. A list that is only a list by typography is
 * harder to follow than the prose it replaced.
 *
 * Hand-rolled rather than reaching for a markdown renderer. The client depends
 * on react and react-dom and nothing else, deliberately, and the grammar here
 * is three cases wide. What it does NOT do is as important: no bold, no
 * headings, no tables, no links. The coach is told not to write them, and a
 * parser that quietly accepted them would be an invitation.
 */

export type ReplyBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'points'; items: string[] }
  | { kind: 'choice'; options: string[] }

/** "1. text", "2) text" — a sequence, where the order is part of the meaning. */
const ORDERED = /^\s*\d{1,2}[.)]\s+(.+)$/

/** "- text", "* text", "• text" — a set, where the order is not. */
const UNORDERED = /^\s*[-*•]\s+(.+)$/

/**
 * "CHOICE: Yes, change it | No, fix what I have" — a fork the coach is putting
 * to the trader, rendered as buttons.
 *
 * Deliberately the plainest marker that could work. Every previous attempt in
 * this app to have a small model emit exact syntax has ended with the syntax
 * on screen, so this tolerates the wrapping it will actually get: brackets or
 * none, any case, a stray full stop. And if the model never writes one, nothing
 * breaks — the reply is just prose.
 */
const CHOICE = /^\s*\[?\s*choice\s*:\s*(.+?)\s*\]?\s*\.?\s*$/i

/** Two to four. One is not a choice; five is a menu, and the coach is supposed
 *  to be narrowing things down rather than opening them up. */
const MIN_OPTIONS = 2
const MAX_OPTIONS = 4

export function toBlocks(reply: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = []

  for (const line of reply.split('\n')) {
    if (line.trim() === '') continue

    const choice = CHOICE.exec(line)
    if (choice) {
      const options = choice[1]
        .split('|')
        .map((option) => option.trim())
        .filter(Boolean)

      if (options.length >= MIN_OPTIONS && options.length <= MAX_OPTIONS) {
        blocks.push({ kind: 'choice', options })
        continue
      }
      // Malformed: fall through and render it as the paragraph it is, rather
      // than swallowing a line the coach meant the trader to read.
    }

    const ordered = ORDERED.exec(line)
    const unordered = ordered ? null : UNORDERED.exec(line)
    const kind = ordered ? 'steps' : unordered ? 'points' : 'paragraph'
    const text = (ordered?.[1] ?? unordered?.[1] ?? line).trim()

    if (kind === 'paragraph') {
      blocks.push({ kind, text })
      continue
    }

    // Consecutive items of the same kind are one list. A bullet directly after
    // a numbered step starts a new one rather than joining it, because mixing
    // them means the coach meant two different things.
    const open = blocks[blocks.length - 1]
    if (open?.kind === kind) {
      open.items.push(text)
    } else {
      blocks.push({ kind, items: [text] })
    }
  }

  return blocks
}
