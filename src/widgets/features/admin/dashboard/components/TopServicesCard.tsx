import { Link } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { fmtMoney } from '@/utils/format'
import type { TopRow } from '../types'

/** Какие услуги (массаж, парение, SPA) приносят больше всего. */
export default function TopServicesCard({ items }: { items: TopRow[] }) {
  const max = Math.max(1, ...items.map((i) => i.amount))
  return (
    <CusCard>
      <CusCardHeader title="Топ услуг" subtitle="Массаж, парение и SPA — по выручке за период" actions={<Link to="/reports/services" className="text-xs font-semibold text-primary hover:underline">Отчёт по услугам →</Link>} />
      <ul className="divide-y divide-park-border">
        {items.map((i, idx) => (
          <li key={i.name} className="px-5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-park-text"><span className="mr-2 text-park-textMuted">{idx + 1}.</span>{i.name}</p>
              <p className="shrink-0 text-sm font-semibold text-park-text">{fmtMoney(i.amount)}</p>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-park-bgHover"><div className="h-full rounded-full bg-secondary" style={{ width: `${(i.amount / max) * 100}%` }} /></div>
              <span className="w-16 shrink-0 text-right text-xs text-park-textMuted">{i.count} раз</span>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">За период услуг не оказывали</li>}
      </ul>
    </CusCard>
  )
}
