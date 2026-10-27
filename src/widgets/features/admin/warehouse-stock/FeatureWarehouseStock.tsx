import { useMemo, useState } from 'react'
import { LuTriangleAlert, LuBanknote, LuPackage, LuPackageX, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import type { Product, StockRow } from '@/types/warehouse.types'
import { fmtMoney, fmtQty } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { flattenGroups } from '../warehouse-products/modals/ModalProduct'
import { useGroups, useProducts, useStock } from '../warehouse-common/hooks/useWarehouse'
import StockMovementsDrawer from './components/StockMovementsDrawer'

type Level = 'ok' | 'low' | 'none'
type View = StockRow & { product: Product; level: Level; groupName: string }

const levelBadge = {
  ok: <CusBadge color="success">В норме</CusBadge>,
  low: <CusBadge color="warning">Мало</CusBadge>,
  none: <CusBadge color="danger">Нет</CusBadge>,
}

function descendants(groups: { id: number; parentId: number | null }[], id: number): number[] {
  return [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => descendants(groups, g.id))]
}

export default function FeatureWarehouseStock() {
  const { data: groups = [] } = useGroups()
  const { data: products = [] } = useProducts()
  const { data: stock = [], isLoading } = useStock()
  const [search, setSearch] = useState('')
  const [groupId, setGroupId] = useState('all')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [selected, setSelected] = useState<Product | null>(null)

  const all: View[] = useMemo(() => {
    const pm = new Map(products.map((p) => [p.id, p]))
    const gm = new Map(groups.map((g) => [g.id, g.name]))
    return stock
      .filter((s) => pm.get(s.productId)?.active && pm.get(s.productId)?.kind !== 'dish')
      .map((s) => {
        const product = pm.get(s.productId)!
        const lvl: Level = s.qty <= 0 ? 'none' : s.qty < product.minStock ? 'low' : 'ok'
        return { ...s, product, level: lvl, groupName: gm.get(product.groupId) ?? '—' }
      })
  }, [stock, products, groups])

  const rows = useMemo(() => {
    const ids = groupId === 'all' ? null : descendants(groups, Number(groupId))
    const q = search.trim().toLowerCase()
    return all.filter((r) => (!ids || ids.includes(r.product.groupId)) && (level === 'all' || r.level === level) && (!q || r.product.name.toLowerCase().includes(q)))
  }, [all, groups, groupId, level, search])

  const totalCost = all.reduce((s, r) => s + Math.max(r.sum, 0), 0)
  const lowCount = all.filter((r) => r.level === 'low').length
  const noneCount = all.filter((r) => r.level === 'none').length

  const columns: ColumnDef<View>[] = [
    { key: 'name', header: 'Наименование', sortable: true, render: (r) => <span className="font-semibold text-park-text">{r.product.name}</span> },
    { key: 'groupName', header: 'Группа', sortable: true },
    { key: 'unit', header: 'Ед.', width: 70, render: (r) => r.product.unit },
    {
      key: 'qty', header: 'Остаток', align: 'right', sortable: true,
      render: (r) => <span className={r.level === 'ok' ? '' : r.level === 'low' ? 'font-semibold text-warning' : 'font-semibold text-danger'}>{fmtQty(r.qty)}</span>,
    },
    { key: 'min', header: 'Минимум', align: 'right', render: (r) => <span className="text-park-textMuted">{fmtQty(r.product.minStock)}</span> },
    { key: 'avgCost', header: 'Себестоимость', align: 'right', sortable: true, render: (r) => fmtMoney(r.avgCost) },
    { key: 'sum', header: 'Сумма, сум', align: 'right', sortable: true, render: (r) => fmtMoney(Math.max(r.sum, 0)) },
    { key: 'level', header: 'Статус', render: (r) => levelBadge[r.level] },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Склад" title="Остатки" highlight="на складе" subtitle="Текущие остатки по проведённым документам. Нажмите на строку, чтобы увидеть движение товара." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <CusStatCard icon={<LuPackage size={24} />} label="Позиций на складе" value={all.filter((r) => r.qty > 0).length} color="info" />
        <CusStatCard icon={<LuBanknote size={24} />} label="Стоимость склада, сум" value={fmtMoney(totalCost)} color="primary" />
        <CusStatCard icon={<LuTriangleAlert size={24} />} label="Ниже минимума" value={lowCount} color="warning" />
        <CusStatCard icon={<LuPackageX size={24} />} label="Нет в наличии" value={noneCount} color="danger" />
      </div>

      <CusCard>
        <CusToolbar
          left={
            <>
              <div className="w-56"><CusSelect value={groupId} onChange={(e) => setGroupId(e.target.value)} options={[{ value: 'all', label: 'Все группы' }, ...flattenGroups(groups)]} /></div>
              <div className="ml-1 flex gap-1.5">
                <CusChip active={level === 'all'} onClick={() => setLevel('all')}>Все</CusChip>
                <CusChip active={level === 'low'} onClick={() => setLevel('low')}>Мало</CusChip>
                <CusChip active={level === 'none'} onClick={() => setLevel('none')}>Нет</CusChip>
              </div>
            </>
          }
          right={<CusInput placeholder="Поиск товара…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />}
        />
        <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(r) => setSelected(r.product)} />
        <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Позиций: {rows.length}</div>
      </CusCard>

      <StockMovementsDrawer product={selected} stock={stock.find((s) => s.productId === selected?.id)} onClose={() => setSelected(null)} />
    </div>
  )
}
