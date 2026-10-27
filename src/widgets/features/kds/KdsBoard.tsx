import { useState } from 'react'
import { LuChefHat, LuClock, LuMartini } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusCard } from '@/components/shared/card/CusCard'
import { cn } from '@/lib/cn'
import { fmtQty } from '@/utils/format'
import type { Station } from '@/types/menu.types'
import type { OrderItem, OrderItemStatus } from '@/types/order.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import type { WriteOffResult } from '@/api/orders/orders.api'
import { minutesSince } from '../waiter/constants'
import { useNow } from '../waiter/hooks/useNow'
import { useOrders, useSetItemStatus, useTables } from '../waiter/hooks/useOrders'
import { stationWorker } from './constants'
import TicketCard from './TicketCard'

type Tab = 'work' | 'ready'

/** Экран кухни/бара (KDS): заказы по столам, «Принять → Готово». «Готово» списывает ингредиенты со склада. */
export default function KdsBoard({ station }: { station: Station }) {
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const setStatus = useSetItemStatus()
  const [tab, setTab] = useState<Tab>('work')
  const [writeOff, setWriteOff] = useState<WriteOffResult | null>(null)
  useNow(15_000)

  const mine = (items: OrderItem[]) => items.filter((i) => i.station === station)
  const all = orders.flatMap((o) => mine(o.items))
  const counts = {
    sent: all.filter((i) => i.status === 'sent').length,
    cooking: all.filter((i) => i.status === 'cooking').length,
    ready: all.filter((i) => i.status === 'ready').length,
  }

  // Тикеты «в работе»: старые сверху
  const tickets = orders
    .map((o) => ({ order: o, items: mine(o.items).filter((i) => i.status === 'sent' || i.status === 'cooking').sort((a, b) => a.sentAt.localeCompare(b.sentAt)) }))
    .filter((t) => t.items.length > 0)
    .sort((a, b) => a.items[0].sentAt.localeCompare(b.items[0].sentAt))

  const readyList = orders
    .map((o) => ({ order: o, items: mine(o.items).filter((i) => i.status === 'ready') }))
    .filter((t) => t.items.length > 0)

  async function change(orderId: number, item: OrderItem, status: OrderItemStatus) {
    const res = await setStatus.mutateAsync({ orderId, itemId: item.id, status, by: stationWorker(station) })
    if (res) {
      setWriteOff(res)
      setTimeout(() => setWriteOff(null), 6000)
    }
  }

  async function changeAll(orderId: number, items: OrderItem[], status: OrderItemStatus) {
    for (const i of items) await change(orderId, i, status)
  }

  const Icon = station === 'kitchen' ? LuChefHat : LuMartini
  const tabBtn = (t: Tab, label: string, n: number) => (
    <button
      onClick={() => setTab(t)}
      className={cn('flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold transition active:scale-95', tab === t ? 'bg-primary text-white' : 'bg-park-bgCard text-park-text3 shadow-card')}
    >
      {label}<span className={cn('rounded-full px-2 py-0.5 text-xs', tab === t ? 'bg-white/25' : 'bg-park-bgHover')}>{n}</span>
    </button>
  )

  return (
    <div className="space-y-4">
      <PageHeader label={station === 'kitchen' ? 'Кухня' : 'Бар'} title={station === 'kitchen' ? 'Заказы' : 'Заказы'} highlight={station === 'kitchen' ? 'кухни' : 'бара'} subtitle="Приняли → приготовили → нажали «Готово»: официант получит сигнал, а продукты спишутся со склада." />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Новые', n: counts.sent, c: 'text-info' },
          { label: 'Готовятся', n: counts.cooking, c: 'text-warning' },
          { label: 'Готово', n: counts.ready, c: 'text-success' },
        ].map((s) => (
          <CusCard key={s.label} className="p-4 text-center">
            <p className={cn('text-3xl font-bold', s.c)}>{s.n}</p>
            <p className="text-xs text-park-textMuted">{s.label}</p>
          </CusCard>
        ))}
      </div>

      {writeOff && (
        <CusAlert color={writeOff.shortage.length ? 'warning' : 'success'}>
          <p className="font-bold">Списано со склада по тех. карте:</p>
          <p className="mt-0.5">{writeOff.lines.map((l) => `${l.name} ${fmtQty(l.qty)} ${l.unit}`).join(' · ')}</p>
          {writeOff.shortage.length > 0 && <p className="mt-1 font-bold">Не хватило на складе: {writeOff.shortage.join(', ')}</p>}
        </CusAlert>
      )}

      <div className="flex gap-2">
        {tabBtn('work', 'В работе', tickets.reduce((s, t) => s + t.items.length, 0))}
        {tabBtn('ready', 'Готово', readyList.reduce((s, t) => s + t.items.length, 0))}
      </div>

      {tab === 'work' && (
        <>
          {tickets.length === 0 && (
            <CusCard className="flex flex-col items-center gap-2 p-12 text-park-textMuted">
              <Icon size={40} />
              <p className="text-sm">Новых заказов нет. Ждём официантов…</p>
            </CusCard>
          )}
          <div className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3 wide:grid-cols-4">
            {tickets.map(({ order, items }) => (
              <TicketCard
                key={order.id}
                order={order}
                table={tables.find((t) => t.id === order.tableId)}
                items={items}
                busy={setStatus.isPending}
                onStatus={(i, s) => change(order.id, i, s)}
                onAll={(its, s) => changeAll(order.id, its, s)}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'ready' && (
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
          {readyList.length === 0 && <CusCard className="p-10 text-center text-sm text-park-textMuted tablet:col-span-2 desktop:col-span-3">Готовых блюд, ожидающих официанта, нет.</CusCard>}
          {readyList.map(({ order, items }) => (
            <CusCard key={order.id} className="p-4">
              <p className="text-lg font-bold text-park-text">{tables.find((t) => t.id === order.tableId)?.name}</p>
              <p className="mb-2 text-xs text-park-textMuted">{order.waiter}</p>
              <ul className="space-y-1.5">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm">
                    <span className="text-park-text">{i.qty} × {i.name}</span>
                    <span className="flex items-center gap-1 text-xs text-success"><LuClock size={12} /> ждёт {minutesSince(i.sentAt)} мин</span>
                  </li>
                ))}
              </ul>
            </CusCard>
          ))}
        </div>
      )}
    </div>
  )
}
