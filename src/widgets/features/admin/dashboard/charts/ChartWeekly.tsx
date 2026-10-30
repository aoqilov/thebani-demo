import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { fmtCompact } from '@/utils/format'

// Цвета проверены скриптом validate_palette (светлая и тёмная тема)
const COLORS = ['#3b82f6', '#16a34a']

export default function ChartWeekly({ data }: { data: { day: string; Выручка: number; 'Валовая прибыль': number }[] }) {
  return (
    <CusCard>
      <CusCardHeader title="Динамика по дням" subtitle="Выручка и валовая прибыль (до операционных расходов)" />
      <div className="p-5"><CusChart type="line" data={data} xKey="day" series={['Выручка', 'Валовая прибыль']} colors={COLORS} format={fmtCompact} /></div>
    </CusCard>
  )
}
