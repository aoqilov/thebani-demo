import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CusCard } from '@/components/shared/card/CusCard'
import type { Order } from '@/types/order.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { pendingOvertime } from '@/data/overtime'
import { useTariffs } from '../../admin/tariffs/hooks/useTariffs'
import { useLockers } from '../../razdevalka/hooks/useLockers'
import { useNow } from '../../waiter/hooks/useNow'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'
import { CURRENT_CASHIER, useCurrentShift, useSettleOvertime } from '../hooks/useCashier'
import AccountList from './components/AccountList'
import BillView from './components/BillView'
import PaymentPanel from './components/PaymentPanel'
import ReceiptDialog from './modals/ReceiptDialog'
import ShopDialog from './modals/ShopDialog'

export default function FeatureCashierCheckout() {
  const navigate = useNavigate()
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const { shift } = useCurrentShift()
  const { data: lockers = [] } = useLockers()
  const { data: tariffs = [] } = useTariffs()
  const settle = useSettleOvertime()
  const now = useNow(30_000)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [receipt, setReceipt] = useState<Order | null>(null)
  const [shopFor, setShopFor] = useState<number | null>(null)

  const selected = orders.find((o) => o.id === selectedId)

  return (
    <div className="space-y-4">
      <PageHeader label="Кассир" title="Закрытие" highlight="счёта" subtitle="Гость вернул браслет — вся его карта в одном месте: тариф, массаж, еда и напитки, товары из магазина." />

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[340px_1fr]">
        <AccountList orders={orders} tables={tables} selectedId={selectedId} onSelect={setSelectedId} />

        {selected ? (
          <div className="grid grid-cols-1 items-start gap-4 wide:grid-cols-[1fr_400px]">
            <BillView order={selected} table={tables.find((t) => t.id === selected.tableId)} locker={lockers.find((l) => l.orderId === selected.id)?.number} onAddGoods={() => setShopFor(selected.id)} overtime={pendingOvertime(selected, tariffs, now)} onSettleOvertime={() => settle.mutate({ orderId: selected.id, by: CURRENT_CASHIER })} />
            <PaymentPanel
              key={selected.id}
              order={selected}
              shiftOpen={!!shift}
              onOpenShift={() => navigate('/cashier/smena')}
              onClosed={(o) => { setReceipt(o); setSelectedId(null) }}
            />
          </div>
        ) : (
          <CusCard className="p-12 text-center text-sm text-park-textMuted">Выберите счёт слева или считайте браслет гостя.</CusCard>
        )}
      </div>

      <ShopDialog orderId={shopFor} bracelet={orders.find((o) => o.id === shopFor)?.bracelet ?? null} onClose={() => setShopFor(null)} />
      <ReceiptDialog order={receipt} table={tables.find((t) => t.id === receipt?.tableId)} onClose={() => setReceipt(null)} />
    </div>
  )
}
