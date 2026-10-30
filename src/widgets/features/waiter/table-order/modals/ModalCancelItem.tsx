import { useEffect, useState } from 'react'
import { LuMinus, LuPlus } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import type { OrderItem } from '@/types/order.types'
import { CANCEL_REASONS, CURRENT_WAITER } from '../../constants'
import { useCancelItem } from '../../hooks/useOrders'

/** Что сказать официанту в зависимости от того, как далеко зашла кухня. */
const WARNING: Record<OrderItem['status'], { color: 'info' | 'warning'; text: string }> = {
  sent: { color: 'info', text: 'Кухня ещё не начала готовить. Отмена без потерь.' },
  cooking: { color: 'warning', text: 'Блюдо уже готовится. Предупредите повара: продукты на него уйдут впустую.' },
  ready: { color: 'warning', text: 'Блюдо уже готово, продукты списаны со склада. Отмена попадёт в потери.' },
  served: { color: 'warning', text: 'Блюдо уже подано — отменить нельзя. Возврат оформляет кассир или администратор.' },
}

interface Props {
  orderId: number
  item: OrderItem | null
  onClose: () => void
}

/** Отмена ошибочно введённой позиции: причина обязательна, можно отменить часть порций. */
export default function ModalCancelItem({ orderId, item, onClose }: Props) {
  const cancel = useCancelItem()
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item) { setQty(item.qty); setReason(null); setError(null) }
  }, [item])

  async function submit() {
    if (!item) return
    if (!reason) return setError('Выберите причину отмены.')
    try {
      await cancel.mutateAsync({ orderId, itemId: item.id, qty, reason, by: CURRENT_WAITER })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const w = item ? WARNING[item.status] : null
  const stepper = 'flex h-12 w-12 items-center justify-center rounded-xl border border-park-border text-park-text active:scale-95 disabled:opacity-40'

  return (
    <CusDialog
      open={!!item}
      onClose={onClose}
      size="sm"
      title="Отменить позицию"
      footer={<><CusButton variant="ghost" onClick={onClose}>Не отменять</CusButton><CusButton size="lg" color="danger" isDisabled={item?.status === 'served'} isLoading={cancel.isPending} onClick={submit}>Отменить{item && item.qty > 1 ? ` ${qty} шт.` : ''}</CusButton></>}
    >
      {item && w && (
        <div className="space-y-4">
          {error && <CusAlert color="danger">{error}</CusAlert>}
          <p className="text-base font-bold text-park-text">{item.qty} × {item.name}</p>
          <CusAlert color={w.color}>{w.text}</CusAlert>

          {item.qty > 1 && item.status !== 'served' && (
            <div>
              <p className="mb-2 text-sm font-semibold text-park-text3">Сколько порций отменить</p>
              <div className="flex items-center justify-center gap-5">
                <button className={stepper} disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} aria-label="Меньше"><LuMinus size={20} /></button>
                <span className="w-10 text-center text-2xl font-bold text-park-text">{qty}</span>
                <button className={stepper} disabled={qty >= item.qty} onClick={() => setQty((q) => q + 1)} aria-label="Больше"><LuPlus size={20} /></button>
              </div>
            </div>
          )}

          {item.status !== 'served' && (
            <div>
              <p className="mb-2 text-sm font-semibold text-park-text3">Причина</p>
              <div className="flex flex-wrap gap-2">
                {CANCEL_REASONS.map((r) => <CusChip key={r} active={reason === r} onClick={() => { setReason(r); setError(null) }}>{r}</CusChip>)}
              </div>
            </div>
          )}
        </div>
      )}
    </CusDialog>
  )
}
