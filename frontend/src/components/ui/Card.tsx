import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  elevated?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddings = {
  sm: 'p-5',
  md: 'p-6',
  lg: 'p-7',
}

export function Card({ children, elevated, padding = 'md', className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-[22px] border border-line ${elevated ? 'bg-surface-2' : 'bg-surface'} ${paddings[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
