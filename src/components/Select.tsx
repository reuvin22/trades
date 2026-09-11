import type { SelectHTMLAttributes } from 'react'
import { ChevronDownIcon } from './Icons'
import { SELECT_CHEVRON, SELECT_SHELL } from './ui'

/**
 * A dropdown that is the same width as the text inputs beside it, with a
 * chevron that turns over while the list is open.
 *
 * The select itself stays a plain <select>, so it keeps the styling FIELD
 * gives every control and the platform keeps its own list rendering — the
 * native popup cannot be animated, but the control can say something is
 * happening, which is the part the trader actually sees.
 */
export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={SELECT_SHELL}>
      <select {...props} className={className ? `peer ${className}` : 'peer'}>
        {children}
      </select>
      <ChevronDownIcon size={14} className={SELECT_CHEVRON} />
    </span>
  )
}
