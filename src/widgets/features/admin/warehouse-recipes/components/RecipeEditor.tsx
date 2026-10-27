import { useMemo, useState } from 'react'
import { LuPlus, LuTrash2 } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import { capacity, foodCostColor, recipeStats, type CostCtx } from '@/data/recipe.calc'
import { cn } from '@/lib/cn'
import type { Product, Recipe } from '@/types/warehouse.types'
import { fmtMoney, fmtQty } from '@/utils/format'
import { useDeleteRecipe, useSaveProduct, useSaveRecipe } from '../../warehouse-common/hooks/useWarehouse'

interface EditLine {
  productId: number | null
  gross: string
  lossPct: string
}

const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0
const emptyLine = (): EditLine => ({ productId: null, gross: '', lossPct: '0' })

interface Props {
  product: Product
  recipe?: Recipe
  products: Product[]
  ctx: CostCtx
}

export default function RecipeEditor({ product, recipe, products, ctx }: Props) {
  const isDish = product.kind === 'dish'
  const save = useSaveRecipe()
  const saveProduct = useSaveProduct()
  const remove = useDeleteRecipe()

  const [outputQty, setOutputQty] = useState(String(recipe?.outputQty ?? 1))
  const [price, setPrice] = useState(String(product.price))
  const [lines, setLines] = useState<EditLine[]>(
    recipe?.lines.length ? recipe.lines.map((l) => ({ productId: l.productId, gross: String(l.gross), lossPct: String(l.lossPct) })) : [emptyLine()],
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const options = useMemo(
    () => products.filter((p) => p.active && p.kind !== 'dish' && p.id !== product.id).map((p) => ({ value: p.id, label: p.name, hint: p.unit })),
    [products, product.id],
  )

  const draft: Recipe = useMemo(
    () => ({
      productId: product.id,
      outputQty: num(outputQty),
      lines: lines.filter((l) => l.productId !== null).map((l) => ({ productId: l.productId!, gross: num(l.gross), lossPct: num(l.lossPct) })),
    }),
    [product.id, outputQty, lines],
  )
  const priceNum = isDish ? num(price) : 0
  const stats = useMemo(() => recipeStats(draft, priceNum, ctx), [draft, priceNum, ctx])
  const cap = useMemo(() => capacity(draft, ctx), [draft, ctx])
  const limiting = cap.limitingProductId !== null ? ctx.products.get(cap.limitingProductId) : undefined

  const patch = (i: number, p: Partial<EditLine>) => {
    setSaved(false)
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...p } : l)))
  }

  async function submit() {
    setError(null)
    setSaved(false)
    try {
      await save.mutateAsync(draft)
      if (isDish && priceNum !== product.price) await saveProduct.mutateAsync({ ...product, price: priceNum })
      setSaved(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    await remove.mutateAsync(product.id)
    setConfirm(false)
    setLines([emptyLine()])
  }

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-park-textMuted'
  const input = 'w-full rounded-md border border-park-border bg-park-bgInput px-2.5 py-1.5 text-right text-sm text-park-text outline-none focus:border-primary'
  const fcColor = foodCostColor(stats.foodCost)

  return (
    <div className="space-y-4">
      {error && <CusAlert color="danger">{error}</CusAlert>}
      {saved && <CusAlert color="success">Тех. карта сохранена.</CusAlert>}

      <CusCard>
        <CusCardHeader
          title={product.name}
          subtitle={recipe ? 'Технологическая карта' : 'Новая технологическая карта'}
          actions={<CusBadge color={isDish ? 'success' : 'secondary'}>{isDish ? 'Блюдо' : 'Заготовка'}</CusBadge>}
        />
        <div className="grid grid-cols-1 gap-4 p-5 tablet:grid-cols-3">
          <CusInput label={`Выход, ${product.unit}`} inputMode="decimal" value={outputQty} onChange={(e) => { setOutputQty(e.target.value); setSaved(false) }} />
          {isDish && <CusInput label="Цена продажи, сум" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setSaved(false) }} />}
          <CusInput label="Код" value={product.code} readOnly />
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader
          title="Состав"
          subtitle="Нетто = брутто − потери. Себестоимость берётся из средней цены на складе."
          actions={<CusButton size="sm" variant="outline" leftIcon={<LuPlus size={14} />} onClick={() => setLines((ls) => [...ls, emptyLine()])}>Добавить ингредиент</CusButton>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-215 text-sm">
            <thead className="bg-park-bgHover/60">
              <tr>
                <th className={`${th} w-10`}>№</th>
                <th className={th}>Ингредиент</th>
                <th className={`${th} w-14`}>Ед.</th>
                <th className={`${th} w-28 text-right`}>Брутто</th>
                <th className={`${th} w-24 text-right`}>Потери, %</th>
                <th className={`${th} w-24 text-right`}>Нетто</th>
                <th className={`${th} w-28 text-right`}>Цена ед.</th>
                <th className={`${th} w-28 text-right`}>Сумма</th>
                <th className={`${th} w-24 text-right`}>На складе</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const p = l.productId !== null ? ctx.products.get(l.productId) : undefined
                const st = l.productId !== null ? stats.lines[draft.lines.findIndex((x) => x.productId === l.productId)] : undefined
                const onHand = l.productId !== null ? (ctx.stock.get(l.productId)?.qty ?? 0) : 0
                const perPortion = num(outputQty) > 0 ? num(l.gross) / num(outputQty) : 0
                const short = !!p && p.kind === 'goods' && onHand < perPortion
                return (
                  <tr key={i} className="border-t border-park-border">
                    <td className="px-3 py-1.5 text-park-textMuted">{i + 1}</td>
                    <td className="px-3 py-1.5"><CusCombobox options={options} value={l.productId} placeholder="Выберите ингредиент…" onChange={(v) => patch(i, { productId: Number(v) })} /></td>
                    <td className="px-3 py-1.5 text-park-textMuted">{p?.unit ?? '—'}</td>
                    <td className="px-3 py-1.5"><input inputMode="decimal" className={input} value={l.gross} onChange={(e) => patch(i, { gross: e.target.value })} /></td>
                    <td className="px-3 py-1.5"><input inputMode="decimal" className={input} value={l.lossPct} onChange={(e) => patch(i, { lossPct: e.target.value })} /></td>
                    <td className="px-3 py-1.5 text-right text-park-textMuted">{st ? fmtQty(st.netto) : '—'}</td>
                    <td className="px-3 py-1.5 text-right text-park-textMuted">{st ? fmtMoney(st.cost) : '—'}</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-park-text">{st ? fmtMoney(st.sum) : '—'}</td>
                    <td className={cn('px-3 py-1.5 text-right', short ? 'font-semibold text-danger' : 'text-park-textMuted')}>{p ? fmtQty(onHand) : '—'}</td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : [emptyLine()]))} className="rounded-md p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Удалить">
                        <LuTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CusCard>

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <CusCard className="p-5">
          <p className="text-xs text-park-textMuted">Себестоимость {isDish ? 'порции' : `1 ${product.unit}`}</p>
          <p className="mt-1 text-2xl font-bold text-park-text">{fmtMoney(stats.perUnit)} <span className="text-sm font-normal text-park-textMuted">сум</span></p>
          <p className="mt-1 text-xs text-park-textMuted">Вся закладка: {fmtMoney(stats.total)} сум</p>
        </CusCard>
        {isDish ? (
          <>
            <CusCard className="p-5">
              <p className="text-xs text-park-textMuted">Цена продажи / маржа</p>
              <p className="mt-1 text-2xl font-bold text-park-text">{fmtMoney(priceNum)} <span className="text-sm font-normal text-park-textMuted">сум</span></p>
              <p className="mt-1 text-xs text-park-textMuted">Маржа: {stats.margin === null ? '—' : `${fmtMoney(stats.margin)} сум`}</p>
            </CusCard>
            <CusCard className="p-5">
              <p className="text-xs text-park-textMuted">Food cost</p>
              <p className="mt-1 text-2xl font-bold text-park-text">{stats.foodCost === null ? '—' : `${stats.foodCost.toFixed(1)}%`}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-park-bgHover">
                <div className={cn('h-full rounded-full', { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', dark: 'bg-park-border2' }[fcColor])} style={{ width: `${Math.min(stats.foodCost ?? 0, 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-park-textMuted">Норма до 30%, внимание до 40%</p>
            </CusCard>
          </>
        ) : (
          <CusCard className="p-5 desktop:col-span-2">
            <p className="text-xs text-park-textMuted">Нетто всего</p>
            <p className="mt-1 text-2xl font-bold text-park-text">{fmtQty(stats.nettoTotal)}</p>
            <p className="mt-1 text-xs text-park-textMuted">Заготовка может входить в рецепты блюд как ингредиент.</p>
          </CusCard>
        )}
        <CusCard className="p-5">
          <p className="text-xs text-park-textMuted">Хватит на</p>
          <p className={cn('mt-1 text-2xl font-bold', cap.portions === null ? 'text-park-textMuted' : cap.portions === 0 ? 'text-danger' : cap.portions < 10 ? 'text-warning' : 'text-success')}>
            {cap.portions === null ? '—' : `${cap.portions} ${product.unit}`}
          </p>
          <p className="mt-1 text-xs text-park-textMuted">{limiting ? `Ограничивает: ${limiting.name}` : 'По остаткам склада'}</p>
        </CusCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {recipe && <CusButton variant="outline" color="danger" leftIcon={<LuTrash2 size={15} />} onClick={() => setConfirm(true)}>Удалить тех. карту</CusButton>}
        </div>
        <CusButton color="success" isLoading={save.isPending || saveProduct.isPending} onClick={submit}>Сохранить тех. карту</CusButton>
      </div>

      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить тех. карту «${product.name}»?`} />
    </div>
  )
}
