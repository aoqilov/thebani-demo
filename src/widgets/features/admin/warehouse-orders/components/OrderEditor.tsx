import { useMemo, useState } from 'react'
import { LuArrowLeft, LuPackageCheck, LuPlus, LuSend, LuTrash2, LuWand } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { suggestOrder } from '@/data/purchasing'
import { PURCHASE_STATUS_LABEL, type PurchaseOrder } from '@/types/warehouse.types'
import { fmtMoney, fmtQty, today } from '@/utils/format'
import { useGroups, useMovements, useProducts, useStock, useSuppliers } from '../../warehouse-common/hooks/useWarehouse'
import { useDeletePurchaseOrder, usePurchaseOrder, useReceivePurchaseOrder, useSavePurchaseOrder, useSendPurchaseOrder } from '../../warehouse-common/hooks/useWarehouseOps'

interface EditLine { productId: number | null; qty: string; price: string }
const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0
const empty = (): EditLine => ({ productId: null, qty: '', price: '' })

export default function OrderEditor({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading } = usePurchaseOrder(id)
  if (id !== null && isLoading) return <div className="p-8 text-center text-park-textMuted">Загрузка…</div>
  const initial: PurchaseOrder | undefined = id === null ? { id: 0, number: 'Авто', date: today(), supplierId: null, status: 'draft', comment: '', lines: [] } : data
  if (!initial) return <CusAlert color="danger">Заказ не найден.</CusAlert>
  return <Form initial={initial} onClose={onClose} />
}

function Form({ initial, onClose }: { initial: PurchaseOrder; onClose: () => void }) {
  const { data: products = [] } = useProducts()
  const { data: suppliers = [] } = useSuppliers()
  const { data: groups = [] } = useGroups()
  const { data: stock = [] } = useStock()
  const { data: movements = [] } = useMovements()
  const save = useSavePurchaseOrder()
  const send = useSendPurchaseOrder()
  const receive = useReceivePurchaseOrder()
  const del = useDeletePurchaseOrder()

  const [meta, setMeta] = useState({ id: initial.id, number: initial.number, status: initial.status })
  const [date, setDate] = useState(initial.date)
  const [supplierId, setSupplierId] = useState<number | null>(initial.supplierId)
  const [comment, setComment] = useState(initial.comment)
  const [lines, setLines] = useState<EditLine[]>(initial.lines.length ? initial.lines.map((l) => ({ productId: l.productId, qty: String(l.qty), price: String(l.price) })) : [empty()])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const readOnly = meta.status !== 'draft'
  const busy = save.isPending || send.isPending || receive.isPending || del.isPending
  const stockMap = useMemo(() => new Map(stock.map((s) => [s.productId, s])), [stock])
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const options = useMemo(() => products.filter((p) => p.active && p.kind === 'goods').map((p) => ({ value: p.id, label: p.name, hint: p.unit })), [products])
  const lastPrice = useMemo(() => {
    const m = new Map<number, number>()
    for (const mv of [...movements].reverse()) if (mv.type === 'income' && !m.has(mv.productId)) m.set(mv.productId, mv.cost)
    return m
  }, [movements])

  const filled = lines.filter((l) => l.productId !== null)
  const total = filled.reduce((s, l) => s + num(l.qty) * num(l.price), 0)
  const patch = (i: number, p: Partial<EditLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...p } : l)))

  function suggest() {
    setError(null)
    if (!supplierId) return setError('Сначала выберите поставщика.')
    const items = suggestOrder(supplierId, products, groups, stock, lastPrice)
    if (!items.length) return setNotice('У этого поставщика нет товаров ниже минимального остатка.')
    setNotice(`Предложено позиций: ${items.length} — товары ниже минимального остатка.`)
    setLines(items.map((s) => ({ productId: s.productId, qty: String(s.qty), price: String(s.price) })))
  }

  function toOrder(): PurchaseOrder {
    return {
      id: meta.id, number: meta.number, date, supplierId, status: 'draft', comment,
      lines: filled.map((l) => ({ productId: l.productId!, qty: num(l.qty), price: num(l.price) })),
    }
  }

  async function run(fn: (id: number) => Promise<unknown>, close: boolean) {
    setError(null)
    setNotice(null)
    try {
      const saved = meta.status === 'draft' ? await save.mutateAsync(toOrder()) : { id: meta.id, number: meta.number }
      setMeta((m) => ({ ...m, id: saved.id, number: saved.number }))
      await fn(saved.id)
      if (close) onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    try { await del.mutateAsync(meta.id); onClose() } catch (e) { setConfirm(false); setError((e as Error).message) }
  }

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-park-textMuted'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CusButton variant="ghost" size="sm" leftIcon={<LuArrowLeft size={15} />} onClick={onClose}>К списку</CusButton>
        <h2 className="text-lg font-bold text-park-text">Заказ поставщику № {meta.number}</h2>
        <CusBadge color={meta.status === 'received' ? 'success' : meta.status === 'sent' ? 'info' : 'warning'}>{PURCHASE_STATUS_LABEL[meta.status]}</CusBadge>
      </div>

      {error && <CusAlert color="danger">{error}</CusAlert>}
      {notice && <CusAlert color="info">{notice}</CusAlert>}
      {meta.status === 'sent' && <CusAlert color="info">Заказ отправлен поставщику. Когда товар привезут — нажмите «Принять товар»: на склад придёт приходная накладная.</CusAlert>}
      {meta.status === 'received' && <CusAlert color="success">Товар принят: приходная накладная создана и проведена, остатки на складе обновлены.</CusAlert>}

      <CusCard>
        <CusCardHeader title="Реквизиты" />
        <div className="grid grid-cols-1 gap-4 p-5 tablet:grid-cols-4">
          <CusInput label="Номер" value={meta.number} readOnly />
          <CusInput label="Дата" type="date" value={date} disabled={readOnly} onChange={(e) => setDate(e.target.value)} />
          <CusSelect label="Поставщик" disabled={readOnly} value={supplierId ?? ''} onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : null)} options={[{ value: '', label: '— выберите —' }, ...suppliers.map((s) => ({ value: String(s.id), label: s.name }))]} />
          <CusInput label="Комментарий" value={comment} disabled={readOnly} onChange={(e) => setComment(e.target.value)} />
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader
          title="Позиции"
          actions={!readOnly && (
            <div className="flex gap-2">
              <CusButton size="sm" variant="outline" color="secondary" leftIcon={<LuWand size={14} />} onClick={suggest}>Предложить по остаткам</CusButton>
              <CusButton size="sm" variant="outline" leftIcon={<LuPlus size={14} />} onClick={() => setLines((ls) => [...ls, empty()])}>Добавить</CusButton>
            </div>
          )}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="bg-park-bgHover/60">
              <tr>
                <th className={`${th} w-10`}>№</th><th className={th}>Товар</th><th className={`${th} w-14`}>Ед.</th>
                <th className={`${th} w-24 text-right`}>На складе</th><th className={`${th} w-24 text-right`}>Минимум</th>
                <th className={`${th} w-28 text-right`}>Заказать</th><th className={`${th} w-32 text-right`}>Цена, сум</th><th className={`${th} w-32 text-right`}>Сумма, сум</th><th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const p = l.productId ? productMap.get(l.productId) : undefined
                const have = l.productId ? (stockMap.get(l.productId)?.qty ?? 0) : 0
                const low = p && have < p.minStock
                return (
                  <tr key={i} className="border-t border-park-border">
                    <td className="px-3 py-1.5 text-park-textMuted">{i + 1}</td>
                    <td className="px-3 py-1.5"><CusCombobox options={options} value={l.productId} disabled={readOnly} placeholder="Выберите товар…" onChange={(v) => patch(i, { productId: Number(v), price: l.price || String(Math.round(lastPrice.get(Number(v)) ?? stockMap.get(Number(v))?.avgCost ?? 0)) })} /></td>
                    <td className="px-3 py-1.5 text-park-textMuted">{p?.unit ?? '—'}</td>
                    <td className={`px-3 py-1.5 text-right ${low ? 'font-semibold text-danger' : 'text-park-textMuted'}`}>{p ? fmtQty(have) : '—'}</td>
                    <td className="px-3 py-1.5 text-right text-park-textMuted">{p ? fmtQty(p.minStock) : '—'}</td>
                    <td className="px-3 py-1.5"><input inputMode="decimal" value={l.qty} disabled={readOnly} onChange={(e) => patch(i, { qty: e.target.value })} className="w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover" /></td>
                    <td className="px-3 py-1.5"><input inputMode="decimal" value={l.price} disabled={readOnly} onChange={(e) => patch(i, { price: e.target.value })} className="w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover" /></td>
                    <td className="px-3 py-1.5 text-right font-semibold text-park-text">{fmtMoney(num(l.qty) * num(l.price))}</td>
                    <td className="px-2 py-1.5">{!readOnly && <button onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : [empty()]))} className="rounded-md p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Удалить"><LuTrash2 size={15} /></button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-6 border-t border-park-border bg-park-bgHover/60 px-5 py-3 text-sm">
          <span className="text-park-textMuted">Позиций: {filled.length}</span>
          <span className="text-park-text">Итого: <b className="text-base">{fmtMoney(total)}</b> сум</span>
        </div>
      </CusCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>{meta.status !== 'received' && meta.id !== 0 && <CusButton variant="outline" color="danger" leftIcon={<LuTrash2 size={15} />} isDisabled={busy} onClick={() => setConfirm(true)}>Удалить</CusButton>}</div>
        <div className="flex flex-wrap gap-2">
          <CusButton variant="ghost" onClick={onClose}>Закрыть</CusButton>
          {meta.status === 'draft' && (
            <>
              <CusButton variant="outline" isLoading={save.isPending && !send.isPending} isDisabled={busy} onClick={() => run(async () => undefined, true)}>Сохранить черновик</CusButton>
              <CusButton leftIcon={<LuSend size={15} />} isLoading={send.isPending} isDisabled={busy} onClick={() => run((id) => send.mutateAsync(id), true)}>Отправить поставщику</CusButton>
            </>
          )}
          {meta.status === 'sent' && <CusButton color="success" leftIcon={<LuPackageCheck size={15} />} isLoading={receive.isPending} isDisabled={busy} onClick={() => run((id) => receive.mutateAsync(id), true)}>Принять товар</CusButton>}
        </div>
      </div>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={del.isPending} text={`Удалить заказ № ${meta.number}?`} />
    </div>
  )
}
