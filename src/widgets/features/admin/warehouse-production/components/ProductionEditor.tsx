import { useMemo, useState } from 'react'
import { LuArrowLeft, LuCheck, LuPlus, LuTrash2, LuUndo2 } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import { unitCost } from '@/data/recipe.calc'
import type { Production } from '@/types/warehouse.types'
import { fmtMoney, fmtQty, today } from '@/utils/format'
import DocStatusBadge from '../../warehouse-common/components/DocStatusBadge'
import { useDeleteProduction, usePostProduction, useProduction, useSaveProduction, useUnpostProduction } from '../../warehouse-common/hooks/useWarehouseOps'
import { useCostCtx } from '../../warehouse-recipes/components/useCostCtx'

interface EditLine { productId: number | null; qty: string }
const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0

export default function ProductionEditor({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading } = useProduction(id)
  if (id !== null && isLoading) return <div className="p-8 text-center text-park-textMuted">Загрузка…</div>
  const initial: Production | undefined = id === null ? { id: 0, number: 'Авто', date: today(), status: 'draft', comment: '', lines: [], docIds: [] } : data
  if (!initial) return <CusAlert color="danger">Акт не найден.</CusAlert>
  return <Form initial={initial} onClose={onClose} />
}

function Form({ initial, onClose }: { initial: Production; onClose: () => void }) {
  const { ctx, products } = useCostCtx()
  const save = useSaveProduction()
  const post = usePostProduction()
  const unpost = useUnpostProduction()
  const del = useDeleteProduction()

  const [meta, setMeta] = useState({ id: initial.id, number: initial.number, status: initial.status })
  const [date, setDate] = useState(initial.date)
  const [comment, setComment] = useState(initial.comment)
  const [lines, setLines] = useState<EditLine[]>(initial.lines.length ? initial.lines.map((l) => ({ productId: l.productId, qty: String(l.qty) })) : [{ productId: null, qty: '' }])
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const readOnly = meta.status === 'posted'
  const busy = save.isPending || post.isPending || unpost.isPending || del.isPending
  // заготовки, для которых есть тех. карта
  const options = useMemo(() => products.filter((p) => p.active && p.kind === 'prep' && ctx.recipes.has(p.id)).map((p) => ({ value: p.id, label: p.name, hint: p.unit })), [products, ctx])

  /** Расход сырья по всем строкам акта и его доступность на складе. */
  const needs = useMemo(() => {
    const raw = new Map<number, number>()
    let cost = 0
    for (const l of lines) {
      const r = l.productId ? ctx.recipes.get(l.productId) : undefined
      if (!r || !(num(l.qty) > 0)) continue
      const k = num(l.qty) / r.outputQty
      for (const rl of r.lines) {
        raw.set(rl.productId, (raw.get(rl.productId) ?? 0) + rl.gross * k)
        cost += rl.gross * k * unitCost(rl.productId, ctx)
      }
    }
    return { raw: [...raw.entries()].map(([pid, need]) => ({ pid, need, have: ctx.stock.get(pid)?.qty ?? 0 })), cost }
  }, [lines, ctx])

  const missing = needs.raw.filter((r) => r.have < r.need - 1e-9)
  const patch = (i: number, p: Partial<EditLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...p } : l)))
  const filled = lines.filter((l) => l.productId !== null && num(l.qty) > 0)

  function toProduction(): Production {
    return { id: meta.id, number: meta.number, date, status: 'draft', comment, docIds: [], lines: filled.map((l) => ({ productId: l.productId!, qty: num(l.qty) })) }
  }

  async function persist(thenPost: boolean) {
    setError(null)
    try {
      const saved = await save.mutateAsync(toProduction())
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CusButton variant="ghost" size="sm" leftIcon={<LuArrowLeft size={15} />} onClick={onClose}>К списку</CusButton>
        <h2 className="text-lg font-bold text-park-text">Акт приготовления № {meta.number}</h2>
        <DocStatusBadge status={meta.status} />
      </div>

      {error && <CusAlert color="danger">{error}</CusAlert>}
      {readOnly && <CusAlert color="info">Акт проведён: сырьё списано, заготовка оприходована. Чтобы изменить — отмените проведение.</CusAlert>}

      <CusCard>
        <CusCardHeader title="Реквизиты" />
        <div className="grid grid-cols-1 gap-4 p-5 tablet:grid-cols-3">
          <CusInput label="Номер" value={meta.number} readOnly />
          <CusInput label="Дата" type="date" value={date} disabled={readOnly} onChange={(e) => setDate(e.target.value)} />
          <CusInput label="Комментарий" value={comment} disabled={readOnly} onChange={(e) => setComment(e.target.value)} />
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader title="Что приготовили" actions={!readOnly && <CusButton size="sm" variant="outline" leftIcon={<LuPlus size={14} />} onClick={() => setLines((ls) => [...ls, { productId: null, qty: '' }])}>Добавить</CusButton>} />
        <table className="w-full text-sm">
          <thead className="bg-park-bgHover/60"><tr><th className={`${th} w-10`}>№</th><th className={th}>Заготовка</th><th className={`${th} w-14`}>Ед.</th><th className={`${th} w-36 text-right`}>Количество</th><th className={`${th} w-40 text-right`}>Себестоимость ед.</th><th className="w-10" /></tr></thead>
          <tbody>
            {lines.map((l, i) => {
              const p = l.productId ? ctx.products.get(l.productId) : undefined
              const r = l.productId ? ctx.recipes.get(l.productId) : undefined
              const perUnit = r ? r.lines.reduce((s, rl) => s + rl.gross * unitCost(rl.productId, ctx), 0) / r.outputQty : 0
              return (
                <tr key={i} className="border-t border-park-border">
                  <td className="px-3 py-1.5 text-park-textMuted">{i + 1}</td>
                  <td className="px-3 py-1.5"><CusCombobox options={options} value={l.productId} disabled={readOnly} placeholder="Выберите заготовку…" onChange={(v) => patch(i, { productId: Number(v) })} /></td>
                  <td className="px-3 py-1.5 text-park-textMuted">{p?.unit ?? '—'}</td>
                  <td className="px-3 py-1.5"><input inputMode="decimal" value={l.qty} disabled={readOnly} onChange={(e) => patch(i, { qty: e.target.value })} className="w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover" /></td>
                  <td className="px-3 py-1.5 text-right text-park-textMuted">{p ? fmtMoney(perUnit) : '—'}</td>
                  <td className="px-2 py-1.5">{!readOnly && <button onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : [{ productId: null, qty: '' }]))} className="rounded-md p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Удалить"><LuTrash2 size={15} /></button>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CusCard>

      <CusCard>
        <CusCardHeader title="Расход сырья по тех. карте" subtitle={readOnly && initial.totalCost ? `Себестоимость партии: ${fmtMoney(initial.totalCost)} сум` : `Себестоимость партии: ${fmtMoney(needs.cost)} сум`} />
        {needs.raw.length === 0 ? <p className="p-6 text-center text-sm text-park-textMuted">Выберите заготовку и количество — здесь появится расход сырья.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-park-bgHover/60"><tr><th className={th}>Сырьё</th><th className={`${th} w-32 text-right`}>Нужно</th><th className={`${th} w-32 text-right`}>На складе</th><th className={`${th} w-28`}>Статус</th></tr></thead>
            <tbody>
              {needs.raw.map((r) => {
                const p = ctx.products.get(r.pid)
                const ok = r.have >= r.need - 1e-9
                return (
                  <tr key={r.pid} className="border-t border-park-border">
                    <td className="px-3 py-2 text-park-text">{p?.name}</td>
                    <td className="px-3 py-2 text-right">{fmtQty(r.need)} {p?.unit}</td>
                    <td className={`px-3 py-2 text-right ${ok ? 'text-park-textMuted' : 'font-semibold text-danger'}`}>{fmtQty(r.have)} {p?.unit}</td>
                    <td className="px-3 py-2">{ok ? <span className="text-success">хватает</span> : <span className="font-semibold text-danger">не хватает {fmtQty(r.need - r.have)}</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CusCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>{!readOnly && meta.id !== 0 && <CusButton variant="outline" color="danger" leftIcon={<LuTrash2 size={15} />} isDisabled={busy} onClick={() => setConfirm(true)}>Удалить</CusButton>}</div>
        <div className="flex flex-wrap gap-2">
          <CusButton variant="ghost" onClick={onClose}>Закрыть</CusButton>
          {readOnly
            ? <CusButton color="warning" leftIcon={<LuUndo2 size={15} />} isLoading={unpost.isPending} onClick={doUnpost}>Отменить проведение</CusButton>
            : <>
                <CusButton variant="outline" isLoading={save.isPending && !post.isPending} isDisabled={busy} onClick={() => persist(false)}>Сохранить черновик</CusButton>
                <CusButton color="success" leftIcon={<LuCheck size={15} />} isLoading={post.isPending} isDisabled={busy || filled.length === 0 || missing.length > 0} onClick={() => persist(true)}>Провести</CusButton>
              </>}
        </div>
      </div>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={del.isPending} text={`Удалить акт № ${meta.number}?`} />
    </div>
  )
}
