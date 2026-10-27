import { useEffect, useState } from 'react'
import { LuMinus, LuNfc, LuPlus } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import type { TableDef } from '@/types/order.types'
import { CURRENT_WAITER } from '../../constants'
import { useOpenTable, useScanBracelet, useScanGuestBracelet } from '../../hooks/useOrders'

export default function ModalOpenTable({ table, onClose, onOpened }: { table: TableDef | null; onClose: () => void; onOpened: (tableId: number) => void }) {
  const open = useOpenTable()
  const scanNew = useScanBracelet()
  const scanGuest = useScanGuestBracelet()
  const scanning = scanNew.isPending || scanGuest.isPending
  const [guests, setGuests] = useState(2)
  const [bracelet, setBracelet] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (table) { setGuests(Math.min(2, table.seats)); setBracelet(null); setError(null) }
  }, [table])

  async function submit() {
    if (!table) return
    try {
      await open.mutateAsync({ tableId: table.id, guests, bracelet, waiter: CURRENT_WAITER })
      onOpened(table.id)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const stepper = 'flex h-14 w-14 items-center justify-center rounded-xl border border-park-border text-park-text active:scale-95 disabled:opacity-40'

  return (
    <CusDialog
      open={!!table}
      onClose={onClose}
      size="sm"
      title={table ? `Открыть ${table.name}` : ''}
      footer={<><CusButton variant="ghost" onClick={onClose}>Отмена</CusButton><CusButton size="lg" isLoading={open.isPending} onClick={submit}>Открыть стол</CusButton></>}
    >
      {table && (
        <div className="space-y-5">
          {error && <CusAlert color="danger">{error}</CusAlert>}
          <div>
            <p className="mb-2 text-sm font-semibold text-park-text3">Гостей (мест: {table.seats})</p>
            <div className="flex items-center justify-center gap-5">
              <button className={stepper} disabled={guests <= 1} onClick={() => setGuests((g) => g - 1)} aria-label="Меньше"><LuMinus size={22} /></button>
              <span className="w-12 text-center text-3xl font-bold text-park-text">{guests}</span>
              <button className={stepper} disabled={guests >= table.seats} onClick={() => setGuests((g) => g + 1)} aria-label="Больше"><LuPlus size={22} /></button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-park-text3">Браслет гостя</p>
            {bracelet ? (
              <div className="flex items-center justify-between rounded-xl bg-success/10 px-4 py-3">
                <span className="flex items-center gap-2 font-mono text-lg font-bold text-success"><LuNfc size={20} /> {bracelet}</span>
                <CusBadge color="success">привязан</CusBadge>
              </div>
            ) : (
              <CusButton size="lg" variant="outline" className="w-full" leftIcon={<LuNfc size={20} />} isLoading={scanning} onClick={async () => setBracelet((await scanGuest.mutateAsync()) ?? (await scanNew.mutateAsync()))}>
                Приложите браслет к считывателю
              </CusButton>
            )}
            <p className="mt-2 text-xs text-park-textMuted">Если гость уже получил браслет на ресепшн, счёт подтянется автоматически.</p>
          </div>
        </div>
      )}
    </CusDialog>
  )
}
