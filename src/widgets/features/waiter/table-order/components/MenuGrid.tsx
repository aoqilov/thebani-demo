import { useMemo, useState } from 'react'
import { LuSearch } from 'react-icons/lu'
import { CusImage } from '@/components/ui/image/CusImage'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { itemState, type ItemState } from '@/data/menu.calc'
import type { CostCtx } from '@/data/recipe.calc'
import { cn } from '@/lib/cn'
import type { MenuCategory, MenuItem } from '@/types/menu.types'
import { fmtMoney } from '@/utils/format'

interface Props {
  categories: MenuCategory[]
  items: MenuItem[]
  ctx: CostCtx
  /** menuItemId -> сколько уже добавлено в черновик */
  counts: Map<number, number>
  onPick: (item: MenuItem) => void
}

export default function MenuGrid({ categories, items, ctx, counts, onPick }: Props) {
  const [cat, setCat] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter((i) => i.active && (cat === 'all' || i.categoryId === cat) && (!q || i.name.toLowerCase().includes(q)))
      .map((i) => ({ item: i, state: itemState(i, ctx) as ItemState }))
      // позиции в стопе уходят вниз
      .sort((a, b) => Number(b.state.sellable) - Number(a.state.sellable))
  }, [items, ctx, cat, search])

  const chip = (active: boolean) =>
    cn('shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95', active ? 'bg-primary text-white' : 'bg-park-bgCard text-park-text3 shadow-card hover:bg-park-bgHover')

  return (
    <div className="space-y-3">
      <CusInput placeholder="Найти блюдо…" value={search} leftIcon={<LuSearch size={16} />} onChange={(e) => setSearch(e.target.value)} />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={chip(cat === 'all')} onClick={() => setCat('all')}>Все</button>
        {categories.map((c) => <button key={c.id} className={chip(cat === c.id)} onClick={() => setCat(c.id)}>{c.name}</button>)}
      </div>

      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 wide:grid-cols-4">
        {rows.map(({ item, state }) => {
          const added = counts.get(item.id) ?? 0
          const stop = !state.sellable
          return (
            <button
              key={item.id}
              disabled={stop}
              onClick={() => onPick(item)}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-2xl bg-park-bgCard text-left shadow-card transition active:scale-[0.97]',
                stop ? 'cursor-not-allowed' : 'hover:shadow-lg',
                added > 0 && 'ring-2 ring-primary',
              )}
            >
              <CusImage src={item.image} alt={item.name} className={cn('h-28 w-full tablet:h-32', stop && 'grayscale')} />
              {stop && (
                <span className="absolute left-2 top-2 rounded-md bg-danger px-2 py-0.5 text-xs font-bold uppercase text-white">Стоп</span>
              )}
              {!stop && state.status === 'low' && (
                <span className="absolute left-2 top-2 rounded-md bg-warning px-2 py-0.5 text-xs font-bold text-white">Осталось {state.portions}</span>
              )}
              {added > 0 && (
                <span className="absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-white shadow">{added}</span>
              )}
              <div className={cn('flex flex-1 flex-col justify-between gap-2 p-3', stop && 'opacity-60')}>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-park-text">{item.name}</p>
                <p className="text-base font-bold text-primary">{fmtMoney(item.price)}</p>
              </div>
            </button>
          )
        })}
      </div>
      {rows.length === 0 && <p className="py-10 text-center text-sm text-park-textMuted">Ничего не найдено</p>}
    </div>
  )
}
