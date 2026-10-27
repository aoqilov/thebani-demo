import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTextArea } from '@/components/ui/inputs/CusTextArea'
import type { Supplier } from '@/types/warehouse.types'
import { useDeleteSupplier, useSaveSupplier } from '../../warehouse-common/hooks/useWarehouse'

export default function ModalSupplier({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier: Supplier | null }) {
  const save = useSaveSupplier()
  const remove = useDeleteSupplier()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [contact, setContact] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(supplier?.name ?? '')
    setPhone(supplier?.phone ?? '')
    setContact(supplier?.contact ?? '')
    setNote(supplier?.note ?? '')
    setError(null)
  }, [open, supplier])

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({ id: supplier?.id, name, phone, contact, note })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    try {
      await remove.mutateAsync(supplier!.id)
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
        title={supplier ? 'Поставщик' : 'Новый поставщик'}
        footer={
          <>
            {supplier && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="grid gap-4">
          {error && <CusAlert color="danger">{error}</CusAlert>}
          <CusInput label="Название" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
            <CusInput label="Телефон" placeholder="+998 XX XXX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <CusInput label="Контактное лицо" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <CusTextArea label="Заметка" placeholder="Что поставляет, условия оплаты, график поставок…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить поставщика «${supplier?.name}»?`} />
    </>
  )
}
