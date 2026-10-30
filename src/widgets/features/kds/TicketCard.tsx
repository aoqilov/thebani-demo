import { LuClock, LuUsers } from 'react-icons/lu'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { cn } from '@/lib/cn'
import { ITEM_STATUS_LABEL, type Order, type OrderItem, type OrderItemStatus, type TableDef } from '@/types/order.types'
import { itemStatusColor, minutesSince } from '../waiter/constants'

interface Props {
  order: Order
  table?: TableDef
  items: OrderItem[]
  busy: boolean
  onStatus: (item: OrderItem, status: OrderItemStatus) => void
  onAll: (items: OrderItem[], status: OrderItemStatus) => void
}

/** Цвет шапки зависит от того, сколько ждёт самая старая позиция. */
function waitTone(min: number) {
  if (min >= 20) return { bar: 'bg-danger', text: 'text-danger' }
  if (min >= 10) return { bar: 'bg-warning', text: 'text-warning' }
  return { bar: 'bg-success', text: 'text-success' }
}

export default function TicketCard({ order, table, items, busy, onStatus, onAll }: Props) {
  const oldest = Math.min(...items.map((i) => new Date(i.sentAt).getTime()))
  const wait = minutesSince(new Date(oldest).toISOString())
  const tone = waitTone(wait)
  const hasNew = items.some((i) => i.status === 'sent')

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-park-bgCard shadow-card">
      <div className={cn('h-1.5', tone.bar)} />
      <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
        <div>
          <h3 className="text-xl font-bold text-park-text">{table?.name ?? `Стол ${order.tableId}`}{order.guestLabel && <span className="text-park-textMuted"> · {order.guestLabel}</span>}</h3>
          <p className="flex items-center gap-2 text-xs text-park-textMuted">
            <span className="flex items-center gap-1"><LuUsers size={12} /> {order.guests}</span>
            <span>№{order.id} · {order.waiter}</span>
          </p>
        </div>
        <div className={cn('flex items-center gap-1 text-lg font-bold', tone.text)}><LuClock size={18} /> {wait}<span className="text-xs font-medium">мин</span></div>
      </header>

      <ul className="flex-1 divide-y divide-park-border px-4">
        {items.map((i) => (
          <li key={i.id} className={cn('py-3', i.status === 'sent' && '-mx-4 border-l-4 border-info bg-info/5 px-3')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-bold text-park-text"><span className="mr-2 text-2xl text-primary">{i.qty}×</span>{i.name}</p>
                {i.mods.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {i.mods.map((m, idx) => <span key={idx} className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">{m.option}</span>)}
                  </div>
                )}
                {i.comment && <p className="mt-1 rounded-md bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">⚠ {i.comment}</p>}
              </div>
              <CusBadge color={itemStatusColor[i.status]}>{ITEM_STATUS_LABEL[i.status]}</CusBadge>
            </div>
            <div className="mt-2">
              {i.status === 'sent' && <CusButton size="lg" color="warning" className="w-full" isDisabled={busy} onClick={() => onStatus(i, 'cooking')}>Принять</CusButton>}
              {i.status === 'cooking' && <CusButton size="lg" color="success" className="w-full" isDisabled={busy} onClick={() => onStatus(i, 'ready')}>Готово</CusButton>}
            </div>
          </li>
        ))}
      </ul>

      {items.length > 1 && (
        <footer className="border-t border-park-border p-3">
          {hasNew
            ? <CusButton variant="outline" color="warning" className="w-full" isDisabled={busy} onClick={() => onAll(items.filter((i) => i.status === 'sent'), 'cooking')}>Принять все</CusButton>
            : <CusButton variant="outline" color="success" className="w-full" isDisabled={busy} onClick={() => onAll(items.filter((i) => i.status === 'cooking'), 'ready')}>Всё готово</CusButton>}
        </footer>
      )}
    </article>
  )
}
