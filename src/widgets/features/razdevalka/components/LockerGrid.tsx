import { LuLock, LuWrench } from 'react-icons/lu'
import { cn } from '@/lib/cn'
import type { Locker } from '@/types/locker.types'

interface Props {
  lockers: Locker[]
  /** Подсветка выбранного шкафа */
  selectedId?: number | null
  /** Подсветить шкафы (например, по поиску) */
  highlightIds?: Set<number>
  /** Если задано — выбирать можно только свободные; иначе кликабельны все */
  onPick: (locker: Locker) => void
  onlyFreeSelectable?: boolean
}

const byNumber = (a: Locker, b: Locker) => a.number.localeCompare(b.number, undefined, { numeric: true })

/** Карта шкафов раздевалки: свободен / занят / неисправен. */
export default function LockerGrid({ lockers, selectedId, highlightIds, onPick, onlyFreeSelectable }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2 tablet:grid-cols-8 desktop:grid-cols-10 wide:grid-cols-12">
      {[...lockers].sort(byNumber).map((l) => {
        const free = l.condition === 'ok' && l.orderId === null
        const broken = l.condition === 'broken'
        const disabled = !!onlyFreeSelectable && !free
        return (
          <button
            key={l.id}
            disabled={disabled}
            onClick={() => onPick(l)}
            title={broken ? 'Неисправен' : free ? 'Свободен' : 'Занят'}
            className={cn(
              'relative flex h-14 flex-col items-center justify-center rounded-xl border-2 text-lg font-bold transition active:scale-95',
              free && 'border-success/50 bg-success/5 text-success hover:bg-success/15',
              !free && !broken && 'border-primary/40 bg-primary/10 text-primary',
              broken && 'border-dashed border-park-border2 bg-park-bgHover text-park-textMuted',
              disabled && 'cursor-not-allowed opacity-50',
              selectedId === l.id && 'ring-4 ring-success/40',
              highlightIds?.has(l.id) && 'ring-4 ring-warning',
            )}
          >
            {l.number}
            {!free && !broken && <LuLock size={11} className="absolute right-1.5 top-1.5" />}
            {broken && <LuWrench size={11} className="absolute right-1.5 top-1.5" />}
          </button>
        )
      })}
    </div>
  )
}
