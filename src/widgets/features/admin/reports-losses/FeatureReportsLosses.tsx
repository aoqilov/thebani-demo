import { useMemo, useState } from 'react'
import { LuDownload, LuPackageX, LuPercent, LuSearch, LuTrash2, LuTriangleAlert } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusInfoTip } from '@/components/ui/popover/CusInfoTip'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { LOSS_CAUSES, LOSS_COLOR, LOSS_HINT, LOSS_LABEL, lossByCause, lossByProduct, lossEvents, type LossCause } from '@/data/losses'
import { purchaseRows } from '@/data/purchases'
import { downloadCsv } from '@/utils/csv'
import { fmtCompact, fmtDate, fmtMoney, fmtQty } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import PeriodFilter, { defaultPeriod } from '@/widgets/shared-ui/PeriodFilter'
import { useClosedOrders } from '../../cashier/hooks/useCashier'
import { useOrders } from '../../waiter/hooks/useOrders'
import { useMenuItems } from '../menu/hooks/useMenu'
import { useDocs, useGroups, useProducts, useRecipes } from '../warehouse-common/hooks/useWarehouse'
import { useButcherings } from '../warehouse-common/hooks/useWarehouseOps'
import { flattenGroups } from '../warehouse-products/modals/ModalProduct'
import { useCostCtx } from '../warehouse-recipes/components/useCostCtx'

type View = 'products' | 'causes' | 'journal'

const groupIds = (groups: { id: number; parentId: number | null }[], id: number): number[] => [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => groupIds(groups, g.id))]

/** Потери товаров: что, сколько и почему ушло со склада без выручки. */
export default function FeatureReportsLosses() {
  const { data: income = [] } = useDocs('income')
  const { data: expense = [] } = useDocs('expense')
  const { data: closed = [] } = useClosedOrders()
  const { data: open = [] } = useOrders()
  const { data: butcherings = [] } = useButcherings()
  const { data: menuItems = [] } = useMenuItems()
  const { data: products = [] } = useProducts()
  const { data: recipes = [] } = useRecipes()
  const { data: groups = [] } = useGroups()
  const { ctx } = useCostCtx()

  const [period, setPeriod] = useState(defaultPeriod)
  const [view, setView] = useState<View>('products')
  const [cause, setCause] = useState<LossCause | 'all'>('all')
  const [groupId, setGroupId] = useState('all')
  const [search, setSearch] = useState('')

  const pm = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const name = (id: number) => pm.get(id)?.name ?? `#${id}`

  const all = useMemo(
    () => lossEvents({ docs: [...income, ...expense], orders: [...closed, ...open], butcherings, menuItems, products, recipes, ctx, from: period.from, to: period.to }),
    [income, expense, closed, open, butcherings, menuItems, products, recipes, ctx, period],
  )

  const events = useMemo(() => {
    const q = search.trim().toLowerCase()
    const inGroup = groupId === 'all' ? null : new Set(groupIds(groups, Number(groupId)))
    return all.filter((e) => {
      const p = pm.get(e.productId)
      return (cause === 'all' || e.cause === cause) && (!inGroup || (p && inGroup.has(p.groupId))) && (!q || (p?.name.toLowerCase().includes(q) ?? false))
    })
  }, [all, cause, groupId, search, groups, pm])

  const byProduct = useMemo(() => lossByProduct(events), [events])
  const byCause = useMemo(() => lossByCause(events), [events])
  const total = events.reduce((s, e) => s + e.sum, 0)
  const purchased = useMemo(() => purchaseRows([...income, ...expense], { from: period.from, to: period.to, supplierId: null, productIds: null }).reduce((s, r) => s + r.sum, 0), [income, expense, period])
  const share = purchased > 0 ? (total / purchased) * 100 : null

  const topBars = byProduct.slice(0, 10).map((r) => ({ name: name(r.productId).length > 16 ? `${name(r.productId).slice(0, 15)}…` : name(r.productId), 'Потери, сум': Math.round(r.sum) }))
  const unit = (id: number) => pm.get(id)?.unit ?? ''

  function exportCsv() {
    const p = `${period.from}_${period.to}`
    if (view === 'products') {
      downloadCsv(`poteri-po-tovaram_${p}.csv`, ['Товар', 'Ед.', 'Количество', 'Сумма, сум', 'Доля, %', 'Главная причина', ...LOSS_CAUSES.map((c) => LOSS_LABEL[c])],
        byProduct.map((r) => [name(r.productId), unit(r.productId), r.qty, Math.round(r.sum), r.share.toFixed(1), LOSS_LABEL[r.topCause], ...LOSS_CAUSES.map((c) => Math.round(r.byCause[c] ?? 0))]))
    } else if (view === 'causes') {
      downloadCsv(`poteri-po-prichinam_${p}.csv`, ['Причина', 'Событий', 'Товаров', 'Сумма, сум', 'Доля, %'], byCause.map((r) => [LOSS_LABEL[r.cause], r.events, r.products, Math.round(r.sum), r.share.toFixed(1)]))
    } else {
      downloadCsv(`poteri-zhurnal_${p}.csv`, ['Дата', 'Товар', 'Ед.', 'Количество', 'Сумма, сум', 'Причина', 'Основание', 'Пояснение'],
        events.map((e) => [e.date, name(e.productId), unit(e.productId), e.qty, Math.round(e.sum), LOSS_LABEL[e.cause], e.ref, e.note]))
    }
  }

  const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const td = 'px-3 py-2 text-right tabular-nums'
  const empty = <tr><td colSpan={8} className="py-10 text-center text-park-textMuted">За выбранный период потерь нет</td></tr>
  const dot = (c: LossCause) => <span className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: LOSS_COLOR[c] }} />

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Отчёты" title="Потери" highlight="товаров" subtitle="Что ушло со склада без выручки и почему: порча, брак, недостача, отменённые блюда, отходы разделки." />

      <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
        <CusStatCard icon={<LuTrash2 size={22} />} color="danger" label="Потери за период, сум" value={fmtMoney(total)} />
        <CusStatCard icon={<LuPercent size={22} />} color={share === null ? 'secondary' : share > 5 ? 'danger' : share > 2 ? 'warning' : 'success'} label="Доля от закупок" value={share === null ? '—' : `${share.toFixed(1)}%`} />
        <CusStatCard icon={<LuPackageX size={22} />} color="warning" label="Товаров с потерями" value={String(byProduct.length)} />
        <CusStatCard icon={<LuTriangleAlert size={22} />} color="info" label="Главная причина" value={byCause[0] ? LOSS_LABEL[byCause[0].cause] : '—'} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_340px]">
        <CusCard>
          <CusCardHeader title="Больше всего теряем" subtitle="Топ-10 товаров по сумме потерь" />
          <div className="p-5">
            {topBars.length ? <CusChart type="bar" data={topBars} xKey="name" series={['Потери, сум']} colors={['#d95926']} format={fmtCompact} height={260} /> : <p className="py-16 text-center text-sm text-park-textMuted">Потерь за период нет</p>}
          </div>
        </CusCard>
        <CusCard>
          <CusCardHeader title="По причинам" />
          <div className="p-5">
            {byCause.length ? (
              <>
                <CusChart type="pie" data={byCause.map((r) => ({ name: LOSS_LABEL[r.cause], value: Math.round(r.sum) }))} xKey="name" series={['value']} colors={byCause.map((r) => LOSS_COLOR[r.cause])} format={fmtMoney} height={170} />
                <ul className="mt-2 space-y-1.5 text-sm">
                  {byCause.map((r) => (
                    <li key={r.cause} className="flex items-center justify-between gap-3">
                      <span className="flex items-center text-park-text3">{dot(r.cause)}{LOSS_LABEL[r.cause]}<CusInfoTip className="ml-1" title={LOSS_LABEL[r.cause]}>{LOSS_HINT[r.cause]}</CusInfoTip></span>
                      <span className="font-semibold text-park-text">{fmtMoney(r.sum)} <span className="font-normal text-park-textMuted">· {r.share.toFixed(0)}%</span></span>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="py-12 text-center text-sm text-park-textMuted">Потерь за период нет</p>}
          </div>
        </CusCard>
      </div>

      <CusCard>
        <CusToolbar
          left={
            <>
              <PeriodFilter value={period} onChange={setPeriod} />
              <div className="w-52"><CusSelect value={groupId} onChange={(e) => setGroupId(e.target.value)} options={[{ value: 'all', label: 'Все группы' }, ...flattenGroups(groups)]} /></div>
            </>
          }
          right={
            <>
              <CusInput placeholder="Поиск товара…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
              <CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} isDisabled={events.length === 0} onClick={exportCsv}>Экспорт CSV</CusButton>
            </>
          }
        />
        <div className="flex flex-wrap items-center gap-1.5 border-t border-park-border px-4 py-2.5">
          <CusChip active={view === 'products'} onClick={() => setView('products')}>По товарам</CusChip>
          <CusChip active={view === 'causes'} onClick={() => setView('causes')}>По причинам</CusChip>
          <CusChip active={view === 'journal'} onClick={() => setView('journal')}>Журнал</CusChip>
          <span className="mx-2 h-5 w-px bg-park-border" />
          <CusChip active={cause === 'all'} onClick={() => setCause('all')}>Все причины</CusChip>
          {LOSS_CAUSES.map((c) => <CusChip key={c} active={cause === c} onClick={() => setCause(c)}>{LOSS_LABEL[c]}</CusChip>)}
        </div>

        <div className="max-h-[560px] overflow-auto border-t border-park-border">
          {view === 'products' && (
            <table className="w-full min-w-200 text-sm">
              <thead className="sticky top-0 z-10 bg-park-bgHover"><tr>
                <th className={`${th} text-left`}>Товар</th><th className={`${th} w-12 text-left`}>Ед.</th><th className={`${th} text-right`}>Количество</th>
                <th className={`${th} text-right`}>Сумма, сум</th><th className={`${th} text-right`}>Доля</th><th className={`${th} text-left`}>Из-за чего</th>
              </tr></thead>
              <tbody>
                {byProduct.length === 0 && empty}
                {byProduct.map((r) => (
                  <tr key={r.id} className="border-t border-park-border hover:bg-park-bgHover/60">
                    <td className="px-3 py-2 font-semibold text-park-text">{name(r.productId)}</td>
                    <td className="px-3 py-2 text-park-textMuted">{unit(r.productId)}</td>
                    <td className={td}>{fmtQty(r.qty)}</td>
                    <td className={`${td} font-semibold text-danger`}>{fmtMoney(r.sum)}</td>
                    <td className={`${td} text-park-textMuted`}>{r.share.toFixed(1)}%</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-park-text3">
                        {LOSS_CAUSES.filter((c) => r.byCause[c]).map((c) => <span key={c} className="flex items-center">{dot(c)}{LOSS_LABEL[c]} · {fmtMoney(r.byCause[c]!)}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {byProduct.length > 0 && <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text"><tr className="border-t-2 border-park-border"><td className="px-3 py-2.5" colSpan={3}>Итого, {byProduct.length} товаров</td><td className={`${td} text-danger`}>{fmtMoney(total)}</td><td colSpan={2} /></tr></tfoot>}
            </table>
          )}

          {view === 'causes' && (
            <table className="w-full min-w-160 text-sm">
              <thead className="sticky top-0 z-10 bg-park-bgHover"><tr>
                <th className={`${th} text-left`}>Причина</th><th className={`${th} text-right`}>Событий</th><th className={`${th} text-right`}>Товаров</th>
                <th className={`${th} text-right`}>Сумма, сум</th><th className={`${th} w-48 text-left`}>Доля</th>
              </tr></thead>
              <tbody>
                {byCause.length === 0 && empty}
                {byCause.map((r) => (
                  <tr key={r.cause} className="cursor-pointer border-t border-park-border hover:bg-park-bgHover/60" onClick={() => { setCause(r.cause); setView('journal') }}>
                    <td className="px-3 py-2 font-semibold text-park-text"><span className="flex items-center">{dot(r.cause)}{LOSS_LABEL[r.cause]}</span></td>
                    <td className={td}>{r.events}</td><td className={td}>{r.products}</td>
                    <td className={`${td} font-semibold text-danger`}>{fmtMoney(r.sum)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-park-bgHover"><div className="h-full rounded-full" style={{ width: `${r.share}%`, background: LOSS_COLOR[r.cause] }} /></div>
                        <span className="w-12 text-right text-xs text-park-textMuted">{r.share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {byCause.length > 0 && <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text"><tr className="border-t-2 border-park-border"><td className="px-3 py-2.5">Итого</td><td className={td}>{events.length}</td><td className={td}>{byProduct.length}</td><td className={`${td} text-danger`}>{fmtMoney(total)}</td><td /></tr></tfoot>}
            </table>
          )}

          {view === 'journal' && (
            <table className="w-full min-w-225 text-sm">
              <thead className="sticky top-0 z-10 bg-park-bgHover"><tr>
                <th className={`${th} text-left`}>Дата</th><th className={`${th} text-left`}>Товар</th><th className={`${th} text-right`}>Количество</th>
                <th className={`${th} text-right`}>Сумма, сум</th><th className={`${th} text-left`}>Причина</th><th className={`${th} text-left`}>Основание</th><th className={`${th} text-left`}>Пояснение</th>
              </tr></thead>
              <tbody>
                {events.length === 0 && empty}
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-park-border hover:bg-park-bgHover/60">
                    <td className="px-3 py-2 text-park-textMuted">{fmtDate(e.date)}</td>
                    <td className="px-3 py-2 font-semibold text-park-text">{name(e.productId)}</td>
                    <td className={td}>{fmtQty(e.qty)} {unit(e.productId)}</td>
                    <td className={`${td} font-semibold text-danger`}>{fmtMoney(e.sum)}</td>
                    <td className="px-3 py-2"><span className="flex items-center whitespace-nowrap">{dot(e.cause)}{LOSS_LABEL[e.cause]}</span></td>
                    <td className="px-3 py-2 font-mono text-xs text-park-textMuted">{e.ref}</td>
                    <td className="px-3 py-2 text-park-text3">{e.note}</td>
                  </tr>
                ))}
              </tbody>
              {events.length > 0 && <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text"><tr className="border-t-2 border-park-border"><td className="px-3 py-2.5" colSpan={3}>Итого, {events.length} записей</td><td className={`${td} text-danger`}>{fmtMoney(total)}</td><td colSpan={3} /></tr></tfoot>}
            </table>
          )}
        </div>
        <p className="border-t border-park-border px-4 py-3 text-xs text-park-textMuted">
          Суммы — по себестоимости (средняя цена склада на момент списания; для отменённых блюд — текущая цена продуктов по тех. карте). Нормальные технологические потери при обработке (чистка, варка) в отчёт не входят: они заложены в тех. карты.
        </p>
      </CusCard>
    </div>
  )
}
