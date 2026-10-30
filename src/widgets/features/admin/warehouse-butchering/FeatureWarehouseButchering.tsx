import { useState } from 'react'
import type { ColumnDef } from '@/components/ui/table/CusTable'
import type { Butchering } from '@/types/warehouse.types'
import { fmtDate, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import DocStatusBadge from '../warehouse-common/components/DocStatusBadge'
import OpsDocList from '../warehouse-common/components/OpsDocList'
import { useButcherings } from '../warehouse-common/hooks/useWarehouseOps'
import { useProducts } from '../warehouse-common/hooks/useWarehouse'
import ButcheringEditor from './components/ButcheringEditor'

/** Разделка: одно сырьё (тушка) даёт несколько продуктов (филе, кости, крылья), себестоимость делится по долям. */
export default function FeatureWarehouseButchering() {
  const { data: rows = [], isLoading } = useButcherings()
  const { data: products = [] } = useProducts()
  const [editing, setEditing] = useState<number | null | undefined>(undefined)
  const name = (id: number) => products.find((p) => p.id === id)?.name ?? '—'

  const columns: ColumnDef<Butchering>[] = [
    { key: 'number', header: 'Номер', sortable: true, render: (b) => <span className="font-semibold text-park-text">{b.number}</span> },
    { key: 'date', header: 'Дата', sortable: true, render: (b) => fmtDate(b.date) },
    { key: 'input', header: 'Сырьё', render: (b) => (b.inputProductId ? `${name(b.inputProductId)} — ${b.inputQty}` : '—') },
    { key: 'outputs', header: 'Получили', render: (b) => b.outputs.map((o) => `${name(o.productId)} — ${o.qty}`).join(', ') || '—' },
    { key: 'cost', header: 'Себестоимость сырья, сум', align: 'right', render: (b) => (b.totalCost ? fmtMoney(b.totalCost) : '—') },
    { key: 'status', header: 'Статус', render: (b) => <DocStatusBadge status={b.status} /> },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      {editing === undefined ? (
        <>
          <PageHeader label="Склад" title="Разделка" highlight="сырья" subtitle="Тушка → филе, кости, крылья: сырьё списывается, продукты приходуются по долям себестоимости (в %). Остаток до 100% — отход." />
          <OpsDocList rows={rows} columns={columns} isLoading={isLoading} newLabel="Новый акт" onNew={() => setEditing(null)} onOpen={(b) => setEditing(b.id)} emptyText="Актов разделки пока нет" />
        </>
      ) : (
        <ButcheringEditor key={editing ?? 'new'} id={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
