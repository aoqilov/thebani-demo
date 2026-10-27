import { useState } from 'react'
import { LuBanknote, LuClock, LuSearch, LuUsers, LuWallet } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusDrawer } from '@/components/ui/dialog/CusDrawer'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { sum } from '@/data/analytics'
import { billTotals } from '@/data/billing'
import type { Order } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import BillView from '../../cashier/checkout/components/BillView'
import { useLockers } from '../../razdevalka/hooks/useLockers'
import { minutesSince } from '../../waiter/constants'
import { useNow } from '../../waiter/hooks/useNow'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'

type Row = Order & { total: number; left: number }

export default function FeatureLiveGuests() {
  const { data: orders = [], isLoading } = useOrders()
  const { data: tables = [] } = useTables()
  const { data: lockers = [] } = useLockers()
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  useNow()

  const q = search.trim().toLowerCase()
  const rows: Row[] = orders
    .map((o) => ({ ...o, total: billTotals(o, 0, false).total, left: o.durationMin - minutesSince(o.openedAt) }))
    .filter((o) => !q || (o.bracelet ?? '').toLowerCase().includes(q) || (tables.find((t) => t.id === o.tableId)?.name ?? '').toLowerCase().includes(q))
    .sort((a, b) => a.left - b.left)

  const opened = orders.find((o) => o.id === openId)

  const columns: ColumnDef<Row>[] = [
    { key: 'bracelet', header: 'Браслет', render: (o) => <span className="font-mono font-semibold text-park-text">{o.bracelet ?? '—'}</span> },
    { key: 'table', header: 'Стол', render: (o) => tables.find((t) => t.id === o.tableId)?.name ?? <span className="text-park-textMuted">не за столом</span> },
    { key: 'locker', header: 'Шкаф', render: (o) => lockers.find((l) => l.orderId === o.id)?.number ?? '—' },
    { key: 'guests', header: 'Гостей', align: 'right' },
    {
      key: 'left', header: 'Время', sortable: true, align: 'right',
      render: (o) => (o.left < 0 ? <span className="font-semibold text-danger">+{-o.left} мин</span> : <span className="text-park-text">{o.left} мин</span>),
    },
    { key: 'total', header: 'Счёт, сум', sortable: true, align: 'right', render: (o) => <span className="font-semibold text-park-text">{fmtMoney(o.total)}</span> },
    { key: 'status', header: 'Статус', render: (o) => (o.status === 'bill' ? <CusBadge color="warning">счёт запрошен</CusBadge> : o.left < 0 ? <CusBadge color="danger">время вышло</CusBadge> : <CusBadge color="info">в зале</CusBadge>) },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Онлайн" title="Гости" highlight="и счета" subtitle="Все открытые счета в реальном времени. Нажмите на строку, чтобы увидеть состав счёта." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <CusStatCard icon={<LuUsers size={24} />} label="Гостей в зале" value={sum(orders, (o) => o.guests)} color="info" />
        <CusStatCard icon={<LuWallet size={24} />} label="Открытых счетов" value={orders.length} color="primary" />
        <CusStatCard icon={<LuClock size={24} />} label="Время вышло" value={rows.filter((r) => r.left < 0).length} color={rows.some((r) => r.left < 0) ? 'danger' : 'success'} />
        <CusStatCard icon={<LuBanknote size={24} />} label="В открытых счетах, сум" value={fmtMoney(sum(rows, (r) => r.total))} color="success" />
      </div>

      <CusCard>
        <CusToolbar right={<CusInput placeholder="Браслет или стол…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />} />
        <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(o) => setOpenId(o.id)} emptyText="Открытых счетов нет" />
      </CusCard>

      <CusDrawer open={!!opened} onClose={() => setOpenId(null)} title={opened?.bracelet ?? 'Счёт'}>
        {opened && <BillView order={opened} table={tables.find((t) => t.id === opened.tableId)} locker={lockers.find((l) => l.orderId === opened.id)?.number} />}
      </CusDrawer>
    </div>
  )
}
