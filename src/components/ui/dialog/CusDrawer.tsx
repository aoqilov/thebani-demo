import type { ReactNode } from 'react'
import { LuX } from 'react-icons/lu'
import { cn } from '@/lib/cn'

export function CusDrawer({ open, onClose, title, children, placement = 'end' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; placement?: 'start' | 'end'
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-[90] bg-black/50" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 z-[95] flex w-full max-w-md flex-col border-park-border bg-park-bgCard shadow-xl transition-transform duration-300',
          placement === 'end' ? 'right-0 border-l' : 'left-0 border-r',
          open ? 'translate-x-0' : placement === 'end' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b border-park-border px-5 py-4">
          <h3 className="font-bold text-park-text">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-park-textMuted hover:text-park-text"><LuX size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  )
}
