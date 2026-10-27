import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'

export default function ChartRevenue({ data }: { data: { hour: string; revenue: number }[] }) {
  return (
    <CusCard>
      <CusCardHeader title="Выручка по часам" subtitle="Сегодня, по времени закрытия счёта" />
      <div className="p-5"><CusChart type="bar" data={data} xKey="hour" series={['revenue']} /></div>
    </CusCard>
  )
}
