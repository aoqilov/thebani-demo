import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { Charge } from '@/types/order.types'
import type { ShopItem } from '@/types/shop.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 80

export const fetchShopItems = (): Promise<ShopItem[]> => delay(getWarehouse().shopItems, ms)

/** Продажа товаров магазина на браслет гостя: каждая позиция — отдельная строка счёта. */
export async function addGoods({ orderId, lines, by }: { orderId: number; lines: { itemId: number; qty: number }[]; by: string }): Promise<void> {
  const st = getWarehouse()
  const order = st.orders.find((o) => o.id === orderId)
  if (!order || order.status === 'closed') throw new Error('Счёт не найден или уже закрыт.')
  const picked = lines.filter((l) => l.qty > 0).map((l) => ({ item: st.shopItems.find((i) => i.id === l.itemId), qty: l.qty }))
  if (picked.length === 0) throw new Error('Выберите хотя бы один товар.')
  if (picked.some((p) => !p.item || !p.item.active)) throw new Error('Один из товаров недоступен.')

  updateWarehouse((s) => {
    let id = Math.max(0, ...s.orders.flatMap((o) => o.charges.map((c) => c.id)))
    const now = new Date().toISOString()
    const charges: Charge[] = picked.map(({ item, qty }) => ({ id: ++id, kind: 'goods', title: `${item!.name} × ${qty}`, amount: item!.price * qty, by, at: now }))
    return { ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, charges: [...o.charges, ...charges] } : o)) }
  })
  await delay(null, ms)
}
