import { useMemo, useState } from 'react'
import { LuLayoutGrid, LuList, LuPlus, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusImage } from '@/components/ui/image/CusImage'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { foodCostColor } from '@/data/recipe.calc'
import { isStopped, itemState, type ItemState } from '@/data/menu.calc'
import { cn } from '@/lib/cn'
import { STATION_LABEL, type MenuCategory, type MenuItem, type ModifierGroup, type Station } from '@/types/menu.types'
import type { CostCtx } from '@/data/recipe.calc'
import type { Product } from '@/types/warehouse.types'
import { fmtMoney } from '@/utils/format'
import { useSetItemStopped } from '../hooks/useMenu'
import ModalMenuItem from '../modals/ModalMenuItem'
import StateBadge from './StateBadge'

type Row = MenuItem & { state: ItemState; categoryName: string }
type Filter = 'all' | 'stop' | 'hidden'

interface Props {
  items: MenuItem[]
  categories: MenuCategory[]
  products: Product[]
  modifierGroups: ModifierGroup[]
  ctx: CostCtx
  categoryId: number | 'all'
}

export default function ItemsTab({ items, categories, products, modifierGroups, ctx, categoryId }: Props) {
  const setStopped = useSetItemStopped()
  const [view, setView] = useState<'table' | 'tiles'>('table')
  const [station, setStation] = useState<Station | 'all'>('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [modal, setModal] = useState(false)

  const rows: Row[] = useMemo(() => {
    const cm = new Map(categories.map((c) => [c.id, c.name]))
    const q = search.trim().toLowerCase()
    return items
      .filter((i) => (categoryId === 'all' || i.categoryId === categoryId) && (station === 'all' || i.station === station) && (!q || i.name.toLowerCase().includes(q)))
      .map((i) => ({ ...i, state: itemState(i, ctx), categoryName: cm.get(i.categoryId) ?? '—' }))
      .filter((r) => (filter === 'all' ? true : filter === 'hidden' ? r.state.status === 'hidden' : isStopped(r.state.status)))
  }, [items, categories, ctx, categoryId, station, filter, search])

  const open = (item: MenuItem | null) => { setEditing(item); setModal(true) }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'name', header: 'Название', sortable: true,
      render: (r) => (
        <span className="flex items-center gap-3">
          <CusImage src={r.image} alt={r.name} className="h-10 w-14 shrink-0 rounded-md" />
          <span className="font-semibold text-park-text">{r.name}</span>
        </span>
      ),
    },
    { key: 'categoryName', header: 'Категория', sortable: true },
    { key: 'station', header: 'Цех', render: (r) => <CusBadge color={r.station === 'bar' ? 'secondary' : 'info'}>{STATION_LABEL[r.station]}</CusBadge> },
    { key: 'price', header: 'Цена, сум', align: 'right', sortable: true, render: (r) => fmtMoney(r.price) },
    { key: 'cost', header: 'Себестоимость', align: 'right', render: (r) => <span className="text-park-textMuted">{r.state.cost > 0 ? fmtMoney(r.state.cost) : '—'}</span> },
    {
      key: 'foodCost', header: 'Food cost', align: 'right',
      render: (r) => (r.state.foodCost === null ? '—' : <CusBadge color={foodCostColor(r.state.foodCost)}>{Math.round(r.state.foodCost)}%</CusBadge>),
    },
    { key: 'portions', header: 'Хватит на', align: 'right', render: (r) => (r.state.portions === null ? '—' : r.state.portions) },
    { key: 'status', header: 'Статус', render: (r) => <StateBadge status={r.state.status} /> },
    {
      key: 'sale', header: 'В продаже', align: 'center',
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <CusSwitch checked={!r.stopped} onChange={(v) => setStopped.mutate({ id: r.id, stopped: !v })} />
        </span>
      ),
    },
  ]

  return (
    <CusCard>
      <CusToolbar
        left={
          <>
            <CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => open(null)}>Добавить позицию</CusButton>
            <div className="ml-2 flex gap-1.5">
              <CusChip active={filter === 'all'} onClick={() => setFilter('all')}>Все</CusChip>
              <CusChip active={filter === 'stop'} onClick={() => setFilter('stop')}>В стопе</CusChip>
              <CusChip active={filter === 'hidden'} onClick={() => setFilter('hidden')}>Скрытые</CusChip>
            </div>
            <div className="flex gap-1.5 border-l border-park-border pl-3">
              <CusChip active={station === 'all'} onClick={() => setStation('all')}>Все цеха</CusChip>
              <CusChip active={station === 'kitchen'} onClick={() => setStation('kitchen')}>Кухня</CusChip>
              <CusChip active={station === 'bar'} onClick={() => setStation('bar')}>Бар</CusChip>
            </div>
          </>
        }
        right={
          <>
            <CusInput placeholder="Поиск позиции…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
            <div className="flex overflow-hidden rounded-md border border-park-border">
              <button onClick={() => setView('table')} aria-label="Таблица" className={cn('p-2', view === 'table' ? 'bg-primary text-white' : 'bg-park-bgCard text-park-textMuted')}><LuList size={15} /></button>
              <button onClick={() => setView('tiles')} aria-label="Плитки" className={cn('p-2', view === 'tiles' ? 'bg-primary text-white' : 'bg-park-bgCard text-park-textMuted')}><LuLayoutGrid size={15} /></button>
            </div>
          </>
        }
      />

      {view === 'table' ? (
        <CusTable data={rows} columns={columns} interactive onRowClick={(r) => open(items.find((i) => i.id === r.id) ?? null)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 tablet:grid-cols-3 desktop:grid-cols-4 wide:grid-cols-5">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => open(items.find((i) => i.id === r.id) ?? null)}
              className={cn('relative flex flex-col overflow-hidden rounded-lg border text-left transition hover:shadow-md', r.state.sellable ? 'border-park-border bg-park-bgCard' : 'border-park-border bg-park-bgHover opacity-70 grayscale')}
            >
              <CusImage src={r.image} alt={r.name} className="h-28 w-full" />
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <p className="line-clamp-2 text-sm font-semibold text-park-text">{r.name}</p>
                  <p className="mt-0.5 text-xs text-park-textMuted">{r.categoryName}</p>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <span className="text-base font-bold text-park-text">{fmtMoney(r.price)}</span>
                  <StateBadge status={r.state.status} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 && <div className="p-8 text-center text-sm text-park-textMuted">Позиций нет</div>}
      <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Позиций: {rows.length}</div>

      <ModalMenuItem
        open={modal}
        onClose={() => setModal(false)}
        item={editing}
        categories={categories}
        products={products}
        modifierGroups={modifierGroups}
        defaultCategoryId={categoryId === 'all' ? (categories[0]?.id ?? 1) : categoryId}
      />
    </CusCard>
  )
}
