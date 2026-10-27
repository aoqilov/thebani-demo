import { useState } from 'react'
import { LuArrowDown, LuArrowUp, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { cn } from '@/lib/cn'
import type { MenuCategory, MenuItem } from '@/types/menu.types'
import { useDeleteCategory, useMoveCategory } from '../hooks/useMenu'
import ModalCategory from '../modals/ModalCategory'

interface Props {
  categories: MenuCategory[]
  items: MenuItem[]
  selectedId: number | 'all'
  onSelect: (id: number | 'all') => void
}

export default function CategoriesPanel({ categories, items, selectedId, onSelect }: Props) {
  const move = useMoveCategory()
  const del = useDeleteCategory()
  const [editing, setEditing] = useState<MenuCategory | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const count = (id: number) => items.filter((i) => i.categoryId === id).length
  const btn = 'rounded p-1 text-park-textMuted hover:bg-park-bgHover hover:text-park-text disabled:opacity-30'

  async function remove(id: number) {
    setError(null)
    try {
      await del.mutateAsync(id)
      if (selectedId === id) onSelect('all')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <CusCard>
      <CusCardHeader title="Категории" actions={<CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => { setEditing(null); setOpen(true) }}>Новая</CusButton>} />
      {error && <div className="p-3"><CusAlert color="danger">{error}</CusAlert></div>}
      <ul className="p-2">
        <li
          onClick={() => onSelect('all')}
          className={cn('flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm', selectedId === 'all' ? 'bg-primary/10 font-semibold text-primary' : 'text-park-text3 hover:bg-park-bgHover')}
        >
          <span>Все позиции</span><span className="text-xs text-park-textMuted">{items.length}</span>
        </li>
        {categories.map((c, i) => (
          <li
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn('group flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-sm', selectedId === c.id ? 'bg-primary/10 font-semibold text-primary' : 'text-park-text3 hover:bg-park-bgHover')}
          >
            <span className="flex-1 truncate">{c.name}</span>
            <span className="hidden items-center group-hover:flex" onClick={(e) => e.stopPropagation()}>
              <button className={btn} disabled={i === 0} onClick={() => move.mutate({ id: c.id, dir: -1 })} aria-label="Выше"><LuArrowUp size={13} /></button>
              <button className={btn} disabled={i === categories.length - 1} onClick={() => move.mutate({ id: c.id, dir: 1 })} aria-label="Ниже"><LuArrowDown size={13} /></button>
              <button className={btn} onClick={() => { setEditing(c); setOpen(true) }} aria-label="Переименовать"><LuPencil size={13} /></button>
              <button className={`${btn} hover:text-danger`} onClick={() => remove(c.id)} aria-label="Удалить"><LuTrash2 size={13} /></button>
            </span>
            <span className="text-xs text-park-textMuted group-hover:hidden">{count(c.id)}</span>
          </li>
        ))}
      </ul>
      <ModalCategory open={open} onClose={() => setOpen(false)} category={editing} />
    </CusCard>
  )
}
