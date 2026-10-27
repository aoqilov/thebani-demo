import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusDrawer } from '@/components/ui/dialog/CusDrawer'
import { CusInfoRow } from '@/components/shared/card/CusCard'
import type { Product, StockRow } from '@/types/warehouse.types'
import { fmtDate, fmtMoney, fmtQty } from '@/utils/format'
import { useMovements } from '../../warehouse-common/hooks/useWarehouse'

export default function StockMovementsDrawer({ product, stock, onClose }: { product: Product | null; stock?: StockRow; onClose: () => void }) {
  const { data: movements = [], isLoading } = useMovements(product?.id)

  return (
    <CusDrawer open={!!product} onClose={onClose} title={product?.name ?? ''}>
      {product && (
        <div className="space-y-5">
          <div className="divide-y divide-park-border rounded-md border border-park-border px-4">
            <CusInfoRow label="Код" value={product.code} />
            <CusInfoRow label="Остаток" value={`${fmtQty(stock?.qty ?? 0)} ${product.unit}`} />
            <CusInfoRow label="Средняя себестоимость" value={`${fmtMoney(stock?.avgCost ?? 0)} сум / ${product.unit}`} />
            <CusInfoRow label="Стоимость остатка" value={`${fmtMoney(stock?.sum ?? 0)} сум`} />
            <CusInfoRow label="Минимальный остаток" value={`${fmtQty(product.minStock)} ${product.unit}`} />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-bold text-park-text">Движение товара</h4>
            {isLoading && <p className="text-sm text-park-textMuted">Загрузка…</p>}
            {!isLoading && !movements.length && <p className="text-sm text-park-textMuted">Движений пока нет.</p>}
            <ul className="space-y-2">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-md border border-park-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-park-text">{m.docNumber}</p>
                    <p className="text-xs text-park-textMuted">{fmtDate(m.date)} · {fmtMoney(m.cost)} сум</p>
                  </div>
                  <CusBadge color={m.qty > 0 ? 'success' : 'danger'}>{m.qty > 0 ? '+' : ''}{fmtQty(m.qty)} {product.unit}</CusBadge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </CusDrawer>
  )
}
