import type { CusColor } from '@/types/common.types'

export function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

export type { CusColor }

export const solid: Record<CusColor, string> = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-white',
  success: 'bg-success text-white',
  info: 'bg-info text-white',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
  dark: 'bg-dark text-white',
}

export const soft: Record<CusColor, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  dark: 'bg-dark/10 text-dark dark:bg-white/10 dark:text-white',
}

export const outline: Record<CusColor, string> = {
  primary: 'border-primary text-primary hover:bg-primary hover:text-white',
  secondary: 'border-secondary text-secondary hover:bg-secondary hover:text-white',
  success: 'border-success text-success hover:bg-success hover:text-white',
  info: 'border-info text-info hover:bg-info hover:text-white',
  warning: 'border-warning text-warning hover:bg-warning hover:text-white',
  danger: 'border-danger text-danger hover:bg-danger hover:text-white',
  dark: 'border-dark text-dark hover:bg-dark hover:text-white',
}
