import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDownIcon, SearchIcon } from './Icons'
import {
  COMBO_EMPTY,
  COMBO_OPTION,
  COMBO_OPTION_ACTIVE,
  COMBO_PANEL,
  COMBO_SEARCH,
  FILTER_LABEL,
  FILTER_SHELL,
  FILTER_SHELL_OPEN,
  FILTER_TRIGGER,
  SELECT_VALUE,
} from './ui'

type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: string[]
  label: string
  /**
   * Render the label inside the trigger, and the whole thing as one card.
   *
   * Without this the caller draws a card, puts a heading in it and this
   * control underneath — and only the control opens the menu, so most of the
   * card is dead to the click that obviously ought to work.
   */
  heading?: string
  /** Card classes for the shell, when it is drawn as one. */
  className?: string
}

/**
 * A select you can type into.
 *
 * Not a `<select>`. That element is drawn by the operating system, so it
 * arrives with its own blue highlight and square corners in the middle of a
 * rounded, themed page, it cannot be searched, and a trader with thirty setups
 * has to scroll a list they cannot narrow.
 *
 * Not the Combobox next door either, which is an input that *suggests*: typing
 * something absent from the list is a valid answer there, because naming a new
 * setup while logging a trade should be. A filter is the opposite — only the
 * values that exist can be filtered for — so the text here searches and never
 * becomes the value.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  label,
  heading,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const wrapper = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const listId = useId()

  const needle = query.trim().toLowerCase()
  const matches =
    needle === ''
      ? options
      : options.filter((option) => option.toLowerCase().includes(needle))

  // Opening is a request to type: the search field takes focus so a long list
  // can be narrowed without reaching for the mouse.
  useEffect(() => {
    if (open) search.current?.focus()
  }, [open])

  // Close on a click anywhere else. Pointerdown rather than click, so the
  // panel is gone before the click lands on whatever is underneath it.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function close() {
    setOpen(false)
    setQuery('')
    setActive(0)
  }

  function choose(option: string) {
    onChange(option)
    close()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close()
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => {
        const next = current + step
        if (next < 0) return matches.length - 1
        if (next >= matches.length) return 0
        return next
      })
      return
    }

    if (event.key === 'Enter' && matches[active]) {
      event.preventDefault()
      choose(matches[active])
    }
  }

  return (
    <div ref={wrapper} className={`${className ? `${FILTER_SHELL} ${className}` : 'relative'} ${
        open ? FILTER_SHELL_OPEN : ''
      }`}>
      <button
        type="button"
        className={heading ? FILTER_TRIGGER : SELECT_VALUE}
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
      >
        {heading && <span className={FILTER_LABEL}>{heading}</span>}

        <span className={heading ? SELECT_VALUE : 'contents'}>
          <span className="truncate">{value}</span>
          <ChevronDownIcon
            className={`flex-none text-fg-muted transition-transform duration-200 ease-out ${
              open ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {open && (
        <div className={COMBO_PANEL} role="listbox" id={listId}>
          <div className={COMBO_SEARCH}>
            <SearchIcon size={13} />
            <input
              ref={search}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={`Search ${label.toLowerCase()}…`}
              aria-label={`Search ${label}`}
              autoComplete="off"
            />
          </div>

          {matches.length === 0 && <p className={COMBO_EMPTY}>Nothing matches that.</p>}

          {matches.map((option, index) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              className={`${COMBO_OPTION} ${
                index === active || option === value ? COMBO_OPTION_ACTIVE : ''
              }`}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
