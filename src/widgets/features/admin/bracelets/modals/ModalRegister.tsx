import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CURRENT_ADMIN, useRegisterBracelets } from '../hooks/useBracelets'

export default function ModalRegister({ open, onClose }: { open: boolean; onClose: () => void }) {
  const register = useRegisterBracelets()
  const [count, setCount] = useState('50')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setCount('50'); setError(null) }
  }, [open])

  async function submit() {
    setError(null)
    try {
      await register.mutateAsync({ count: Number(count), by: CURRENT_ADMIN })
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
      title="Зарегистрировать браслеты"
      footer={<><CusButton variant="ghost" onClick={onClose}>Отмена</CusButton><CusButton isLoading={register.isPending} onClick={submit}>Зарегистрировать</CusButton></>}
    >
      <div className="space-y-3">
        {error && <CusAlert color="danger">{error}</CusAlert>}
        <CusInput label="Сколько браслетов" inputMode="numeric" value={count} autoFocus onChange={(e) => setCount(e.target.value)} />
        <p className="text-xs text-park-textMuted">В демо коды NFC-меток создаются автоматически. В реальной версии каждый браслет считывается на NFC-считывателе.</p>
      </div>
    </CusDialog>
  )
}
