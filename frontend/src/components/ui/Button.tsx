import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2.5 rounded-2xl font-semibold tracking-tight transition-all duration-200 ease-out disabled:opacity-45 disabled:pointer-events-none select-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-ai text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(99,102,241,0.75)] hover:brightness-110 active:scale-[0.98] hover:scale-[1.01]',
  secondary:
    'bg-surface-2 text-ink border border-line hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.98]',
  ghost: 'text-muted hover:text-ink hover:bg-white/5 active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  md: 'h-14 px-6 text-[15px]',
  lg: 'h-[60px] px-7 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className = '',
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} w-full ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
