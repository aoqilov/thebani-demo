import { useState } from 'react'
import { LuCircleAlert, LuCircleCheck, LuSquare, LuSquareCheck } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { cn } from '@/lib/cn'
import type { WarehouseLive } from '../hooks/useWarehouseLive'
import type { GuideUi } from '../steps'

interface Item {
  id: string
  title: string
  hint: string
  to: string
  /** true/false — проверено по данным; null — отмечается вручную */
  auto: boolean | null
}

function useManual(key: string): [Record<string, boolean>, (id: string) => void] {
  const [state, setState] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '{}') } catch { return {} }
  })
  const toggle = (id: string) => setState((s) => {
    const next = { ...s, [id]: !s[id] }
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* без сохранения */ }
    return next
  })
  return [state, toggle]
}

/** Чек-лист закрытия месяца: часть пунктов проверяется по данным, часть отмечается вручную. */
export default function MonthChecklist({ live, ui }: { live: WarehouseLive; ui: GuideUi }) {
  const navigate = useNavigate()
  const [manual, toggle] = useManual(`thebani_month_check_${live.monthStart}`)
  const c = ui.check
  const draftDocs = live.draftExpense + live.draftProductions

  const items: Item[] = [
    { id: 'income', title: c.income[0], hint: c.income[1](live.draftIncome), to: '/warehouse/income', auto: live.draftIncome === 0 },
    { id: 'orders', title: c.orders[0], hint: c.orders[1](live.ordersSent), to: '/warehouse/orders', auto: live.ordersSent === 0 },
    { id: 'docs', title: c.docs[0], hint: c.docs[1](draftDocs), to: '/warehouse/expense', auto: draftDocs === 0 },
    { id: 'inventory', title: c.inventory[0], hint: c.inventory[1](live.lastInventory), to: '/warehouse/inventory', auto: live.inventoryThisMonth },
    { id: 'loss', title: c.loss[0], hint: c.loss[1](live.monthLoss), to: '/warehouse/variance', auto: null },
    { id: 'report', title: c.report[0], hint: c.report[1], to: '/warehouse/turnover', auto: null },
  ]

  const done = (i: Item) => (i.auto === null ? !!manual[i.id] : i.auto)
  const total = items.filter(done).length
  const pct = Math.round((total / items.length) * 100)

  return (
    <CusCard>
      <CusCardHeader title={ui.monthTitle} subtitle={ui.monthSubtitle(total, items.length)} />
      <div className="px-5 pt-4">
        <div className="h-2 overflow-hidden rounded-full bg-park-bgHover"><div className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} /></div>
      </div>
      <ul className="divide-y divide-park-border">
        {items.map((it, i) => {
          const ok = done(it)
          return (
            <li key={it.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-5 text-center text-xs font-bold text-park-textMuted">{i + 1}</span>
              {it.auto === null ? (
                <button onClick={() => toggle(it.id)} aria-label="✓" className={ok ? 'text-success' : 'text-park-textMuted'}>{ok ? <LuSquareCheck size={22} /> : <LuSquare size={22} />}</button>
              ) : ok ? <LuCircleCheck size={22} className="text-success" /> : <LuCircleAlert size={22} className="text-warning" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-park-text">{it.title}</p>
                <p className="text-xs text-park-textMuted">{it.hint}{it.auto === null && ui.manualSuffix}</p>
              </div>
              <button onClick={() => navigate(it.to)} className="shrink-0 text-xs font-semibold text-primary hover:underline">{ui.open}</button>
            </li>
          )
        })}
      </ul>
    </CusCard>
  )
}
