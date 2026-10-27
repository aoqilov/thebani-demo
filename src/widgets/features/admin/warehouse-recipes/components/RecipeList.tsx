import { useMemo, useState } from 'react'
import { LuPlus, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { cn } from '@/lib/cn'
import { foodCostColor, recipeStats, type CostCtx } from '@/data/recipe.calc'
import type { Product, Recipe } from '@/types/warehouse.types'
import { fmtMoney } from '@/utils/format'

type Filter = 'all' | 'dish' | 'prep' | 'none'

interface Props {
  products: Product[]
  recipes: Recipe[]
  ctx: CostCtx
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
}

export default function RecipeList({ products, recipes, ctx, selectedId, onSelect, onCreate }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const items = useMemo(() => {
    const has = new Set(recipes.map((r) => r.productId))
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => p.kind !== 'goods' && p.active)
      .filter((p) => (filter === 'all' ? true : filter === 'none' ? !has.has(p.id) : p.kind === filter))
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .map((p) => {
        const r = ctx.recipes.get(p.id)
        return { product: p, stats: r ? recipeStats(r, p.price, ctx) : null }
      })
  }, [products, recipes, ctx, filter, search])

  return (
    <CusCard>
      <div className="space-y-3 border-b border-park-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1"><CusInput placeholder="Поиск…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} /></div>
          <CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={onCreate}>Новая</CusButton>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CusChip active={filter === 'all'} onClick={() => setFilter('all')}>Все</CusChip>
          <CusChip active={filter === 'dish'} onClick={() => setFilter('dish')}>Блюда</CusChip>
          <CusChip active={filter === 'prep'} onClick={() => setFilter('prep')}>Заготовки</CusChip>
          <CusChip active={filter === 'none'} onClick={() => setFilter('none')}>Без тех. карты</CusChip>
        </div>
      </div>

      <ul className="max-h-[640px] divide-y divide-park-border overflow-y-auto">
        {items.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">Ничего не найдено</li>}
        {items.map(({ product: p, stats }) => (
          <li
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn('flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition', selectedId === p.id ? 'bg-primary/10' : 'hover:bg-park-bgHover')}
          >
            <div className="min-w-0">
              <p className={cn('truncate text-sm font-semibold', selectedId === p.id ? 'text-primary' : 'text-park-text')}>{p.name}</p>
              <p className="text-xs text-park-textMuted">
                {p.kind === 'dish' ? 'Блюдо' : 'Заготовка'}
                {stats ? ` · себестоимость ${fmtMoney(stats.perUnit)} / ${p.unit}` : ''}
              </p>
            </div>
            {!stats ? (
              <CusBadge color="dark">нет карты</CusBadge>
            ) : p.kind === 'dish' && stats.foodCost !== null ? (
              <CusBadge color={foodCostColor(stats.foodCost)}>{Math.round(stats.foodCost)}%</CusBadge>
            ) : (
              <CusBadge color="secondary">{stats.lines.length} инг.</CusBadge>
            )}
          </li>
        ))}
      </ul>
    </CusCard>
  )
}
