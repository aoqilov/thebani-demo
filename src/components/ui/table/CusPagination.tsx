import { cn } from '@/lib/cn'

export function CusPagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (p: number) => void }) {
  const btn = 'h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition disabled:opacity-40'
  return (
    <nav className="flex items-center gap-1">
      <button className={cn(btn, 'hover:bg-park-bgHover')} disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)} className={cn(btn, p === page ? 'bg-primary text-white' : 'hover:bg-park-bgHover')}>{p}</button>
      ))}
      <button className={cn(btn, 'hover:bg-park-bgHover')} disabled={page === pageCount} onClick={() => onChange(page + 1)}>›</button>
    </nav>
  )
}
