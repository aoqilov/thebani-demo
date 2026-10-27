import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface BreadCrumbItem { label: string; to?: string }

export function CusBreadCrumb({ items, separator = '/' }: { items: BreadCrumbItem[]; separator?: ReactNode }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs text-park-textMuted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && separator}
          {it.to ? <Link to={it.to} className="hover:text-park-text">{it.label}</Link> : <span className="text-park-text3">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}
