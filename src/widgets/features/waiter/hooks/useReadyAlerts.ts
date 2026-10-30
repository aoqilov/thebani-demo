import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CURRENT_WAITER } from '../constants'
import { useOrders, useTables } from './useOrders'

export interface ReadyAlert {
  /** Уникальный номер уведомления */
  id: number
  orderId: number
  title: string
  items: { itemId: number; qty: number; name: string }[]
}

const AUTO_HIDE_MS = 20_000

/** Короткий двойной сигнал. Работает после первого касания экрана (требование браузера). */
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.value = 0.15
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.14)
    })
    setTimeout(() => ctx.close(), 800)
  } catch {
    /* звук недоступен — остаются вибрация и уведомление на экране */
  }
}

/**
 * Следит за заказами текущего официанта и сообщает, когда блюдо стало «Готово»:
 * уведомление на экране, вибрация, звук и (если разрешено) системное уведомление браузера.
 * Блюда, которые были готовы до открытия приложения, не считаются новыми — их видно по бейджу «Заказы».
 */
export function useReadyAlerts() {
  const orders = useOrders()
  const { data: tables = [] } = useTables()
  const seen = useRef<Set<number> | null>(null)
  const nextId = useRef(1)
  const [alerts, setAlerts] = useState<ReadyAlert[]>([])

  const mine = useMemo(() => (orders.data ?? []).filter((o) => o.waiter === CURRENT_WAITER && o.tableId !== null), [orders.data])
  const readyCount = useMemo(() => mine.flatMap((o) => o.items).filter((i) => i.status === 'ready').reduce((s, i) => s + i.qty, 0), [mine])

  useEffect(() => {
    if (!orders.isSuccess) return
    const ready = mine.flatMap((o) => o.items.filter((i) => i.status === 'ready').map((i) => ({ order: o, item: i })))
    if (seen.current === null) {
      seen.current = new Set(ready.map((r) => r.item.id))
      return
    }
    const fresh = ready.filter((r) => !seen.current!.has(r.item.id))
    if (!fresh.length) return
    fresh.forEach((r) => seen.current!.add(r.item.id))

    // Блюда одного счёта, ставшие готовыми одновременно, — в одно уведомление
    const byOrder = new Map<number, typeof fresh>()
    fresh.forEach((r) => byOrder.set(r.order.id, [...(byOrder.get(r.order.id) ?? []), r]))
    const created: ReadyAlert[] = [...byOrder.values()].map((list) => {
      const o = list[0].order
      const table = tables.find((t) => t.id === o.tableId)?.name ?? `Стол ${o.tableId}`
      return {
        id: nextId.current++, orderId: o.id,
        title: `${table}${o.guestLabel ? ` · ${o.guestLabel}` : ''}`,
        items: list.map((r) => ({ itemId: r.item.id, qty: r.item.qty, name: r.item.name })),
      }
    })
    setAlerts((a) => [...a, ...created])

    navigator.vibrate?.([200, 100, 200])
    beep()
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      created.forEach((a) => new Notification(`Готово: ${a.title}`, { body: a.items.map((i) => `${i.qty} × ${i.name}`).join(', '), tag: `ready-${a.orderId}` }))
    }
    created.forEach((a) => setTimeout(() => setAlerts((list) => list.filter((x) => x.id !== a.id)), AUTO_HIDE_MS))
  }, [orders.isSuccess, mine, tables])

  const dismiss = useCallback((id: number) => setAlerts((a) => a.filter((x) => x.id !== id)), [])
  return { alerts, dismiss, readyCount }
}
