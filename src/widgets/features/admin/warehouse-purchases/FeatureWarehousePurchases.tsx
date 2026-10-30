import { Fragment, useMemo, useState } from 'react'
import { LuBoxes, LuChevronRight, LuDownload, LuFileText, LuHandshake, LuWallet, LuSearch } from 'react-icons/lu'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { bySupplier, byProduct, invoices, purchaseRows } from '@/data/purchases'
import { cn } from '@/lib/cn'
import { downloadCsv } from '@/utils/csv'
import { fmtDate, fmtMoney, fmtQty, today } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useDocs, useGroups, useProducts, useSuppliers } from '../warehouse-common/hooks/useWarehouse'
import { flattenGroups } from '../warehouse-products/modals/ModalProduct'

type View = 'suppliers' | 'products' | 'invoices'

const groupIds = (groups: { id: number; parentId: number | null }[], id: number): number[] => [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => groupIds(groups, g.id))]
const monthStart = () => `${today().slice(0, 7)}-01`

/** Закупки у поставщиков: что, у кого, на какую сумму и по какой цене приходовали за период. */
export default function FeatureWarehousePurchases() {
  const { data: docs = [] } = useDocs('income')
  const { data: suppliers = [] } = useSuppliers()
  const { data: products = [] } = useProducts()
  const { data: groups = [] } = useGroups()

  const [view, setView] = useState<View>('suppliers')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today())
  const [supplierId, setSupplierId] = useState('all')
  const [groupId, setGroupId] = useState('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const firstDate = useMemo(() => docs.filter((d) => d.supplierId !== null).map((d) => d.date).sort()[0] ?? monthStart(), [docs])
  const start = from || firstDate

  const supplierName = (id: number) => suppliers.find((s) => s.id === id)?.name ?? '—'
  const pm = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const inGroup = groupId === 'all' ? null : new Set(groupIds(groups, Number(groupId)))
    const ids = new Set(products.filter((p) => (!inGroup || inGroup.has(p.groupId)) && (!q || p.name.toLowerCase().includes(q))).map((p) => p.id))
    const filtered = inGroup || q
    return purchaseRows(docs, { from: start, to, supplierId: supplierId === 'all' ? null : Number(supplierId), productIds: filtered ? ids : null })
  }, [docs, products, groups, start, to, supplierId, groupId, search])

  const supplierStats = useMemo(() => bySupplier(rows), [rows])
  const productStats = useMemo(() => byProduct(rows), [rows])
  const invoiceStats = useMemo(() => invoices(rows), [rows])
  const total = rows.reduce((s, r) => s + r.sum, 0)

  function exportCsv() {
    const period = `${start}_${to}`
    if (view === 'suppliers') {
      downloadCsv(`zakupki-po-postavshchikam_${period}.csv`, ['Поставщик', 'Накладных', 'Товаров', 'Сумма, сум', 'Доля, %', 'Последняя поставка'],
        supplierStats.map((s) => [supplierName(s.supplierId), s.docs, s.positions, Math.round(s.sum), s.share.toFixed(1), s.lastDate]))
    } else if (view === 'products') {
      downloadCsv(`zakupki-po-tovaram_${period}.csv`, ['Товар', 'Ед.', 'Поставщиков', 'Количество', 'Сумма, сум', 'Средняя цена', 'Мин. цена', 'Макс. цена', 'Последняя цена', 'Изменение цены, %', 'Дешевле всех'],
        productStats.map((s) => [pm.get(s.productId)?.name ?? s.productId, pm.get(s.productId)?.unit ?? '', s.suppliers, s.qty, Math.round(s.sum), Math.round(s.avgPrice), s.minPrice, s.maxPrice, s.lastPrice, s.priceChange === null ? '' : s.priceChange.toFixed(1), s.cheapestSupplierId ? supplierName(s.cheapestSupplierId) : '']))
    } else {
      downloadCsv(`nakladnye_${period}.csv`, ['Номер', 'Дата', 'Поставщик', 'Позиция', 'Ед.', 'Количество', 'Цена', 'Сумма, сум', 'Основание'],
        invoiceStats.flatMap((i) => i.lines.map((l) => [i.number, i.date, supplierName(i.supplierId), pm.get(l.productId)?.name ?? l.productId, pm.get(l.productId)?.unit ?? '', l.qty, l.price, Math.round(l.sum), i.source ?? ''])))
    }
  }

  const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const td = 'px-3 py-2 text-right'
  const empty = <tr><td colSpan={11} className="py-10 text-center text-park-textMuted">За выбранный период закупок нет</td></tr>

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Склад" title="Закупки" highlight="у поставщиков" subtitle="Какие товары пришли от поставщиков за период: по поставщикам, по товарам и списком накладных. Экспорт в CSV." />

      <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
        <CusStatCard icon={<LuWallet size={20} />} color="primary" label="Закуплено, сум" value={fmtMoney(total)} />
        <CusStatCard icon={<LuFileText size={20} />} color="info" label="Накладных" value={String(invoiceStats.length)} />
        <CusStatCard icon={<LuHandshake size={20} />} color="secondary" label="Поставщиков" value={String(supplierStats.length)} />
        <CusStatCard icon={<LuBoxes size={20} />} color="success" label="Товаров" value={String(productStats.length)} />
      </div>

      <CusCard>
        <CusToolbar
          left={
            <>
              <div className="w-40"><CusInput type="date" value={start} onChange={(e) => setFrom(e.target.value)} /></div>
              <span className="text-park-textMuted">—</span>
              <div className="w-40"><CusInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <div className="w-56"><CusSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={[{ value: 'all', label: 'Все поставщики' }, ...suppliers.map((s) => ({ value: String(s.id), label: s.name }))]} /></div>
              <div className="w-56"><CusSelect value={groupId} onChange={(e) => setGroupId(e.target.value)} options={[{ value: 'all', label: 'Все группы' }, ...flattenGroups(groups)]} /></div>
            </>
          }
          right={
            <>
              <CusInput placeholder="Поиск товара…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
              <CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} isDisabled={rows.length === 0} onClick={exportCsv}>Экспорт CSV</CusButton>
            </>
          }
        />
        <div className="flex gap-1.5 border-t border-park-border px-4 py-2.5">
          <CusChip active={view === 'suppliers'} onClick={() => setView('suppliers')}>По поставщикам</CusChip>
          <CusChip active={view === 'products'} onClick={() => setView('products')}>По товарам</CusChip>
          <CusChip active={view === 'invoices'} onClick={() => setView('invoices')}>Накладные</CusChip>
        </div>

        <div className="max-h-[620px] overflow-auto border-t border-park-border">
          {view === 'suppliers' && (
            <table className="w-full min-w-160 text-sm">
              <thead className="sticky top-0 z-10 bg-park-bgHover"><tr>
                <th className={`${th} text-left`}>Поставщик</th><th className={`${th} text-right`}>Накладных</th><th className={`${th} text-right`}>Товаров</th>
                <th className={`${th} text-right`}>Сумма, сум</th><th className={`${th} w-48 text-left`}>Доля</th><th className={`${th} text-right`}>Последняя поставка</th>
              </tr></thead>
              <tbody>
                {supplierStats.length === 0 && empty}
                {supplierStats.map((s) => (
                  <tr key={s.id} className="border-t border-park-border hover:bg-park-bgHover/60">
                    <td className="px-3 py-2 font-semibold text-park-text">{supplierName(s.supplierId)}</td>
                    <td className={td}>{s.docs}</td><td className={td}>{s.positions}</td>
                    <td className={`${td} font-semibold text-park-text`}>{fmtMoney(s.sum)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-park-bgHover"><div className="h-full rounded-full bg-primary" style={{ width: `${s.share}%` }} /></div>
                        <span className="w-12 text-right text-xs text-park-textMuted">{s.share.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className={`${td} text-park-textMuted`}>{fmtDate(s.lastDate)}</td>
                  </tr>
                ))}
              </tbody>
              {supplierStats.length > 0 && <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text"><tr className="border-t-2 border-park-border"><td className="px-3 py-2.5">Итого</td><td className={td}>{invoiceStats.length}</td><td className={td}>{productStats.length}</td><td className={td}>{fmtMoney(total)}</td><td colSpan={2} /></tr></tfoot>}
            </table>
          )}

          {view === 'products' && (
            <table className="w-full min-w-250 text-sm">
              <thead className="sticky top-0 z-10 bg-park-bgHover"><tr>
                <th className={`${th} text-left`}>Товар</th><th className={`${th} w-12 text-left`}>Ед.</th><th className={`${th} text-right`}>Поставщиков</th><th className={`${th} text-right`}>Количество</th>
                <th className={`${th} text-right`}>Сумма, сум</th><th className={`${th} text-right`}>Ср. цена</th><th className={`${th} text-right`}>Мин.</th><th className={`${th} text-right`}>Макс.</th>
                <th className={`${th} text-right`}>Изм. цены</th><th className={`${th} text-left`}>Дешевле у</th>
              </tr></thead>
              <tbody>
                {productStats.length === 0 && empty}
                {productStats.map((s) => {
                  const p = pm.get(s.productId)
                  return (
                    <tr key={s.id} className="border-t border-park-border hover:bg-park-bgHover/60">
                      <td className="px-3 py-2 font-semibold text-park-text">{p?.name ?? s.productId}</td>
                      <td className="px-3 py-2 text-park-textMuted">{p?.unit}</td>
                      <td className={td}>{s.suppliers}</td><td className={td}>{fmtQty(s.qty)}</td>
                      <td className={`${td} font-semibold text-park-text`}>{fmtMoney(s.sum)}</td>
                      <td className={td}>{fmtMoney(s.avgPrice)}</td>
                      <td className={`${td} text-park-textMuted`}>{fmtMoney(s.minPrice)}</td><td className={`${td} text-park-textMuted`}>{fmtMoney(s.maxPrice)}</td>
                      <td className={td}>{s.priceChange === null ? '—' : <CusBadge color={s.priceChange > 5 ? 'danger' : s.priceChange < -5 ? 'success' : 'dark'}>{s.priceChange > 0 ? '+' : ''}{s.priceChange.toFixed(1)}%</CusBadge>}</td>
                      <td className="px-3 py-2 text-park-textMuted">{s.cheapestSupplierId ? supplierName(s.cheapestSupplierId) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
              {productStats.length > 0 && <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text"><tr className="border-t-2 border-park-border"><td className="px-3 py-2.5" colSpan={4}>Итого, {productStats.length} поз.</td><td className={td}>{fmtMoney(total)}</td><td colSpan={5} /></tr></tfoot>}
            </table>
          )}

          {view === 'invoices' && (
            <table className="w-full min-w-200 text-sm">
              <thead className="sticky top-0 z-10 bg-park-bgHover"><tr>
                <th className="w-8" /><th className={`${th} text-left`}>Номер</th><th className={`${th} text-left`}>Дата</th><th className={`${th} text-left`}>Поставщик</th>
                <th className={`${th} text-right`}>Позиций</th><th className={`${th} text-right`}>Сумма, сум</th><th className={`${th} text-left`}>Основание</th>
              </tr></thead>
              <tbody>
                {invoiceStats.length === 0 && empty}
                {invoiceStats.map((i) => (
                  <Fragment key={i.id}>
                    <tr onClick={() => setOpen(open === i.id ? null : i.id)} className="cursor-pointer border-t border-park-border hover:bg-park-bgHover/60">
                      <td className="pl-3"><LuChevronRight size={14} className={cn('text-park-textMuted transition-transform', open === i.id && 'rotate-90')} /></td>
                      <td className="px-3 py-2 font-semibold text-park-text">{i.number}</td>
                      <td className="px-3 py-2 text-park-textMuted">{fmtDate(i.date)}</td>
                      <td className="px-3 py-2">{supplierName(i.supplierId)}</td>
                      <td className={td}>{i.lines.length}</td>
                      <td className={`${td} font-semibold text-park-text`}>{fmtMoney(i.sum)}</td>
                      <td className="px-3 py-2 text-park-textMuted">{i.source ?? '—'}</td>
                    </tr>
                    {open === i.id && (
                      <tr className="bg-park-bgHover/40">
                        <td />
                        <td colSpan={6} className="px-3 py-2">
                          <table className="w-full text-xs">
                            <thead><tr className="text-park-textMuted"><th className="py-1 text-left font-semibold">Товар</th><th className="py-1 text-right font-semibold">Кол-во</th><th className="py-1 text-right font-semibold">Цена</th><th className="py-1 text-right font-semibold">Сумма</th></tr></thead>
                            <tbody>
                              {i.lines.map((l, idx) => (
                                <tr key={idx} className="border-t border-park-border">
                                  <td className="py-1 text-park-text">{pm.get(l.productId)?.name ?? l.productId}</td>
                                  <td className="py-1 text-right">{fmtQty(l.qty)} {pm.get(l.productId)?.unit}</td>
                                  <td className="py-1 text-right">{fmtMoney(l.price)}</td>
                                  <td className="py-1 text-right font-semibold">{fmtMoney(l.sum)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
              {invoiceStats.length > 0 && <tfoot className="sticky bottom-0 bg-park-bgHover font-bold text-park-text"><tr className="border-t-2 border-park-border"><td colSpan={4} className="px-3 py-2.5">Итого, {invoiceStats.length} накл.</td><td className={td}>{rows.length}</td><td className={td}>{fmtMoney(total)}</td><td /></tr></tfoot>}
            </table>
          )}
        </div>
      </CusCard>
    </div>
  )
}
