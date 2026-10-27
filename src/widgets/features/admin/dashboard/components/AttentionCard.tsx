import { Link } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { cn } from '@/lib/cn'
import type { AttentionItem } from '../types'

const dot: Record<AttentionItem['tone'], string> = { danger: 'bg-danger', warning: 'bg-warning', info: 'bg-info', success: 'bg-success' }

/** Что требует внимания администратора прямо сейчас. */
export default function AttentionCard({ items }: { items: AttentionItem[] }) {
  return (
    <CusCard>
      <CusCardHeader title="Требует внимания" subtitle="Обновляется автоматически" />
      <ul className="divide-y divide-park-border">
        {items.map((a) => (
          <li key={a.id}>
            <Link to={a.to} className="flex items-center gap-3 px-5 py-3 transition hover:bg-park-bgHover">
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dot[a.tone])} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-park-text">{a.title}</p>
                <p className="text-xs text-park-textMuted">{a.hint}</p>
              </div>
            </Link>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">Всё в порядке</li>}
      </ul>
    </CusCard>
  )
}
