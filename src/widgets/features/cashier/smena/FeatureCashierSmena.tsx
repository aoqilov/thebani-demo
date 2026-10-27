import { useState } from 'react'
import { LuBanknote, LuClock, LuReceipt, LuWallet } from 'react-icons/lu'
import { cashSince } from '@/api/cashier/cashier.api'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import type { Shift } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useOrders } from '../../waiter/hooks/useOrders'
import { CURRENT_CASHIER, useCloseShift, useClosedOrders, useCurrentShift, useOpenShift, useShifts } from '../hooks/useCashier'

const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.')) || 0
const time = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function FeatureCashierSmena() {
  const { shift } = useCurrentShift()
  const { data: shifts = [] } = useShifts()
  const { data: closed = [] } = useClosedOrders()
  const { data: openOrders = [] } = useOrders()
  const open = useOpenShift()
  const closeShift = useCloseShift()
  const [opening, setOpening] = useState('500000')
  const [counted, setCounted] = useState('')
  const [error, setError] = useState<string | null>(null)

  const inShift = shift ? closed.filter((o) => o.payment && o.payment.at >= shift.openedAt) : []
  const cash = shift ? cashSince(closed, shift.openedAt) : 0
  const expected = (shift?.openingCash ?? 0) + cash
  const diff = counted ? num(counted) - expected : null

  async function doOpen() {
    setError(null)
    try { await open.mutateAsync({ openingCash: num(opening), cashier: CURRENT_CASHIER }) } catch (e) { setError((e as Error).message) }
  }
  async function doClose() {
    setError(null)
    try { await closeShift.mutateAsync({ countedCash: num(counted) }); setCounted('') } catch (e) { setError((e as Error).message) }
  }

  const history = shifts.filter((s) => s.closedAt)
  const columns: ColumnDef<Shift>[] = [
    { key: 'cashier', header: 'Кассир' },
    { key: 'openedAt', header: 'Открыта', render: (s) => time(s.openedAt) },
    { key: 'closedAt', header: 'Закрыта', render: (s) => (s.closedAt ? time(s.closedAt) : '—') },
    { key: 'expectedCash', header: 'Ожидалось', align: 'right', render: (s) => fmtMoney(s.expectedCash ?? 0) },
    { key: 'countedCash', header: 'Пересчитано', align: 'right', render: (s) => fmtMoney(s.countedCash ?? 0) },
    {
      key: 'diff', header: 'Разница', align: 'right',
      render: (s) => {
        const d = (s.countedCash ?? 0) - (s.expectedCash ?? 0)
        return <span className={d === 0 ? 'text-success' : 'font-semibold text-danger'}>{d > 0 ? '+' : ''}{fmtMoney(d)}</span>
      },
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader label="Кассир" title="Смена" subtitle={shift ? `Открыта ${time(shift.openedAt)} · ${shift.cashier}` : 'Смена закрыта'} />
      {error && <CusAlert color="danger">{error}</CusAlert>}

      {!shift ? (
        <CusCard>
          <CusCardHeader title="Открыть смену" subtitle="Без открытой смены принимать оплату нельзя." />
          <div className="max-w-sm space-y-4 p-5">
            <CusInput label="Наличные в кассе на начало, сум" inputMode="numeric" value={opening} onChange={(e) => setOpening(e.target.value)} />
            <CusButton size="lg" className="w-full" isLoading={open.isPending} onClick={doOpen}>Открыть смену</CusButton>
          </div>
        </CusCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
            <CusStatCard icon={<LuClock size={24} />} label="Открыта" value={time(shift.openedAt)} color="info" />
            <CusStatCard icon={<LuWallet size={24} />} label="На начало, сум" value={fmtMoney(shift.openingCash)} color="primary" />
            <CusStatCard icon={<LuBanknote size={24} />} label="Принято наличными, сум" value={fmtMoney(cash)} color="success" />
            <CusStatCard icon={<LuReceipt size={24} />} label="Счетов закрыто" value={inShift.length} color="secondary" />
          </div>

          <CusCard>
            <CusCardHeader title="Закрыть смену" subtitle="Пересчитайте наличные в кассе и введите сумму." />
            <div className="grid max-w-3xl grid-cols-1 gap-5 p-5 tablet:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl bg-park-bgHover/60 p-4">
                  <p className="text-xs text-park-textMuted">Должно быть в кассе</p>
                  <p className="text-2xl font-bold text-park-text">{fmtMoney(expected)} <span className="text-sm font-normal text-park-textMuted">сум</span></p>
                  <p className="mt-1 text-xs text-park-textMuted">{fmtMoney(shift.openingCash)} на начало + {fmtMoney(cash)} наличными</p>
                </div>
                {openOrders.length > 0 && <CusAlert color="warning">Незакрытых счетов: {openOrders.length}. Закройте их, прежде чем закрывать смену.</CusAlert>}
              </div>
              <div className="space-y-3">
                <CusInput label="Фактически в кассе, сум" inputMode="numeric" value={counted} onChange={(e) => setCounted(e.target.value)} />
                {diff !== null && (
                  <p className={diff === 0 ? 'text-sm font-semibold text-success' : 'text-sm font-semibold text-danger'}>
                    {diff === 0 ? 'Сходится' : diff > 0 ? `Излишек ${fmtMoney(diff)}` : `Недостача ${fmtMoney(-diff)}`}
                  </p>
                )}
                <CusButton size="lg" color="danger" className="w-full" isDisabled={!counted || openOrders.length > 0} isLoading={closeShift.isPending} onClick={doClose}>Закрыть смену</CusButton>
              </div>
            </div>
          </CusCard>
        </>
      )}

      <CusCard>
        <CusCardHeader title="Прошлые смены" />
        <CusTable data={history} columns={columns} emptyText="Закрытых смен пока нет" />
      </CusCard>
    </div>
  )
}
