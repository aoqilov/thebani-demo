import { useMemo, useState } from 'react'
import { LuBadgePercent, LuBanknote, LuReceipt, LuTrendingUp } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { STRUCTURE_LABEL, byHour, closedToday, methodTotals, structure, sum, topItems, type ItemStat, type Structure } from '@/data/analytics'
import { itemState } from '@/data/menu.calc'
import { foodCostColor } from '@/data/recipe.calc'
import { PAY_METHOD_LABEL, type PayMethod } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useClosedOrders } from '../../cashier/hooks/useCashier'
import { useMenuItems } from '../menu/hooks/useMenu'
import { useCostCtx } from '../warehouse-recipes/components/useCostCtx'

type Row = ItemStat & { id: number; cost: number; foodCost: number | null }

export default function FeatureReportsFinance() {
  const { data: closed = [] } = useClosedOrders()
  const { data: menu = [] } = useMenuItems()
  const { ctx } = useCostCtx()
  const [period, setPeriod] = useState<'today' | 'all'>('today')

  const orders = useMemo(() => (period === 'today' ? closedToday(closed) : closed.filter((o) => o.payment)), [closed, period])

  const revenue = sum(orders, (o) => o.payment!.total)
  const discounts = sum(orders, (o) => o.payment!.discount)
  const service = sum(orders, (o) => o.payment!.service)
  const struct = structure(orders)
  const methods = methodTotals(orders)

  const items: Row[] = useMemo(() => topItems(orders).map((s) => {
    const m = menu.find((x) => x.id === s.menuItemId)
    const cost = m ? itemState(m, ctx).cost * s.qty : 0
    return { ...s, id: s.menuItemId, cost, foodCost: cost > 0 && s.revenue > 0 ? (cost / s.revenue) * 100 : null }
  }), [orders, menu, ctx])

  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Позиция', sortable: true, render: (r) => <span className="font-semibold text-park-text">{r.name}</span> },
    { key: 'qty', header: 'Продано', sortable: true, align: 'right' },
    { key: 'revenue', header: 'Выручка, сум', sortable: true, align: 'right', render: (r) => fmtMoney(r.revenue) },
    { key: 'cost', header: 'Себестоимость', align: 'right', render: (r) => <span className="text-park-textMuted">{r.cost > 0 ? fmtMoney(r.cost) : '—'}</span> },
    { key: 'foodCost', header: 'Food cost', align: 'right', render: (r) => (r.foodCost === null ? '—' : <CusBadge color={foodCostColor(r.foodCost)}>{Math.round(r.foodCost)}%</CusBadge>) },
    { key: 'margin', header: 'Маржа, сум', align: 'right', render: (r) => (r.cost > 0 ? <span className="font-semibold text-success">{fmtMoney(r.revenue - r.cost)}</span> : '—') },
  ]

  const structRows = (Object.keys(struct) as (keyof Structure)[]).map((k) => ({ name: STRUCTURE_LABEL[k], value: struct[k] })).filter((r) => r.value > 0)
  const methodRows = (Object.keys(methods) as PayMethod[]).map((m) => ({ name: PAY_METHOD_LABEL[m], value: methods[m] })).filter((r) => r.value > 0)

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Финансы" highlight="и продажи" subtitle="Выручка, структура, способы оплаты и рентабельность позиций (по тех. картам)." />

      <div className="flex gap-1.5">
        <CusChip active={period === 'today'} onClick={() => setPeriod('today')}>Сегодня</CusChip>
        <CusChip active={period === 'all'} onClick={() => setPeriod('all')}>Всё время</CusChip>
      </div>

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <CusStatCard icon={<LuBanknote size={24} />} label="Выручка, сум" value={fmtMoney(revenue)} color="success" />
        <CusStatCard icon={<LuReceipt size={24} />} label="Чеков" value={orders.length} color="primary" />
        <CusStatCard icon={<LuTrendingUp size={24} />} label="Средний чек, сум" value={fmtMoney(orders.length ? revenue / orders.length : 0)} color="info" />
        <CusStatCard icon={<LuBadgePercent size={24} />} label="Скидки / обслуживание, сум" value={`${fmtMoney(discounts)} / ${fmtMoney(service)}`} color="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
        <CusCard className="desktop:col-span-2">
          <CusCardHeader title="Выручка по часам" />
          <div className="p-5"><CusChart type="bar" data={byHour(orders)} xKey="hour" series={['revenue']} /></div>
        </CusCard>
        <CusCard>
          <CusCardHeader title="Структура выручки" />
          <div className="p-5">
            {structRows.length ? <CusChart type="pie" data={structRows} xKey="name" series={['value']} height={200} /> : <p className="py-12 text-center text-sm text-park-textMuted">Нет данных</p>}
            <ul className="mt-2 space-y-1 text-sm">{structRows.map((r) => <li key={r.name} className="flex justify-between"><span className="text-park-textMuted">{r.name}</span><span className="font-semibold text-park-text">{fmtMoney(r.value)}</span></li>)}</ul>
          </div>
        </CusCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_320px]">
        <CusCard>
          <CusCardHeader title="Продажи по позициям" subtitle="Себестоимость считается по тех. картам и средней цене склада" />
          <CusTable data={items} columns={columns} emptyText="Продаж пока нет" />
        </CusCard>
        <CusCard>
          <CusCardHeader title="Способы оплаты" />
          <ul className="divide-y divide-park-border">
            {methodRows.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">Нет данных</li>}
            {methodRows.map((r) => <li key={r.name} className="flex items-center justify-between px-5 py-3 text-sm"><span className="text-park-text3">{r.name}</span><span className="font-semibold text-park-text">{fmtMoney(r.value)}</span></li>)}
          </ul>
        </CusCard>
      </div>
    </div>
  )
}
