import PageHeader from '@/widgets/shared-ui/PageHeader'
import ChartRevenue from './charts/ChartRevenue'
import ChartStructure from './charts/ChartStructure'
import AttentionCard from './components/AttentionCard'
import DashboardKpiRow from './components/DashboardKpiRow'
import { useDashboard } from './hooks/useDashboard'

export default function FeatureDashboard() {
  const d = useDashboard()
  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Обзор" title="Обзор" highlight="комплекса" subtitle="Данные обновляются по мере работы ресепшн, кухни, кассы и склада." />
      <DashboardKpiRow kpi={d.kpi} />
      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[3fr_2fr]">
        <ChartRevenue data={d.hourly} />
        <AttentionCard items={d.attention} />
      </div>
      <ChartStructure data={d.structure} />
    </div>
  )
}
