import { useEffect, useMemo, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusImagePicker } from '@/components/ui/image/CusImagePicker'
import { CusCheckbox } from '@/components/ui/inputs/CusCheckbox'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { STATION_LABEL, type MenuCategory, type MenuItem, type ModifierGroup, type Station } from '@/types/menu.types'
import type { Product } from '@/types/warehouse.types'
import { useDeleteMenuItem, useSaveMenuItem } from '../hooks/useMenu'

interface Props {
  open: boolean
  onClose: () => void
  item: MenuItem | null
  categories: MenuCategory[]
  products: Product[]
  modifierGroups: ModifierGroup[]
  defaultCategoryId: number
}

export default function ModalMenuItem({ open, onClose, item, categories, products, modifierGroups, defaultCategoryId }: Props) {
  const save = useSaveMenuItem()
  const remove = useDeleteMenuItem()
  const [productId, setProductId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [station, setStation] = useState<Station>('kitchen')
  const [price, setPrice] = useState('')
  const [mods, setMods] = useState<number[]>([])
  const [active, setActive] = useState(true)
  const [image, setImage] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setProductId(item?.productId ?? null)
    setName(item?.name ?? '')
    setCategoryId(item?.categoryId ?? defaultCategoryId)
    setStation(item?.station ?? 'kitchen')
    setPrice(item ? String(item.price) : '')
    setMods(item?.modifierGroupIds ?? [])
    setActive(item?.active ?? true)
    setImage(item?.image)
    setError(null)
  }, [open, item, defaultCategoryId])

  const options = useMemo(
    () => products.filter((p) => p.active && p.kind !== 'prep').map((p) => ({ value: p.id, label: p.name, hint: p.kind === 'dish' ? 'блюдо' : 'товар' })),
    [products],
  )

  /** При выборе источника подставляем название, цену и цех. */
  function pickProduct(id: number) {
    setProductId(id)
    const p = products.find((x) => x.id === id)
    if (!p) return
    if (!item) {
      setName(p.name)
      setStation(p.kind === 'dish' ? 'kitchen' : 'bar')
      if (p.kind === 'dish' && p.price > 0) setPrice(String(p.price))
    }
  }

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({
        id: item?.id, productId: productId ?? 0, name: name.trim(), categoryId, station,
        price: Number(price.replace(/\s/g, '').replace(',', '.')) || 0,
        modifierGroupIds: mods, stopped: item?.stopped ?? false, active, image,
      })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    await remove.mutateAsync(item!.id)
    setConfirm(false)
    onClose()
  }

  return (
    <>
      <CusDialog
        open={open}
        onClose={onClose}
        size="lg"
        title={item ? 'Позиция меню' : 'Новая позиция меню'}
        footer={
          <>
            {item && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {error && <div className="tablet:col-span-2"><CusAlert color="danger">{error}</CusAlert></div>}
          <div className="tablet:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-park-text3">Что продаём</span>
            <CusCombobox options={options} value={productId} onChange={(v) => pickProduct(Number(v))} placeholder="Блюдо по тех. карте или покупной товар…" />
          </div>
          <div className="tablet:col-span-2"><CusImagePicker value={image} name={name} onChange={setImage} /></div>
          <div className="tablet:col-span-2"><CusInput label="Название в меню" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <CusSelect label="Категория" value={String(categoryId)} onChange={(e) => setCategoryId(Number(e.target.value))} options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
          <CusSelect label="Цех приготовления" value={station} onChange={(e) => setStation(e.target.value as Station)} options={(Object.keys(STATION_LABEL) as Station[]).map((s) => ({ value: s, label: STATION_LABEL[s] }))} />
          <CusInput label="Цена, сум" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          <div className="flex items-end"><CusSwitch checked={active} onChange={setActive} label="Показывать в меню" /></div>

          <div className="tablet:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-park-text3">Модификаторы</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-park-border p-3">
              {modifierGroups.map((g) => (
                <CusCheckbox
                  key={g.id}
                  label={`${g.name}${g.required ? ' *' : ''}`}
                  checked={mods.includes(g.id)}
                  onChange={(e) => setMods((m) => (e.target.checked ? [...m, g.id] : m.filter((x) => x !== g.id)))}
                />
              ))}
              {!modifierGroups.length && <span className="text-sm text-park-textMuted">Групп модификаторов пока нет — создайте их на вкладке «Модификаторы».</span>}
            </div>
          </div>
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить «${item?.name}» из меню?`} />
    </>
  )
}
