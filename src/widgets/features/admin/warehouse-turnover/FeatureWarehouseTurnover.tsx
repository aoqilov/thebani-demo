import { useMemo, useState } from 'react'
import { LuDownload, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { turnover } from '@/data/turnover'
import { fmtMoney, fmtQty, today } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useGroups, useMovements, useProducts } from '../warehouse-common/hooks/useWarehouse'
import { flattenGroups } from '../warehouse-products/modals/ModalProduct'

function groupIds(groups: { id: number; parentId: number | null }[], id: number): number[] {
  return [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => groupIds(groups, g.id))]
}

/** Оборотная ведомость: начальный остаток + приход − расход = конечный остаток, в количестве и деньгах. */
export default function FeatureWarehouseTurnover() {
  const { data: movements = [] } = useMovements()
  const { data: products = [] } = useProducts()
  const { data: groups = [] } = useGroups()

  const firstDate = useMemo(() => movements.map((m) => m.date).sort()[0] ?? today(), [movements])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today())
  const [groupId, setGroupId] = useState('all')
  const [search, setSearch] = useState('')
  const [hideEmpty, setHideEmpty] = useState(true)
  const start = from || firstDate

  const rows = useMemo(() => {
    const ids = groupId === 'all' ? null : groupIds(groups, Number(groupId))
    const q = search.trim().toLowerCase()
    const pm = new Map(products.map((p) => [p.id, p]))
    return turnover(movements, start, to)
      .map((r) => ({ ...r, product: pm.get(r.productId) }))
      .filter((r) => r.product && (!ids || ids.includes(r.product.groupId)) && (!q || r.product.name.toLowerCase().includes(q)))
      .filter((r) => !hideEmpty || r.opening.qty !== 0 || r.income.qty !== 0 || r.expense.qty !== 0 || r.closing.qty !== 0)
      .sort((a, b) => a.product!.name.localeCompare(b.product!.name, 'ru'))
  }, [movements, products, groups, start, to, groupId, search, hideEmpty])

  const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + pick(r), 0)

  function exportCsv() {
    const head = ['Товар', 'Ед.', 'Нач. остаток', 'Нач. сумма', 'Приход', 'Сумма прихода', 'Расход', 'Сумма расхода', 'Кон. остаток', 'Кон. сумма']
    const lines = rows.map((r) => [r.product!.name, r.product!.unit, r.opening.qty, Math.round(r.opening.sum), r.income.qty, Math.round(r.income.sum), r.expense.qty, Math.round(r.expense.sum), r.closing.qty, Math.round(r.closing.sum)])
    const csv = [head, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `oborotnaya-vedomost_${start}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const th = 'px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const td = 'px-3 py-2 text-right'
  const neg = (n: number) => (n < 0 ? 'text-danger' : 'text-park-text')

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Склад" title="Оборотная" highlight="ведомость" subtitle="Движение товаров за период: что было, сколько пришло, ушло и осталось — в количестве и в деньгах." />

      <CusCard>
        <CusToolbar
          left={
            <>
              <div className="w-40"><CusInput type="date" value={start} onChange={(e) => setFrom(e.target.value)} /></div>
              <span className="text-park-textMuted">—</span>
              <div className="w-40"><CusInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <div className="w-56"><CusSelect value={groupId} onChange={(e) => setGroupId(e.target.value)} options={[{ value: 'all', label: 'Все группы' }, ...flattenGroups(groups)]} /></div>
              <CusSwitch checked={hideEmpty} onChange={setHideEmpty} label="Скрыть нулевые" />
            </>
          }
          right={
            <>
              <CusInput placeholder="Поиск товара…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
              <CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} isDisabled={rows.length === 0} onClick={exportCsv}>Экспорт CSV</CusButton>
            </>
          }
        />
        <div className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-250 text-sm">
            <thead className="sticky top-0 z-10 bg-park-bgHover">
              <tr>
                <th rowSpan={2} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-park-textMuted">Товар</th>
                <th rowSpan={2} className="w-12 px-3 py-2 text-left text-xs font-semibold uppercase text-park-textMuted">Ед.</th>
                <th colSpan={2} className="border-l border-park-border px-3 py-1.5 text-center text-xs font-semibold uppercase text-park-textMuted">Начало</th>
                <th colSpan={2} className="border-l border-park-border px-3 py-1.5 text-center text-xs font-semibold uppercase text-success">Приход</th>
                <th colSpan={2} className="border-l border-park-border px-3 py-1.5 text-center text-xs font-semibold uppercase text-danger">Расход</th>
                <th colSpan={2} className="border-l border-park-border px-3 py-1.5 text-center text-xs font-semibold uppercase text-park-textMuted">Конец</th>
              </tr>
              <tr>{['Кол-во', 'Сумма', 'Кол-во', 'Сумма', 'Кол-во', 'Сумма', 'Кол-во', 'Сумма'].map((h, i) => <th key={i} className={`${th} ${i % 2 === 0 ? 'border-l border-park-border' : ''}`}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-park-textMuted">За выбранный период движений нет</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-park-border hover:bg-park-bgHover/60">
                  <td className="px-3 py-2 font-semibold text-park-text">{r.product!.name}</td>
                  <td className="px-3 py-2 text-park-textMuted">{r.product!.unit}</td>
                  <td className={`${td} border-l border-park-border ${neg(r.opening.qty)}`}>{fmtQty(r.opening.qty)}</td><td className={`${td} text-park-textMuted`}>{fmtMoney(r.opening.sum)}</td>
                  <td className={`${td} border-l border-park-border text-success`}>{r.income.qty ? fmtQty(r.income.qty) : '—'}</td><td className={`${td} text-park-textMuted`}>{r.income.qty ? fmtMoney(r.income.sum) : '—'}</td>
                  <td className={`${td} border-l border-park-border text-danger`}>{r.expense.qty ? fmtQty(r.expense.qty) : '—'}</td><td className={`${td} text-park-textMuted`}>{r.expense.qty ? fmtMoney(r.expense.sum) : '—'}</td>
                  <td className={`${td} border-l border-park-border font-semibold ${neg(r.closing.qty)}`}>{fmtQty(r.closing.qty)}</td><td className={`${td} font-semibold ${neg(r.closing.sum)}`}>{fmtMoney(r.closing.sum)}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text">
                <tr className="border-t-2 border-park-border">
                  <td className="px-3 py-2.5" colSpan={2}>Итого, {rows.length} поз.</td>
                  <td className="border-l border-park-border" /><td className={td}>{fmtMoney(sum((r) => r.opening.sum))}</td>
                  <td className="border-l border-park-border" /><td className={`${td} text-success`}>{fmtMoney(sum((r) => r.income.sum))}</td>
                  <td className="border-l border-park-border" /><td className={`${td} text-danger`}>{fmtMoney(sum((r) => r.expense.sum))}</td>
                  <td className="border-l border-park-border" /><td className={td}>{fmtMoney(sum((r) => r.closing.sum))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CusCard>
    </div>
  )
}
