import { useMemo, useState } from 'react'
import { LuPlus, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import type { DocStatus, DocType, WarehouseDoc } from '@/types/warehouse.types'
import { fmtDate, fmtMoney } from '@/utils/format'
import { useDocs, useMovements, useSuppliers } from '../hooks/useWarehouse'
import DocStatusBadge from './DocStatusBadge'

type Row = WarehouseDoc & { total: number | null; party: string }

export default function DocumentsList({ type, onOpen }: { type: DocType; onOpen: (id: number | null) => void }) {
  const { data: docs = [], isLoading } = useDocs(type)
  const { data: suppliers = [] } = useSuppliers()
  const { data: movements = [] } = useMovements()
  const [status, setStatus] = useState<DocStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const rows: Row[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs
      .map((d) => {
        const total = d.type === 'income'
          ? d.lines.reduce((s, l) => s + l.qty * l.price, 0)
          : d.status === 'posted' ? Math.abs(movements.filter((m) => m.docId === d.id).reduce((s, m) => s + m.sum, 0)) : null
        const party = d.type === 'income' ? (suppliers.find((s) => s.id === d.supplierId)?.name ?? '—') : d.reason || '—'
        return { ...d, total, party }
      })
      .filter((r) => (status === 'all' || r.status === status) && (!q || r.number.toLowerCase().includes(q) || r.party.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)))
  }, [docs, suppliers, movements, status, search])

  const columns: ColumnDef<Row>[] = [
    { key: 'number', header: 'Номер', sortable: true, render: (r) => <span className="font-semibold text-park-text">{r.number}</span> },
    { key: 'date', header: 'Дата', sortable: true, render: (r) => fmtDate(r.date) },
    { key: 'party', header: type === 'income' ? 'Поставщик' : 'Причина', sortable: true },
    { key: 'comment', header: 'Комментарий', render: (r) => <span className="text-park-textMuted">{r.comment || '—'}</span> },
    { key: 'lines', header: 'Позиций', align: 'right', render: (r) => r.lines.length },
    { key: 'total', header: 'Сумма, сум', align: 'right', sortable: true, render: (r) => (r.total === null ? '—' : fmtMoney(r.total)) },
    { key: 'status', header: 'Статус', render: (r) => <DocStatusBadge status={r.status} /> },
  ]

  const sum = rows.reduce((s, r) => s + (r.total ?? 0), 0)

  return (
    <CusCard>
      <CusToolbar
        left={
          <>
            <CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => onOpen(null)}>
              {type === 'income' ? 'Новая накладная' : 'Новое списание'}
            </CusButton>
            <div className="ml-2 flex gap-1.5">
              <CusChip active={status === 'all'} onClick={() => setStatus('all')}>Все</CusChip>
              <CusChip active={status === 'draft'} onClick={() => setStatus('draft')}>Черновики</CusChip>
              <CusChip active={status === 'posted'} onClick={() => setStatus('posted')}>Проведённые</CusChip>
            </div>
          </>
        }
        right={<CusInput placeholder="Номер, поставщик, комментарий…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />}
      />
      <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(r) => onOpen(r.id)} />
      <div className="flex items-center justify-between border-t border-park-border px-4 py-2.5 text-sm">
        <span className="text-park-textMuted">Документов: {rows.length}</span>
        <span className="text-park-text">Итого: <b>{fmtMoney(sum)}</b> сум</span>
      </div>
    </CusCard>
  )
}
