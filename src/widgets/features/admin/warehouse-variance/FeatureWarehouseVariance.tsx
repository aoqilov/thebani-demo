import { useMemo, useState } from 'react'
import { LuBanknote, LuSearch, LuTriangleAlert, LuUtensils } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { variance } from '@/data/variance'
import { fmtMoney, fmtQty, today } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useDocs, useGroups, useProducts } from '../warehouse-common/hooks/useWarehouse'
import { flattenGroups } from '../warehouse-products/modals/ModalProduct'

const groupIds = (groups: { id: number; parentId: number | null }[], id: number): number[] => [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => groupIds(groups, g.id))]

/**
 * Расхождения: теоретический расход (продажи и приготовление по тех. картам) против факта инвентаризации.
 * Показывает, какие продукты «исчезают» и на какую сумму.
 */
export default function FeatureWarehouseVariance() {
  const { data: income = [] } = useDocs('income')
  const { data: expense = [] } = useDocs('expense')
  const { data: products = [] } = useProducts()
  const { data: groups = [] } = useGroups()

  const docs = useMemo(() => [...income, ...expense], [income, expense])
  const [from, setFrom] = useState('2026-10-20')
  const [to, setTo] = useState(today())
  const [groupId, setGroupId] = useState('all')
  const [search, setSearch] = useState('')
  const [onlyLoss, setOnlyLoss] = useState(true)

  const rows = useMemo(() => {
    const ids = groupId === 'all' ? null : groupIds(groups, Number(groupId))
    const q = search.trim().toLowerCase()
    const pm = new Map(products.map((p) => [p.id, p]))
    return variance(docs, from, to)
      .map((r) => ({ ...r, product: pm.get(r.productId) }))
      .filter((r) => r.product && (!ids || ids.includes(r.product.groupId)) && (!q || r.product.name.toLowerCase().includes(q)))
      .filter((r) => (onlyLoss ? Math.abs(r.lossQty) > 0.0005 : r.theoretical > 0 || r.writeoff > 0 || Math.abs(r.lossQty) > 0.0005))
      .sort((a, b) => b.lossSum - a.lossSum)
  }, [docs, products, groups, from, to, groupId, search, onlyLoss])

  const lossTotal = rows.reduce((s, r) => s + Math.max(r.lossSum, 0), 0)
  const writeoffTotal = rows.reduce((s, r) => s + r.writeoffSum, 0)
  const theoTotal = rows.reduce((s, r) => s + r.theoSum, 0)
  const top = rows.filter((r) => r.lossSum > 0).slice(0, 8).map((r) => ({ name: r.product!.name.slice(0, 18), loss: Math.round(r.lossSum) }))

  const th = 'px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const td = 'px-3 py-2 text-right'

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Склад" title="Потери" highlight="и расхождения" subtitle="Сколько продукта должно было уйти по тех. картам и сколько реально исчезло по инвентаризации. Разница — потери." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <CusStatCard icon={<LuTriangleAlert size={24} />} label="Потери (недостача), сум" value={fmtMoney(lossTotal)} color={lossTotal > 0 ? 'danger' : 'success'} />
        <CusStatCard icon={<LuBanknote size={24} />} label="Известные списания, сум" value={fmtMoney(writeoffTotal)} color="warning" />
        <CusStatCard icon={<LuUtensils size={24} />} label="Теоретический расход, сум" value={fmtMoney(theoTotal)} color="info" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_360px]">
        <CusCard>
          <CusToolbar
            left={
              <>
                <div className="w-40"><CusInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                <span className="text-park-textMuted">—</span>
                <div className="w-40"><CusInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
                <div className="w-52"><CusSelect value={groupId} onChange={(e) => setGroupId(e.target.value)} options={[{ value: 'all', label: 'Все группы' }, ...flattenGroups(groups)]} /></div>
                <CusSwitch checked={onlyLoss} onChange={setOnlyLoss} label="Только с потерями" />
              </>
            }
            right={<CusInput placeholder="Поиск товара…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />}
          />
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full min-w-215 text-sm">
              <thead className="sticky top-0 bg-park-bgHover">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-park-textMuted">Товар</th>
                  <th className={th}>Было</th><th className={th}>Закуплено</th><th className={th}>По тех. картам</th><th className={th}>Списано</th>
                  <th className={th}>Остаток</th><th className={th}>Потери</th><th className={th}>Потери, сум</th><th className={th}>% от расхода</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-park-textMuted">Расхождений за период нет — проведите инвентаризацию</td></tr>}
                {rows.map((r) => {
                  const pct = r.theoSum > 0 ? (r.lossSum / r.theoSum) * 100 : null
                  const bad = r.lossSum > 0 && (pct === null || pct >= 5)
                  const u = r.product!.unit
                  return (
                    <tr key={r.id} className="border-t border-park-border hover:bg-park-bgHover/60">
                      <td className="px-3 py-2 font-semibold text-park-text">{r.product!.name}<span className="ml-1 text-xs font-normal text-park-textMuted">{u}</span></td>
                      <td className={`${td} text-park-textMuted`}>{fmtQty(r.opening)}</td>
                      <td className={td}>{r.purchases + r.produced ? fmtQty(r.purchases + r.produced) : '—'}</td>
                      <td className={td}>{r.theoretical ? fmtQty(r.theoretical) : '—'}</td>
                      <td className={`${td} text-warning`}>{r.writeoff ? fmtQty(r.writeoff) : '—'}</td>
                      <td className={`${td} font-semibold`}>{fmtQty(r.closing)}</td>
                      <td className={`${td} ${r.lossQty > 0 ? 'font-semibold text-danger' : r.lossQty < 0 ? 'text-success' : 'text-park-textMuted'}`}>{r.lossQty ? `${r.lossQty > 0 ? '−' : '+'}${fmtQty(Math.abs(r.lossQty))}` : '—'}</td>
                      <td className={`${td} ${bad ? 'font-bold text-danger' : 'text-park-text'}`}>{r.lossSum ? fmtMoney(r.lossSum) : '—'}</td>
                      <td className={`${td} ${bad ? 'font-bold text-danger' : 'text-park-textMuted'}`}>{pct === null ? (r.lossSum > 0 ? 'нет продаж' : '—') : `${pct.toFixed(1)}%`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-park-border px-4 py-2.5 text-xs text-park-textMuted">
            Красным выделены позиции, где потери от расхода 5% и больше (или продаж не было вовсе). Источник: проведённые инвентаризации.
          </div>
        </CusCard>

        <CusCard>
          <CusCardHeader title="Главные потери" subtitle="Топ по сумме, сум" />
          <div className="p-5">{top.length ? <CusChart type="bar" data={top} xKey="name" series={['loss']} height={260} /> : <p className="py-12 text-center text-sm text-park-textMuted">Потерь нет</p>}</div>
        </CusCard>
      </div>
    </div>
  )
}
