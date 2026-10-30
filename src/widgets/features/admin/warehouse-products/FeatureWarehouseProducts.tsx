import { useMemo, useState } from 'react'
import { LuFolderPlus, LuPencil, LuPlus, LuSearch, LuTriangleAlert } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { CusTreeView, type TreeNode } from '@/components/ui/tree/CusTreeView'
import { recipeStats, unitCost } from '@/data/recipe.calc'
import { PRODUCT_KIND_LABEL, type Product, type ProductGroup, type ProductKind } from '@/types/warehouse.types'
import { fmtMoney, fmtQty } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useGroups, useProducts } from '../warehouse-common/hooks/useWarehouse'
import { useCostCtx } from '../warehouse-recipes/components/useCostCtx'
import ModalGroup from './modals/ModalGroup'
import ModalProduct from './modals/ModalProduct'

const ALL = 'all'

function descendants(groups: ProductGroup[], id: number): number[] {
  return [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => descendants(groups, g.id))]
}

export default function FeatureWarehouseProducts() {
  const { data: groups = [] } = useGroups()
  const { data: allProducts = [], isLoading } = useProducts()
  const { ctx } = useCostCtx()
  const [selected, setSelected] = useState<number | string>(ALL)
  const [kind, setKind] = useState<ProductKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [copyOf, setCopyOf] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [groupModal, setGroupModal] = useState<{ group: ProductGroup | null } | null>(null)

  const products = useMemo(() => allProducts.filter((p) => showDeleted || !p.deleted), [allProducts, showDeleted])
  const deletedCount = useMemo(() => allProducts.filter((p) => p.deleted).length, [allProducts])

  const tree: TreeNode[] = useMemo(() => {
    const build = (parentId: number | null): TreeNode[] =>
      groups.filter((g) => g.parentId === parentId).map((g) => ({
        id: g.id,
        label: g.name,
        count: products.filter((p) => descendants(groups, g.id).includes(p.groupId)).length,
        children: build(g.id),
      }))
    return [{ id: ALL, label: 'Вся номенклатура', count: products.length, children: build(null) }]
  }, [groups, products])

  const groupName = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups])

  const rows = useMemo(() => {
    const ids = selected === ALL ? null : descendants(groups, Number(selected))
    const q = search.trim().toLowerCase()
    return products.filter((p) => (!ids || ids.includes(p.groupId)) && (kind === 'all' || p.kind === kind) && (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)))
  }, [products, groups, selected, kind, search])

  /** Себестоимость единицы: по тех. карте для блюд и заготовок, средняя по складу для товаров. */
  const costOf = (p: Product) => {
    const r = ctx.recipes.get(p.id)
    return r ? recipeStats(r, p.price, ctx).perUnit : unitCost(p.id, ctx)
  }

  const missingCards = useMemo(() => rows.filter((p) => !p.deleted && p.kind !== 'goods' && !ctx.recipes.has(p.id)).length, [rows, ctx])

  const columns: ColumnDef<Product>[] = [
    { key: 'code', header: 'Код', sortable: true, width: 100, render: (p) => <span className="font-mono text-xs text-park-textMuted">{p.code}</span> },
    {
      key: 'name', header: 'Наименование', sortable: true,
      render: (p) => (
        <span className={p.deleted ? 'font-semibold text-park-textMuted line-through' : 'font-semibold text-park-text'}>
          {p.name}
          {!p.deleted && p.kind !== 'goods' && !ctx.recipes.has(p.id) && <LuTriangleAlert size={14} className="ml-1.5 inline text-warning" aria-label="Нет тех. карты" />}
        </span>
      ),
    },
    { key: 'groupId', header: 'Группа', render: (p) => groupName.get(p.groupId) ?? '—' },
    { key: 'unit', header: 'Ед.', width: 70 },
    { key: 'minStock', header: 'Мин. остаток / цена', align: 'right', render: (p) => (p.kind === 'dish' ? `${fmtMoney(p.price)} сум` : fmtQty(p.minStock)) },
    { key: 'cost', header: 'Себестоимость', align: 'right', render: (p) => { const c = costOf(p); return c > 0 ? fmtMoney(Math.round(c)) : '—' } },
    { key: 'markup', header: 'Наценка, %', align: 'right', render: (p) => { const c = costOf(p); return p.kind === 'dish' && p.price > 0 && c > 0 ? `${Math.round(((p.price - c) / c) * 100)}%` : '—' } },
    { key: 'output', header: 'Выход', align: 'right', render: (p) => { const r = ctx.recipes.get(p.id); return r ? `${fmtQty(r.outputQty)} ${p.unit}` : '—' } },
    { key: 'kind', header: 'Тип', render: (p) => <CusBadge color={p.kind === 'prep' ? 'secondary' : p.kind === 'dish' ? 'success' : 'info'}>{PRODUCT_KIND_LABEL[p.kind]}</CusBadge> },
    { key: 'active', header: 'Статус', render: (p) => (p.deleted ? <CusBadge color="danger">Удалён</CusBadge> : p.active ? <CusBadge color="success">Активен</CusBadge> : <CusBadge color="dark">Скрыт</CusBadge>) },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Склад" title="Номенклатура" highlight="и товары" subtitle="Справочник товаров и заготовок с группами и единицами измерения." />

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[280px_1fr]">
        <CusCard>
          <CusCardHeader
            title="Группы"
            actions={
              <div className="flex gap-1">
                {selected !== ALL && (
                  <button onClick={() => setGroupModal({ group: groups.find((g) => g.id === Number(selected)) ?? null })} className="rounded-md p-2 text-park-textMuted hover:bg-park-bgHover" aria-label="Изменить группу" title="Изменить выбранную группу"><LuPencil size={15} /></button>
                )}
                <button onClick={() => setGroupModal({ group: null })} className="rounded-md p-2 text-park-textMuted hover:bg-park-bgHover" aria-label="Новая группа" title={selected === ALL ? 'Новая группа' : 'Новая подгруппа в выбранной'}><LuFolderPlus size={16} /></button>
              </div>
            }
          />
          <div className="max-h-[560px] overflow-y-auto p-2">
            <CusTreeView nodes={tree} selectedId={selected} onSelect={setSelected} />
          </div>
        </CusCard>

        <CusCard>
          <CusToolbar
            left={
              <>
                <CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => { setEditing(null); setCopyOf(null); setModalOpen(true) }}>Добавить товар</CusButton>
                <div className="ml-2 flex gap-1.5">
                  <CusChip active={kind === 'all'} onClick={() => setKind('all')}>Все</CusChip>
                  <CusChip active={kind === 'goods'} onClick={() => setKind('goods')}>Товары</CusChip>
                  <CusChip active={kind === 'prep'} onClick={() => setKind('prep')}>Заготовки</CusChip>
                  <CusChip active={kind === 'dish'} onClick={() => setKind('dish')}>Блюда</CusChip>
                  {deletedCount > 0 && <CusChip active={showDeleted} onClick={() => setShowDeleted((v) => !v)}>Удалённые ({deletedCount})</CusChip>}
                </div>
              </>
            }
            right={<CusInput placeholder="Поиск по названию или коду…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />}
          />
          <div className="overflow-x-auto"><CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(p) => { setEditing(p); setCopyOf(null); setModalOpen(true) }} /></div>
          <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Позиций: {rows.length}{missingCards > 0 && <span className="ml-3 text-warning">Без тех. карты: {missingCards}</span>}</div>
        </CusCard>
      </div>

      <ModalGroup
        open={!!groupModal}
        onClose={() => setGroupModal(null)}
        groups={groups}
        group={groupModal?.group ?? null}
        defaultParentId={selected === ALL ? null : Number(selected)}
      />

      <ModalProduct
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        groups={groups}
        product={editing}
        copyOf={copyOf}
        onCopy={(p) => { setEditing(null); setCopyOf(p) }}
        defaultGroupId={selected === ALL ? (groups.find((g) => g.parentId === null)?.id ?? 1) : Number(selected)}
      />
    </div>
  )
}
