import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { PAY_METHOD_LABEL, chargesTotal, type Order, type TableDef } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'

const row = 'flex justify-between gap-3'

/** Чек закрытого счёта. */
export default function ReceiptDialog({ order, table, onClose }: { order: Order | null; table?: TableDef; onClose: () => void }) {
  const p = order?.payment
  return (
    <CusDialog open={!!order} onClose={onClose} size="sm" title="Счёт закрыт" footer={<CusButton size="lg" className="w-full" onClick={onClose}>Готово</CusButton>}>
      {order && p && (
        <div className="space-y-3 font-mono text-xs text-park-text">
          <div className="text-center">
            <p className="text-base font-bold">THEBANI</p>
            <p className="text-park-textMuted">Чек № {order.id} · {table?.name}</p>
            <p className="text-park-textMuted">{new Date(p.at).toLocaleString('ru-RU')}</p>
          </div>
          <hr className="border-dashed border-park-border2" />
          {order.charges.map((c) => <div key={c.id} className={row}><span>{c.title}</span><span>{fmtMoney(c.amount)}</span></div>)}
          {order.items.map((i) => <div key={i.id} className={row}><span>{i.qty} × {i.name}</span><span>{fmtMoney(i.unitPrice * i.qty)}</span></div>)}
          <hr className="border-dashed border-park-border2" />
          <div className={row}><span>Сумма</span><span>{fmtMoney(p.subtotal)}</span></div>
          {p.discount > 0 && <div className={row}><span>Скидка</span><span>−{fmtMoney(p.discount)}</span></div>}
          {p.service > 0 && <div className={row}><span>Обслуживание</span><span>{fmtMoney(p.service)}</span></div>}
          <div className={`${row} text-base font-bold`}><span>ИТОГО</span><span>{fmtMoney(p.total)}</span></div>
          <hr className="border-dashed border-park-border2" />
          {p.lines.map((l, i) => <div key={i} className={row}><span>{PAY_METHOD_LABEL[l.method]}</span><span>{fmtMoney(l.amount)}</span></div>)}
          {p.change > 0 && <div className={`${row} font-bold`}><span>Сдача</span><span>{fmtMoney(p.change)}</span></div>}
          <p className="pt-1 text-center text-park-textMuted">Кассир: {p.cashier}</p>
          <p className="text-center text-park-textMuted">Тариф и услуги: {fmtMoney(chargesTotal(order))} · Спасибо за визит!</p>
        </div>
      )}
    </CusDialog>
  )
}
