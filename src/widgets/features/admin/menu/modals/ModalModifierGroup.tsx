import { useEffect, useState } from 'react'
import { LuPlus, LuTrash2 } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import type { ModifierGroup } from '@/types/menu.types'
import { useDeleteModifierGroup, useSaveModifierGroup } from '../hooks/useMenu'

interface OptLine { id: number; name: string; price: string }

export default function ModalModifierGroup({ open, onClose, group }: { open: boolean; onClose: () => void; group: ModifierGroup | null }) {
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
    setOptions(group ? group.options.map((o) => ({ id: o.id, name: o.name, price: String(o.price) })) : [{ id: 0, name: '', price: '0' }])
    setError(null)
  }, [open, group])

  const patch = (i: number, p: Partial<OptLine>) => setOptions((os) => os.map((o, idx) => (idx === i ? { ...o, ...p } : o)))

  async function submit() {
    try {
      await save.mutateAsync({
        id: group?.id, name, required, multiple,
        options: options.map((o) => ({ id: o.id, name: o.name, price: Number(o.price.replace(',', '.')) || 0 })),
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
              <CusButton size="sm" variant="outline" leftIcon={<LuPlus size={14} />} onClick={() => setOptions((o) => [...o, { id: 0, name: '', price: '0' }])}>Добавить</CusButton>
            </div>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1"><CusInput placeholder="Название" value={o.name} onChange={(e) => patch(i, { name: e.target.value })} /></div>
                  <div className="w-36"><CusInput placeholder="Доплата, сум" inputMode="decimal" value={o.price} onChange={(e) => patch(i, { price: e.target.value })} /></div>
                  <button onClick={() => setOptions((os) => os.filter((_, idx) => idx !== i))} className="rounded-md p-2 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Удалить"><LuTrash2 size={15} /></button>
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
