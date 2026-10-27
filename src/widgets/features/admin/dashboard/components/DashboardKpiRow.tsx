import { LuBanknote, LuReceipt, LuUsers, LuWallet } from 'react-icons/lu'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { fmtMoney } from '@/utils/format'
import type { DashboardKpi } from '../types'

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
