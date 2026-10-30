import { LuBanknote, LuChefHat, LuPiggyBank, LuReceipt, LuTrendingUp, LuUsers, LuWallet } from 'react-icons/lu'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { cn } from '@/lib/cn'
import { fmtMoney } from '@/utils/format'
import type { DashboardKpi, DashboardKpi2 } from '../types'

/** Значение с мелкой пометкой под числом: изменение к вчера и т. п. */
function WithNote({ value, note, tone }: { value: string; note?: string; tone?: 'good' | 'bad' | 'muted' }) {
  return (
    <>
      {value}
      {note && <span className={cn('mt-0.5 block text-xs font-semibold', tone === 'good' ? 'text-success' : tone === 'bad' ? 'text-danger' : 'text-park-textMuted')}>{note}</span>}
    </>
  )
}

/** Что происходит прямо сейчас и сегодня. */
export default function DashboardKpiRow({ kpi }: { kpi: DashboardKpi }) {
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
      <CusStatCard icon={<LuUsers size={24} />} label="Гостей сейчас" value={kpi.guestsNow} color="info" />
      <CusStatCard icon={<LuWallet size={24} />} label="Открытых счетов" value={kpi.openOrders} color="primary" />
      <CusStatCard icon={<LuBanknote size={24} />} label="Выручка сегодня, сум" value={fmtMoney(kpi.revenueToday)} color="success" />
      <CusStatCard icon={<LuReceipt size={24} />} label="Чеков сегодня" value={kpi.checksToday} color="secondary" />
    </div>
  )
}

/** Деньги и эффективность за выбранный период. */
export function DashboardPeriodKpiRow({ kpi2 }: { kpi2: DashboardKpi2 }) {
  const delta = kpi2.avgCheckDelta
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
      <CusStatCard icon={<LuBanknote size={24} />} color="info" label="Выручка за период, сум" value={fmtMoney(kpi2.revenue)} />
      <CusStatCard
        icon={<LuTrendingUp size={24} />} color="primary" label="Средний чек, сум"
        value={<WithNote value={kpi2.avgCheck ? fmtMoney(kpi2.avgCheck) : '—'} note={delta === null ? 'в прошлом периоде чеков не было' : `${delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : ''}${delta.toFixed(0)}% к прошлому периоду`} tone={delta === null ? 'muted' : delta >= 0 ? 'good' : 'bad'} />}
      />
      <CusStatCard
        icon={<LuPiggyBank size={24} />} color={kpi2.netProfit >= 0 ? 'success' : 'danger'} label="Чистая прибыль, сум"
        value={<WithNote value={`${kpi2.netProfit < 0 ? '−' : ''}${fmtMoney(Math.abs(kpi2.netProfit))}`} note="с учётом расходов и налогов" tone="muted" />}
      />
      <CusStatCard
        icon={<LuChefHat size={24} />} color={kpi2.foodCost === null ? 'secondary' : kpi2.foodCost <= 30 ? 'success' : kpi2.foodCost <= 40 ? 'warning' : 'danger'} label="Food cost"
        value={kpi2.foodCost === null ? '—' : `${kpi2.foodCost.toFixed(1)}%`}
      />
    </div>
  )
}
