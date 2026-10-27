import type { ReactNode } from 'react'
import { LuX } from 'react-icons/lu'
import { cn } from '@/lib/cn'

export interface CusDialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function CusDialog({ open, onClose, title, children, footer, size = 'md' }: CusDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={cn('w-full rounded-xl border border-park-border bg-park-bgCard shadow-xl', { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-park-border px-5 py-4">
          <h3 className="font-bold text-park-text">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-park-textMuted hover:text-park-text"><LuX size={18} /></button>
        </header>
        <div className="p-5 text-sm text-park-text2">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-park-border px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}
