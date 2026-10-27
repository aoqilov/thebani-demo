import { useMemo, useState } from 'react'
import { LuNfc, LuTicket } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import type { Order } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useCheckIn, useIssueBracelet, useTariffs } from '../../admin/tariffs/hooks/useTariffs'
import { CURRENT_RECEPTIONIST } from '../constants'
import TariffCard from './components/TariffCard'

export default function FeatureReceptionNewGuest() {
  const navigate = useNavigate()
  const { data: tariffs = [] } = useTariffs()
  const issue = useIssueBracelet()
  const checkIn = useCheckIn()
  const [qty, setQty] = useState<Record<number, number>>({})
  const [bracelet, setBracelet] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Order | null>(null)

  const active = tariffs.filter((t) => t.active)
  const lines = useMemo(() => active.filter((t) => (qty[t.id] ?? 0) > 0).map((t) => ({ tariff: t, qty: qty[t.id] })), [active, qty])
  const total = lines.reduce((s, l) => s + l.tariff.price * l.qty, 0)
  const guests = lines.reduce((s, l) => s + l.tariff.guests * l.qty, 0)
  const hours = lines.length ? Math.max(...lines.map((l) => l.tariff.durationMin)) / 60 : 0

  async function submit() {
    setError(null)
    try {
      const order = await checkIn.mutateAsync({ lines: lines.map((l) => ({ tariffId: l.tariff.id, qty: l.qty })), bracelet: bracelet!, receptionist: CURRENT_RECEPTIONIST })
      setDone(order)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function reset() {
    setDone(null)
    setQty({})
    setBracelet(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader label="Ресепшн" title="Новый" highlight="гость" subtitle="Выберите тариф, выдайте браслет — счёт откроется автоматически. Оплата — при выходе у кассира." />

      <div className="grid grid-cols-1 items-start gap-5 desktop:grid-cols-[1fr_380px]">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
          {active.map((t) => <TariffCard key={t.id} tariff={t} qty={qty[t.id] ?? 0} onChange={(n) => setQty((q) => ({ ...q, [t.id]: Math.max(0, n) }))} />)}
          {active.length === 0 && <CusCard className="p-8 text-center text-sm text-park-textMuted tablet:col-span-2">Активных тарифов нет. Добавьте их в разделе «Тарифы».</CusCard>}
        </div>

        <aside className="sticky top-20">
          <CusCard>
            <CusCardHeader title="Счёт гостя" />
            <div className="space-y-4 p-5">
              {error && <CusAlert color="danger">{error}</CusAlert>}

              {lines.length === 0 ? (
                <p className="rounded-xl border border-dashed border-park-border2 p-5 text-center text-sm text-park-textMuted">Выберите тариф слева</p>
              ) : (
                <ul className="divide-y divide-park-border text-sm">
                  {lines.map((l) => (
                    <li key={l.tariff.id} className="flex items-center justify-between py-2">
                      <span className="text-park-text">{l.tariff.name} × {l.qty}</span>
                      <span className="font-semibold text-park-text">{fmtMoney(l.tariff.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <dl className="space-y-1 rounded-xl bg-park-bgHover/60 p-4 text-sm">
                <div className="flex justify-between"><dt className="text-park-textMuted">Гостей</dt><dd className="font-semibold text-park-text">{guests}</dd></div>
                <div className="flex justify-between"><dt className="text-park-textMuted">Время</dt><dd className="font-semibold text-park-text">{hours ? `${hours} ч` : '—'}</dd></div>
                <div className="flex items-end justify-between border-t border-park-border pt-2"><dt className="font-bold text-park-text">К оплате при выходе</dt><dd className="text-2xl font-bold text-park-text">{fmtMoney(total)}</dd></div>
              </dl>

              <div>
                <p className="mb-2 text-sm font-semibold text-park-text3">Браслет</p>
                {bracelet ? (
                  <div className="flex items-center justify-between rounded-xl bg-success/10 px-4 py-3">
                    <span className="flex items-center gap-2 font-mono text-lg font-bold text-success"><LuNfc size={20} /> {bracelet}</span>
                    <button className="text-xs font-semibold text-park-textMuted underline" onClick={() => setBracelet(null)}>другой</button>
                  </div>
                ) : (
                  <CusButton size="lg" variant="outline" className="w-full" leftIcon={<LuNfc size={20} />} isLoading={issue.isPending} onClick={async () => setBracelet(await issue.mutateAsync())}>
                    Записать новый браслет
                  </CusButton>
                )}
              </div>

              <CusButton size="lg" color="success" className="w-full" leftIcon={<LuTicket size={20} />} isDisabled={lines.length === 0 || !bracelet} isLoading={checkIn.isPending} onClick={submit}>
                Выдать браслет и открыть счёт
              </CusButton>
            </div>
          </CusCard>
        </aside>
      </div>

      <CusDialog
        open={!!done}
        onClose={reset}
        size="sm"
        title="Счёт открыт"
        footer={
          <div className="flex w-full gap-2">
            <CusButton variant="outline" className="flex-1" onClick={() => { reset(); navigate('/reception/guests') }}>Гости в зале</CusButton>
            <CusButton size="lg" className="flex-1" onClick={reset}>Следующий гость</CusButton>
          </div>
        }
      >
        {done && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-park-textMuted">Передайте гостю браслет</p>
            <p className="flex items-center justify-center gap-2 font-mono text-3xl font-bold text-success"><LuNfc size={28} /> {done.bracelet}</p>
            <p className="text-sm text-park-text">Гостей: <b>{done.guests}</b> · Время: <b>{done.durationMin >= 960 ? 'безлимит' : `${done.durationMin / 60} ч`}</b></p>
            <p className="text-sm text-park-textMuted">К оплате при выходе: <b className="text-park-text">{fmtMoney(done.charges.reduce((s, c) => s + c.amount, 0))} сум</b></p>
          </div>
        )}
      </CusDialog>
    </div>
  )
}
