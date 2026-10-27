import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function CusPopover({ trigger, children, align = 'right', width = 'w-72' }: {
  trigger: ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; width?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center">{trigger}</button>
      {open && (
        <div className={cn('absolute top-full z-50 mt-2 rounded-xl border border-park-border bg-park-bgCard shadow-xl', width, align === 'right' ? 'right-0' : 'left-0')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
