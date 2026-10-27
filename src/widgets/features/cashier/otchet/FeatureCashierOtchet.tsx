import { useMemo } from 'react'
import { LuBadgePercent, LuBanknote, LuReceipt, LuTrendingUp } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { PAY_METHOD_LABEL, type Order, type PayMethod } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useTables } from '../../waiter/hooks/useOrders'
import { useClosedOrders, useCurrentShift } from '../hooks/useCashier'

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export default function FeatureCashierOtchet() {
  const { data: closed = [] } = useClosedOrders()
  const { data: tables = [] } = useTables()
  const { shift } = useCurrentShift()

  // отчёт за текущую смену, а если она закрыта — за сегодня
  const since = shift?.openedAt ?? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const orders = useMemo(() => closed.filter((o) => o.payment && o.payment.at >= since), [closed, since])

  const revenue = orders.reduce((s, o) => s + o.payment!.total, 0)
  const discounts = orders.reduce((s, o) => s + o.payment!.discount, 0)
  const byMethod = (Object.keys(PAY_METHOD_LABEL) as PayMethod[]).map((m) => ({
    name: PAY_METHOD_LABEL[m],
    value: orders.reduce((s, o) => s + o.payment!.lines.filter((l) => l.method === m).reduce((a, l) => a + l.amount, 0), 0),
  })).filter((x) => x.value > 0)

  const columns: ColumnDef<Order>[] = [
    { key: 'time', header: 'Время', render: (o) => hhmm(o.payment!.at) },
    { key: 'table', header: 'Стол', render: (o) => tables.find((t) => t.id === o.tableId)?.name ?? o.tableId },
    { key: 'id', header: 'Чек №', render: (o) => `№ ${o.id}` },
    { key: 'methods', header: 'Оплата', render: (o) => o.payment!.lines.map((l) => PAY_METHOD_LABEL[l.method]).join(' + ') },
    { key: 'discount', header: 'Скидка', align: 'right', render: (o) => (o.payment!.discount ? fmtMoney(o.payment!.discount) : '—') },
    { key: 'total', header: 'Итого, сум', align: 'right', render: (o) => <span className="font-semibold text-park-text">{fmtMoney(o.payment!.total)}</span> },
  ]

  return (
    <div className="space-y-4">
      <PageHeader label="Кассир" title="Отчёт" highlight={shift ? 'за смену' : 'за сегодня'} subtitle="Выручка по закрытым счетам и способам оплаты." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <CusStatCard icon={<LuBanknote size={24} />} label="Выручка, сум" value={fmtMoney(revenue)} color="success" />
        <CusStatCard icon={<LuReceipt size={24} />} label="Чеков" value={orders.length} color="primary" />
        <CusStatCard icon={<LuTrendingUp size={24} />} label="Средний чек, сум" value={fmtMoney(orders.length ? revenue / orders.length : 0)} color="info" />
        <CusStatCard icon={<LuBadgePercent size={24} />} label="Скидки, сум" value={fmtMoney(discounts)} color="warning" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[360px_1fr]">
        <CusCard>
          <CusCardHeader title="По способам оплаты" />
          <div className="p-5">
            {byMethod.length > 0 ? <CusChart type="pie" data={byMethod} xKey="name" series={['value']} height={220} /> : <p className="py-10 text-center text-sm text-park-textMuted">Нет данных</p>}
            <ul className="mt-2 space-y-1.5 text-sm">
              {byMethod.map((m) => <li key={m.name} className="flex justify-between"><span className="text-park-textMuted">{m.name}</span><span className="font-semibold text-park-text">{fmtMoney(m.value)}</span></li>)}
            </ul>
          </div>
        </CusCard>
        <CusCard>
          <CusCardHeader title="Закрытые счета" />
          <CusTable data={orders} columns={columns} emptyText="Закрытых счетов пока нет" />
        </CusCard>
      </div>
    </div>
  )
}
