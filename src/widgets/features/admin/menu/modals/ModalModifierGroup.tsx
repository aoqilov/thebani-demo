import { useEffect, useMemo, useState } from 'react'
import { LuPlus, LuTrash2 } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusCombobox } from '@/components/ui/select/CusCombobox'
import type { ModifierGroup } from '@/types/menu.types'
import type { Product } from '@/types/warehouse.types'
import { useDeleteModifierGroup, useSaveModifierGroup } from '../hooks/useMenu'

interface OptLine { id: number; name: string; price: string; productId: number | null; qty: string; replaceProductId: number | null }

const emptyOpt = (): OptLine => ({ id: 0, name: '', price: '0', productId: null, qty: '', replaceProductId: null })

export default function ModalModifierGroup({ open, onClose, group, products }: { open: boolean; onClose: () => void; group: ModifierGroup | null; products: Product[] }) {
  const save = useSaveModifierGroup()
  const remove = useDeleteModifierGroup()
  const [name, setName] = useState('')
  const [required, setRequired] = useState(false)
  const [multiple, setMultiple] = useState(false)
  const [options, setOptions] = useState<OptLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(group?.name ?? '')
    setRequired(group?.required ?? false)
    setMultiple(group?.multiple ?? false)
    setOptions(group ? group.options.map((o) => ({ id: o.id, name: o.name, price: String(o.price), productId: o.productId ?? null, qty: o.qty ? String(o.qty) : '', replaceProductId: o.replaceProductId ?? null })) : [emptyOpt()])
    setError(null)
  }, [open, group])

  const patch = (i: number, p: Partial<OptLine>) => setOptions((os) => os.map((o, idx) => (idx === i ? { ...o, ...p } : o)))

  const stockOptions = useMemo(
    () => products.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name, hint: p.unit })),
    [products],
  )
  const unitOf = (id: number | null) => products.find((p) => p.id === id)?.unit

  async function submit() {
    const bad = options.find((o) => o.name.trim() && o.productId && !(Number(o.qty.replace(',', '.')) > 0))
    if (bad) return setError(`Вариант «${bad.name}»: укажите количество для списания.`)
    try {
      await save.mutateAsync({
        id: group?.id, name, required, multiple,
        options: options.map((o) => ({
          id: o.id, name: o.name, price: Number(o.price.replace(',', '.')) || 0,
          ...(o.productId ? { productId: o.productId, qty: Number(o.qty.replace(',', '.')) || 0, replaceProductId: o.replaceProductId ?? undefined } : {}),
        })),
      })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    await remove.mutateAsync(group!.id)
    setConfirm(false)
    onClose()
  }

  return (
    <>
      <CusDialog
        open={open}
        onClose={onClose}
        size="lg"
        title={group ? 'Группа модификаторов' : 'Новая группа модификаторов'}
        footer={
          <>
            {group && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && <CusAlert color="danger">{error}</CusAlert>}
          <CusInput label="Название группы" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-6">
            <CusSwitch checked={required} onChange={setRequired} label="Обязательный выбор" />
            <CusSwitch checked={multiple} onChange={setMultiple} label="Можно выбрать несколько" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-park-text3">Варианты</span>
              <CusButton size="sm" variant="outline" leftIcon={<LuPlus size={14} />} onClick={() => setOptions((o) => [...o, emptyOpt()])}>Добавить</CusButton>
            </div>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-park-border p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><CusInput placeholder="Название" value={o.name} onChange={(e) => patch(i, { name: e.target.value })} /></div>
                    <div className="w-36"><CusInput placeholder="Доплата, сум" inputMode="decimal" value={o.price} onChange={(e) => patch(i, { price: e.target.value })} /></div>
                    <button onClick={() => setOptions((os) => os.filter((_, idx) => idx !== i))} className="rounded-md p-2 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Удалить"><LuTrash2 size={15} /></button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-48 flex-1">
                      <CusCombobox options={stockOptions} value={o.productId} onChange={(v) => patch(i, { productId: Number(v) })} placeholder="Списывать со склада: товар или заготовка…" />
                    </div>
                    <div className="w-32"><CusInput placeholder={`Кол-во${unitOf(o.productId) ? `, ${unitOf(o.productId)}` : ''}`} inputMode="decimal" value={o.qty} onChange={(e) => patch(i, { qty: e.target.value })} /></div>
                    {o.productId && <button onClick={() => patch(i, { productId: null, qty: '', replaceProductId: null })} className="text-xs text-park-textMuted hover:text-danger">Не списывать</button>}
                  </div>
                  {o.productId && (
                    <div>
                      <CusCombobox
                        options={stockOptions} value={o.replaceProductId}
                        onChange={(v) => patch(i, { replaceProductId: Number(v) })}
                        placeholder="Заменяет ингредиент основной тех. карты (необязательно)…"
                      />
                      {o.replaceProductId && <button onClick={() => patch(i, { replaceProductId: null })} className="mt-1 text-xs text-park-textMuted hover:text-danger">Не заменять, только добавить</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить группу «${group?.name}»? Она будет убрана из всех позиций.`} />
    </>
  )
}
