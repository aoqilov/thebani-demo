import { useMemo, useState } from 'react'
import { LuDownload, LuPercent, LuSearch, LuStar, LuTriangleAlert } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusInfoTip } from '@/components/ui/popover/CusInfoTip'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { itemState } from '@/data/menu.calc'
import { MENU_CLASS_HINT, MENU_CLASS_LABEL, menuAnalysis, type MenuClass, type MenuRow } from '@/data/menuAnalysis'
import { foodCostColor } from '@/data/recipe.calc'
import { downloadCsv } from '@/utils/csv'
import { fmtCompact, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import PeriodFilter, { defaultPeriod } from '@/widgets/shared-ui/PeriodFilter'
import { useClosedOrders } from '../../cashier/hooks/useCashier'
import { useMenuCategories, useMenuItems } from '../menu/hooks/useMenu'
import { useCostCtx } from '../warehouse-recipes/components/useCostCtx'

const CLASSES: MenuClass[] = ['star', 'plowhorse', 'puzzle', 'dog']
const CLASS_COLOR = { star: 'success', plowhorse: 'info', puzzle: 'warning', dog: 'danger' } as const

/** Food cost и маржинальность меню: что приносит прибыль, что продаётся плохо. */
export default function FeatureReportsMenu() {
  const { data: closed = [] } = useClosedOrders()
  const { data: menu = [] } = useMenuItems()
  const { data: categories = [] } = useMenuCategories()
  const { ctx } = useCostCtx()

  const [period, setPeriod] = useState(defaultPeriod)
  const [cls, setCls] = useState<MenuClass | 'all'>('all')
  const [categoryId, setCategoryId] = useState('all')
  const [search, setSearch] = useState('')

  const analysis = useMemo(() => menuAnalysis(menu, closed, period.from, period.to, (m) => itemState(m, ctx).cost), [menu, closed, period, ctx])
  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return analysis.rows.filter((r) => (cls === 'all' || r.cls === cls) && (categoryId === 'all' || r.categoryId === Number(categoryId)) && (!q || r.name.toLowerCase().includes(q)))
  }, [analysis, cls, categoryId, search])

  const count = (c: MenuClass) => analysis.rows.filter((r) => r.cls === c).length
  const noCost = analysis.rows.filter((r) => r.cost <= 0).length
  const top = useMemo(() => [...analysis.rows].filter((r) => r.profit > 0).sort((a, b) => b.profit - a.profit).slice(0, 10).map((r) => ({ name: r.name.length > 18 ? `${r.name.slice(0, 17)}…` : r.name, Прибыль: Math.round(r.profit) })), [analysis])

  const columns: ColumnDef<MenuRow>[] = [
    { key: 'name', header: 'Позиция', sortable: true, render: (r) => <span className="font-semibold text-park-text">{r.name}</span> },
    { key: 'categoryId', header: 'Категория', render: (r) => catName.get(r.categoryId) ?? '—' },
    { key: 'price', header: 'Цена', sortable: true, align: 'right', render: (r) => fmtMoney(r.price) },
    { key: 'cost', header: 'Себестоимость', sortable: true, align: 'right', render: (r) => (r.cost > 0 ? fmtMoney(Math.round(r.cost)) : <span className="text-warning">нет данных</span>) },
    { key: 'foodCost', header: 'Food cost', sortable: true, align: 'right', render: (r) => (r.foodCost === null ? '—' : <CusBadge color={foodCostColor(r.foodCost)}>{Math.round(r.foodCost)}%</CusBadge>) },
    { key: 'margin', header: 'Маржа', sortable: true, align: 'right', render: (r) => (r.cost > 0 ? fmtMoney(Math.round(r.margin)) : '—') },
    { key: 'qty', header: 'Продано', sortable: true, align: 'right', render: (r) => r.qty || '—' },
    { key: 'revenue', header: 'Выручка', sortable: true, align: 'right', render: (r) => (r.revenue ? fmtMoney(r.revenue) : '—') },
    { key: 'profit', header: 'Прибыль', sortable: true, align: 'right', render: (r) => (r.cost > 0 && r.qty ? <span className="font-semibold text-success">{fmtMoney(Math.round(r.profit))}</span> : '—') },
    { key: 'cls', header: 'Класс', render: (r) => (r.cls ? <CusBadge color={CLASS_COLOR[r.cls]}>{MENU_CLASS_LABEL[r.cls]}</CusBadge> : <span className="text-park-textMuted">—</span>) },
  ]

  function exportCsv() {
    downloadCsv(`menu-marzha_${period.from}_${period.to}.csv`, ['Позиция', 'Категория', 'Цена', 'Себестоимость', 'Food cost, %', 'Маржа', 'Продано', 'Выручка', 'Прибыль', 'Класс'],
      rows.map((r) => [r.name, catName.get(r.categoryId) ?? '', r.price, Math.round(r.cost), r.foodCost === null ? '' : r.foodCost.toFixed(1), Math.round(r.margin), r.qty, Math.round(r.revenue), Math.round(r.profit), r.cls ? MENU_CLASS_LABEL[r.cls] : '']))
  }

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Food cost" highlight="и маржа меню" subtitle="Сколько стоит и сколько приносит каждая позиция. Классы позиций помогают решить, что продвигать, что удешевить, а что убрать." />

      <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
        <CusStatCard icon={<LuPercent size={20} />} color="info" label="Средний food cost" value={analysis.avgFoodCost === null ? '—' : `${analysis.avgFoodCost.toFixed(1)}%`} />
        <CusStatCard icon={<LuStar size={20} />} color="success" label="Звёзд в меню" value={String(count('star'))} />
        <CusStatCard icon={<LuTriangleAlert size={20} />} color="danger" label="Собак (убрать?)" value={String(count('dog'))} />
        <CusStatCard icon={<LuTriangleAlert size={20} />} color="warning" label="Без себестоимости" value={String(noCost)} />
      </div>

      <CusCard>
        <CusCardHeader title="10 самых прибыльных позиций" subtitle="Прибыль = выручка − себестоимость проданного" />
        <div className="p-5">
          {top.length ? <CusChart type="bar" data={top} xKey="name" series={['Прибыль']} colors={['#3b82f6']} format={fmtCompact} height={280} /> : <p className="py-10 text-center text-sm text-park-textMuted">За период продаж с известной себестоимостью нет</p>}
        </div>
      </CusCard>

      <CusCard>
        <CusToolbar
          left={
            <>
              <PeriodFilter value={period} onChange={setPeriod} />
              <div className="w-52"><CusSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={[{ value: 'all', label: 'Все категории' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]} /></div>
            </>
          }
          right={
            <>
              <CusInput placeholder="Поиск позиции…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
              <CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} isDisabled={rows.length === 0} onClick={exportCsv}>Экспорт CSV</CusButton>
            </>
          }
        />
        <div className="flex flex-wrap items-center gap-1.5 border-t border-park-border px-4 py-2.5">
          <CusChip active={cls === 'all'} onClick={() => setCls('all')}>Все ({analysis.rows.length})</CusChip>
          {CLASSES.map((c) => <CusChip key={c} active={cls === c} onClick={() => setCls(c)}>{MENU_CLASS_LABEL[c]} ({count(c)})</CusChip>)}
          <CusInfoTip title="Классы позиций" className="ml-1">
            <p>Популярная — продана не менее чем на 70% от среднего по меню. Маржа высокая — не ниже средней, взвешенной по продажам.</p>
            {CLASSES.map((c) => <p key={c}><b className="text-park-text">{MENU_CLASS_LABEL[c]}.</b> {MENU_CLASS_HINT[c]}</p>)}
          </CusInfoTip>
        </div>
        <div className="overflow-x-auto"><CusTable data={rows} columns={columns} emptyText="Нет позиций по выбранным фильтрам" /></div>
        <div className="space-y-1 border-t border-park-border px-4 py-3 text-xs text-park-textMuted">
          <p>Позиций: {rows.length}. Себестоимость — по тех. картам и текущим средним ценам склада; модификаторы в расчёт не входят.</p>
          <p>Позиции без тех. карты или без цены сырья получают «нет данных» и в классы не попадают.</p>
        </div>
      </CusCard>
    </div>
  )
}
