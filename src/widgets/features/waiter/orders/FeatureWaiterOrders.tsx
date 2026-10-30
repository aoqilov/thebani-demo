import { useState } from 'react'
import { LuBellRing, LuClock } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusAccordion } from '@/components/ui/accordion/CusAccordion'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { ITEM_STATUS_LABEL, orderTotal, type Order } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { itemStatusColor, minutesSince } from '../constants'
import { useNow } from '../hooks/useNow'
import { useOrders, useSetItemStatus, useTables } from '../hooks/useOrders'

const readyOf = (o: Order) => o.items.filter((i) => i.status === 'ready').length

/** Открытые заказы официанта: одна карточка на стол, внутри — счета гостей, если они раздельные. */
export default function FeatureWaiterOrders() {
  const navigate = useNavigate()
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const setStatus = useSetItemStatus()
  // Явный выбор официанта; пока его нет — раскрыты только столы с готовыми блюдами
  const [toggled, setToggled] = useState<Record<number, boolean>>({})
  useNow()

  // Группируем счета по столам
  const byTable = new Map<number, Order[]>()
  for (const o of orders) {
    if (o.tableId === null) continue
    byTable.set(o.tableId, [...(byTable.get(o.tableId) ?? []), o].sort((a, b) => a.id - b.id))
  }
  // Сначала столы, где есть готовое к подаче
  const groups = [...byTable.entries()].sort((a, b) => b[1].reduce((s, o) => s + readyOf(o), 0) - a[1].reduce((s, o) => s + readyOf(o), 0))

  return (
    <div className="space-y-4">
      <PageHeader label="Официант" title="Заказы" subtitle="Все открытые заказы по столам. Готовые блюда — сверху." />

      {groups.length === 0 && <CusCard className="p-8 text-center text-sm text-park-textMuted">Открытых заказов нет</CusCard>}

      {groups.map(([tableId, list]) => {
        const table = tables.find((t) => t.id === tableId)
        const ready = list.reduce((s, o) => s + readyOf(o), 0)
        const bill = list.some((o) => o.status === 'bill')
        const total = list.reduce((s, o) => s + orderTotal(o), 0)
        const since = Math.max(...list.map((o) => minutesSince(o.openedAt)))
        const split = list.length > 1 || !!list[0].guestLabel
        const open = (o?: Order) => navigate(`/waiter/table/${tableId}${o ? `?o=${o.id}` : ''}`)

        const isOpen = toggled[tableId] ?? ready > 0
        const preview = list.flatMap((o) => o.items).filter((i) => i.status !== 'served').length

        return (
          <CusCard key={tableId}>
            <CusAccordion
              open={isOpen}
              onToggle={() => setToggled((t) => ({ ...t, [tableId]: !isOpen }))}
              title={
                <>
                  <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-park-text">
                    {table?.name ?? `Стол ${tableId}`}
                    {ready > 0 && <span className="flex animate-pulse items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-bold text-white"><LuBellRing size={12} /> {ready}</span>}
                    {bill && <CusBadge color="warning">счёт</CusBadge>}
                    {split && <CusBadge color="info">{list.length} счёт(а)</CusBadge>}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-park-textMuted"><LuClock size={12} /> {since} мин · {list[0].waiter}{!isOpen && ` · ${preview} поз. в работе`}</p>
                </>
              }
              aside={
                <div className="text-right">
                  <p className="text-lg font-bold text-park-text">{fmtMoney(total)}</p>
                  <button className="text-xs font-semibold text-primary" onClick={() => open(split ? undefined : list[0])}>Открыть стол →</button>
                </div>
              }
            >
            {list.map((o) => {
              // В работе — сверху, поданные остаются ниже с пометкой «Подано»
              const lines = [...o.items].sort((a, b) => Number(a.status === 'served') - Number(b.status === 'served'))
              return (
                <section key={o.id} className={split ? 'border-t border-park-border first:border-t-0' : ''}>
                  {split && (
                    <button onClick={() => open(o)} className="flex w-full items-center justify-between gap-3 bg-park-bgHover/50 px-4 py-2 text-left">
                      <span className="flex items-center gap-2 text-sm font-bold text-park-text">
                        {o.guestLabel ?? 'Весь стол'}
                        {readyOf(o) > 0 && <span className="rounded-full bg-success px-1.5 text-xs font-bold text-white">{readyOf(o)}</span>}
                        {o.status === 'bill' && <CusBadge color="warning">счёт</CusBadge>}
                      </span>
                      <span className="text-sm font-semibold text-park-text3">{fmtMoney(orderTotal(o))}</span>
                    </button>
                  )}
                  <ul className="divide-y divide-park-border">
                    {lines.length === 0 && <li className="px-4 py-3 text-sm text-park-textMuted">Позиций пока нет</li>}
                    {lines.map((i) => (
                      <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span className={i.status === 'served' ? 'text-sm text-park-textMuted' : 'text-sm text-park-text'}>{i.qty} × {i.name}</span>
                        {i.status === 'ready' ? (
                          <CusButton size="sm" color="success" onClick={() => setStatus.mutate({ orderId: o.id, itemId: i.id, status: 'served' })}>Подать</CusButton>
                        ) : (
                          <CusBadge color={itemStatusColor[i.status]}>{ITEM_STATUS_LABEL[i.status]}</CusBadge>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
            </CusAccordion>
          </CusCard>
        )
      })}
    </div>
  )
}
