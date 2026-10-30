import { useMemo, useState } from 'react'
import { LuArrowDownToLine, LuArrowUpFromLine, LuDownload, LuScale } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInfoTip } from '@/components/ui/popover/CusInfoTip'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { cashflow } from '@/data/cashflow'
import { purchaseRows } from '@/data/purchases'
import { cn } from '@/lib/cn'
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from '@/types/accounting.types'
import { PAY_METHOD_LABEL, type PayMethod } from '@/types/order.types'
import { downloadCsv } from '@/utils/csv'
import { fmtCompact, fmtDate, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import PeriodFilter, { defaultPeriod } from '@/widgets/shared-ui/PeriodFilter'
import { useClosedOrders } from '../../cashier/hooks/useCashier'
import { useExpenses } from '../accounting-expenses/hooks/useExpenses'
import { useDocs } from '../warehouse-common/hooks/useWarehouse'

const C_IN = '#3b82f6'
const C_OUT = '#ea580c'
const METHODS: PayMethod[] = ['cash', 'uzcard', 'humo', 'online']
const signed = (n: number) => (n < 0 ? `−${fmtMoney(-n)}` : fmtMoney(n))

/** ОДДС: сколько денег пришло от гостей (по способам оплаты) и сколько ушло на расходы и закупки. */
export default function FeatureReportsCashflow() {
  const { data: closed = [] } = useClosedOrders()
  const { data: expenses = [] } = useExpenses()
  const { data: income = [] } = useDocs('income')
  const [period, setPeriod] = useState(defaultPeriod)

  const purchases = useMemo(
    () => purchaseRows(income, { from: period.from, to: period.to, supplierId: null, productIds: null }),
    [income, period],
  )
  const cf = useMemo(() => cashflow(closed, expenses, purchases, period.from, period.to), [closed, expenses, purchases, period])

  const chartData = cf.days.map((d) => ({ day: `${d.date.slice(8)}.${d.date.slice(5, 7)}`, Поступления: Math.round(d.inTotal), Выплаты: Math.round(d.outTotal) }))
  const methodRows = METHODS.map((m) => ({ name: PAY_METHOD_LABEL[m], value: cf.byMethod[m] })).filter((r) => r.value > 0)
  const outRows = [
    ...(Object.keys(cf.byCategory) as ExpenseCategory[]).map((c) => ({ name: EXPENSE_CATEGORY_LABEL[c], value: cf.byCategory[c] })),
    { name: 'Закупки у поставщиков', value: cf.purchasesTotal },
  ].filter((r) => r.value > 0).sort((a, b) => b.value - a.value)

  function exportCsv() {
    downloadCsv(`oddc_${period.from}_${period.to}.csv`, ['Дата', ...METHODS.map((m) => PAY_METHOD_LABEL[m]), 'Поступления', 'Расходы', 'Закупки', 'Выплаты', 'Чистый поток', 'Нарастающим итогом'],
      cf.days.map((d) => [d.date, ...METHODS.map((m) => Math.round(d.inflow[m])), Math.round(d.inTotal), Math.round(d.expenses), Math.round(d.purchases), Math.round(d.outTotal), Math.round(d.net), Math.round(d.running)]))
  }

  const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const td = 'px-3 py-2 text-right tabular-nums'

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Движение" highlight="денег" subtitle="ОДДС: сколько денег пришло от гостей и сколько ушло на расходы и закупки. Показывает, хватает ли денег, а не прибыль." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <CusStatCard icon={<LuArrowDownToLine size={20} />} color="primary" label="Поступления, сум" value={fmtMoney(cf.inTotal)} />
        <CusStatCard icon={<LuArrowUpFromLine size={20} />} color="warning" label="Выплаты, сум" value={fmtMoney(cf.outTotal)} />
        <CusStatCard icon={<LuScale size={20} />} color={cf.net >= 0 ? 'success' : 'danger'} label="Чистый поток, сум" value={signed(cf.net)} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_340px]">
        <CusCard>
          <CusCardHeader title="Поступления и выплаты по дням" subtitle={cf.days.length >= 366 ? 'Последние 366 дней периода' : undefined} />
          <div className="p-5"><CusChart type="bar" data={chartData} xKey="day" series={['Поступления', 'Выплаты']} colors={[C_IN, C_OUT]} format={fmtCompact} /></div>
        </CusCard>
        <div className="space-y-4">
          <CusCard>
            <CusCardHeader title="Откуда деньги" subtitle="Способы оплаты" />
            <div className="p-5">
              {methodRows.length ? (
                <>
                  <CusChart type="pie" data={methodRows} xKey="name" series={['value']} format={fmtMoney} height={170} />
                  <ul className="mt-2 space-y-1 text-sm">{methodRows.map((r) => <li key={r.name} className="flex justify-between gap-3"><span className="text-park-textMuted">{r.name}</span><span className="font-semibold text-park-text">{fmtMoney(r.value)}</span></li>)}</ul>
                </>
              ) : <p className="py-8 text-center text-sm text-park-textMuted">Оплат за период нет</p>}
            </div>
          </CusCard>
          <CusCard>
            <CusCardHeader title="Куда ушли" subtitle="Статьи выплат" />
            <ul className="space-y-1 p-5 text-sm">
              {outRows.length === 0 && <li className="py-4 text-center text-park-textMuted">Выплат за период нет</li>}
              {outRows.map((r) => <li key={r.name} className="flex justify-between gap-3"><span className="text-park-textMuted">{r.name}</span><span className="font-semibold text-park-text">{fmtMoney(r.value)}</span></li>)}
            </ul>
          </CusCard>
        </div>
      </div>

      <CusCard>
        <CusToolbar
          left={<PeriodFilter value={period} onChange={setPeriod} />}
          right={<CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} onClick={exportCsv}>Экспорт CSV</CusButton>}
        />
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-225 text-sm">
            <thead className="sticky top-0 z-10 bg-park-bgHover">
              <tr>
                <th className={`${th} text-left`}>Дата</th>
                {METHODS.map((m) => <th key={m} className={`${th} text-right`}>{PAY_METHOD_LABEL[m]}</th>)}
                <th className={`${th} text-right`}>
                  <span className="inline-flex items-center gap-1.5">Поступления
                    <CusInfoTip title="Поступления" to="/reports/shifts" toLabel="Z-отчёты смен">Деньги, принятые кассой по закрытым счетам. Наличные — за вычетом сдачи. День — по времени закрытия счёта.</CusInfoTip>
                  </span>
                </th>
                <th className={`${th} text-right`}>
                  <span className="inline-flex items-center gap-1.5">Выплаты
                    <CusInfoTip title="Выплаты" to="/reports/expenses" toLabel="Журнал расходов">Записи журнала расходов плюс закупки у поставщиков по проведённым накладным. Закупки считаются в день накладной: оплата поставщикам пока не вводится отдельно.</CusInfoTip>
                  </span>
                </th>
                <th className={`${th} text-right`}>Чистый поток</th>
                <th className={`${th} text-right`}>
                  <span className="inline-flex items-center gap-1.5">Нарастающим
                    <CusInfoTip title="Нарастающим итогом">Сумма чистого потока с первого дня периода до этой даты. Не остаток в кассе: начальный остаток не учитывается.</CusInfoTip>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cf.days.map((d) => (
                <tr key={d.id} className="border-t border-park-border hover:bg-park-bgHover/60">
                  <td className="px-3 py-2 font-semibold text-park-text">{fmtDate(d.date)}</td>
                  {METHODS.map((m) => <td key={m} className={`${td} text-park-textMuted`}>{d.inflow[m] ? fmtMoney(d.inflow[m]) : '—'}</td>)}
                  <td className={`${td} font-semibold text-park-text`}>{d.inTotal ? fmtMoney(d.inTotal) : '—'}</td>
                  <td className={td}>{d.outTotal ? fmtMoney(d.outTotal) : '—'}</td>
                  <td className={cn(td, 'font-semibold', d.net < 0 ? 'text-danger' : 'text-park-text')}>{d.inTotal || d.outTotal ? signed(d.net) : '—'}</td>
                  <td className={cn(td, d.running < 0 ? 'text-danger' : 'text-park-textMuted')}>{signed(d.running)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text">
              <tr className="border-t-2 border-park-border">
                <td className="px-3 py-2.5">Итого</td>
                {METHODS.map((m) => <td key={m} className={td}>{fmtMoney(cf.byMethod[m])}</td>)}
                <td className={td}>{fmtMoney(cf.inTotal)}</td>
                <td className={td}>{fmtMoney(cf.outTotal)}</td>
                <td className={cn(td, cf.net < 0 && 'text-danger')}>{signed(cf.net)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </CusCard>
    </div>
  )
}
