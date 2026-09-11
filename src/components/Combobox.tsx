import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDownIcon } from './Icons'
import {
  COMBO_EMPTY,
  COMBO_OPTION,
  COMBO_OPTION_ACTIVE,
  COMBO_PANEL,
  SELECT_CHEVRON,
  SELECT_SHELL,
} from './ui'

type ComboboxProps = {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
}

/**
 * An input with a list of suggestions under it.
 *
 * This replaces a <datalist>, which the browser draws itself: it picks the
 * popup's width from the longest option and places it wherever it likes, so a
 * narrow list appears beside a wide field. Owning the panel means it is the
 * width of the input, sits directly beneath it, and can animate.
 *
 * Typing a value that is not on the list stays allowed — the list suggests,
 * it does not constrain.
 */
export function Combobox({ value, onChange, options, placeholder }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapper = useRef<HTMLDivElement>(null)
  const listId = useId()

  const query = value.trim().toLowerCase()
  const matches =
    query === ''
      ? options
      : options.filter((option) => option.toLowerCase().includes(query))

  function choose(option: string) {
    onChange(option)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (matches.length === 0) return

      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => {
        const next = current + step
        if (next < 0) return matches.length - 1
        if (next >= matches.length) return 0
        return next
      })
      return
    }

    // Enter only commits a highlighted suggestion; otherwise it belongs to the
    // form, which is how someone submits a setup name they typed themselves.
    if (event.key === 'Enter' && open && active >= 0 && matches[active]) {
      event.preventDefault()
      choose(matches[active])
    }
  }

  return (
    <div
      ref={wrapper}
      className={SELECT_SHELL}
      onBlur={(event) => {
        // Only close when focus has actually left the control.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false)
          setActive(-1)
        }
      }}
    >
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="peer"
      />

      <ChevronDownIcon
        size={14}
        className={`${SELECT_CHEVRON} ${open ? 'rotate-180 text-accent-strong' : ''}`}
      />

      {open && (
        <div className={COMBO_PANEL} id={listId} role="listbox">
          {matches.length === 0 ? (
            <p className={COMBO_EMPTY}>
              No match. Press Tab to keep &ldquo;{value.trim()}&rdquo;.
            </p>
          ) : (
            matches.map((option, index) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                // The list must not steal focus before the click lands.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
                className={`${COMBO_OPTION} ${index === active ? COMBO_OPTION_ACTIVE : ''}`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
