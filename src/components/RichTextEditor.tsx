import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  BoldIcon,
  BulletListIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  NumberListIcon,
  QuoteIcon,
  RuleIcon,
  SpinnerIcon,
  UnderlineIcon,
} from './Icons'
import { readableApiError } from '../lib/api'
import { uploadImage } from '../lib/uploads'
import {
  RTE,
  RTE_BAR,
  RTE_BUTTON,
  RTE_FOOT,
  RTE_GROUP,
  RTE_PAGE,
  RTE_WIDE,
} from './ui'

/**
 * A rich text editor, written rather than installed.
 *
 * `trades/package.json` depends on react and react-dom and nothing else, and
 * that is a rule this project states in as many words. So this is
 * `contenteditable` plus a toolbar rather than a fifth of a megabyte of
 * editor — which for the job at hand, formatting an email, is enough: the
 * output only has to be the handful of tags a mail client will render, and
 * the server's allowlist drops everything else anyway.
 *
 * `document.execCommand` is deprecated and still the only thing every browser
 * implements for this. The replacement, the EditContext API, is not in Safari.
 * Reimplementing bold on top of Range and Selection is a project, not a
 * component, so the deprecated call stays and this comment is why.
 *
 * **What comes out is not trusted.** It is sanitised server-side on the way
 * into storage (`views/mail_html.py`), and what the API returns is what will
 * be sent — so a tag this editor produced and the server refused is visibly
 * gone when the page reloads, rather than silently gone at send time.
 */

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Shown under the surface, for a per-section hint. */
  note?: ReactNode
}

type Command = {
  id: string
  label: string
  title: string
  icon?: ReactNode
  /** The execCommand name, when it is a plain one. */
  command: string
  argument?: string
  /** Queried for the pressed state. Headings answer by block name instead. */
  state?: 'inline' | 'block'
}

const INLINE: Command[] = [
  { id: 'bold', label: 'B', title: 'Bold', command: 'bold', state: 'inline', icon: <BoldIcon size={14} /> },
  { id: 'italic', label: 'I', title: 'Italic', command: 'italic', state: 'inline', icon: <ItalicIcon size={14} /> },
  { id: 'underline', label: 'U', title: 'Underline', command: 'underline', state: 'inline', icon: <UnderlineIcon size={14} /> },
]

const BLOCKS: Command[] = [
  { id: 'h2', label: 'H1', title: 'Large heading', command: 'formatBlock', argument: 'h2', state: 'block' },
  { id: 'h3', label: 'H2', title: 'Small heading', command: 'formatBlock', argument: 'h3', state: 'block' },
  { id: 'p', label: 'P', title: 'Body text', command: 'formatBlock', argument: 'p', state: 'block' },
]

const LISTS: Command[] = [
  { id: 'ul', label: '•', title: 'Bulleted list', command: 'insertUnorderedList', state: 'inline', icon: <BulletListIcon size={14} /> },
  { id: 'ol', label: '1.', title: 'Numbered list', command: 'insertOrderedList', state: 'inline', icon: <NumberListIcon size={14} /> },
  { id: 'quote', label: '"', title: 'Quote', command: 'formatBlock', argument: 'blockquote', state: 'block', icon: <QuoteIcon size={14} /> },
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  note,
}: RichTextEditorProps) {
  const surface = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  /*
   * The DOM owns the text while it is being typed into.
   *
   * A contenteditable cannot be a controlled input: writing `value` back on
   * every keystroke moves the caret to the start, because React replaces the
   * node and the selection does not survive it. So this syncs only when the
   * incoming value is something the surface does not already hold — a load,
   * or a reset — and lets the DOM be the source in between.
   */
  useEffect(() => {
    const node = surface.current
    if (node !== null && node.innerHTML !== value) node.innerHTML = value
  }, [value])

  function emit() {
    const node = surface.current
    if (node !== null) onChange(node.innerHTML)
  }

  /** Which buttons look pressed, read back from the selection. */
  function refresh() {
    const found: string[] = []

    for (const entry of [...INLINE, ...LISTS]) {
      if (entry.state === 'inline') {
        try {
          if (document.queryCommandState(entry.command)) found.push(entry.id)
        } catch {
          // Safari throws on some states rather than answering false.
        }
      }
    }

    try {
      const block = document.queryCommandValue('formatBlock').toLowerCase()
      const match = [...BLOCKS, ...LISTS].find((entry) => entry.argument === block)
      if (match) found.push(match.id)
    } catch {
      // Same again — a toolbar that cannot read its state is not a failure.
    }

    setActive(found)
  }

  function run(entry: Command) {
    surface.current?.focus()
    document.execCommand(entry.command, false, entry.argument)
    refresh()
    emit()
  }

  function addLink() {
    const href = window.prompt('Link address', 'https://')
    if (href === null) return

    if (!/^https?:\/\//i.test(href)) {
      setFailure('A link has to start with http:// or https://.')
      return
    }

    setFailure(null)
    surface.current?.focus()
    document.execCommand('createLink', false, href)
    emit()
  }

  async function addImage(file: File) {
    setBusy(true)
    setFailure(null)

    try {
      const key = await uploadImage(file, 'university')
      // The public redirect, not a signed URL: this markup ends up in an
      // email that is opened days later by a client with no session.
      const src = `/api/v1/uploads/public/${key}`

      surface.current?.focus()
      document.execCommand('insertHTML', false, `<img src="${src}" alt="" />`)
      emit()
    } catch (cause) {
      setFailure(readableApiError(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={RTE}>
      <div className={RTE_BAR} role="toolbar" aria-label="Formatting">
        <div className={RTE_GROUP}>
          {BLOCKS.map((entry) => (
            <Button key={entry.id} entry={entry} active={active} onRun={run} wide />
          ))}
        </div>

        <div className={RTE_GROUP}>
          {INLINE.map((entry) => (
            <Button key={entry.id} entry={entry} active={active} onRun={run} />
          ))}
        </div>

        <div className={RTE_GROUP}>
          {LISTS.map((entry) => (
            <Button key={entry.id} entry={entry} active={active} onRun={run} />
          ))}
        </div>

        <div className={RTE_GROUP}>
          <button
            type="button"
            className={RTE_BUTTON}
            title="Add a link"
            onClick={addLink}
          >
            <LinkIcon size={14} />
          </button>

          <button
            type="button"
            className={RTE_BUTTON}
            title="Horizontal rule"
            onClick={() =>
              run({ id: 'hr', label: '—', title: 'Rule', command: 'insertHorizontalRule' })
            }
          >
            <RuleIcon size={14} />
          </button>

          <label className={RTE_BUTTON} title="Add an image or GIF">
            {busy ? <SpinnerIcon size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void addImage(file)
              }}
            />
          </label>
        </div>
      </div>

      <div
        ref={surface}
        className={RTE_PAGE}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onKeyUp={refresh}
        onMouseUp={refresh}
        // Plain text only. A paste from a word processor carries a document's
        // worth of markup that the server would strip anyway, and stripping it
        // here means what you see pasted is what will send.
        onPaste={(event) => {
          event.preventDefault()
          const text = event.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, text)
          emit()
        }}
      />

      <div className={RTE_FOOT}>
        <span>{failure ?? note ?? 'Pasting keeps the words and drops the formatting.'}</span>
        {busy && <span>Uploading…</span>}
      </div>
    </div>
  )
}

function Button({
  entry,
  active,
  onRun,
  wide = false,
}: {
  entry: Command
  active: string[]
  onRun: (entry: Command) => void
  wide?: boolean
}) {
  return (
    <button
      type="button"
      className={`${RTE_BUTTON} ${wide ? RTE_WIDE : ''}`}
      title={entry.title}
      aria-label={entry.title}
      aria-pressed={active.includes(entry.id)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onRun(entry)}
    >
      {entry.icon ?? entry.label}
    </button>
  )
}
