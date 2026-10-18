import type { HTMLAttributes } from 'react'
import './Plate.css'

export type PlateVariant = 'default' | 'raised' | 'repair'
type PlateTag = 'div' | 'section' | 'article' | 'header' | 'footer'

type PlateProps = HTMLAttributes<HTMLElement> & {
  /** The element to render; a plate is a container, never a control. */
  as?: PlateTag
  variant?: PlateVariant
}

/** A solid opaque container: one fill step and a 1px solid line, never an alpha wash. */
export function Plate({ as: Tag = 'div', variant = 'default', className = '', ...props }: PlateProps) {
  const variantClass = variant === 'default' ? '' : ` plate-${variant}`
  return <Tag {...props} className={`plate${variantClass}${className ? ` ${className}` : ''}`} />
}
