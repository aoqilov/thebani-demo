import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusCheckbox } from '@/components/ui/inputs/CusCheckbox'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import type { Master, ServiceDirection } from '@/types/services.types'
import { useDeleteMaster, useSaveMaster } from '../../services-list/hooks/useServices'

export default function ModalMaster({ open, onClose, master, directions }: { open: boolean; onClose: () => void; master: Master | null; directions: ServiceDirection[] }) {
  const save = useSaveMaster()
  const remove = useDeleteMaster()
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [phone, setPhone] = useState('')
  const [commission, setCommission] = useState('35')
  const [dirs, setDirs] = useState<number[]>([])
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setFirstname(master?.firstname ?? '')
    setLastname(master?.lastname ?? '')
    setPhone(master?.phone ?? '')
    setCommission(String(master?.commissionPct ?? 35))
    setDirs(master?.directionIds ?? [])
    setActive(master?.active ?? true)
    setError(null)
  }, [open, master])

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({ id: master?.id, firstname: firstname.trim(), lastname: lastname.trim(), phone, directionIds: dirs, commissionPct: Number(commission.replace(',', '.')) || 0, active })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    try {
      await remove.mutateAsync(master!.id)
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
        title={master ? 'Мастер' : 'Новый мастер'}
        footer={
          <>
            {master && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {error && <div className="tablet:col-span-2"><CusAlert color="danger">{error}</CusAlert></div>}
          <CusInput label="Имя" value={firstname} autoFocus onChange={(e) => setFirstname(e.target.value)} />
          <CusInput label="Фамилия" value={lastname} onChange={(e) => setLastname(e.target.value)} />
          <CusInput label="Телефон" placeholder="+998 XX XXX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <CusInput label="Процент мастеру, %" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} />
          <div className="tablet:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-park-text3">Направления</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-park-border p-3">
              {directions.map((d) => (
                <CusCheckbox key={d.id} label={d.name} checked={dirs.includes(d.id)} onChange={(e) => setDirs((x) => (e.target.checked ? [...x, d.id] : x.filter((i) => i !== d.id)))} />
              ))}
            </div>
          </div>
          <div className="tablet:col-span-2"><CusSwitch checked={active} onChange={setActive} label="Работает (может добавлять услуги)" /></div>
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить мастера «${master?.firstname} ${master?.lastname}»?`} />
    </>
  )
}
