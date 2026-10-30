import { useState } from 'react'
import { LuPencil, LuPlus } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import type { MenuItem, ModifierGroup } from '@/types/menu.types'
import { modAvailability, modCost } from '@/data/menu.calc'
import type { CostCtx } from '@/data/recipe.calc'
import type { Product } from '@/types/warehouse.types'
import { fmtMoney } from '@/utils/format'
import ModalModifierGroup from '../modals/ModalModifierGroup'

export default function ModifiersTab({ groups, items, products, ctx }: { groups: ModifierGroup[]; items: MenuItem[]; products: Product[]; ctx: CostCtx }) {
  const [editing, setEditing] = useState<ModifierGroup | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CusButton leftIcon={<LuPlus size={15} />} onClick={() => { setEditing(null); setOpen(true) }}>Новая группа</CusButton>
      </div>
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
        {groups.map((g) => {
          const used = items.filter((i) => i.modifierGroupIds.includes(g.id)).length
          return (
            <CusCard key={g.id}>
              <CusCardHeader
                title={g.name}
                subtitle={`Используется в ${used} поз.`}
                actions={<button onClick={() => { setEditing(g); setOpen(true) }} className="rounded-md p-2 text-park-textMuted hover:bg-park-bgHover" aria-label="Изменить"><LuPencil size={15} /></button>}
              />
              <div className="space-y-3 p-5">
                <div className="flex gap-2">
                  <CusBadge color={g.required ? 'danger' : 'dark'}>{g.required ? 'Обязательный' : 'Необязательный'}</CusBadge>
                  <CusBadge color="info">{g.multiple ? 'Несколько' : 'Один вариант'}</CusBadge>
                </div>
                <ul className="divide-y divide-park-border text-sm">
                  {g.options.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-1.5">
                      <span className="text-park-text3">
                        {o.name}
                        {o.productId && <span className="block text-xs text-park-textMuted">Склад: {o.replaceProductId ? `${products.find((p) => p.id === o.replaceProductId)?.name ?? '?'} → ` : '+ '}{products.find((p) => p.id === o.productId)?.name ?? '?'} · {o.qty} {products.find((p) => p.id === o.productId)?.unit}{!o.replaceProductId && ` · себестоимость ${fmtMoney(Math.round(modCost(o, ctx)))}`}{!modAvailability(o, ctx).available && <span className="ml-1 font-semibold text-danger">· стоп: {modAvailability(o, ctx).reason}</span>}</span>}
                      </span>
                      <span className="text-park-textMuted">{o.price > 0 ? `+${fmtMoney(o.price)}` : 'бесплатно'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CusCard>
          )
        })}
      </div>
      {!groups.length && <CusCard className="p-8 text-center text-sm text-park-textMuted">Групп модификаторов пока нет.</CusCard>}
      <ModalModifierGroup open={open} onClose={() => setOpen(false)} group={editing} products={products} />
    </div>
  )
}
