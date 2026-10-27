import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { STRUCTURE_LABEL, type Structure } from '@/data/analytics'

export default function ChartStructure({ data }: { data: Structure }) {
  const rows = (Object.keys(data) as (keyof Structure)[]).map((k) => ({ name: STRUCTURE_LABEL[k], value: data[k] })).filter((r) => r.value > 0)
  return (
    <CusCard>
      <CusCardHeader title="Структура выручки" subtitle="Тарифы, услуги, кухня, бар" />
      <div className="p-5">
        {rows.length ? <CusChart type="pie" data={rows} xKey="name" series={['value']} /> : <p className="py-16 text-center text-sm text-park-textMuted">Сегодня ещё нет закрытых счетов</p>}
      </div>
    </CusCard>
  )
}
