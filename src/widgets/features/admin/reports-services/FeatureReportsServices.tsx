import { useMemo } from 'react'
import { LuBanknote, LuHandHelping, LuPercent } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { masterName } from '@/types/services.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useMasters, useServiceRecords } from '../services-list/hooks/useServices'

interface Row {
  id: number
  name: string
  count: number
  revenue: number
  pct: number
  payout: number
}

export default function FeatureReportsServices() {
  const { data: records = [] } = useServiceRecords()
  const { data: masters = [] } = useMasters()

  const rows: Row[] = useMemo(
    () => masters.map((m) => {
      const mine = records.filter((r) => r.charge.masterId === m.id)
      const revenue = mine.reduce((s, r) => s + r.charge.amount, 0)
      return { id: m.id, name: masterName(m), count: mine.length, revenue, pct: m.commissionPct, payout: Math.round((revenue * m.commissionPct) / 100) }
    }).filter((r) => r.count > 0 || masters.find((m) => m.id === r.id)?.active),
    [masters, records],
  )

  const total = rows.reduce((s, r) => s + r.revenue, 0)
  const payout = rows.reduce((s, r) => s + r.payout, 0)

  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Мастер', sortable: true, render: (r) => <span className="font-semibold text-park-text">{r.name}</span> },
    { key: 'count', header: 'Услуг', sortable: true, align: 'right' },
    { key: 'revenue', header: 'Выручка, сум', sortable: true, align: 'right', render: (r) => fmtMoney(r.revenue) },
    { key: 'pct', header: 'Процент', align: 'right', render: (r) => `${r.pct}%` },
    { key: 'payout', header: 'К выплате, сум', sortable: true, align: 'right', render: (r) => <span className="font-semibold text-success">{fmtMoney(r.payout)}</span> },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Услуги" highlight="мастеров" subtitle="Сколько услуг оказал каждый мастер, на какую сумму и сколько ему причитается." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <CusStatCard icon={<LuHandHelping size={24} />} label="Услуг оказано" value={records.length} color="info" />
        <CusStatCard icon={<LuBanknote size={24} />} label="Выручка, сум" value={fmtMoney(total)} color="primary" />
        <CusStatCard icon={<LuPercent size={24} />} label="К выплате мастерам, сум" value={fmtMoney(payout)} color="success" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_380px]">
        <CusCard>
          <CusCardHeader title="По мастерам" />
          <CusTable data={rows} columns={columns} emptyText="Услуг пока нет" />
        </CusCard>
        <CusCard>
          <CusCardHeader title="Выручка по мастерам" />
          <div className="p-5">
            <CusChart type="bar" data={rows.map((r) => ({ name: r.name.split(' ')[0], revenue: r.revenue }))} xKey="name" series={['revenue']} height={240} />
          </div>
        </CusCard>
      </div>
    </div>
  )
}
