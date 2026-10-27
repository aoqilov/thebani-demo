import { useEffect, useState } from 'react'
import { LuNfc } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusCheckbox } from '@/components/ui/inputs/CusCheckbox'
import { LOST_BRACELET_FINE } from '@/types/bracelet.types'
import { fmtMoney } from '@/utils/format'
import { CURRENT_ADMIN, useReplaceBracelet } from '../hooks/useBracelets'

interface Props {
  /** Счёт гостя, которому меняем браслет; null — окно закрыто */
  orderId: number | null
  oldCode: string | null
  by?: string
  onClose: () => void
}

/** Замена браслета гостю: потерян или сломан. Шкаф и счёт переходят на новый браслет. */
export default function ModalReplaceBracelet({ orderId, oldCode, by = CURRENT_ADMIN, onClose }: Props) {
  const replace = useReplaceBracelet()
  const [reason, setReason] = useState<'lost' | 'broken'>('lost')
  const [fine, setFine] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (orderId !== null) { setReason('lost'); setFine(true); setError(null); setResult(null) }
  }, [orderId])

  async function submit() {
    setError(null)
    try { setResult(await replace.mutateAsync({ orderId: orderId!, reason, fine, by })) } catch (e) { setError((e as Error).message) }
  }

  const choice = (active: boolean) => `min-h-12 flex-1 rounded-xl border-2 px-4 text-sm font-semibold transition active:scale-95 ${active ? 'border-primary bg-primary/10 text-primary' : 'border-park-border text-park-text3 hover:bg-park-bgHover'}`

  return (
    <CusDialog
      open={orderId !== null}
      onClose={onClose}
      size="sm"
      title="Замена браслета"
      footer={result ? <CusButton size="lg" className="w-full" onClick={onClose}>Готово</CusButton> : <><CusButton variant="ghost" onClick={onClose}>Отмена</CusButton><CusButton isLoading={replace.isPending} onClick={submit}>Выдать новый браслет</CusButton></>}
    >
      {result ? (
        <div className="space-y-2 text-center">
          <p className="text-sm text-park-textMuted">Передайте гостю новый браслет</p>
          <p className="flex items-center justify-center gap-2 font-mono text-3xl font-bold text-success"><LuNfc size={28} /> {result}</p>
          <p className="text-xs text-park-textMuted">Счёт и шкаф перенесены на новый браслет. Старый ({oldCode}) больше не действует.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <CusAlert color="danger">{error}</CusAlert>}
          <p className="text-sm text-park-textMuted">Браслет гостя: <b className="font-mono text-park-text">{oldCode}</b></p>
          <div className="flex gap-2">
            <button className={choice(reason === 'lost')} onClick={() => setReason('lost')}>Потерян</button>
            <button className={choice(reason === 'broken')} onClick={() => setReason('broken')}>Сломан</button>
          </div>
          {reason === 'lost' && <CusCheckbox label={`Взять штраф ${fmtMoney(LOST_BRACELET_FINE)} сум`} checked={fine} onChange={(e) => setFine(e.target.checked)} />}
        </div>
      )}
    </CusDialog>
  )
}
