import { useMemo, useState } from 'react'
import { LuCheck, LuClock, LuNfc, LuSearch, LuUsers } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { billTotals } from '@/data/billing'
import { cn } from '@/lib/cn'
import { masterName } from '@/types/services.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useAddServiceCharge, useDirections, useServices } from '../../admin/services-list/hooks/useServices'
import { minutesSince } from '../../waiter/constants'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'
import { useCurrentMaster } from '../hooks/useCurrentMaster'

/** Мастер находит клиента по браслету и добавляет оказанную услугу в его счёт — с любой кассы/POS. */
export default function FeatureMasseurService() {
  const { master, masters, select } = useCurrentMaster()
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const { data: directions = [] } = useDirections()
  const { data: services = [] } = useServices()
  const add = useAddServiceCharge()

  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const order = orders.find((o) => o.id === orderId)
  const table = tables.find((t) => t.id === order?.tableId)

  /** Услуги, которые вправе оказывать этот мастер, по направлениям. */
  const groups = useMemo(
    () => directions
      .filter((d) => master?.directionIds.includes(d.id))
      .map((d) => ({ direction: d, items: services.filter((s) => s.directionId === d.id && s.active) }))
      .filter((g) => g.items.length > 0),
    [directions, services, master],
  )

  function scan() {
    setScanning(true)
    setError(null)
    setNotice(null)
    setTimeout(() => {
      const withBracelet = orders.filter((o) => o.bracelet)
      const typed = code.trim().toLowerCase()
      const found = typed ? withBracelet.find((o) => o.bracelet!.toLowerCase() === typed) : withBracelet[Math.floor(Math.random() * withBracelet.length)]
      if (found) { setOrderId(found.id); setServiceId(null); setCode(found.bracelet!) }
      else setError('Счёт с таким браслетом не найден.')
      setScanning(false)
    }, 500)
  }

  async function submit() {
    if (!order || !master || serviceId === null) return
    setError(null)
    try {
      const charge = await add.mutateAsync({ orderId: order.id, serviceId, masterId: master.id })
      setNotice(`Добавлено в счёт ${order.bracelet}: ${charge.title} — ${fmtMoney(charge.amount)} сум`)
      setServiceId(null)
      setTimeout(() => setNotice(null), 6000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const picked = services.find((s) => s.id === serviceId)
  const left = order ? order.durationMin - minutesSince(order.openedAt) : 0

  return (
    <div className="space-y-4">
      <PageHeader label="Массажист" title="Оказать" highlight="услугу" subtitle="Считайте браслет клиента, выберите услугу — она сразу попадёт в его счёт." />

      <CusCard className="p-4">
        <CusSelect label="Вы (демо)" value={master?.id ?? ''} onChange={(e) => { select(Number(e.target.value)); setServiceId(null) }} options={masters.map((m) => ({ value: String(m.id), label: masterName(m) }))} />
      </CusCard>

      {error && <CusAlert color="danger">{error}</CusAlert>}
      {notice && <CusAlert color="success">{notice}</CusAlert>}

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <CusCard>
            <CusCardHeader title="1. Клиент" />
            <div className="space-y-3 p-4">
              <CusButton size="lg" className="w-full" leftIcon={<LuNfc size={20} />} isLoading={scanning} onClick={scan}>Считать браслет</CusButton>
              <CusInput placeholder="или введите номер браслета" value={code} leftIcon={<LuSearch size={14} />} onChange={(e) => setCode(e.target.value)} />
            </div>
          </CusCard>

          {order && (
            <CusCard className="p-4">
              <p className="flex items-center gap-2 font-mono text-xl font-bold text-park-text"><LuNfc size={20} /> {order.bracelet}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-park-textMuted">
                <span className="flex items-center gap-1"><LuUsers size={12} /> {order.guests}</span>
                {table ? <CusBadge color="info">{table.name}</CusBadge> : <CusBadge color="dark">не за столом</CusBadge>}
                <span className={cn('flex items-center gap-1 font-semibold', left < 0 && 'text-danger')}><LuClock size={12} /> {left < 0 ? `превышено на ${-left} мин` : `осталось ${left} мин`}</span>
              </p>
              <p className="mt-2 text-sm text-park-textMuted">В счёте сейчас: <b className="text-park-text">{fmtMoney(billTotals(order, 0, false).total)} сум</b></p>
              {order.charges.some((c) => c.kind === 'service') && (
                <ul className="mt-2 space-y-0.5 border-t border-park-border pt-2 text-xs text-park-textMuted">
                  {order.charges.filter((c) => c.kind === 'service').map((c) => <li key={c.id} className="flex justify-between gap-2"><span>{c.title}</span><span>{fmtMoney(c.amount)}</span></li>)}
                </ul>
              )}
            </CusCard>
          )}
        </div>

        <CusCard>
          <CusCardHeader title="2. Услуга" subtitle={master ? `Направления мастера: ${directions.filter((d) => master.directionIds.includes(d.id)).map((d) => d.name).join(', ')}` : undefined} />
          <div className="space-y-5 p-4">
            {!order && <p className="py-8 text-center text-sm text-park-textMuted">Сначала считайте браслет клиента.</p>}
            {order && groups.length === 0 && <p className="py-8 text-center text-sm text-park-textMuted">Для ваших направлений нет активных услуг.</p>}
            {order && groups.map((g) => (
              <section key={g.direction.id}>
                <h4 className="mb-2 text-sm font-bold text-park-text">{g.direction.name}</h4>
                <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
                  {g.items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setServiceId(s.id)}
                      className={cn('flex min-h-20 flex-col justify-between rounded-xl border-2 p-3 text-left transition active:scale-[0.98]', serviceId === s.id ? 'border-primary bg-primary/10' : 'border-park-border hover:bg-park-bgHover')}
                    >
                      <span className="text-sm font-semibold text-park-text">{s.name}</span>
                      <span className="mt-2 flex items-center justify-between text-xs text-park-textMuted">
                        <span>{s.durationMin} мин</span>
                        <span className="text-base font-bold text-primary">{fmtMoney(s.price)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {order && (
              <CusButton size="lg" color="success" className="w-full" leftIcon={<LuCheck size={20} />} isDisabled={!picked} isLoading={add.isPending} onClick={submit}>
                {picked ? `Добавить в счёт · ${fmtMoney(picked.price)} сум` : 'Выберите услугу'}
              </CusButton>
            )}
          </div>
        </CusCard>
      </div>
    </div>
  )
}
