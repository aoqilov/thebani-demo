import { useMemo, useState } from 'react'
import { LuArrowLeft, LuCheck, LuPlus, LuTrash2, LuUndo2 } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { EXPENSE_REASONS, type DocType, type WarehouseDoc } from '@/types/warehouse.types'
import { fmtMoney, fmtQty, today } from '@/utils/format'
import { useDeleteDoc, useDoc, useMovements, usePostDoc, useProducts, useSaveDoc, useStock, useSuppliers, useUnpostDoc } from '../hooks/useWarehouse'
import DocStatusBadge from './DocStatusBadge'

interface EditLine {
  productId: number | null
  qty: string
  price: string
}

const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0
const emptyLine = (): EditLine => ({ productId: null, qty: '', price: '' })

function newDoc(type: DocType): WarehouseDoc {
  return { id: 0, type, number: 'Авто', date: today(), status: 'draft', supplierId: null, reason: EXPENSE_REASONS[0], comment: '', lines: [] }
}

/** Загрузка документа → форма. */
export default function DocumentEditor({ type, docId, onClose }: { type: DocType; docId: number | null; onClose: () => void }) {
  const { data, isLoading } = useDoc(docId)
  if (docId !== null && isLoading) return <div className="p-8 text-center text-park-textMuted">Загрузка…</div>
  const initial = docId === null ? newDoc(type) : data
  if (!initial) return <CusAlert color="danger">Документ не найден.</CusAlert>
  return <EditorForm initial={initial} onClose={onClose} />
}

function EditorForm({ initial, onClose }: { initial: WarehouseDoc; onClose: () => void }) {
  const isIncome = initial.type === 'income'
  const { data: products = [] } = useProducts()
  const { data: suppliers = [] } = useSuppliers()
  const { data: stock = [] } = useStock()
  const { data: movements = [] } = useMovements()
  const saveDoc = useSaveDoc()
  const postDoc = usePostDoc()
  const unpostDoc = useUnpostDoc()
  const deleteDoc = useDeleteDoc()

  const [meta, setMeta] = useState({ id: initial.id, number: initial.number, status: initial.status })
  const [date, setDate] = useState(initial.date)
  const [supplierId, setSupplierId] = useState<number | null>(initial.supplierId)
  const [reason, setReason] = useState(initial.reason || EXPENSE_REASONS[0])
  const [comment, setComment] = useState(initial.comment)
  const [lines, setLines] = useState<EditLine[]>(
    initial.lines.length ? initial.lines.map((l) => ({ productId: l.productId, qty: String(l.qty), price: String(l.price) })) : [emptyLine()],
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const auto = !!initial.source
  const readOnly = meta.status === 'posted'
  const busy = saveDoc.isPending || postDoc.isPending || unpostDoc.isPending || deleteDoc.isPending
  const stockMap = useMemo(() => new Map(stock.map((s) => [s.productId, s])), [stock])
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const options = useMemo(() => products.filter((p) => p.active && p.kind !== 'dish').map((p) => ({ value: p.id, label: p.name, hint: p.unit })), [products])

  /** Цена строки: приход — введённая; расход — себестоимость (при проведении — из движения). */
  function unitCost(l: EditLine): number {
    if (isIncome) return num(l.price)
    if (l.productId === null) return 0
    if (readOnly) return Math.abs(movements.find((m) => m.docId === meta.id && m.productId === l.productId)?.cost ?? 0)
    return stockMap.get(l.productId)?.avgCost ?? 0
  }

  const total = lines.reduce((s, l) => s + num(l.qty) * unitCost(l), 0)
  const filled = lines.filter((l) => l.productId !== null)

  const patch = (i: number, p: Partial<EditLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...p } : l)))

  function toDoc(): WarehouseDoc {
    return {
      id: meta.id, type: initial.type, number: meta.number, date, status: 'draft', supplierId: isIncome ? supplierId : null,
      reason: isIncome ? '' : reason, comment,
      lines: filled.map((l) => ({ productId: l.productId!, qty: num(l.qty), price: isIncome ? num(l.price) : 0 })),
    }
  }

  async function persist(thenPost: boolean) {
    setError(null)
    try {
      const saved = await saveDoc.mutateAsync(toDoc())
      setMeta((m) => ({ ...m, id: saved.id, number: saved.number }))
      if (thenPost) {
        await postDoc.mutateAsync(saved.id)
        setMeta((m) => ({ ...m, status: 'posted' }))
      }
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function unpost() {
    setError(null)
    try {
      await unpostDoc.mutateAsync(meta.id)
      setMeta((m) => ({ ...m, status: 'draft' }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function remove() {
    try {
      await deleteDoc.mutateAsync(meta.id)
      onClose()
    } catch (e) {
      setConfirmDelete(false)
      setError((e as Error).message)
    }
  }

  const title = isIncome ? 'Приходная накладная' : 'Акт списания'
  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-park-textMuted'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CusButton variant="ghost" size="sm" leftIcon={<LuArrowLeft size={15} />} onClick={onClose}>К списку</CusButton>
        <h2 className="text-lg font-bold text-park-text">{title} № {meta.number}</h2>
        <DocStatusBadge status={meta.status} />
      </div>

      {error && <CusAlert color="danger">{error}</CusAlert>}
      {auto && <CusAlert color="warning">Документ создан автоматически ({initial.source}). Изменить или отменить его можно только через документ-источник.</CusAlert>}
      {readOnly && !auto && <CusAlert color="info">Документ проведён и недоступен для редактирования. Чтобы изменить — отмените проведение.</CusAlert>}

      <CusCard>
        <CusCardHeader title="Реквизиты" />
        <div className="grid grid-cols-1 gap-4 p-5 tablet:grid-cols-2 desktop:grid-cols-4">
          <CusInput label="Номер" value={meta.number} readOnly />
          <CusInput label="Дата" type="date" value={date} disabled={readOnly} onChange={(e) => setDate(e.target.value)} />
          {isIncome ? (
            <CusSelect
              label="Поставщик"
              disabled={readOnly}
              value={supplierId ?? ''}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : null)}
              options={[{ value: '', label: '— выберите —' }, ...suppliers.map((s) => ({ value: String(s.id), label: s.name }))]}
            />
          ) : (
            <CusSelect label="Причина списания" disabled={readOnly} value={reason} onChange={(e) => setReason(e.target.value)} options={[...EXPENSE_REASONS, ...(EXPENSE_REASONS.includes(reason as never) ? [] : [reason])].map((r) => ({ value: r, label: r }))} />
          )}
          <CusInput label="Склад" value="Основной склад" readOnly />
          <div className="tablet:col-span-2 desktop:col-span-4">
            <CusInput label="Комментарий" value={comment} disabled={readOnly} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader
          title="Позиции"
          subtitle={`${filled.length} из ${lines.length} строк заполнено`}
          actions={!readOnly && <CusButton size="sm" variant="outline" leftIcon={<LuPlus size={14} />} onClick={() => setLines((ls) => [...ls, emptyLine()])}>Добавить строку</CusButton>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-park-bgHover/60">
              <tr>
                <th className={`${th} w-10`}>№</th>
                <th className={th}>Товар</th>
                <th className={`${th} w-16`}>Ед.</th>
                {!isIncome && <th className={`${th} w-28 text-right`}>На складе</th>}
                <th className={`${th} w-32 text-right`}>Количество</th>
                <th className={`${th} w-36 text-right`}>{isIncome ? 'Цена, сум' : 'Себестоимость'}</th>
                <th className={`${th} w-36 text-right`}>Сумма, сум</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const p = l.productId !== null ? productMap.get(l.productId) : undefined
                const onHand = l.productId !== null ? (stockMap.get(l.productId)?.qty ?? 0) : 0
                const short = !isIncome && !readOnly && p && num(l.qty) > onHand
                return (
                  <tr key={i} className="border-t border-park-border">
                    <td className="px-3 py-1.5 text-park-textMuted">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <CusCombobox
                        options={options}
                        value={l.productId}
                        disabled={readOnly}
                        placeholder="Начните вводить название…"
                        onChange={(v) => patch(i, { productId: Number(v) })}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-park-textMuted">{p?.unit ?? '—'}</td>
                    {!isIncome && (
                      <td className={`px-3 py-1.5 text-right ${short ? 'font-semibold text-danger' : 'text-park-textMuted'}`}>{p ? fmtQty(onHand) : '—'}</td>
                    )}
                    <td className="px-3 py-1.5">
                      <input
                        inputMode="decimal"
                        value={l.qty}
                        disabled={readOnly}
                        onChange={(e) => patch(i, { qty: e.target.value })}
                        className={`w-full rounded-md border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover ${short ? 'border-danger' : 'border-park-border'}`}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      {isIncome ? (
                        <input
                          inputMode="decimal"
                          value={l.price}
                          disabled={readOnly}
                          onChange={(e) => patch(i, { price: e.target.value })}
                          className="w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover"
                        />
                      ) : (
                        <div className="px-2.5 py-1.5 text-right text-park-textMuted">{fmtMoney(unitCost(l))}</div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-park-text">{fmtMoney(num(l.qty) * unitCost(l))}</td>
                    <td className="px-2 py-1.5">
                      {!readOnly && (
                        <button
                          onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : [emptyLine()]))}
                          className="rounded-md p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger"
                          aria-label="Удалить строку"
                        >
                          <LuTrash2 size={15} />
                        </button>
                      )}
                    </td>
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
        <div>
          {!readOnly && meta.id !== 0 && (
            <CusButton variant="outline" color="danger" leftIcon={<LuTrash2 size={15} />} isDisabled={busy} onClick={() => setConfirmDelete(true)}>Удалить</CusButton>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <CusButton variant="ghost" onClick={onClose}>Закрыть</CusButton>
          {readOnly ? (auto ? null : (
            <CusButton color="warning" leftIcon={<LuUndo2 size={15} />} isLoading={unpostDoc.isPending} onClick={unpost}>Отменить проведение</CusButton>
          )) : (
            <>
              <CusButton variant="outline" isLoading={saveDoc.isPending && !postDoc.isPending} isDisabled={busy} onClick={() => persist(false)}>Сохранить черновик</CusButton>
              <CusButton color="success" leftIcon={<LuCheck size={15} />} isLoading={postDoc.isPending} isDisabled={busy} onClick={() => persist(true)}>Провести</CusButton>
            </>
          )}
        </div>
      </div>

      <CusDialogDelete open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={remove} isLoading={deleteDoc.isPending} text={`Удалить документ № ${meta.number}?`} />
    </div>
  )
}
