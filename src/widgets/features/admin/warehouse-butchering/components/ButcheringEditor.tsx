import { useMemo, useState } from 'react'
import { LuArrowLeft, LuCheck, LuPlus, LuTrash2, LuUndo2 } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import { unitCost } from '@/data/recipe.calc'
import type { Butchering } from '@/types/warehouse.types'
import { fmtMoney, fmtQty, today } from '@/utils/format'
import DocStatusBadge from '../../warehouse-common/components/DocStatusBadge'
import { useButchering, useDeleteButchering, usePostButchering, useSaveButchering, useUnpostButchering } from '../../warehouse-common/hooks/useWarehouseOps'
import { useCostCtx } from '../../warehouse-recipes/components/useCostCtx'

interface EditOut { productId: number | null; qty: string; share: string }
const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0
const emptyOut = (): EditOut => ({ productId: null, qty: '', share: '' })

export default function ButcheringEditor({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading } = useButchering(id)
  if (id !== null && isLoading) return <div className="p-8 text-center text-park-textMuted">Загрузка…</div>
  const initial: Butchering | undefined = id === null
    ? { id: 0, number: 'Авто', date: today(), status: 'draft', comment: '', inputProductId: 0, inputQty: 0, outputs: [], docIds: [] }
    : data
  if (!initial) return <CusAlert color="danger">Акт не найден.</CusAlert>
  return <Form initial={initial} onClose={onClose} />
}

function Form({ initial, onClose }: { initial: Butchering; onClose: () => void }) {
  const { ctx, products } = useCostCtx()
  const save = useSaveButchering()
  const post = usePostButchering()
  const unpost = useUnpostButchering()
  const del = useDeleteButchering()

  const [meta, setMeta] = useState({ id: initial.id, number: initial.number, status: initial.status })
  const [date, setDate] = useState(initial.date)
  const [comment, setComment] = useState(initial.comment)
  const [inputId, setInputId] = useState<number | null>(initial.inputProductId || null)
  const [inputQty, setInputQty] = useState(initial.inputQty ? String(initial.inputQty) : '')
  const [outs, setOuts] = useState<EditOut[]>(
    initial.outputs.length ? initial.outputs.map((o) => ({ productId: o.productId, qty: String(o.qty), share: String(o.sharePct) })) : [emptyOut(), emptyOut()],
  )
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const readOnly = meta.status === 'posted'
  const busy = save.isPending || post.isPending || unpost.isPending || del.isPending
  const options = useMemo(() => products.filter((p) => p.active && p.kind !== 'dish').map((p) => ({ value: p.id, label: p.name, hint: p.unit })), [products])

  const input = inputId ? ctx.products.get(inputId) : undefined
  const have = inputId ? ctx.stock.get(inputId)?.qty ?? 0 : 0
  const qtyNum = num(inputQty)
  const totalCost = inputId ? qtyNum * unitCost(inputId, ctx) : 0
  const shareSum = outs.reduce((s, o) => s + num(o.share), 0)
  const waste = 100 - shareSum
  const shortage = !!inputId && qtyNum > have + 1e-9
  const filled = outs.filter((o) => o.productId !== null && num(o.qty) > 0)

  const patch = (i: number, p: Partial<EditOut>) => setOuts((os) => os.map((o, idx) => (idx === i ? { ...o, ...p } : o)))

  function toButchering(): Butchering {
    return {
      id: meta.id, number: meta.number, date, status: 'draft', comment, docIds: [],
      inputProductId: inputId ?? 0, inputQty: qtyNum,
      outputs: filled.map((o) => ({ productId: o.productId!, qty: num(o.qty), sharePct: num(o.share) })),
    }
  }

  async function persist(thenPost: boolean) {
    setError(null)
    try {
      const saved = await save.mutateAsync(toButchering())
      setMeta((m) => ({ ...m, id: saved.id, number: saved.number }))
      if (thenPost) await post.mutateAsync(saved.id)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doUnpost() {
    setError(null)
    try { await unpost.mutateAsync(meta.id); setMeta((m) => ({ ...m, status: 'draft' })) } catch (e) { setError((e as Error).message) }
  }

  async function doDelete() {
    try { await del.mutateAsync(meta.id); onClose() } catch (e) { setConfirm(false); setError((e as Error).message) }
  }

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const field = 'w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover'
  const canPost = !!inputId && qtyNum > 0 && filled.length > 0 && waste >= -1e-9 && !shortage

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CusButton variant="ghost" size="sm" leftIcon={<LuArrowLeft size={15} />} onClick={onClose}>К списку</CusButton>
        <h2 className="text-lg font-bold text-park-text">Акт разделки № {meta.number}</h2>
        <DocStatusBadge status={meta.status} />
      </div>

      {error && <CusAlert color="danger">{error}</CusAlert>}
      {readOnly && <CusAlert color="info">Акт проведён: сырьё списано, продукты оприходованы. Чтобы изменить — отмените проведение.</CusAlert>}

      <CusCard>
        <CusCardHeader title="Реквизиты" />
        <div className="grid grid-cols-1 gap-4 p-5 tablet:grid-cols-3">
          <CusInput label="Номер" value={meta.number} readOnly />
          <CusInput label="Дата" type="date" value={date} disabled={readOnly} onChange={(e) => setDate(e.target.value)} />
          <CusInput label="Комментарий" value={comment} disabled={readOnly} onChange={(e) => setComment(e.target.value)} />
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader title="Что разделываем" subtitle={inputId ? `На складе: ${fmtQty(have)} ${input?.unit ?? ''}` : undefined} />
        <div className="grid grid-cols-1 gap-4 p-5 tablet:grid-cols-[1fr_12rem]">
          <div>
            <span className="mb-1 block text-sm font-semibold text-park-text3">Сырьё</span>
            <CusCombobox options={options} value={inputId} disabled={readOnly} placeholder="Например: Курица тушка…" onChange={(v) => setInputId(Number(v))} />
          </div>
          <CusInput label={`Количество${input ? `, ${input.unit}` : ''}`} inputMode="decimal" value={inputQty} disabled={readOnly} onChange={(e) => setInputQty(e.target.value)} />
        </div>
        {shortage && !readOnly && <p className="px-5 pb-4 text-sm font-semibold text-danger">Не хватает на складе: {fmtQty(qtyNum - have)} {input?.unit}</p>}
      </CusCard>

      <CusCard>
        <CusCardHeader
          title="Что получили"
          subtitle={`Себестоимость сырья: ${fmtMoney(readOnly && initial.totalCost ? initial.totalCost : Math.round(totalCost))} сум`}
          actions={!readOnly && <CusButton size="sm" variant="outline" leftIcon={<LuPlus size={14} />} onClick={() => setOuts((os) => [...os, emptyOut()])}>Добавить</CusButton>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-park-bgHover/60"><tr><th className={`${th} w-10`}>№</th><th className={th}>Продукт</th><th className={`${th} w-14`}>Ед.</th><th className={`${th} w-32 text-right`}>Количество</th><th className={`${th} w-28 text-right`}>Доля, %</th><th className={`${th} w-36 text-right`}>Себестоимость ед.</th><th className="w-10" /></tr></thead>
            <tbody>
              {outs.map((o, i) => {
                const p = o.productId ? ctx.products.get(o.productId) : undefined
                const q = num(o.qty)
                const perUnit = q > 0 ? (totalCost * num(o.share)) / 100 / q : 0
                return (
                  <tr key={i} className="border-t border-park-border">
                    <td className="px-3 py-1.5 text-park-textMuted">{i + 1}</td>
                    <td className="min-w-56 px-3 py-1.5"><CusCombobox options={options.filter((x) => x.value !== inputId)} value={o.productId} disabled={readOnly} placeholder="Выберите продукт…" onChange={(v) => patch(i, { productId: Number(v) })} /></td>
                    <td className="px-3 py-1.5 text-park-textMuted">{p?.unit ?? '—'}</td>
                    <td className="px-3 py-1.5"><input inputMode="decimal" value={o.qty} disabled={readOnly} onChange={(e) => patch(i, { qty: e.target.value })} className={field} /></td>
                    <td className="px-3 py-1.5"><input inputMode="decimal" value={o.share} disabled={readOnly} onChange={(e) => patch(i, { share: e.target.value })} className={field} /></td>
                    <td className="px-3 py-1.5 text-right text-park-textMuted">{p && q > 0 ? fmtMoney(Math.round(perUnit)) : '—'}</td>
                    <td className="px-2 py-1.5">{!readOnly && <button onClick={() => setOuts((os) => (os.length > 1 ? os.filter((_, idx) => idx !== i) : [emptyOut()]))} className="rounded-md p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Удалить"><LuTrash2 size={15} /></button>}</td>
                  </tr>
                )
              })}
              <tr className="border-t border-park-border bg-park-bgHover/40 font-semibold">
                <td colSpan={4} className="px-3 py-2 text-right text-park-text3">Распределено</td>
                <td className={`px-3 py-2 text-right ${waste < -1e-9 ? 'text-danger' : 'text-park-text'}`}>{fmtQty(shareSum)}%</td>
                <td colSpan={2} className={`px-3 py-2 ${waste < -1e-9 ? 'text-danger' : 'text-park-textMuted'}`}>{waste < -1e-9 ? 'Больше 100%!' : `Отход: ${fmtQty(waste)}% (${fmtMoney(Math.round((totalCost * Math.max(waste, 0)) / 100))} сум)`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CusCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>{!readOnly && meta.id !== 0 && <CusButton variant="outline" color="danger" leftIcon={<LuTrash2 size={15} />} isDisabled={busy} onClick={() => setConfirm(true)}>Удалить</CusButton>}</div>
        <div className="flex flex-wrap gap-2">
          <CusButton variant="ghost" onClick={onClose}>Закрыть</CusButton>
          {readOnly
            ? <CusButton color="warning" leftIcon={<LuUndo2 size={15} />} isLoading={unpost.isPending} onClick={doUnpost}>Отменить проведение</CusButton>
            : <>
                <CusButton variant="outline" isLoading={save.isPending && !post.isPending} isDisabled={busy} onClick={() => persist(false)}>Сохранить черновик</CusButton>
                <CusButton color="success" leftIcon={<LuCheck size={15} />} isLoading={post.isPending} isDisabled={busy || !canPost} onClick={() => persist(true)}>Провести</CusButton>
              </>}
        </div>
      </div>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={del.isPending} text={`Удалить акт № ${meta.number}?`} />
    </div>
  )
}
