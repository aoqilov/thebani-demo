import type { InputHTMLAttributes } from 'react'

export function CusCheckbox({ label, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-park-text3">
      <input type="checkbox" {...p} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  )
}
