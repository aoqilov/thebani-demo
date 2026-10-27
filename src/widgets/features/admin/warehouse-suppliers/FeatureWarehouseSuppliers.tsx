import { useMemo, useState } from 'react'
import { LuPlus, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import type { Supplier } from '@/types/warehouse.types'
import { fmtDate, fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useDocs, useSuppliers } from '../warehouse-common/hooks/useWarehouse'
import { usePurchaseOrders } from '../warehouse-common/hooks/useWarehouseOps'
import ModalSupplier from './modals/ModalSupplier'

type Row = Supplier & { docs: number; total: number; lastDate: string | null; orders: number }

/** Справочник поставщиков: здесь они создаются, дальше выбираются в приходе и заказах. */
export default function FeatureWarehouseSuppliers() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const { data: income = [] } = useDocs('income')
  const { data: orders = [] } = usePurchaseOrders()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [open, setOpen] = useState(false)

  const rows: Row[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    return suppliers
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || (s.contact ?? '').toLowerCase().includes(q))
      .map((s) => {
        const mine = income.filter((d) => d.supplierId === s.id && d.status === 'posted')
        return {
          ...s,
          docs: mine.length,
          total: mine.reduce((sum, d) => sum + d.lines.reduce((a, l) => a + l.qty * l.price, 0), 0),
          lastDate: mine.map((d) => d.date).sort().at(-1) ?? null,
          orders: orders.filter((o) => o.supplierId === s.id).length,
        }
      })
  }, [suppliers, income, orders, search])

  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Поставщик', sortable: true, render: (s) => <span className="font-semibold text-park-text">{s.name}</span> },
    { key: 'phone', header: 'Телефон' },
    { key: 'contact', header: 'Контактное лицо', render: (s) => s.contact || <span className="text-park-textMuted">—</span> },
    { key: 'docs', header: 'Поставок', sortable: true, align: 'right' },
    { key: 'total', header: 'Закуплено, сум', sortable: true, align: 'right', render: (s) => (s.total ? fmtMoney(s.total) : '—') },
    { key: 'lastDate', header: 'Последняя поставка', render: (s) => (s.lastDate ? fmtDate(s.lastDate) : '—') },
    { key: 'orders', header: 'Заказов', align: 'right' },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Склад" title="Поставщики" subtitle="Здесь создаются поставщики. Дальше они выбираются в приходных накладных и заказах." />
      <CusCard>
        <CusToolbar
          left={<CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => { setEditing(null); setOpen(true) }}>Новый поставщик</CusButton>}
          right={<CusInput placeholder="Название, телефон, контакт…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />}
        />
        <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(s) => { setEditing(suppliers.find((x) => x.id === s.id) ?? null); setOpen(true) }} emptyText="Поставщиков пока нет" />
        <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Поставщиков: {rows.length}</div>
      </CusCard>
      <ModalSupplier open={open} onClose={() => setOpen(false)} supplier={editing} />
    </div>
  )
}
