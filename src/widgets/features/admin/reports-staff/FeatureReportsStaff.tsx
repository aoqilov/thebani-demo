import { useMemo, useState } from 'react'
import { LuDownload } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInfoTip } from '@/components/ui/popover/CusInfoTip'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { cashierStats, waiterStats, type CashierStat, type WaiterStat } from '@/data/staffStats'
import { downloadCsv } from '@/utils/csv'
import { fmtCompact, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import PeriodFilter, { defaultPeriod } from '@/widgets/shared-ui/PeriodFilter'
import { useClosedOrders } from '../../cashier/hooks/useCashier'

type Tab = 'cashiers' | 'waiters'

/** Работа сотрудников: кассиры (деньги, скидки) и официанты (продажи, средний чек). */
export default function FeatureReportsStaff() {
  const { data: closed = [], isLoading } = useClosedOrders()
  const [period, setPeriod] = useState(defaultPeriod)
  const [tab, setTab] = useState<Tab>('cashiers')

  const cashiers = useMemo(() => cashierStats(closed, period.from, period.to), [closed, period])
  const waiters = useMemo(() => waiterStats(closed, period.from, period.to), [closed, period])

  const cashierCols: ColumnDef<CashierStat>[] = [
    { key: 'name', header: 'Кассир', sortable: true, render: (c) => <span className="font-semibold text-park-text">{c.name}</span> },
    { key: 'orders', header: 'Счетов', sortable: true, align: 'right' },
    { key: 'revenue', header: 'Принято, сум', sortable: true, align: 'right', render: (c) => fmtMoney(c.revenue) },
    { key: 'avgCheck', header: 'Средний чек', sortable: true, align: 'right', render: (c) => fmtMoney(c.avgCheck) },
    { key: 'cash', header: 'Наличные', sortable: true, align: 'right', render: (c) => fmtMoney(c.cash) },
    { key: 'cashless', header: 'Безналичные', sortable: true, align: 'right', render: (c) => fmtMoney(c.cashless) },
    { key: 'discount', header: 'Скидки, сум', sortable: true, align: 'right', render: (c) => (c.discount ? fmtMoney(c.discount) : '—') },
    { key: 'discountPct', header: 'Доля скидок', sortable: true, align: 'right', render: (c) => (c.discount ? <CusBadge color={c.discountPct > 5 ? 'danger' : c.discountPct > 2 ? 'warning' : 'dark'}>{c.discountPct.toFixed(1)}%</CusBadge> : '—') },
  ]
  const waiterCols: ColumnDef<WaiterStat>[] = [
    { key: 'name', header: 'Официант', sortable: true, render: (w) => <span className="font-semibold text-park-text">{w.name}</span> },
    { key: 'orders', header: 'Счетов', sortable: true, align: 'right' },
    { key: 'guests', header: 'Гостей', sortable: true, align: 'right' },
    { key: 'sales', header: 'Продано, сум', sortable: true, align: 'right', render: (w) => fmtMoney(w.sales) },
    { key: 'avgOrder', header: 'Средний счёт', sortable: true, align: 'right', render: (w) => fmtMoney(w.avgOrder) },
    { key: 'avgPerGuest', header: 'На гостя', sortable: true, align: 'right', render: (w) => fmtMoney(w.avgPerGuest) },
    { key: 'service', header: 'Сбор за обслуживание', sortable: true, align: 'right', render: (w) => (w.service ? fmtMoney(w.service) : '—') },
  ]

  const chart = tab === 'cashiers'
    ? cashiers.map((c) => ({ name: c.name, 'Принято': Math.round(c.revenue) }))
    : waiters.map((w) => ({ name: w.name, 'Продано': Math.round(w.sales) }))

  function exportCsv() {
    if (tab === 'cashiers') {
      downloadCsv(`kassiry_${period.from}_${period.to}.csv`, ['Кассир', 'Счетов', 'Принято', 'Средний чек', 'Наличные', 'Безналичные', 'Скидки', 'Доля скидок, %'],
        cashiers.map((c) => [c.name, c.orders, Math.round(c.revenue), Math.round(c.avgCheck), Math.round(c.cash), Math.round(c.cashless), Math.round(c.discount), c.discountPct.toFixed(1)]))
    } else {
      downloadCsv(`oficianty_${period.from}_${period.to}.csv`, ['Официант', 'Счетов', 'Гостей', 'Продано', 'Средний счёт', 'На гостя', 'Сбор за обслуживание'],
        waiters.map((w) => [w.name, w.orders, w.guests, Math.round(w.sales), Math.round(w.avgOrder), Math.round(w.avgPerGuest), Math.round(w.service)]))
    }
  }

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Кассиры" highlight="и официанты" subtitle="Кто и сколько принял денег, как часто даёт скидки, кто лучше продаёт блюда и напитки." />

      <CusCard>
        <CusCardHeader title={tab === 'cashiers' ? 'Принято по кассирам' : 'Продано по официантам'} />
        <div className="p-5">
          {chart.length ? <CusChart type="bar" data={chart} xKey="name" series={[tab === 'cashiers' ? 'Принято' : 'Продано']} colors={['#3b82f6']} format={fmtCompact} height={240} /> : <p className="py-10 text-center text-sm text-park-textMuted">За выбранный период закрытых счетов нет</p>}
        </div>
      </CusCard>

      <CusCard>
        <CusToolbar
          left={<PeriodFilter value={period} onChange={setPeriod} />}
          right={<CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} isDisabled={(tab === 'cashiers' ? cashiers : waiters).length === 0} onClick={exportCsv}>Экспорт CSV</CusButton>}
        />
        <div className="flex items-center gap-1.5 border-t border-park-border px-4 py-2.5">
          <CusChip active={tab === 'cashiers'} onClick={() => setTab('cashiers')}>Кассиры ({cashiers.length})</CusChip>
          <CusChip active={tab === 'waiters'} onClick={() => setTab('waiters')}>Официанты ({waiters.length})</CusChip>
          <CusInfoTip title={tab === 'cashiers' ? 'Как считается' : 'Как считается'} className="ml-1">
            {tab === 'cashiers'
              ? <><p>«Принято» — сумма оплаченных счетов, закрытых этим кассиром (наличные за вычетом сдачи).</p><p>«Доля скидок» — скидки ÷ сумма счетов до скидки. Выше 5% подсвечивается красным: повод проверить причины.</p></>
              : <><p>«Продано» — только блюда и напитки со счетов официанта, без тарифов и услуг. Счета без заказов за стол в расчёт не входят.</p><p>«На гостя» — продано ÷ число гостей за столом.</p></>}
          </CusInfoTip>
        </div>
        <div className="overflow-x-auto">
          {tab === 'cashiers'
            ? <CusTable data={cashiers} columns={cashierCols} isLoading={isLoading} emptyText="Закрытых счетов за период нет" />
            : <CusTable data={waiters} columns={waiterCols} isLoading={isLoading} emptyText="За период нет счетов с заказами" />}
        </div>
      </CusCard>
    </div>
  )
}
