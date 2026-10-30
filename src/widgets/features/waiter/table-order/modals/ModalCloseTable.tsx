import { useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { orderTotal, type DraftLine, type Order, type TableDef } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import { CURRENT_WAITER } from '../../constants'
import { useCloseTable } from '../../hooks/useOrders'

interface Props {
  open: boolean
  table: TableDef
  /** Все открытые счета стола */
  orders: Order[]
  /** Позиции, которые добавлены в корзину, но ещё не отправлены */
  drafts: Record<number, DraftLine[]>
  onClose: () => void
  onClosed: () => void
}

/** Подтверждение закрытия стола: гости поели и ушли, счёт остаётся открытым до оплаты на кассе. */
export default function ModalCloseTable({ open, table, orders, drafts, onClose, onClosed }: Props) {
  const close = useCloseTable()
  const [error, setError] = useState<string | null>(null)

  const unserved = orders.flatMap((o) => o.items).filter((i) => i.status !== 'served')
  const pending = orders.reduce((s, o) => s + (drafts[o.id]?.length ?? 0), 0)
  const blocked = unserved.length > 0 || pending > 0
  const total = orders.reduce((s, o) => s + orderTotal(o), 0)

  async function submit() {
    setError(null)
    try {
      await close.mutateAsync({ tableId: table.id, by: CURRENT_WAITER })
      onClosed()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <CusDialog
      open={open}
      onClose={onClose}
      size="sm"
      title={`Закрыть ${table.name}?`}
      footer={<><CusButton variant="ghost" onClick={onClose}>Назад</CusButton><CusButton size="lg" color="success" isDisabled={blocked} isLoading={close.isPending} onClick={submit}>Закрыть стол</CusButton></>}
    >
      <div className="space-y-4">
        {error && <CusAlert color="danger">{error}</CusAlert>}

        {unserved.length > 0 && (
          <CusAlert color="warning">
            Не всё подано: {unserved.map((i) => `${i.qty} × ${i.name}`).join(', ')}. Подайте эти блюда или отмените их.
          </CusAlert>
        )}
        {pending > 0 && <CusAlert color="warning">В корзине есть неотправленные позиции. Отправьте их на кухню или уберите из корзины.</CusAlert>}

        <div className="rounded-xl bg-park-bgHover/60 p-4 text-sm">
          <div className="flex justify-between"><span className="text-park-textMuted">Счетов за столом</span><span className="font-semibold text-park-text">{orders.length}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-park-textMuted">Сумма заказов</span><span className="font-semibold text-park-text">{fmtMoney(total)} сум</span></div>
        </div>

        <ul className="space-y-1.5 text-sm text-park-text3">
          <li>• Счёт остаётся открытым: гость оплатит на кассе при выходе по браслету.</li>
          <li>• Стол перейдёт в «ждёт уборки» и попадёт в раздел «Закрытые».</li>
          <li>• Посадить новых гостей можно после того, как стол отмечен убранным.</li>
        </ul>
      </div>
    </CusDialog>
  )
}
