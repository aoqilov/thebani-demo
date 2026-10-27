import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { PRODUCT_KIND_LABEL, UNITS, type Product, type ProductGroup, type ProductKind, type Unit } from '@/types/warehouse.types'
import { useDeleteProduct, useSaveProduct } from '../../warehouse-common/hooks/useWarehouse'

/** Группы в плоском списке с отступом по глубине. */
export function flattenGroups(groups: ProductGroup[], parentId: number | null = null, depth = 0): { value: string; label: string }[] {
  return groups
    .filter((g) => g.parentId === parentId)
    .flatMap((g) => [{ value: String(g.id), label: `${'— '.repeat(depth)}${g.name}` }, ...flattenGroups(groups, g.id, depth + 1)])
}

interface Props {
  open: boolean
  onClose: () => void
  groups: ProductGroup[]
  product: Product | null
  defaultGroupId: number
  defaultKind?: ProductKind
}

export default function ModalProduct({ open, onClose, groups, product, defaultGroupId, defaultKind = 'goods' }: Props) {
  const save = useSaveProduct()
  const remove = useDeleteProduct()
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState(defaultGroupId)
  const [unit, setUnit] = useState<Unit>('кг')
  const [kind, setKind] = useState<ProductKind>('goods')
  const [minStock, setMinStock] = useState('0')
  const [price, setPrice] = useState('0')
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? '')
    setGroupId(product?.groupId ?? defaultGroupId)
    setUnit(product?.unit ?? (defaultKind === 'dish' ? 'порц' : 'кг'))
    setKind(product?.kind ?? defaultKind)
    setPrice(String(product?.price ?? 0))
    setMinStock(String(product?.minStock ?? 0))
    setActive(product?.active ?? true)
    setError(null)
  }, [open, product, defaultGroupId, defaultKind])

  async function submit() {
    setError(null)
    if (!name.trim()) return setError('Укажите наименование.')
    try {
      await save.mutateAsync({ id: product?.id, name: name.trim(), groupId, unit, kind, minStock: Number(minStock.replace(',', '.')) || 0, price: kind === 'dish' ? Number(price.replace(/s/g, '').replace(',', '.')) || 0 : 0, active })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    try {
      await remove.mutateAsync(product!.id)
      setConfirm(false)
      onClose()
    } catch (e) {
      setConfirm(false)
      setError((e as Error).message)
    }
  }

  return (
    <>
      <CusDialog
        open={open}
        onClose={onClose}
        size="lg"
        title={product ? `Товар ${product.code}` : 'Новый товар'}
        footer={
          <>
            {product && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {error && <div className="tablet:col-span-2"><CusAlert color="danger">{error}</CusAlert></div>}
          <div className="tablet:col-span-2"><CusInput label="Наименование" value={name} autoFocus onChange={(e) => setName(e.target.value)} /></div>
          <CusSelect label="Группа" value={String(groupId)} onChange={(e) => setGroupId(Number(e.target.value))} options={flattenGroups(groups)} />
          <CusSelect label="Тип" value={kind} onChange={(e) => setKind(e.target.value as ProductKind)} options={(Object.keys(PRODUCT_KIND_LABEL) as ProductKind[]).map((k) => ({ value: k, label: PRODUCT_KIND_LABEL[k] }))} />
          <CusSelect label="Единица измерения" value={unit} onChange={(e) => setUnit(e.target.value as Unit)} options={UNITS.map((u) => ({ value: u, label: u }))} />
          {kind === 'dish'
            ? <CusInput label="Цена продажи, сум" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            : <CusInput label={`Минимальный остаток, ${unit}`} inputMode="decimal" value={minStock} onChange={(e) => setMinStock(e.target.value)} />}
          <div className="tablet:col-span-2"><CusSwitch checked={active} onChange={setActive} label="Активен (доступен для выбора в документах)" /></div>
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить товар «${product?.name}»?`} />
    </>
  )
}
