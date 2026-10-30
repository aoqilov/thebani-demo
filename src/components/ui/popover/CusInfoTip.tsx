import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LuInfo } from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface Props {
  title: string
  children: ReactNode
  /** Ссылка на страницу-источник данных */
  to?: string
  toLabel?: string
  className?: string
}

const WIDTH = 288

/**
 * Значок «i» с пояснением: откуда взято число. Окно рисуется через портал с fixed-позицией,
 * поэтому не обрезается таблицами с overflow-x-auto.
 */
export function CusInfoTip({ title, children, to, toLabel = 'Открыть источник', className }: Props) {
  const btn = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    if (!pos) return
    const close = () => setPos(null)
    const onDown = (e: MouseEvent) => {
      if (!btn.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-info-tip]')) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [pos])

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (pos) return setPos(null)
    const r = btn.current!.getBoundingClientRect()
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - WIDTH - 8)), top: r.bottom + 6 })
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-label={`Откуда это число: ${title}`}
        className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-park-textMuted transition hover:bg-primary/10 hover:text-primary', pos && 'bg-primary/10 text-primary', className)}
      >
        <LuInfo size={14} />
      </button>
      {pos && createPortal(
        <div data-info-tip style={{ left: pos.left, top: pos.top, width: WIDTH }} className="fixed z-[100] rounded-xl border border-park-border bg-park-bgCard p-3.5 text-left text-sm font-normal normal-case shadow-xl">
          <p className="mb-1 font-semibold text-park-text">{title}</p>
          <div className="space-y-1 text-xs leading-relaxed text-park-text3">{children}</div>
          {to && <Link to={to} onClick={() => setPos(null)} className="mt-2.5 inline-block text-xs font-semibold text-primary hover:underline">{toLabel} →</Link>}
        </div>,
        document.body,
      )}
    </>
  )
}
