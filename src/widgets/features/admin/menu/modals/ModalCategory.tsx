import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusInput } from '@/components/ui/inputs/CusInput'
import type { MenuCategory } from '@/types/menu.types'
import { useSaveCategory } from '../hooks/useMenu'

export default function ModalCategory({ open, onClose, category }: { open: boolean; onClose: () => void; category: MenuCategory | null }) {
  const save = useSaveCategory()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setName(category?.name ?? ''); setError(null) }
  }, [open, category])

  async function submit() {
    try {
      await save.mutateAsync({ id: category?.id, name })
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
      title={category ? 'Переименовать категорию' : 'Новая категория'}
      footer={<><CusButton variant="ghost" onClick={onClose}>Отмена</CusButton><CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton></>}
    >
      <div className="space-y-3">
        {error && <CusAlert color="danger">{error}</CusAlert>}
        <CusInput label="Название" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
      </div>
    </CusDialog>
  )
}
