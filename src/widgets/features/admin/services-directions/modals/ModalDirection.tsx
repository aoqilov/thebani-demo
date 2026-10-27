import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusInput } from '@/components/ui/inputs/CusInput'
import type { ServiceDirection } from '@/types/services.types'
import { useSaveDirection } from '../../services-list/hooks/useServices'

export default function ModalDirection({ open, onClose, direction }: { open: boolean; onClose: () => void; direction: ServiceDirection | null }) {
  const save = useSaveDirection()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setName(direction?.name ?? ''); setError(null) }
  }, [open, direction])

  async function submit() {
    try {
      await save.mutateAsync({ id: direction?.id, name })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <CusDialog
      open={open}
      onClose={onClose}
      size="sm"
      title={direction ? 'Переименовать направление' : 'Новое направление'}
      footer={<><CusButton variant="ghost" onClick={onClose}>Отмена</CusButton><CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton></>}
    >
      <div className="space-y-3">
        {error && <CusAlert color="danger">{error}</CusAlert>}
        <CusInput label="Название" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
      </div>
    </CusDialog>
  )
}
