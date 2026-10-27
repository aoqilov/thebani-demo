import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusSelect } from '@/components/ui/select/CusSelect'
import type { Service, ServiceDirection } from '@/types/services.types'
import { useDeleteService, useSaveService } from '../hooks/useServices'

const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0

export default function ModalService({ open, onClose, service, directions, defaultDirectionId }: {
  open: boolean; onClose: () => void; service: Service | null; directions: ServiceDirection[]; defaultDirectionId: number
}) {
  const save = useSaveService()
  const remove = useDeleteService()
  const [name, setName] = useState('')
  const [directionId, setDirectionId] = useState(defaultDirectionId)
  const [duration, setDuration] = useState('60')
  const [price, setPrice] = useState('')
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(service?.name ?? '')
    setDirectionId(service?.directionId ?? defaultDirectionId)
    setDuration(String(service?.durationMin ?? 60))
    setPrice(String(service?.price ?? ''))
    setActive(service?.active ?? true)
    setError(null)
  }, [open, service, defaultDirectionId])

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({ id: service?.id, name: name.trim(), directionId, durationMin: Math.round(num(duration)), price: num(price), active })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    await remove.mutateAsync(service!.id)
    setConfirm(false)
    onClose()
  }

  return (
    <>
      <CusDialog
        open={open}
        onClose={onClose}
        title={service ? 'Услуга' : 'Новая услуга'}
        footer={
          <>
            {service && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {error && <div className="tablet:col-span-2"><CusAlert color="danger">{error}</CusAlert></div>}
          <div className="tablet:col-span-2"><CusInput label="Название" value={name} autoFocus onChange={(e) => setName(e.target.value)} /></div>
          <div className="tablet:col-span-2"><CusSelect label="Направление" value={String(directionId)} onChange={(e) => setDirectionId(Number(e.target.value))} options={directions.map((d) => ({ value: String(d.id), label: d.name }))} /></div>
          <CusInput label="Длительность, мин" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <CusInput label="Цена, сум" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          <div className="tablet:col-span-2"><CusSwitch checked={active} onChange={setActive} label="Доступна мастерам" /></div>
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить услугу «${service?.name}»?`} />
    </>
  )
}
