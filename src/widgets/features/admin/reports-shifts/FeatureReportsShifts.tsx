import { useMemo } from 'react'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { sum } from '@/data/analytics'
import type { Shift } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useClosedOrders, useShifts } from '../../cashier/hooks/useCashier'

const stamp = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

type Row = Shift & { checks: number; revenue: number; cash: number; diff: number | null }

/** Z-отчёты: по каждой смене кассира — выручка, чеки, наличные и расхождение при закрытии. */
export default function FeatureReportsShifts() {
  const { data: shifts = [], isLoading } = useShifts()
  const { data: closed = [] } = useClosedOrders()

  const rows: Row[] = useMemo(() => shifts.map((s) => {
    const to = s.closedAt ?? new Date().toISOString()
    const orders = closed.filter((o) => o.payment && o.payment.at >= s.openedAt && o.payment.at <= to)
    return {
      ...s,
      checks: orders.length,
      revenue: sum(orders, (o) => o.payment!.total),
      cash: sum(orders, (o) => sum(o.payment!.lines.filter((l) => l.method === 'cash'), (l) => l.amount)),
      diff: s.closedAt ? (s.countedCash ?? 0) - (s.expectedCash ?? 0) : null,
    }
  }), [shifts, closed])

  const columns: ColumnDef<Row>[] = [
    { key: 'cashier', header: 'Кассир', render: (s) => <span className="font-semibold text-park-text">{s.cashier}</span> },
    { key: 'openedAt', header: 'Открыта', sortable: true, render: (s) => stamp(s.openedAt) },
    { key: 'closedAt', header: 'Закрыта', render: (s) => (s.closedAt ? stamp(s.closedAt) : '—') },
    { key: 'checks', header: 'Чеков', align: 'right' },
    { key: 'revenue', header: 'Выручка, сум', sortable: true, align: 'right', render: (s) => fmtMoney(s.revenue) },
    { key: 'cash', header: 'Наличными', align: 'right', render: (s) => fmtMoney(s.cash) },
    { key: 'expected', header: 'Ожидалось в кассе', align: 'right', render: (s) => (s.closedAt ? fmtMoney(s.expectedCash ?? 0) : '—') },
    {
      key: 'diff', header: 'Разница', align: 'right',
      render: (s) => (s.diff === null ? '—' : <span className={s.diff === 0 ? 'text-success' : 'font-semibold text-danger'}>{s.diff > 0 ? '+' : ''}{fmtMoney(s.diff)}</span>),
    },
    { key: 'status', header: 'Статус', render: (s) => (s.closedAt ? <CusBadge color="dark">Закрыта</CusBadge> : <CusBadge color="success">Открыта</CusBadge>) },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Z-отчёты" highlight="смен" subtitle="Итоги каждой смены кассира и расхождения по наличным." />
      <CusCard>
        <CusCardHeader title="Смены" />
        <CusTable data={rows} columns={columns} isLoading={isLoading} emptyText="Смен пока нет" />
      </CusCard>
    </div>
  )
}
