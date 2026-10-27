import { useMemo, useState } from 'react'
import { LuArrowLeft, LuNfc, LuReceipt, LuUsers } from 'react-icons/lu'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDrawer } from '@/components/ui/dialog/CusDrawer'
import type { MenuItem } from '@/types/menu.types'
import { draftTotal, orderTotal, type DraftLine, type OrderItemMod } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import { useMenuCategories, useMenuItems, useModifierGroups } from '../../admin/menu/hooks/useMenu'
import { useCostCtx } from '../../admin/warehouse-recipes/components/useCostCtx'
import { useOrders, useSendItems, useTables } from '../hooks/useOrders'
import MenuGrid from './components/MenuGrid'
import OrderPanel from './components/OrderPanel'
import ModifierSheet from './modals/ModifierSheet'

const lineKey = (id: number, mods: OrderItemMod[], comment: string) => `${id}|${mods.map((m) => `${m.group}:${m.option}`).join(',')}|${comment}`

export default function FeatureWaiterTableOrder() {
  const navigate = useNavigate()
  const tableId = Number(useParams().tableId)
  const { data: tables = [], isLoading: l1 } = useTables()
  const { data: orders = [], isLoading: l2 } = useOrders()
  const { data: categories = [] } = useMenuCategories()
  const { data: items = [] } = useMenuItems()
  const { data: groups = [] } = useModifierGroups()
  const { ctx } = useCostCtx()
  const send = useSendItems()

  const [draft, setDraft] = useState<DraftLine[]>([])
  const [sheet, setSheet] = useState<MenuItem | null>(null)
  const [cart, setCart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const table = tables.find((t) => t.id === tableId)
  const order = orders.find((o) => o.tableId === tableId)

  const counts = useMemo(() => {
    const m = new Map<number, number>()
    draft.forEach((l) => m.set(l.menuItemId, (m.get(l.menuItemId) ?? 0) + l.qty))
    return m
  }, [draft])

  if (l1 || l2) return <p className="py-16 text-center text-park-textMuted">Загрузка…</p>
  if (!table || !order) return <Navigate to="/waiter" replace />

  function addLine(item: MenuItem, mods: OrderItemMod[], comment: string, qty: number) {
    const key = lineKey(item.id, mods, comment)
    const unitPrice = item.price + mods.reduce((s, m) => s + m.price, 0)
    setError(null)
    setNotice(null)
    setDraft((d) =>
      d.some((l) => l.key === key)
        ? d.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
        : [...d, { key, menuItemId: item.id, name: item.name, unitPrice, qty, mods, comment, station: item.station }],
    )
    setSheet(null)
  }

  /** Блюдо без модификаторов добавляется сразу, одним касанием. */
  function pick(item: MenuItem) {
    if (item.modifierGroupIds.length > 0) setSheet(item)
    else addLine(item, [], '', 1)
  }

  const changeQty = (key: string, delta: number) =>
    setDraft((d) => d.flatMap((l) => (l.key !== key ? [l] : l.qty + delta <= 0 ? [] : [{ ...l, qty: l.qty + delta }])))

  async function submit() {
    setError(null)
    try {
      await send.mutateAsync({ orderId: order!.id, lines: draft })
      setDraft([])
      setCart(false)
      setNotice('Заказ отправлен на кухню и в бар.')
      setTimeout(() => setNotice(null), 3500)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const draftQty = draft.reduce((s, l) => s + l.qty, 0)
  const total = orderTotal(order) + draftTotal(draft)
  const panel = (
    <OrderPanel order={order} draft={draft} onQty={changeQty} onRemove={(k) => setDraft((d) => d.filter((l) => l.key !== k))} onSend={submit} sending={send.isPending} error={error} notice={notice} />
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CusButton variant="ghost" leftIcon={<LuArrowLeft size={18} />} onClick={() => navigate('/waiter')}>Столы</CusButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-park-text">{table.name}</h1>
          <p className="flex flex-wrap items-center gap-3 text-xs text-park-textMuted">
            <span className="flex items-center gap-1"><LuUsers size={12} /> {order.guests} гост.</span>
            {order.bracelet && <span className="flex items-center gap-1 font-mono"><LuNfc size={12} /> {order.bracelet}</span>}
            <span>{order.waiter}</span>
          </p>
        </div>
        {order.status === 'bill' && <CusBadge color="warning">Счёт запрошен</CusBadge>}
      </div>

      {order.status === 'bill' && <CusAlert color="warning">Счёт запрошен. Новые позиции можно добавить, пока кассир не закрыл счёт.</CusAlert>}

      <div className="grid grid-cols-1 items-start gap-5 desktop:grid-cols-[1fr_380px]">
        <MenuGrid categories={categories} items={items} ctx={ctx} counts={counts} onPick={pick} />
        <aside className="sticky top-20 hidden max-h-[calc(100vh-7rem)] rounded-2xl bg-park-bgCard p-4 shadow-card desktop:block">{panel}</aside>
      </div>

      {/* Мобильный/планшетный режим: плавающая кнопка корзины */}
      <div className="fixed inset-x-0 bottom-24 z-30 px-4 desktop:hidden">
        <CusButton size="lg" className="w-full shadow-xl" leftIcon={<LuReceipt size={20} />} onClick={() => setCart(true)}>
          Заказ{draftQty > 0 && ` · ${draftQty} новых`} · {fmtMoney(total)} сум
        </CusButton>
      </div>
      <div className="desktop:hidden">
        <CusDrawer open={cart} onClose={() => setCart(false)} title={`${table.name} — заказ`}>{panel}</CusDrawer>
      </div>

      <ModifierSheet item={sheet} groups={groups} onClose={() => setSheet(null)} onAdd={addLine} />
    </div>
  )
}
