import { Link } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { cn } from '@/lib/cn'
import { fmtMoney, fmtQty } from '@/utils/format'
import type { LowStockItem, PendingDelivery } from '../types'

/** Склад: что заканчивается и какие поставки ещё не пришли. */
export default function WarehouseCard({ lowStock, deliveries }: { lowStock: LowStockItem[]; deliveries: PendingDelivery[] }) {
  return (
    <CusCard>
      <CusCardHeader title="Склад и поставки" subtitle="Что заканчивается и чего ждём" actions={<Link to="/warehouse/orders" className="text-xs font-semibold text-primary hover:underline">Заказы →</Link>} />

      <p className="px-5 pt-3 text-xs font-semibold uppercase tracking-wide text-park-textMuted">Ниже минимального остатка</p>
      <ul className="divide-y divide-park-border">
        {lowStock.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
            <Link to="/warehouse/stock" className="min-w-0 truncate text-sm font-semibold text-park-text hover:text-primary">{p.name}</Link>
            <span className={cn('shrink-0 text-sm font-semibold', p.qty <= 0 ? 'text-danger' : 'text-warning')}>{fmtQty(p.qty)} <span className="font-normal text-park-textMuted">из {fmtQty(p.minStock)} {p.unit}</span></span>
          </li>
        ))}
        {lowStock.length === 0 && <li className="px-5 py-4 text-sm text-park-textMuted">Всё выше минимума</li>}
      </ul>

      <p className="border-t border-park-border px-5 pt-3 text-xs font-semibold uppercase tracking-wide text-park-textMuted">Ждём поставки</p>
      <ul className="divide-y divide-park-border">
        {deliveries.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-park-text">{d.supplier}</p>
              <p className="text-xs text-park-textMuted">{d.number} · {fmtMoney(d.sum)} сум</p>
            </div>
            <span className={cn('shrink-0 text-sm font-semibold', d.days >= 3 ? 'text-danger' : 'text-park-text3')}>{d.days === 0 ? 'сегодня' : `${d.days} дн.`}</span>
          </li>
        ))}
        {deliveries.length === 0 && <li className="px-5 py-4 text-sm text-park-textMuted">Отправленных заказов нет</li>}
      </ul>
    </CusCard>
  )
}
