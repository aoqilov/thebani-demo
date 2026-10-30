import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

export interface ComboOption {
  value: number | string
  label: string
  hint?: string
}

interface Props {
  options: ComboOption[]
  value: number | string | null
  onChange: (value: number | string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

interface ListPos {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

/**
 * Выпадающий список с поиском и навигацией с клавиатуры (↑ ↓ Enter Esc).
 * Список рисуется поверх страницы через портал (fixed), поэтому его не обрезают таблицы, карточки и диалоги с overflow.
 */
export function CusCombobox({ options, value, onChange, placeholder = 'Выберите…', disabled, autoFocus, className }: Props) {
  const selected = options.find((o) => o.value === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pos, setPos] = useState<ListPos | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)) : options
  }, [options, query])

  // Положение списка под полем; если снизу мало места — открываем вверх. Следим за прокруткой и размером окна.
  useLayoutEffect(() => {
    if (!open) return setPos(null)
    const place = () => {
      const r = inputRef.current?.getBoundingClientRect()
      if (!r) return
      const below = window.innerHeight - r.bottom - 12
      const above = r.top - 12
      const up = below < 200 && above > below
      setPos({ left: r.left, width: r.width, maxHeight: Math.max(120, Math.min(240, up ? above : below)), ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => setActive(0), [query, open])
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function pick(o: ComboOption) {
    onChange(o.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        disabled={disabled}
        value={open ? query : (selected?.label ?? '')}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); setQuery('') }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter' && open && filtered[active]) { e.preventDefault(); pick(filtered[active]) }
          else if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
        }}
        className="w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover disabled:opacity-80"
      />
      {open && !disabled && pos && createPortal(
        <div
          ref={listRef}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.width, maxHeight: pos.maxHeight }}
          className="fixed z-[300] max-w-[90vw] overflow-y-auto rounded-md border border-park-border bg-park-bgCard py-1 shadow-xl"
        >
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-park-textMuted">Ничего не найдено</div>}
          {filtered.map((o, i) => (
            <div
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); pick(o) }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-sm', i === active ? 'bg-primary/10 text-primary' : 'text-park-text3')}
            >
              <span className="truncate">{o.label}</span>
              {o.hint && <span className="shrink-0 text-xs text-park-textMuted">{o.hint}</span>}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
