import { useState } from 'react'
import { CusCard, CusInfoRow } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { BRACELET_STATUS_LABEL, type Bracelet, type BraceletStatus } from '@/types/bracelet.types'
import type { Order, TableDef } from '@/types/order.types'
import type { CusColor } from '@/types/common.types'
import { CURRENT_ADMIN, useDeleteBracelet, useSetBraceletStatus } from '../hooks/useBracelets'

export const statusColor: Record<BraceletStatus, CusColor> = { free: 'success', issued: 'primary', lost: 'danger', blocked: 'warning', retired: 'dark' }

interface Props {
  bracelet: Bracelet | null
  order?: Order
  table?: TableDef
  lockerNumber?: string
  onClose: () => void
  onReplace: (orderId: number, code: string) => void
}

/** Карточка браслета с действиями по статусу. */
export default function ModalBracelet({ bracelet, order, table, lockerNumber, onClose, onReplace }: Props) {
  const setStatus = useSetBraceletStatus()
  const del = useDeleteBracelet()
  const [error, setError] = useState<string | null>(null)

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try { await fn(); onClose() } catch (e) { setError((e as Error).message) }
  }
  const to = (status: 'free' | 'lost' | 'blocked' | 'retired') => run(() => setStatus.mutateAsync({ id: bracelet!.id, status, by: CURRENT_ADMIN }))

  return (
    <CusDialog
      open={!!bracelet}
      onClose={onClose}
      size="sm"
      title={bracelet?.code ?? ''}
      footer={bracelet && (
        <div className="flex w-full flex-col gap-2">
          {bracelet.status === 'issued' && order && <CusButton color="warning" onClick={() => { onClose(); onReplace(order.id, bracelet.code) }}>Заменить браслет (потерян / сломан)</CusButton>}
          {bracelet.status === 'free' && (
            <>
              <CusButton variant="outline" color="warning" isLoading={setStatus.isPending} onClick={() => to('blocked')}>Заблокировать</CusButton>
              <CusButton variant="outline" color="danger" isLoading={setStatus.isPending} onClick={() => to('lost')}>Отметить утерянным</CusButton>
            </>
          )}
          {bracelet.status === 'blocked' && <CusButton color="success" isLoading={setStatus.isPending} onClick={() => to('free')}>Разблокировать</CusButton>}
          {bracelet.status === 'lost' && <CusButton color="success" isLoading={setStatus.isPending} onClick={() => to('free')}>Браслет найден — вернуть в оборот</CusButton>}
          {bracelet.status !== 'issued' && bracelet.status !== 'retired' && <CusButton variant="ghost" isLoading={setStatus.isPending} onClick={() => to('retired')}>Списать</CusButton>}
          {bracelet.status !== 'issued' && <CusButton variant="ghost" color="danger" isLoading={del.isPending} onClick={() => run(() => del.mutateAsync(bracelet.id))}>Удалить из реестра</CusButton>}
        </div>
      )}
    >
      {bracelet && (
        <div className="space-y-3">
          {error && <CusAlert color="danger">{error}</CusAlert>}
          <CusCard className="divide-y divide-park-border px-4">
            <CusInfoRow label="Статус" value={<CusBadge color={statusColor[bracelet.status]}>{BRACELET_STATUS_LABEL[bracelet.status]}</CusBadge>} />
            {order && (
              <>
                <CusInfoRow label="Гость" value={`${order.guests} чел.`} />
                <CusInfoRow label="Стол" value={table?.name ?? 'не за столом'} />
                <CusInfoRow label="Шкаф" value={lockerNumber ? `№${lockerNumber}` : '—'} />
              </>
            )}
            <CusInfoRow label="Зарегистрирован" value={new Date(bracelet.registeredAt).toLocaleDateString('ru-RU')} />
          </CusCard>
        </div>
      )}
    </CusDialog>
  )
}
