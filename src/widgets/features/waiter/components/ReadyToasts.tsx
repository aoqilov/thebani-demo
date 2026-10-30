import { useState } from 'react'
import { LuBell, LuBellRing, LuX } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { useSetItemStatus } from '../hooks/useOrders'
import type { ReadyAlert } from '../hooks/useReadyAlerts'

const canAskPermission = () => typeof Notification !== 'undefined' && Notification.permission === 'default'

/** Всплывающие уведомления «блюдо готово» сверху экрана официанта. */
export default function ReadyToasts({ alerts, onDismiss }: { alerts: ReadyAlert[]; onDismiss: (id: number) => void }) {
  const navigate = useNavigate()
  const setStatus = useSetItemStatus()
  const [askHidden, setAskHidden] = useState(false)
  const showAsk = !askHidden && canAskPermission()

  function serve(a: ReadyAlert) {
    a.items.forEach((i) => setStatus.mutate({ orderId: a.orderId, itemId: i.itemId, status: 'served' }))
    onDismiss(a.id)
  }

  async function enable() {
    await Notification.requestPermission()
    setAskHidden(true)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[72px] z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-3">
      {showAsk && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-park-border bg-park-bgCard p-3 shadow-xl">
          <LuBell size={22} className="shrink-0 text-primary" />
          <p className="flex-1 text-xs text-park-text3">Включите уведомления, чтобы узнавать о готовых блюдах, даже когда экран телефона погашен.</p>
          <CusButton size="sm" onClick={enable}>Включить</CusButton>
          <button onClick={() => setAskHidden(true)} className="rounded-md p-1 text-park-textMuted hover:bg-park-bgHover" aria-label="Закрыть"><LuX size={16} /></button>
        </div>
      )}

      {alerts.map((a) => (
        <div key={a.id} role="alert" className="pointer-events-auto overflow-hidden rounded-2xl border-2 border-success bg-park-bgCard shadow-xl">
          <div className="flex items-start gap-3 p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success text-white"><LuBellRing size={22} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-park-text">Готово · {a.title}</p>
              <ul className="mt-0.5 text-sm text-park-text3">
                {a.items.map((i) => <li key={i.itemId} className="truncate">{i.qty} × {i.name}</li>)}
              </ul>
            </div>
            <button onClick={() => onDismiss(a.id)} className="rounded-md p-1 text-park-textMuted hover:bg-park-bgHover" aria-label="Закрыть"><LuX size={18} /></button>
          </div>
          <div className="flex gap-2 border-t border-park-border p-2.5">
            <CusButton size="lg" color="success" className="flex-1" onClick={() => serve(a)}>Подано</CusButton>
            <CusButton size="lg" variant="outline" className="flex-1" onClick={() => { onDismiss(a.id); navigate('/waiter/orders') }}>Заказы</CusButton>
          </div>
        </div>
      ))}
    </div>
  )
}
