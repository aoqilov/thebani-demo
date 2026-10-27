import { useMemo, useState } from 'react'
import { LuCheck, LuX } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { SERVICE_PCT, billTotals, checkPayment } from '@/data/billing'
import { cn } from '@/lib/cn'
import { PAY_METHOD_LABEL, type Order, type PayMethod } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import { CURRENT_CASHIER, useCloseOrder } from '../../hooks/useCashier'

interface Line { id: number; method: PayMethod; amount: string }

const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0
const methods = Object.keys(PAY_METHOD_LABEL) as PayMethod[]
const percents = [0, 5, 10, 15, 20]

interface Props {
  order: Order
  shiftOpen: boolean
  onClosed: (order: Order) => void
  onOpenShift: () => void
}

export default function PaymentPanel({ order, shiftOpen, onClosed, onOpenShift }: Props) {
  const close = useCloseOrder()
  const [pct, setPct] = useState(0)
  const [custom, setCustom] = useState('')
  const [serviceOn, setServiceOn] = useState(order.items.length > 0)
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState<string | null>(null)

  const subtotal = billTotals(order, 0, false).subtotal
  const discount = custom ? num(custom) : Math.round((subtotal * pct) / 100)
  const totals = billTotals(order, discount, serviceOn)
  const payLines = useMemo(() => lines.map((l) => ({ method: l.method, amount: num(l.amount) })), [lines])
  const chk = checkPayment(totals.total, payLines)
  const canClose = shiftOpen && chk.remaining === 0 && !chk.error && totals.total > 0 && !close.isPending

  function addMethod(method: PayMethod) {
    const rest = Math.max(totals.total - lines.reduce((s, l) => s + num(l.amount), 0), 0)
    setLines((ls) => [...ls, { id: Date.now() + ls.length, method, amount: rest ? String(rest) : '' }])
  }
  const setAmount = (id: number, amount: string) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, amount } : l)))

  /** Подсказки по купюрам для наличных. */
  const cashHints = [...new Set([totals.total, Math.ceil(totals.total / 50000) * 50000, Math.ceil(totals.total / 100000) * 100000, Math.ceil(totals.total / 500000) * 500000])].filter((v) => v >= totals.total)

  async function submit() {
    setError(null)
    try {
      const closed = await close.mutateAsync({ orderId: order.id, discount: totals.discount, serviceOn, lines: payLines, cashier: CURRENT_CASHIER })
      onClosed(closed)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const chip = (active: boolean) => cn('min-h-11 rounded-xl border-2 px-4 text-sm font-semibold transition active:scale-95', active ? 'border-primary bg-primary/10 text-primary' : 'border-park-border text-park-text3 hover:bg-park-bgHover')

  return (
    <CusCard>
      <CusCardHeader title="Оплата" />
      <div className="space-y-5 p-5">
        {!shiftOpen && (
          <CusAlert color="danger">
            Смена не открыта. <button className="font-bold underline" onClick={onOpenShift}>Открыть смену</button>
          </CusAlert>
        )}
        {error && <CusAlert color="danger">{error}</CusAlert>}

        <section>
          <p className="mb-2 text-sm font-semibold text-park-text3">Скидка</p>
          <div className="flex flex-wrap gap-2">
            {percents.map((p) => <button key={p} className={chip(!custom && pct === p)} onClick={() => { setPct(p); setCustom('') }}>{p === 0 ? 'Нет' : `${p}%`}</button>)}
            <input
              inputMode="numeric"
              placeholder="своя, сум"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="min-h-11 w-32 rounded-xl border-2 border-park-border bg-park-bgInput px-3 text-sm text-park-text outline-none focus:border-primary"
            />
          </div>
        </section>

        <CusSwitch checked={serviceOn} onChange={setServiceOn} label={`Обслуживание ${SERVICE_PCT}% (кухня и бар)`} />

        <dl className="space-y-1.5 rounded-xl bg-park-bgHover/60 p-4 text-sm">
          <div className="flex justify-between"><dt className="text-park-textMuted">Сумма счёта</dt><dd className="text-park-text">{fmtMoney(totals.subtotal)}</dd></div>
          {totals.discount > 0 && <div className="flex justify-between"><dt className="text-park-textMuted">Скидка</dt><dd className="text-danger">−{fmtMoney(totals.discount)}</dd></div>}
          {totals.service > 0 && <div className="flex justify-between"><dt className="text-park-textMuted">Обслуживание</dt><dd className="text-park-text">+{fmtMoney(totals.service)}</dd></div>}
          <div className="flex items-end justify-between border-t border-park-border pt-2"><dt className="font-bold text-park-text">К оплате</dt><dd className="text-3xl font-bold text-park-text">{fmtMoney(totals.total)}</dd></div>
        </dl>

        <section>
          <p className="mb-2 text-sm font-semibold text-park-text3">Способ оплаты</p>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => <button key={m} className={chip(false)} onClick={() => addMethod(m)}>+ {PAY_METHOD_LABEL[m]}</button>)}
          </div>
          <ul className="mt-3 space-y-2">
            {lines.map((l) => (
              <li key={l.id} className="rounded-xl border border-park-border p-3">
                <div className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-sm font-bold text-park-text">{PAY_METHOD_LABEL[l.method]}</span>
                  <input
                    inputMode="numeric"
                    value={l.amount}
                    onChange={(e) => setAmount(l.id, e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-park-border bg-park-bgInput px-3 text-right text-lg font-bold text-park-text outline-none focus:border-primary"
                  />
                  <button onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} className="rounded-lg p-2 text-park-textMuted hover:text-danger" aria-label="Убрать"><LuX size={18} /></button>
                </div>
                {l.method === 'cash' && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cashHints.map((h) => (
                      <button key={h} onClick={() => setAmount(l.id, String(h))} className="rounded-lg bg-park-bgHover px-3 py-1.5 text-xs font-semibold text-park-text3 active:scale-95">{h === totals.total ? 'Ровно' : fmtMoney(h)}</button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-park-textMuted">Принято</span><span className="font-semibold text-park-text">{fmtMoney(chk.received)}</span></div>
          {chk.remaining > 0 && <div className="flex justify-between"><span className="text-park-textMuted">Осталось принять</span><span className="font-bold text-danger">{fmtMoney(chk.remaining)}</span></div>}
          {chk.change > 0 && <div className="flex justify-between"><span className="text-park-textMuted">Сдача</span><span className="text-xl font-bold text-success">{fmtMoney(chk.change)}</span></div>}
          {chk.error && <p className="font-semibold text-danger">{chk.error}</p>}
        </div>

        <CusButton size="lg" color="success" className="w-full" leftIcon={<LuCheck size={20} />} isDisabled={!canClose} isLoading={close.isPending} onClick={submit}>
          Закрыть счёт
        </CusButton>
      </div>
    </CusCard>
  )
}
