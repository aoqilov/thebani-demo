import type { ReactNode } from 'react'
import { LuPlus } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'

interface Props<T extends { id: number }> {
  rows: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  newLabel: string
  onNew: () => void
  onOpen: (row: T) => void
  /** Дополнительные элементы тулбара справа */
  right?: ReactNode
  emptyText?: string
}

/** Список документов склада: кнопка создания + кликабельная таблица. */
export default function OpsDocList<T extends { id: number }>({ rows, columns, isLoading, newLabel, onNew, onOpen, right, emptyText }: Props<T>) {
  return (
    <CusCard>
      <CusToolbar left={<CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={onNew}>{newLabel}</CusButton>} right={right} />
      <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={onOpen} emptyText={emptyText} />
      <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Документов: {rows.length}</div>
    </CusCard>
  )
}
