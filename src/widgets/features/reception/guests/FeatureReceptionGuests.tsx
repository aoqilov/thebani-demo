import { useState } from 'react'
import { LuClock, LuNfc, LuSearch, LuTimerReset, LuUsers } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { billTotals } from '@/data/billing'
import { cn } from '@/lib/cn'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useExtendStay } from '../../admin/tariffs/hooks/useTariffs'
import { minutesSince } from '../../waiter/constants'
import { useNow } from '../../waiter/hooks/useNow'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'
import { useLockers } from '../../razdevalka/hooks/useLockers'
import ModalReplaceBracelet from '../../admin/bracelets/modals/ModalReplaceBracelet'
import { CURRENT_RECEPTIONIST } from '../constants'

export default function FeatureReceptionGuests() {
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const extend = useExtendStay()
  const { data: lockers = [] } = useLockers()
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState<{ orderId: number; code: string } | null>(null)
  useNow()

  const q = search.trim().toLowerCase()
  const rows = orders
    .filter((o) => !q || (o.bracelet ?? '').toLowerCase().includes(q) || (tables.find((t) => t.id === o.tableId)?.name ?? '').toLowerCase().includes(q))
    // дольше всех находящиеся — выше
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt))

  const guests = orders.reduce((s, o) => s + o.guests, 0)
  const overdue = orders.filter((o) => minutesSince(o.openedAt) > o.durationMin).length

  return (
    <div className="space-y-4">
      <PageHeader label="Ресепшн" title="Гости" highlight="в зале" subtitle="Все открытые счета с остатком времени. Просрочившим можно продлить на час." />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <CusStatCard icon={<LuUsers size={24} />} label="Гостей в зале" value={guests} color="info" />
        <CusStatCard icon={<LuNfc size={24} />} label="Открытых счетов" value={orders.length} color="primary" />
        <CusStatCard icon={<LuClock size={24} />} label="Время вышло" value={overdue} color={overdue ? 'danger' : 'success'} />
      </div>

      <CusInput placeholder="Номер браслета или стол…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid grid-cols-1 gap-3 desktop:grid-cols-2">
        {rows.length === 0 && <CusCard className="p-8 text-center text-sm text-park-textMuted desktop:col-span-2">Гостей нет</CusCard>}
        {rows.map((o) => {
          const elapsed = minutesSince(o.openedAt)
          const left = o.durationMin - elapsed
          const pct = Math.min((elapsed / o.durationMin) * 100, 100)
          const table = tables.find((t) => t.id === o.tableId)
          const tone = left < 0 ? 'bg-danger' : pct > 80 ? 'bg-warning' : 'bg-success'
          return (
            <CusCard key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-mono text-lg font-bold text-park-text"><LuNfc size={18} /> {o.bracelet ?? '—'}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-park-textMuted">
                    <span className="flex items-center gap-1"><LuUsers size={12} /> {o.guests}</span>
                    {table ? <CusBadge color="info">{table.name}</CusBadge> : <CusBadge color="dark">не за столом</CusBadge>}
                    {lockers.find((l) => l.orderId === o.id) ? <CusBadge color="primary">шкаф №{lockers.find((l) => l.orderId === o.id)!.number}</CusBadge> : <CusBadge color="warning">без шкафа</CusBadge>}
                  </p>
                </div>
                <p className="text-right text-lg font-bold text-park-text">{fmtMoney(billTotals(o, 0, false).total)}<span className="block text-xs font-normal text-park-textMuted">сумма счёта</span></p>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-park-textMuted">{elapsed} из {o.durationMin} мин</span>
                  <span className={cn('font-bold', left < 0 ? 'text-danger' : 'text-park-text')}>{left < 0 ? `Превышено на ${-left} мин` : `Осталось ${left} мин`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-park-bgHover"><div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} /></div>
              </div>

              <ul className="mt-3 space-y-0.5 text-xs text-park-textMuted">
                {o.charges.map((c) => <li key={c.id} className="flex justify-between"><span>{c.title}</span><span>{fmtMoney(c.amount)}</span></li>)}
              </ul>

              <CusButton className="mt-3 w-full" variant={left < 0 ? 'solid' : 'outline'} color={left < 0 ? 'danger' : 'primary'} leftIcon={<LuTimerReset size={16} />} isLoading={extend.isPending && extend.variables?.orderId === o.id} onClick={() => extend.mutate({ orderId: o.id, receptionist: CURRENT_RECEPTIONIST })}>
                Продлить на 1 час
              </CusButton>
              <button className="mt-2 w-full text-center text-xs font-semibold text-park-textMuted underline" onClick={() => setReplace({ orderId: o.id, code: o.bracelet ?? '' })}>Заменить браслет (потерян / сломан)</button>
            </CusCard>
          )
        })}
      </div>
      <ModalReplaceBracelet orderId={replace?.orderId ?? null} oldCode={replace?.code ?? null} by={CURRENT_RECEPTIONIST} onClose={() => setReplace(null)} />
    </div>
  )
}
