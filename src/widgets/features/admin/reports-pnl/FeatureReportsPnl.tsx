import { useMemo, useState } from 'react'
import { LuBanknote, LuCoins, LuDownload, LuPiggyBank, LuTrendingUp } from 'react-icons/lu'
import { CusChart, type WaterfallRow } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusInfoTip } from '@/components/ui/popover/CusInfoTip'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { pnl, STRUCTURE_LABEL, type PnlResult } from '@/data/pnl'
import { cn } from '@/lib/cn'
import { EXPENSE_CATEGORY_LABEL, OPEX_CATEGORIES, type ExpenseCategory } from '@/types/accounting.types'
import { downloadCsv } from '@/utils/csv'
import { fmtCompact, fmtDate, fmtMoney, today } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useClosedOrders } from '../../cashier/hooks/useCashier'
import { useExpenses } from '../accounting-expenses/hooks/useExpenses'
import { useMasters } from '../services-list/hooks/useServices'
import { useItemCost } from './hooks/useItemCost'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const daysBack = (n: number) => iso(new Date(Date.now() - n * 86_400_000))
const PRESETS = [
  { key: 'today', label: 'Сегодня', range: () => ({ from: today(), to: today() }) },
  { key: '7', label: '7 дней', range: () => ({ from: daysBack(6), to: today() }) },
  { key: '20', label: '20 дней', range: () => ({ from: daysBack(19), to: today() }) },
  { key: 'month', label: 'Этот месяц', range: () => ({ from: `${today().slice(0, 7)}-01`, to: today() }) },
] as const

type Kind = 'line' | 'sub' | 'subtotal' | 'total'
interface Line {
  label: string
  kind: Kind
  /** Значение со знаком: доходы — плюс, расходы — минус */
  pick: (r: PnlResult) => number
  /** Откуда взято число: пояснение и страница-источник */
  source: { text: string; to?: string; toLabel?: string }
}

const revenueKeys = ['tariffs', 'services', 'goods', 'fines', 'kitchen', 'bar'] as const

const REVENUE_SOURCE: Record<(typeof revenueKeys)[number], Line['source']> = {
  tariffs: { text: 'Начисления «Тариф» в закрытых счетах за период. Их создаёт ресепшн, когда выдаёт гостю браслет и открывает счёт.', to: '/reports/finance', toLabel: 'Отчёт «Финансы»' },
  services: { text: 'Услуги мастеров (массаж, процедуры), добавленные на браслет гостя и оплаченные при закрытии счёта.', to: '/reports/services', toLabel: 'Отчёт «Услуги мастеров»' },
  goods: { text: 'Товары магазина (веники, шапки, аренда халатов), проданные через браслет и оплаченные в закрытых счетах.', to: '/reports/finance', toLabel: 'Отчёт «Финансы»' },
  fines: { text: 'Штрафы в закрытых счетах, например за утерю браслета.', to: '/reports/finance', toLabel: 'Отчёт «Финансы»' },
  kitchen: { text: 'Блюда кухни из заказов за столы: цена позиции × количество, в закрытых счетах.', to: '/reports/finance', toLabel: 'Отчёт «Финансы»' },
  bar: { text: 'Напитки и блюда бара из заказов за столы: цена позиции × количество, в закрытых счетах.', to: '/reports/finance', toLabel: 'Отчёт «Финансы»' },
}

const LINES: Line[] = [
  ...revenueKeys.map((k): Line => ({ label: STRUCTURE_LABEL[k], kind: 'sub', pick: (r) => r.revenue[k], source: REVENUE_SOURCE[k] })),
  { label: 'Скидки', kind: 'sub', pick: (r) => -r.discounts, source: { text: 'Скидки, которые кассир применил при закрытии счетов за период.', to: '/reports/shifts', toLabel: 'Z-отчёты смен' } },
  { label: 'Сбор за обслуживание', kind: 'sub', pick: (r) => r.serviceCharge, source: { text: '20% на кухню и бар, начисляется при закрытии счёта, если кассир его не отключил. На тарифы и услуги не начисляется.', to: '/reports/shifts', toLabel: 'Z-отчёты смен' } },
  { label: 'Выручка', kind: 'subtotal', pick: (r) => r.revenueNet, source: { text: 'Итог: все начисления − скидки + сбор за обслуживание. Совпадает с суммой, принятой кассой по закрытым счетам.', to: '/reports/finance', toLabel: 'Отчёт «Финансы»' } },
  { label: 'Себестоимость кухни', kind: 'sub', pick: (r) => -r.cogsKitchen, source: { text: 'Для каждого проданного блюда: себестоимость по тех. карте × количество + расход модификаторов. Цены сырья — средние по складу.', to: '/warehouse/recipes', toLabel: 'Тех. карты' } },
  { label: 'Себестоимость бара', kind: 'sub', pick: (r) => -r.cogsBar, source: { text: 'Покупные напитки и товары бара списываются по средней закупочной цене склада; коктейли и блюда — по тех. карте.', to: '/warehouse/stock', toLabel: 'Остатки склада' } },
  { label: 'Доля мастеров (комиссия)', kind: 'sub', pick: (r) => -r.masterCommission, source: { text: 'Стоимость каждой услуги × процент мастера из справочника мастеров. Считается только по услугам закрытых счетов.', to: '/services/masters', toLabel: 'Мастера' } },
  { label: 'Валовая прибыль', kind: 'subtotal', pick: (r) => r.grossProfit, source: { text: 'Выручка − себестоимость кухни и бара − доля мастеров. Показывает, сколько остаётся до операционных расходов.' } },
  ...OPEX_CATEGORIES.map((c: ExpenseCategory): Line => ({
    label: EXPENSE_CATEGORY_LABEL[c], kind: 'sub', pick: (r) => -r.opex[c],
    source: { text: `Сумма записей журнала расходов со статьёй «${EXPENSE_CATEGORY_LABEL[c]}» за период. Добавляет бухгалтер вручную.`, to: '/reports/expenses', toLabel: 'Журнал расходов' },
  })),
  { label: 'Операционная прибыль', kind: 'subtotal', pick: (r) => r.operatingProfit, source: { text: 'Валовая прибыль − все операционные расходы (без налогов).' } },
  { label: 'Налоги', kind: 'sub', pick: (r) => -r.taxes, source: { text: 'Записи журнала расходов со статьёй «Налоги» за период.', to: '/reports/expenses', toLabel: 'Журнал расходов' } },
  { label: 'Чистая прибыль', kind: 'total', pick: (r) => r.netProfit, source: { text: 'Операционная прибыль − налоги. Итог периода: плюс — прибыль, минус — убыток.' } },
]

/** Цвета графиков: проверены скриптом validate_palette (светлая и тёмная тема) */
const C_REVENUE = '#3b82f6'
const C_PROFIT = '#16a34a'
const C_LOSS = '#ef4444'
const C_DEDUCT = '#94a3b8'
const MAX_DAYS = 120

const signed = (n: number) => (n < 0 ? `−${fmtMoney(-n)}` : fmtMoney(n))

/** Отчёт о прибылях и убытках (ОПиУ): выручка → валовая прибыль → операционная → чистая, с сравнением с прошлым периодом. */
export default function FeatureReportsPnl() {
  const { data: closed = [] } = useClosedOrders()
  const { data: expenses = [] } = useExpenses()
  const { data: masters = [] } = useMasters()

  const [preset, setPreset] = useState<string>('20')
  const [range, setRange] = useState(() => PRESETS[2].range())

  const itemCost = useItemCost()

  const cur = useMemo(() => pnl({ orders: closed, expenses, masters, itemCost, ...range }), [closed, expenses, masters, itemCost, range])

  /** Водопад: как выручка превращается в чистую прибыль. */
  const waterfall: WaterfallRow[] = useMemo(() => [
    { name: 'Выручка', value: cur.revenueNet, total: true, color: C_REVENUE },
    { name: 'Себестоимость', value: -cur.cogs, color: C_DEDUCT },
    { name: 'Доля мастеров', value: -cur.masterCommission, color: C_DEDUCT },
    { name: 'Валовая прибыль', value: cur.grossProfit, total: true, color: cur.grossProfit >= 0 ? C_PROFIT : C_LOSS },
    { name: 'Расходы', value: -cur.opexTotal, color: C_DEDUCT },
    { name: 'Операц. прибыль', value: cur.operatingProfit, total: true, color: cur.operatingProfit >= 0 ? C_PROFIT : C_LOSS },
    { name: 'Налоги', value: -cur.taxes, color: C_DEDUCT },
    { name: 'Чистая прибыль', value: cur.netProfit, total: true, color: cur.netProfit >= 0 ? C_PROFIT : C_LOSS },
  ], [cur])

  /** Выручка и валовая прибыль по дням (расходы нерегулярные, поэтому в ряд по дням не входят). */
  const daily = useMemo(() => {
    const days: { day: string; Выручка: number; 'Валовая прибыль': number }[] = []
    const end = new Date(range.to).getTime()
    const start = Math.max(new Date(range.from).getTime(), end - (MAX_DAYS - 1) * 86_400_000)
    for (let t = start; t <= end; t += 86_400_000) {
      const d = new Date(t).toISOString().slice(0, 10)
      const r = pnl({ orders: closed, expenses: [], masters, itemCost, from: d, to: d })
      days.push({ day: d.slice(8) + '.' + d.slice(5, 7), Выручка: Math.round(r.revenueNet), 'Валовая прибыль': Math.round(r.grossProfit) })
    }
    return days
  }, [closed, masters, itemCost, range])

  const expenseRows = useMemo(
    () => [...OPEX_CATEGORIES.map((c) => ({ name: EXPENSE_CATEGORY_LABEL[c], value: cur.opex[c] })), { name: 'Налоги', value: cur.taxes }].filter((r) => r.value > 0).sort((a, b) => b.value - a.value),
    [cur],
  )

  const pickPreset = (key: string) => {
    setPreset(key)
    const p = PRESETS.find((x) => x.key === key)
    if (p) setRange(p.range())
  }

  function exportCsv() {
    downloadCsv(`opiu_${range.from}_${range.to}.csv`, ['Статья', 'Сумма, сум', '% от выручки'],
      LINES.map((l) => [l.label, Math.round(l.pick(cur)), cur.revenueNet > 0 ? ((l.pick(cur) / cur.revenueNet) * 100).toFixed(1) : '']))
  }

  const th = 'px-4 py-2 text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const empty = cur.orders === 0

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Прибыли" highlight="и убытки" subtitle="Сколько заработали и сколько осталось после себестоимости, расходов и налогов. " />

      <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
        <CusStatCard icon={<LuBanknote size={20} />} color="primary" label="Выручка, сум" value={fmtMoney(cur.revenueNet)} />
        <CusStatCard icon={<LuCoins size={20} />} color="info" label={`Валовая прибыль · ${cur.grossMargin.toFixed(0)}%`} value={signed(cur.grossProfit)} />
        <CusStatCard icon={<LuTrendingUp size={20} />} color="secondary" label="Операционная прибыль" value={signed(cur.operatingProfit)} />
        <CusStatCard icon={<LuPiggyBank size={20} />} color={cur.netProfit >= 0 ? 'success' : 'danger'} label={`Чистая прибыль · ${cur.netMargin.toFixed(0)}%`} value={signed(cur.netProfit)} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <CusCard>
          <CusCardHeader title="Из выручки в прибыль" subtitle="Серым — что вычитается, цветом — итоговые строки" />
          <div className="overflow-x-auto p-5">
            <div className="min-w-160"><CusChart type="waterfall" data={waterfall} format={fmtCompact} height={300} /></div>
          </div>
        </CusCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_340px]">
        <CusCard>
          <CusCardHeader title="Выручка и валовая прибыль по дням" subtitle={daily.length >= MAX_DAYS ? `Последние ${MAX_DAYS} дней периода` : undefined} />
          <div className="p-5"><CusChart type="line" data={daily} xKey="day" series={['Выручка', 'Валовая прибыль']} colors={[C_REVENUE, C_PROFIT]} format={fmtCompact} /></div>
        </CusCard>
        <CusCard>
          <CusCardHeader title="Структура расходов" />
          <div className="p-5">
            {expenseRows.length ? (
              <>
                <CusChart type="pie" data={expenseRows} xKey="name" series={['value']} format={fmtMoney} height={200} />
                <ul className="mt-2 space-y-1 text-sm">{expenseRows.map((r) => <li key={r.name} className="flex justify-between gap-3"><span className="text-park-textMuted">{r.name}</span><span className="font-semibold text-park-text">{fmtMoney(r.value)}</span></li>)}</ul>
              </>
            ) : <p className="py-12 text-center text-sm text-park-textMuted">За период расходов нет</p>}
          </div>
        </CusCard>
      </div>

      <CusCard>
        <CusToolbar
          left={
            <>
              <div className="flex gap-1.5">{PRESETS.map((p) => <CusChip key={p.key} active={preset === p.key} onClick={() => pickPreset(p.key)}>{p.label}</CusChip>)}</div>
              <div className="ml-2 w-40"><CusInput type="date" value={range.from} onChange={(e) => { setPreset(''); setRange((r) => ({ ...r, from: e.target.value })) }} /></div>
              <span className="text-park-textMuted">—</span>
              <div className="w-40"><CusInput type="date" value={range.to} onChange={(e) => { setPreset(''); setRange((r) => ({ ...r, to: e.target.value })) }} /></div>
            </>
          }
          right={<CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} onClick={exportCsv}>Экспорт CSV</CusButton>}
        />

        {empty && <div className="px-4 pt-4"><CusAlert color="warning">За выбранный период нет закрытых счетов — выручка и себестоимость будут нулевыми, останутся только расходы.</CusAlert></div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-sm">
            <thead className="bg-park-bgHover">
              <tr>
                <th className={`${th} text-left`}>Статья</th>
                <th className={`${th} text-right`}>
                  <span className="inline-flex items-center gap-1.5">{fmtDate(range.from)} — {fmtDate(range.to)}
                    <CusInfoTip title="Выбранный период" to="/reports/finance" toLabel="Отчёт «Финансы»">Суммы за период, который вы выбрали сверху. Выручка берётся по дате оплаты закрытого счёта, расходы — по дате в журнале расходов.</CusInfoTip>
                  </span>
                </th>
                <th className={`${th} w-28 text-right`}>
                  <span className="inline-flex items-center gap-1.5">% выручки
                    <CusInfoTip title="% выручки">Доля строки в итоговой выручке периода: сумма строки ÷ выручка × 100. Помогает увидеть, какая статья «съедает» больше всего.</CusInfoTip>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {LINES.map((l) => {
                const v = l.pick(cur)
                const strong = l.kind !== 'line' && l.kind !== 'sub'
                return (
                  <tr key={l.label} className={cn('border-t border-park-border', strong && 'bg-park-bgHover/50 font-bold text-park-text', l.kind === 'total' && 'border-t-2 text-base')}>
                    <td className={cn('px-4 py-2', l.kind === 'sub' && 'pl-9 text-park-text3')}>
                      <span className="inline-flex items-center gap-1.5">{l.label}<CusInfoTip title={l.label} to={l.source.to} toLabel={l.source.toLabel}>{l.source.text}</CusInfoTip></span>
                    </td>
                    <td className={cn('px-4 py-2 text-right tabular-nums', v < 0 && 'text-danger', l.kind === 'total' && (v >= 0 ? 'text-success' : 'text-danger'))}>{v === 0 && !strong ? '—' : signed(v)}</td>
                    <td className="px-4 py-2 text-right text-park-textMuted">{cur.revenueNet > 0 && v !== 0 ? `${((v / cur.revenueNet) * 100).toFixed(1)}%` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-1 border-t border-park-border px-4 py-3 text-xs text-park-textMuted">
          <p>Закрытых счетов за период: {cur.orders}. Расходы берутся из «Журнала расходов».</p>
          <p>Себестоимость кухни и бара считается по тех. картам и текущим средним ценам склада, с учётом модификаторов. Себестоимость товаров магазина и услуг не учитывается: услуги — только доля мастера.</p>
          <p>Сбор за обслуживание включён в выручку. Его выплата персоналу отдельной строкой не выделена — учитывайте её в журнале расходов.</p>
        </div>
      </CusCard>
    </div>
  )
}
