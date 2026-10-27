import { useState, type ReactNode } from 'react'
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from 'react-icons/lu'
import { useTranslation } from '@/i18n/languageConfig'
import { cn, solid } from '@/lib/cn'
import type { CusColor } from '@/types/common.types'

export interface ColumnDef<T> {
  key: string
  header: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (row: T, index: number) => ReactNode
}

interface CusTableProps<T extends { id: number }> {
  data: T[]
  columns: ColumnDef<T>[]
  striped?: boolean
  interactive?: boolean
  bordered?: boolean
  stickyHeader?: boolean
  headColor?: CusColor
  isLoading?: boolean
  emptyText?: string
  maxH?: string
  onRowClick?: (row: T, index: number) => void
}

type SortDir = 'asc' | 'desc' | null

export function CusTable<T extends { id: number }>({
  data, columns, striped, interactive, bordered, stickyHeader, headColor, isLoading, emptyText, maxH, onRowClick,
}: CusTableProps<T>) {
  const { t } = useTranslation('common.')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const rows = sortKey && sortDir
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey] as string | number
        const bv = (b as Record<string, unknown>)[sortKey] as string | number
        return (av > bv ? 1 : av < bv ? -1 : 0) * (sortDir === 'asc' ? 1 : -1)
      })
    : data

  function toggleSort(key: string) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return }
    if (sortDir === 'asc') setSortDir('desc')
    else { setSortKey(null); setSortDir(null) }
  }

  const cell = bordered ? 'border border-park-border' : ''
  return (
    <div className="overflow-x-auto" style={{ maxHeight: maxH }}>
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className={cn(stickyHeader && 'sticky top-0 z-10', headColor ? solid[headColor] : 'bg-park-bgHover text-park-text')}>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width, textAlign: c.align }}
                className={cn('px-4 py-3 font-semibold', cell, c.sortable && 'cursor-pointer select-none')}
                onClick={() => c.sortable && toggleSort(c.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {c.header}
                  {c.sortable && (sortKey === c.key ? (sortDir === 'asc' ? <LuArrowUp size={12} /> : <LuArrowDown size={12} />) : <LuArrowUpDown size={12} className="opacity-40" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={columns.length} className="py-8 text-center text-park-textMuted">…</td></tr>}
          {!isLoading && !rows.length && <tr><td colSpan={columns.length} className="py-8 text-center text-park-textMuted">{emptyText ?? t('tableEmptyText')}</td></tr>}
          {!isLoading && rows.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row, i)}
              className={cn('border-b border-park-border', striped && i % 2 === 1 && 'bg-park-bgHover/50', (interactive || onRowClick) && 'cursor-pointer hover:bg-park-bgHover')}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }} className={cn('px-4 py-3', cell)}>
                  {c.render ? c.render(row, i) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
