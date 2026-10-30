import { useState } from 'react'
import { LuBell, LuMinus, LuPlus, LuSend, LuTrash2, LuX } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { STATION_LABEL } from '@/types/menu.types'
import { ITEM_STATUS_LABEL, draftTotal, orderTotal, type DraftLine, type Order, type OrderItem } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import { itemStatusColor, minutesSince } from '../../constants'
import { useRequestBill, useSetItemStatus } from '../../hooks/useOrders'
import ModalCancelItem from '../modals/ModalCancelItem'

interface Props {
  order: Order
  draft: DraftLine[]
  onQty: (key: string, delta: number) => void
  onRemove: (key: string) => void
  onSend: () => void
  sending: boolean
  error: string | null
  notice: string | null
}

const modsText = (mods: DraftLine['mods']) => mods.map((m) => m.option).join(', ')

export default function OrderPanel({ order, draft, onQty, onRemove, onSend, sending, error, notice }: Props) {
  const setStatus = useSetItemStatus()
  const bill = useRequestBill()
  const [cancelling, setCancelling] = useState<OrderItem | null>(null)

  const kitchen = draft.filter((l) => l.station === 'kitchen').reduce((s, l) => s + l.qty, 0)
  const bar = draft.filter((l) => l.station === 'bar').reduce((s, l) => s + l.qty, 0)
  const total = orderTotal(order) + draftTotal(draft)
  const batches = [...new Set(order.items.map((i) => i.batch))].sort((a, b) => b - a)
  const stepper = 'flex h-10 w-10 items-center justify-center rounded-lg border border-park-border text-park-text active:scale-95 disabled:opacity-40'

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto">
        {error && <CusAlert color="danger">{error}</CusAlert>}
        {notice && <CusAlert color="success">{notice}</CusAlert>}

        <section>
          <h3 className="mb-2 flex items-center justify-between text-sm font-bold text-park-text">
            Новые позиции {draft.length > 0 && <CusBadge color="primary">{draft.reduce((s, l) => s + l.qty, 0)}</CusBadge>}
          </h3>
          {draft.length === 0 && <p className="rounded-xl border border-dashed border-park-border2 p-5 text-center text-sm text-park-textMuted">Выберите блюда слева — они появятся здесь</p>}
          <ul className="space-y-2">
            {draft.map((l) => (
              <li key={l.key} className="rounded-xl bg-park-bgHover/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-park-text">{l.name}</p>
                    {l.mods.length > 0 && <p className="text-xs text-park-textMuted">{modsText(l.mods)}</p>}
                    {l.comment && <p className="text-xs italic text-park-textMuted">«{l.comment}»</p>}
                  </div>
                  <button onClick={() => onRemove(l.key)} className="rounded-md p-1.5 text-park-textMuted hover:text-danger" aria-label="Убрать"><LuTrash2 size={16} /></button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className={stepper} onClick={() => onQty(l.key, -1)} aria-label="Меньше"><LuMinus size={16} /></button>
                    <span className="w-6 text-center text-lg font-bold text-park-text">{l.qty}</span>
                    <button className={stepper} onClick={() => onQty(l.key, 1)} aria-label="Больше"><LuPlus size={16} /></button>
                  </div>
                  <span className="text-sm font-bold text-park-text">{fmtMoney(l.unitPrice * l.qty)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {batches.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-park-text">Отправлено</h3>
            <div className="space-y-3">
              {batches.map((b) => {
                const items = order.items.filter((i) => i.batch === b)
                return (
                  <div key={b} className="rounded-xl border border-park-border">
                    <p className="border-b border-park-border px-3 py-1.5 text-xs text-park-textMuted">Заход {b} · {minutesSince(items[0].sentAt)} мин назад</p>
                    <ul className="divide-y divide-park-border">
                      {items.map((i) => (
                        <li key={i.id} className="flex items-center justify-between gap-2 px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm text-park-text">{i.qty} × {i.name}</p>
                            <p className="text-xs text-park-textMuted">{STATION_LABEL[i.station]}{i.mods.length > 0 && ` · ${modsText(i.mods)}`}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {i.status === 'ready' ? (
                              <CusButton size="sm" color="success" onClick={() => setStatus.mutate({ orderId: order.id, itemId: i.id, status: 'served' })}>Подать</CusButton>
                            ) : (
                              <CusBadge color={itemStatusColor[i.status]}>{ITEM_STATUS_LABEL[i.status]}</CusBadge>
                            )}
                            {i.status !== 'served' && (
                              <button onClick={() => setCancelling(i)} className="flex h-9 w-9 items-center justify-center rounded-lg text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label={`Отменить: ${i.name}`} title="Отменить позицию"><LuX size={18} /></button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {(order.cancelled?.length ?? 0) > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-park-text">Отменено</h3>
            <ul className="divide-y divide-park-border rounded-xl border border-park-border">
              {order.cancelled!.map((c) => (
                <li key={c.id} className="px-3 py-2">
                  <p className="text-sm text-park-textMuted line-through">{c.qty} × {c.name}</p>
                  <p className="text-xs text-park-textMuted">{c.reason} · {c.by} · {minutesSince(c.at)} мин назад</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ModalCancelItem orderId={order.id} item={cancelling} onClose={() => setCancelling(null)} />

      <div className="mt-4 space-y-3 border-t border-park-border pt-4">
        <div className="flex items-end justify-between">
          <span className="text-sm text-park-textMuted">Итого по столу</span>
          <span className="text-2xl font-bold text-park-text">{fmtMoney(total)} <span className="text-sm font-normal text-park-textMuted">сум</span></span>
        </div>
        <CusButton size="lg" className="w-full" leftIcon={<LuSend size={20} />} isDisabled={draft.length === 0} isLoading={sending} onClick={onSend}>
          Отправить{draft.length > 0 && `: ${[kitchen && `кухня ${kitchen}`, bar && `бар ${bar}`].filter(Boolean).join(' · ')}`}
        </CusButton>
        {order.status === 'bill' ? (
          <CusAlert color="warning">Счёт запрошен — ожидает кассира.</CusAlert>
        ) : (
          <CusButton size="lg" variant="outline" color="warning" className="w-full" leftIcon={<LuBell size={20} />} isDisabled={order.items.length === 0} isLoading={bill.isPending} onClick={() => bill.mutate(order.id)}>
            Запросить счёт
          </CusButton>
        )}
      </div>
    </div>
  )
}
