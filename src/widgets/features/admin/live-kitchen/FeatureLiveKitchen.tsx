import { useMemo } from 'react'
import { LuChefHat, LuClock, LuMartini, LuTimer } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { STATION_LABEL } from '@/types/menu.types'
import { ITEM_STATUS_LABEL, type OrderItem } from '@/types/order.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { itemStatusColor, minutesSince } from '../../waiter/constants'
import { useNow } from '../../waiter/hooks/useNow'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'

type Row = OrderItem & { tableName: string; orderId: number; wait: number }

/** Очередь кухни и бара для администратора (только просмотр). */
export default function FeatureLiveKitchen() {
  const { data: orders = [], isLoading } = useOrders()
  const { data: tables = [] } = useTables()
  useNow(15_000)

  const rows: Row[] = useMemo(
    () => orders.flatMap((o) => o.items.filter((i) => i.status !== 'served').map((i) => ({
      ...i, orderId: o.id, tableName: tables.find((t) => t.id === o.tableId)?.name ?? '—', wait: minutesSince(i.sentAt),
    }))).sort((a, b) => b.wait - a.wait),
    [orders, tables],
  )

  const queue = rows.filter((r) => r.status === 'sent' || r.status === 'cooking')
  const avg = queue.length ? Math.round(queue.reduce((s, r) => s + r.wait, 0) / queue.length) : 0
  const count = (st: 'kitchen' | 'bar') => queue.filter((r) => r.station === st).length

  const columns: ColumnDef<Row>[] = [
    { key: 'station', header: 'Цех', render: (r) => <CusBadge color={r.station === 'bar' ? 'secondary' : 'info'}>{STATION_LABEL[r.station]}</CusBadge> },
    { key: 'tableName', header: 'Стол', sortable: true },
    { key: 'name', header: 'Позиция', render: (r) => <span className="font-semibold text-park-text">{r.qty} × {r.name}</span> },
    { key: 'status', header: 'Статус', render: (r) => <CusBadge color={itemStatusColor[r.status]}>{ITEM_STATUS_LABEL[r.status]}</CusBadge> },
    {
      key: 'wait', header: 'Ждёт', sortable: true, align: 'right',
      render: (r) => <span className={r.wait >= 20 ? 'font-bold text-danger' : r.wait >= 10 ? 'font-semibold text-warning' : 'text-park-text'}>{r.wait} мин</span>,
    },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Онлайн" title="Кухня" highlight="и бар" subtitle="Очередь заказов в реальном времени. Самые долгие — сверху." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <CusStatCard icon={<LuChefHat size={24} />} label="В очереди на кухне" value={count('kitchen')} color="info" />
        <CusStatCard icon={<LuMartini size={24} />} label="В очереди в баре" value={count('bar')} color="secondary" />
        <CusStatCard icon={<LuTimer size={24} />} label="Среднее ожидание, мин" value={avg} color={avg >= 15 ? 'danger' : 'success'} />
        <CusStatCard icon={<LuClock size={24} />} label="Готово, ждёт подачи" value={rows.filter((r) => r.status === 'ready').length} color="warning" />
      </div>

      <CusCard>
        <CusTable data={rows} columns={columns} isLoading={isLoading} emptyText="Очередь пуста" />
      </CusCard>
    </div>
  )
}
