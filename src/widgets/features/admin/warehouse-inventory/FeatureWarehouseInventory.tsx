import { useState } from 'react'
import type { ColumnDef } from '@/components/ui/table/CusTable'
import type { Inventory } from '@/types/warehouse.types'
import { fmtDate, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import DocStatusBadge from '../warehouse-common/components/DocStatusBadge'
import OpsDocList from '../warehouse-common/components/OpsDocList'
import { useInventories } from '../warehouse-common/hooks/useWarehouseOps'
import InventoryEditor from './components/InventoryEditor'

/** Инвентаризация: пересчёт остатков, разница оформляется документами склада. */
export default function FeatureWarehouseInventory() {
  const { data: rows = [], isLoading } = useInventories()
  // undefined — список; null — новая; number — существующая
  const [editing, setEditing] = useState<number | null | undefined>(undefined)

  const columns: ColumnDef<Inventory>[] = [
    { key: 'number', header: 'Номер', sortable: true, render: (i) => <span className="font-semibold text-park-text">{i.number}</span> },
    { key: 'date', header: 'Дата', sortable: true, render: (i) => fmtDate(i.date) },
    { key: 'comment', header: 'Комментарий', render: (i) => <span className="text-park-textMuted">{i.comment || '—'}</span> },
    { key: 'lines', header: 'Позиций', align: 'right', render: (i) => i.lines.length },
    {
      key: 'short', header: 'Недостача, сум', align: 'right',
      render: (i) => (i.status === 'posted' ? <span className="text-danger">{fmtMoney(i.lines.filter((l) => l.fact < l.expected).reduce((s, l) => s + (l.expected - l.fact) * l.cost, 0))}</span> : '—'),
    },
    {
      key: 'over', header: 'Излишек, сум', align: 'right',
      render: (i) => (i.status === 'posted' ? <span className="text-success">{fmtMoney(i.lines.filter((l) => l.fact > l.expected).reduce((s, l) => s + (l.fact - l.expected) * l.cost, 0))}</span> : '—'),
    },
    { key: 'status', header: 'Статус', render: (i) => <DocStatusBadge status={i.status} /> },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      {editing === undefined ? (
        <>
          <PageHeader label="Склад" title="Инвентаризация" subtitle="Пересчитайте остатки: недостача уйдёт в расход, излишек — в приход автоматически." />
          <OpsDocList rows={rows} columns={columns} isLoading={isLoading} newLabel="Новая инвентаризация" onNew={() => setEditing(null)} onOpen={(i) => setEditing(i.id)} emptyText="Инвентаризаций пока нет" />
        </>
      ) : (
        <InventoryEditor key={editing ?? 'new'} id={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
