import { LuBanknote, LuHandHelping, LuPercent } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useServiceRecords } from '../../admin/services-list/hooks/useServices'
import { useCurrentMaster } from '../hooks/useCurrentMaster'

const hhmm = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—')

export default function FeatureMasseurHistory() {
  const { master } = useCurrentMaster()
  const { data: records = [] } = useServiceRecords()

  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const mine = records.filter((r) => r.charge.masterId === master?.id && (r.charge.at ?? '') >= startOfDay)
  const revenue = mine.reduce((s, r) => s + r.charge.amount, 0)
  const share = Math.round((revenue * (master?.commissionPct ?? 0)) / 100)

  return (
    <div className="space-y-4">
      <PageHeader label="Массажист" title="Мои" highlight="услуги" subtitle={master ? `${master.firstname} ${master.lastname} · сегодня` : undefined} />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <CusStatCard icon={<LuHandHelping size={24} />} label="Услуг" value={mine.length} color="info" />
        <CusStatCard icon={<LuBanknote size={24} />} label="На сумму, сум" value={fmtMoney(revenue)} color="primary" />
        <CusStatCard icon={<LuPercent size={24} />} label={`Моя доля ${master?.commissionPct ?? 0}%`} value={fmtMoney(share)} color="success" />
      </div>

      <CusCard>
        <CusCardHeader title="Оказанные услуги" />
        <ul className="divide-y divide-park-border">
          {mine.length === 0 && <li className="p-8 text-center text-sm text-park-textMuted">Сегодня услуг ещё не было</li>}
          {mine.map((r) => (
            <li key={r.charge.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-park-text">{r.charge.title}</p>
                <p className="text-xs text-park-textMuted">{hhmm(r.charge.at)} · <span className="font-mono">{r.bracelet}</span></p>
              </div>
              <span className="text-sm font-bold text-park-text">{fmtMoney(r.charge.amount)}</span>
            </li>
          ))}
        </ul>
      </CusCard>
    </div>
  )
}
