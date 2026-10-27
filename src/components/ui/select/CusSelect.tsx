import type { SelectHTMLAttributes } from 'react'

export interface SelectOption { value: string; label: string }

export function CusSelect({ label, options, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: SelectOption[] }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-semibold text-park-text3">{label}</span>}
      <select {...p} className="w-full rounded-lg border border-park-border bg-park-bgInput px-3 py-2 text-park-text outline-none focus:border-primary">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
