import { useMemo, useState } from 'react'
import { LuArrowLeft, LuCheck, LuTrash2, LuUndo2 } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import { CusSelect } from '@/components/ui/select/CusSelect'
import type { Inventory } from '@/types/warehouse.types'
import { fmtMoney, fmtQty, today } from '@/utils/format'
import DocStatusBadge from '../../warehouse-common/components/DocStatusBadge'
import { useGroups, useProducts, useStock } from '../../warehouse-common/hooks/useWarehouse'
import { useDeleteInventory, useInventory, usePostInventory, useSaveInventory, useUnpostInventory } from '../../warehouse-common/hooks/useWarehouseOps'
import { flattenGroups } from '../../warehouse-products/modals/ModalProduct'

interface EditLine { productId: number; fact: string }
const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'))

export default function InventoryEditor({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading } = useInventory(id)
  if (id !== null && isLoading) return <div className="p-8 text-center text-park-textMuted">Загрузка…</div>
  const initial: Inventory | undefined = id === null
    ? { id: 0, number: 'Авто', date: today(), status: 'draft', comment: '', lines: [], docIds: [] }
    : data
  if (!initial) return <CusAlert color="danger">Инвентаризация не найдена.</CusAlert>
  return <Form initial={initial} onClose={onClose} />
}

function Form({ initial, onClose }: { initial: Inventory; onClose: () => void }) {
  const { data: products = [] } = useProducts()
  const { data: groups = [] } = useGroups()
  const { data: stock = [] } = useStock()
  const save = useSaveInventory()
  const post = usePostInventory()
  const unpost = useUnpostInventory()
  const del = useDeleteInventory()

  const [meta, setMeta] = useState({ id: initial.id, number: initial.number, status: initial.status })
  const [date, setDate] = useState(initial.date)
  const [comment, setComment] = useState(initial.comment)
  const [lines, setLines] = useState<EditLine[]>(initial.lines.map((l) => ({ productId: l.productId, fact: String(l.fact) })))
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const readOnly = meta.status === 'posted'
  const busy = save.isPending || post.isPending || unpost.isPending || del.isPending
  const stockMap = useMemo(() => new Map(stock.map((s) => [s.productId, s])), [stock])
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const posted = useMemo(() => new Map(initial.lines.map((l) => [l.productId, l])), [initial.lines])
  const countable = useMemo(() => products.filter((p) => p.active && p.kind !== 'dish'), [products])
  const options = useMemo(() => countable.filter((p) => !lines.some((l) => l.productId === p.id)).map((p) => ({ value: p.id, label: p.name, hint: p.unit })), [countable, lines])

  /** Остаток по учёту: после проведения — зафиксированный, до проведения — текущий. */
  const expectedOf = (pid: number) => (readOnly ? (posted.get(pid)?.expected ?? 0) : (stockMap.get(pid)?.qty ?? 0))
  const costOf = (pid: number) => (readOnly ? (posted.get(pid)?.cost ?? 0) : (stockMap.get(pid)?.avgCost ?? 0))

  const rows = lines.map((l) => {
    const counted = l.fact.trim() !== '' && !Number.isNaN(num(l.fact))
    const diff = counted ? num(l.fact) - expectedOf(l.productId) : 0
    return { ...l, counted, diff, sum: diff * costOf(l.productId) }
  })
  const shortage = rows.filter((r) => r.diff < -0.0005).reduce((s, r) => s + r.sum, 0)
  const surplus = rows.filter((r) => r.diff > 0.0005).reduce((s, r) => s + r.sum, 0)

  const patch = (pid: number, fact: string) => setLines((ls) => ls.map((l) => (l.productId === pid ? { ...l, fact } : l)))
  const addMany = (ids: number[]) => setLines((ls) => [...ls, ...ids.filter((i) => !ls.some((l) => l.productId === i)).map((productId) => ({ productId, fact: '' }))])

  function toInventory(): Inventory {
    return {
      id: meta.id, number: meta.number, date, status: 'draft', comment, docIds: [],
      lines: rows.filter((r) => r.counted).map((r) => ({ productId: r.productId, fact: num(r.fact), expected: 0, cost: 0 })),
    }
  }

  async function persist(thenPost: boolean) {
    setError(null)
    try {
      const saved = await save.mutateAsync(toInventory())
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
        <h2 className="text-lg font-bold text-park-text">Инвентаризация № {meta.number}</h2>
        <DocStatusBadge status={meta.status} />
      </div>

      {error && <CusAlert color="danger">{error}</CusAlert>}
      {readOnly && <CusAlert color="info">Инвентаризация проведена: недостача и излишек оформлены документами склада. Чтобы изменить — отмените проведение.</CusAlert>}

      <CusCard>
        <CusCardHeader title="Реквизиты" />
        <div className="grid grid-cols-1 gap-4 p-5 tablet:grid-cols-3">
          <CusInput label="Номер" value={meta.number} readOnly />
          <CusInput label="Дата" type="date" value={date} disabled={readOnly} onChange={(e) => setDate(e.target.value)} />
          <CusInput label="Комментарий" value={comment} disabled={readOnly} onChange={(e) => setComment(e.target.value)} />
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader title="Пересчёт" subtitle={`Посчитано ${rows.filter((r) => r.counted).length} из ${rows.length} позиций`} />
        {!readOnly && (
          <div className="flex flex-wrap items-end gap-3 border-b border-park-border px-5 py-3">
            <div className="w-72"><CusCombobox options={options} value={null} placeholder="Добавить товар…" onChange={(v) => addMany([Number(v)])} /></div>
            <div className="w-56"><CusSelect value="" onChange={(e) => { if (e.target.value) addMany(countable.filter((p) => groupIds(groups, Number(e.target.value)).includes(p.groupId)).map((p) => p.id)) }} options={[{ value: '', label: '+ Добавить группу…' }, ...flattenGroups(groups)]} /></div>
            <CusButton size="sm" variant="outline" onClick={() => addMany(countable.map((p) => p.id))}>Все товары</CusButton>
            <CusButton size="sm" variant="outline" onClick={() => setLines((ls) => ls.map((l) => (l.fact.trim() === '' ? { ...l, fact: String(fmtRaw(expectedOf(l.productId))) } : l)))}>Заполнить по учёту</CusButton>
          </div>
        )}
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-195 text-sm">
            <thead className="sticky top-0 bg-park-bgHover">
              <tr>
                <th className={`${th} w-10`}>№</th><th className={th}>Товар</th><th className={`${th} w-14`}>Ед.</th>
                <th className={`${th} w-28 text-right`}>По учёту</th><th className={`${th} w-32 text-right`}>Факт</th>
                <th className={`${th} w-28 text-right`}>Разница</th><th className={`${th} w-32 text-right`}>Сумма, сум</th><th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-park-textMuted">Добавьте товары для пересчёта</td></tr>}
              {rows.map((r, i) => {
                const p = productMap.get(r.productId)
                const tone = !r.counted || Math.abs(r.diff) < 0.0005 ? 'text-park-textMuted' : r.diff < 0 ? 'font-semibold text-danger' : 'font-semibold text-success'
                return (
                  <tr key={r.productId} className="border-t border-park-border">
                    <td className="px-3 py-1.5 text-park-textMuted">{i + 1}</td>
                    <td className="px-3 py-1.5 font-semibold text-park-text">{p?.name}</td>
                    <td className="px-3 py-1.5 text-park-textMuted">{p?.unit}</td>
                    <td className="px-3 py-1.5 text-right text-park-text3">{fmtQty(expectedOf(r.productId))}</td>
                    <td className="px-3 py-1.5">
                      <input inputMode="decimal" value={r.fact} disabled={readOnly} placeholder="—" onChange={(e) => patch(r.productId, e.target.value)}
                        className="w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary disabled:bg-park-bgHover" />
                    </td>
                    <td className={`px-3 py-1.5 text-right ${tone}`}>{r.counted ? `${r.diff > 0 ? '+' : ''}${fmtQty(r.diff)}` : '—'}</td>
                    <td className={`px-3 py-1.5 text-right ${tone}`}>{r.counted && Math.abs(r.diff) >= 0.0005 ? fmtMoney(r.sum) : '—'}</td>
                    <td className="px-2 py-1.5">{!readOnly && <button onClick={() => setLines((ls) => ls.filter((l) => l.productId !== r.productId))} className="rounded-md p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Убрать"><LuTrash2 size={15} /></button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-6 border-t border-park-border bg-park-bgHover/60 px-5 py-3 text-sm">
          <span className="text-park-text3">Недостача: <b className="text-danger">{fmtMoney(shortage)}</b></span>
          <span className="text-park-text3">Излишек: <b className="text-success">+{fmtMoney(surplus)}</b></span>
          <span className="text-park-text">Итого: <b className="text-base">{fmtMoney(shortage + surplus)}</b> сум</span>
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
                <CusButton color="success" leftIcon={<LuCheck size={15} />} isLoading={post.isPending} isDisabled={busy || rows.every((r) => !r.counted)} onClick={() => persist(true)}>Провести</CusButton>
              </>}
        </div>
      </div>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={del.isPending} text={`Удалить инвентаризацию № ${meta.number}?`} />
    </div>
  )
}

const fmtRaw = (n: number) => Math.round(n * 1000) / 1000

/** id группы и всех её потомков. */
function groupIds(groups: { id: number; parentId: number | null }[], id: number): number[] {
  return [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => groupIds(groups, g.id))]
}
