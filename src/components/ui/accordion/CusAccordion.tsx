import type { ReactNode } from 'react'
import { LuChevronDown } from 'react-icons/lu'
import { cn } from '@/lib/cn'

interface Props {
  /** Заголовок: нажатие по нему сворачивает и разворачивает блок */
  title: ReactNode
  /** Справа от заголовка, вне области нажатия (сумма, кнопки) */
  aside?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}

/** Раскрывающийся блок. Состояние держит родитель — так можно, например, раскрыть все блоки с готовыми блюдами. */
export function CusAccordion({ title, aside, open, onToggle, children, className }: Props) {
  return (
    <div className={className}>
      <div className={cn('flex items-center gap-3 px-4 py-3', open && 'border-b border-park-border')}>
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <LuChevronDown size={20} className={cn('shrink-0 text-park-textMuted transition-transform', !open && '-rotate-90')} />
          <div className="min-w-0 flex-1">{title}</div>
        </button>
        {aside}
      </div>
      {open && children}
    </div>
  )
}
