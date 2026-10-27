import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function CusTextArea({ label, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-semibold text-park-text3">{label}</span>}
      <textarea {...p} rows={p.rows ?? 3} className={cn('w-full rounded-lg border border-park-border bg-park-bgInput px-3 py-2 text-park-text outline-none focus:border-primary', className)} />
    </label>
  )
}
