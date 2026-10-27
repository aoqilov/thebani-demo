import { LuBellRing, LuClock } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { ITEM_STATUS_LABEL, orderTotal } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { itemStatusColor, minutesSince } from '../constants'
import { useNow } from '../hooks/useNow'
import { useOrders, useSetItemStatus, useTables } from '../hooks/useOrders'

export default function FeatureWaiterOrders() {
  const navigate = useNavigate()
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const setStatus = useSetItemStatus()
  useNow()

  // Сначала столы, где есть готовое к подаче
  const sorted = orders.filter((o) => o.tableId !== null).sort((a, b) => b.items.filter((i) => i.status === 'ready').length - a.items.filter((i) => i.status === 'ready').length)

  return (
    <div className="space-y-4">
      <PageHeader label="Официант" title="Заказы" subtitle="Все открытые заказы. Готовые блюда — сверху." />

      {sorted.length === 0 && <CusCard className="p-8 text-center text-sm text-park-textMuted">Открытых заказов нет</CusCard>}

      {sorted.map((o) => {
        const table = tables.find((t) => t.id === o.tableId)
        const active = o.items.filter((i) => i.status !== 'served')
        const ready = o.items.filter((i) => i.status === 'ready').length
        return (
          <CusCard key={o.id}>
            <div className="flex items-center justify-between gap-3 border-b border-park-border px-4 py-3">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-park-text">
                  {table?.name}
                  {ready > 0 && <span className="flex animate-pulse items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-bold text-white"><LuBellRing size={12} /> {ready}</span>}
                  {o.status === 'bill' && <CusBadge color="warning">счёт</CusBadge>}
                </p>
                <p className="flex items-center gap-1 text-xs text-park-textMuted"><LuClock size={12} /> {minutesSince(o.openedAt)} мин · {o.waiter}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-park-text">{fmtMoney(orderTotal(o))}</p>
                <button className="text-xs font-semibold text-primary" onClick={() => navigate(`/waiter/table/${o.tableId}`)}>Открыть стол →</button>
              </div>
            </div>
            <ul className="divide-y divide-park-border">
              {active.length === 0 && <li className="px-4 py-3 text-sm text-park-textMuted">Всё подано</li>}
              {active.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-park-text">{i.qty} × {i.name}</span>
                  {i.status === 'ready' ? (
                    <CusButton size="sm" color="success" onClick={() => setStatus.mutate({ orderId: o.id, itemId: i.id, status: 'served' })}>Подать</CusButton>
                  ) : (
                    <CusBadge color={itemStatusColor[i.status]}>{ITEM_STATUS_LABEL[i.status]}</CusBadge>
                  )}
                </li>
              ))}
            </ul>
          </CusCard>
        )
      })}
    </div>
  )
}
