import { Link } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { fmtMoney } from '@/utils/format'
import type { TopItem } from '../types'

/** Что лучше всего продаётся за неделю. */
export default function TopItemsCard({ items }: { items: TopItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.revenue))
  return (
    <CusCard>
      <CusCardHeader title="Топ-5 позиций" subtitle="По выручке за выбранный период" actions={<Link to="/reports/menu" className="text-xs font-semibold text-primary hover:underline">Food cost и маржа →</Link>} />
      <ul className="divide-y divide-park-border">
        {items.map((i, idx) => (
          <li key={i.id} className="px-5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-park-text"><span className="mr-2 text-park-textMuted">{idx + 1}.</span>{i.name}</p>
              <p className="shrink-0 text-sm font-semibold text-park-text">{fmtMoney(i.revenue)}</p>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-park-bgHover"><div className="h-full rounded-full bg-primary" style={{ width: `${(i.revenue / max) * 100}%` }} /></div>
              <span className="w-16 shrink-0 text-right text-xs text-park-textMuted">{i.qty} шт.</span>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">За период продаж блюд и напитков нет</li>}
      </ul>
    </CusCard>
  )
}
