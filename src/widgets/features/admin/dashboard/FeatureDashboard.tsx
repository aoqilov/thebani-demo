import { useState } from 'react'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import PeriodFilter, { defaultPeriod } from '@/widgets/shared-ui/PeriodFilter'
import ChartMethods from './charts/ChartMethods'
import ChartRevenue from './charts/ChartRevenue'
import ChartStructure from './charts/ChartStructure'
import ChartWeekly from './charts/ChartWeekly'
import AttentionCard from './components/AttentionCard'
import DashboardKpiRow, { DashboardPeriodKpiRow } from './components/DashboardKpiRow'
import TopItemsCard from './components/TopItemsCard'
import WarehouseCard from './components/WarehouseCard'
import { useDashboard } from './hooks/useDashboard'

export default function FeatureDashboard() {
  const [period, setPeriod] = useState(defaultPeriod)
  const d = useDashboard(period)
  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Обзор" title="Обзор" highlight="комплекса" subtitle="Данные обновляются по мере работы ресепшн, кухни, кассы и склада." />

      {/* Сейчас и сегодня */}
      <DashboardKpiRow kpi={d.kpi} />
      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[3fr_2fr]">
        <ChartRevenue data={d.hourly} />
        <AttentionCard items={d.attention} />
      </div>

      {/* За выбранный период */}
      <CusCard>
        <CusToolbar left={<><span className="mr-2 text-sm font-semibold text-park-text">Период</span><PeriodFilter value={period} onChange={setPeriod} /></>} />
      </CusCard>
      <DashboardPeriodKpiRow kpi2={d.kpi2} />
      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[3fr_2fr]">
        <ChartWeekly data={d.daily} />
        <ChartMethods data={d.methods} />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-2">
        <TopItemsCard items={d.topItems} />
        <ChartStructure data={d.structure} />
      </div>

      {/* Склад — всегда текущее состояние */}
      <WarehouseCard lowStock={d.lowStock} deliveries={d.deliveries} />
    </div>
  )
}
