import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAvatar } from '@/components/ui/avatar/CusAvatar'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { cn } from '@/lib/cn'
import { fmtMoney } from '@/utils/format'
import type { DashboardData } from '../types'

type Tab = keyof DashboardData['topStaff']

const TABS: { key: Tab; label: string; unit: string; metric: string }[] = [
  { key: 'waiters', label: 'Официанты', unit: 'счетов', metric: 'продажи' },
  { key: 'cashiers', label: 'Кассиры', unit: 'чеков', metric: 'принято' },
  { key: 'masters', label: 'Мастера', unit: 'услуг', metric: 'выручка' },
]

const medal = ['bg-warning text-white', 'bg-park-border2 text-white', 'bg-secondary/70 text-white']

/** Лучшие сотрудники периода: официанты, кассиры и мастера. */
export default function TopStaffCard({ data }: { data: DashboardData['topStaff'] }) {
  const [tab, setTab] = useState<Tab>('waiters')
  const cfg = TABS.find((t) => t.key === tab)!
  const rows = data[tab]
  const max = Math.max(1, ...rows.map((r) => r.amount))

  return (
    <CusCard>
      <CusCardHeader title="Топ сотрудников" subtitle={`По сумме: ${cfg.metric}, за выбранный период`} actions={<Link to="/reports/staff" className="text-xs font-semibold text-primary hover:underline">Подробнее →</Link>} />
      <div className="flex gap-1.5 border-b border-park-border px-5 py-3">
        {TABS.map((t) => <CusChip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</CusChip>)}
      </div>
      <ul className="divide-y divide-park-border">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center gap-3 px-5 py-3">
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', medal[i] ?? 'bg-park-bgHover text-park-textMuted')}>{i + 1}</span>
            <CusAvatar name={r.name} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold text-park-text">{r.name}</p>
                <p className="shrink-0 text-sm font-semibold text-park-text">{fmtMoney(r.amount)}</p>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-park-bgHover"><div className="h-full rounded-full bg-success" style={{ width: `${(r.amount / max) * 100}%` }} /></div>
                <span className="w-20 shrink-0 text-right text-xs text-park-textMuted">{r.count} {cfg.unit}</span>
              </div>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">За период данных нет</li>}
      </ul>
    </CusCard>
  )
}
