import { useState } from 'react'
import type { ColumnDef } from '@/components/ui/table/CusTable'
import type { Production } from '@/types/warehouse.types'
import { fmtDate, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import DocStatusBadge from '../warehouse-common/components/DocStatusBadge'
import OpsDocList from '../warehouse-common/components/OpsDocList'
import { useProductions } from '../warehouse-common/hooks/useWarehouseOps'
import { useProducts } from '../warehouse-common/hooks/useWarehouse'
import ProductionEditor from './components/ProductionEditor'

/** Приготовление заготовок: сырьё списывается по тех. карте, готовая заготовка поступает на склад. */
export default function FeatureWarehouseProduction() {
  const { data: rows = [], isLoading } = useProductions()
  const { data: products = [] } = useProducts()
  const [editing, setEditing] = useState<number | null | undefined>(undefined)
  const name = (id: number) => products.find((p) => p.id === id)?.name ?? '—'

  const columns: ColumnDef<Production>[] = [
    { key: 'number', header: 'Номер', sortable: true, render: (p) => <span className="font-semibold text-park-text">{p.number}</span> },
    { key: 'date', header: 'Дата', sortable: true, render: (p) => fmtDate(p.date) },
    { key: 'lines', header: 'Что приготовили', render: (p) => p.lines.map((l) => `${name(l.productId)} — ${l.qty}`).join(', ') || '—' },
    { key: 'cost', header: 'Себестоимость, сум', align: 'right', render: (p) => (p.totalCost ? fmtMoney(p.totalCost) : '—') },
    { key: 'status', header: 'Статус', render: (p) => <DocStatusBadge status={p.status} /> },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      {editing === undefined ? (
        <>
          <PageHeader label="Склад" title="Приготовление" highlight="заготовок" subtitle="Бульон, тесто, зажарка: сырьё списывается по тех. карте, заготовка приходуется на склад по себестоимости партии." />
          <OpsDocList rows={rows} columns={columns} isLoading={isLoading} newLabel="Новый акт" onNew={() => setEditing(null)} onOpen={(p) => setEditing(p.id)} emptyText="Актов приготовления пока нет" />
        </>
      ) : (
        <ProductionEditor key={editing ?? 'new'} id={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
