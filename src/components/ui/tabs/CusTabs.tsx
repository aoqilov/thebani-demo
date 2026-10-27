import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function CusTabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [i, setI] = useState(0)
  return (
    <div>
      <div className="flex gap-1 border-b border-park-border">
        {tabs.map((t, idx) => (
          <button
            key={t.label}
            onClick={() => setI(idx)}
            className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-semibold', idx === i ? 'border-primary text-primary' : 'border-transparent text-park-textMuted hover:text-park-text')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-4 text-sm">{tabs[i].content}</div>
    </div>
  )
}
