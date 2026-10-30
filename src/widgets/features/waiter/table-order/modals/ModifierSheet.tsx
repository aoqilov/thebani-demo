import { useEffect, useMemo, useState } from 'react'
import { LuMinus, LuPlus } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusImage } from '@/components/ui/image/CusImage'
import { CusTextArea } from '@/components/ui/inputs/CusTextArea'
import { modAvailability } from '@/data/menu.calc'
import type { CostCtx } from '@/data/recipe.calc'
import { cn } from '@/lib/cn'
import type { MenuItem, ModifierGroup } from '@/types/menu.types'
import type { OrderItemMod } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'

interface Props {
  item: MenuItem | null
  groups: ModifierGroup[]
  ctx: CostCtx
  onClose: () => void
  onAdd: (item: MenuItem, mods: OrderItemMod[], comment: string, qty: number) => void
}

/** Выбор модификаторов, комментария и количества перед добавлением в заказ. */
export default function ModifierSheet({ item, groups, ctx, onClose, onAdd }: Props) {
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [comment, setComment] = useState('')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const itemGroups = useMemo(() => groups.filter((g) => item?.modifierGroupIds.includes(g.id)), [groups, item])

  useEffect(() => {
    if (item) { setSelected({}); setComment(''); setQty(1); setError(null) }
  }, [item])

  const mods: OrderItemMod[] = itemGroups.flatMap((g) =>
    g.options.filter((o) => selected[g.id]?.includes(o.id)).map((o) => ({ group: g.name, option: o.name, price: o.price, productId: o.productId, qty: o.qty, replaceProductId: o.replaceProductId })),
  )
  const unit = (item?.price ?? 0) + mods.reduce((s, m) => s + m.price, 0)

  function toggle(g: ModifierGroup, optionId: number) {
    setError(null)
    const opt = g.options.find((o) => o.id === optionId)
    if (opt && !modAvailability(opt, ctx).available) return
    setSelected((s) => {
      const cur = s[g.id] ?? []
      if (!g.multiple) return { ...s, [g.id]: [optionId] }
      return { ...s, [g.id]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] }
    })
  }

  function submit() {
    const missing = itemGroups.find((g) => g.required && !(selected[g.id]?.length))
    if (missing) return setError(`Выберите: ${missing.name}`)
    onAdd(item!, mods, comment.trim(), qty)
  }

  const stepper = 'flex h-12 w-12 items-center justify-center rounded-xl border border-park-border text-park-text active:scale-95 disabled:opacity-40'

  return (
    <CusDialog
      open={!!item}
      onClose={onClose}
      title={item?.name ?? ''}
      footer={<CusButton size="lg" className="w-full" onClick={submit}>Добавить · {fmtMoney(unit * qty)} сум</CusButton>}
    >
      {item && (
        <div className="space-y-5">
          <CusImage src={item.image} alt={item.name} className="h-36 w-full rounded-xl" />
          {error && <CusAlert color="danger">{error}</CusAlert>}

          {itemGroups.map((g) => (
            <div key={g.id}>
              <p className="mb-2 text-sm font-bold text-park-text">
                {g.name} {g.required && <span className="text-danger">*</span>}
                <span className="ml-2 text-xs font-normal text-park-textMuted">{g.multiple ? 'можно несколько' : 'один вариант'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const on = selected[g.id]?.includes(o.id)
                  const stop = !modAvailability(o, ctx).available
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={stop}
                      onClick={() => toggle(g, o.id)}
                      className={cn('min-h-12 rounded-xl border-2 px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-50 disabled:active:scale-100', on ? 'border-primary bg-primary/10 text-primary' : 'border-park-border text-park-text3 hover:bg-park-bgHover')}
                    >
                      {o.name}{o.price > 0 && <span className="ml-1 text-xs text-park-textMuted">+{fmtMoney(o.price)}</span>}
                      {stop && <span className="ml-1 text-xs text-danger">стоп</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <CusTextArea label="Комментарий для кухни" rows={2} placeholder="Например: без соли, подать вместе" value={comment} onChange={(e) => setComment(e.target.value)} />

          <div className="flex items-center justify-center gap-5">
            <button className={stepper} disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} aria-label="Меньше"><LuMinus size={20} /></button>
            <span className="w-10 text-center text-2xl font-bold text-park-text">{qty}</span>
            <button className={stepper} onClick={() => setQty((q) => q + 1)} aria-label="Больше"><LuPlus size={20} /></button>
          </div>
        </div>
      )}
    </CusDialog>
  )
}
