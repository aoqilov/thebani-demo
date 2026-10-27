import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusTextArea } from '@/components/ui/inputs/CusTextArea'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { TARIFF_KIND_LABEL, type Tariff, type TariffKind } from '@/types/tariff.types'
import { useDeleteTariff, useSaveTariff } from '../hooks/useTariffs'

const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0

export default function ModalTariff({ open, onClose, tariff }: { open: boolean; onClose: () => void; tariff: Tariff | null }) {
  const save = useSaveTariff()
  const remove = useDeleteTariff()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<TariffKind>('adult')
  const [hours, setHours] = useState('3')
  const [price, setPrice] = useState('')
  const [guests, setGuests] = useState('1')
  const [extra, setExtra] = useState('')
  const [includes, setIncludes] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(tariff?.name ?? '')
    setKind(tariff?.kind ?? 'adult')
    setHours(String((tariff?.durationMin ?? 180) / 60))
    setPrice(String(tariff?.price ?? ''))
    setGuests(String(tariff?.guests ?? 1))
    setExtra(String(tariff?.extraHourPrice ?? ''))
    setIncludes((tariff?.includes ?? []).join(', '))
    setDescription(tariff?.description ?? '')
    setActive(tariff?.active ?? true)
    setError(null)
  }, [open, tariff])

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({
        id: tariff?.id, name: name.trim(), kind, durationMin: Math.round(num(hours) * 60), price: num(price), guests: Math.round(num(guests)),
        extraHourPrice: num(extra), includes: includes.split(',').map((s) => s.trim()).filter(Boolean), description: description.trim(), active,
      })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    await remove.mutateAsync(tariff!.id)
    setConfirm(false)
    onClose()
  }

  return (
    <>
      <CusDialog
        open={open}
        onClose={onClose}
        size="lg"
        title={tariff ? 'Тариф' : 'Новый тариф'}
        footer={
          <>
            {tariff && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {error && <div className="tablet:col-span-2"><CusAlert color="danger">{error}</CusAlert></div>}
          <div className="tablet:col-span-2"><CusInput label="Название" value={name} autoFocus onChange={(e) => setName(e.target.value)} /></div>
          <CusSelect label="Тип" value={kind} onChange={(e) => setKind(e.target.value as TariffKind)} options={(Object.keys(TARIFF_KIND_LABEL) as TariffKind[]).map((k) => ({ value: k, label: TARIFF_KIND_LABEL[k] }))} />
          <CusInput label="Длительность, часов" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
          <CusInput label="Цена, сум" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          <CusInput label="Гостей в тарифе" inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value)} />
          <CusInput label="Продление +1 час, сум" inputMode="numeric" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <div className="flex items-end"><CusSwitch checked={active} onChange={setActive} label="Доступен на ресепшн" /></div>
          <div className="tablet:col-span-2"><CusInput label="Что входит (через запятую)" value={includes} onChange={(e) => setIncludes(e.target.value)} /></div>
          <div className="tablet:col-span-2"><CusTextArea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить тариф «${tariff?.name}»?`} />
    </>
  )
}
