import { useState } from 'react'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import type { ColumnDef } from '@/components/ui/table/CusTable'
import { PURCHASE_STATUS_LABEL, type PurchaseOrder } from '@/types/warehouse.types'
import { fmtDate, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import OpsDocList from '../warehouse-common/components/OpsDocList'
import { useSuppliers } from '../warehouse-common/hooks/useWarehouse'
import { usePurchaseOrders } from '../warehouse-common/hooks/useWarehouseOps'
import OrderEditor from './components/OrderEditor'

/** Заказы поставщикам: предложение по остаткам → отправка → приёмка (создаёт приходную накладную). */
export default function FeatureWarehouseOrders() {
  const { data: rows = [], isLoading } = usePurchaseOrders()
  const { data: suppliers = [] } = useSuppliers()
  const [editing, setEditing] = useState<number | null | undefined>(undefined)

  const columns: ColumnDef<PurchaseOrder>[] = [
    { key: 'number', header: 'Номер', sortable: true, render: (o) => <span className="font-semibold text-park-text">{o.number}</span> },
    { key: 'date', header: 'Дата', sortable: true, render: (o) => fmtDate(o.date) },
    { key: 'supplier', header: 'Поставщик', render: (o) => suppliers.find((s) => s.id === o.supplierId)?.name ?? '—' },
    { key: 'lines', header: 'Позиций', align: 'right', render: (o) => o.lines.length },
    { key: 'sum', header: 'Сумма, сум', align: 'right', render: (o) => fmtMoney(o.lines.reduce((s, l) => s + l.qty * l.price, 0)) },
    { key: 'status', header: 'Статус', render: (o) => <CusBadge color={o.status === 'received' ? 'success' : o.status === 'sent' ? 'info' : 'warning'}>{PURCHASE_STATUS_LABEL[o.status]}</CusBadge> },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      {editing === undefined ? (
        <>
          <PageHeader label="Склад" title="Заказы" highlight="поставщикам" subtitle="Система предлагает заказать то, что ниже минимального остатка. После приёмки остатки пополняются автоматически." />
          <OpsDocList rows={rows} columns={columns} isLoading={isLoading} newLabel="Новый заказ" onNew={() => setEditing(null)} onOpen={(o) => setEditing(o.id)} emptyText="Заказов пока нет" />
        </>
      ) : (
        <OrderEditor key={editing ?? 'new'} id={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
