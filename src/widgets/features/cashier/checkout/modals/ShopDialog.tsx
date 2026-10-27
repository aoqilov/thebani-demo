import { useEffect, useMemo, useState } from 'react'
import { LuMinus, LuPlus, LuSearch } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { cn } from '@/lib/cn'
import { fmtMoney } from '@/utils/format'
import { CURRENT_CASHIER } from '../../hooks/useCashier'
import { useAddGoods, useShopItems } from '../../hooks/useShop'

/** Продажа товаров магазина на браслет гостя. */
export default function ShopDialog({ orderId, bracelet, onClose }: { orderId: number | null; bracelet: string | null; onClose: () => void }) {
  const { data: items = [] } = useShopItems()
  const add = useAddGoods()
  const [qty, setQty] = useState<Record<number, number>>({})
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId !== null) { setQty({}); setCategory('all'); setSearch(''); setError(null) }
  }, [orderId])

  const active = items.filter((i) => i.active)
  const categories = useMemo(() => [...new Set(active.map((i) => i.category))], [active])
  const q = search.trim().toLowerCase()
  const visible = active.filter((i) => (category === 'all' || i.category === category) && (!q || i.name.toLowerCase().includes(q)))

  const total = active.reduce((s, i) => s + i.price * (qty[i.id] ?? 0), 0)
  const count = Object.values(qty).reduce((s, n) => s + n, 0)
  const step = 'flex h-10 w-10 items-center justify-center rounded-lg border border-park-border text-park-text active:scale-95 disabled:opacity-40'

  async function submit() {
    setError(null)
    try {
      await add.mutateAsync({ orderId: orderId!, lines: Object.entries(qty).filter(([, q2]) => q2 > 0).map(([itemId, q2]) => ({ itemId: Number(itemId), qty: q2 })), by: CURRENT_CASHIER })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <CusDialog
      open={orderId !== null}
      onClose={onClose}
      size="lg"
      title={`Товары на браслет ${bracelet ?? ''}`}
      footer={<><CusButton variant="ghost" onClick={onClose}>Отмена</CusButton><CusButton size="lg" color="success" isDisabled={count === 0} isLoading={add.isPending} onClick={submit}>Добавить в счёт · {fmtMoney(total)} сум</CusButton></>}
    >
      <div className="space-y-3">
        {error && <CusAlert color="danger">{error}</CusAlert>}
        <CusInput placeholder="Найти товар…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          <CusChip active={category === 'all'} onClick={() => setCategory('all')}>Все</CusChip>
          {categories.map((c) => <CusChip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</CusChip>)}
        </div>
        <div className="grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto tablet:grid-cols-2">
          {visible.map((i) => {
            const n = qty[i.id] ?? 0
            return (
              <div key={i.id} className={cn('flex items-center justify-between gap-3 rounded-xl border-2 p-3', n > 0 ? 'border-primary bg-primary/5' : 'border-park-border')}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-park-text">{i.name}</p>
                  <p className="text-sm font-bold text-primary">{fmtMoney(i.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className={step} disabled={n === 0} onClick={() => setQty((s) => ({ ...s, [i.id]: n - 1 }))} aria-label="Меньше"><LuMinus size={16} /></button>
                  <span className="w-6 text-center text-lg font-bold text-park-text">{n}</span>
                  <button className={step} onClick={() => setQty((s) => ({ ...s, [i.id]: n + 1 }))} aria-label="Больше"><LuPlus size={16} /></button>
                </div>
              </div>
            )
          })}
          {visible.length === 0 && <p className="py-8 text-center text-sm text-park-textMuted tablet:col-span-2">Ничего не найдено</p>}
        </div>
      </div>
    </CusDialog>
  )
}
