import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { cn } from '@/lib/cn'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { billTotals } from '@/data/billing'
import LockerGrid from '../../razdevalka/components/LockerGrid'
import { useLockers } from '../../razdevalka/hooks/useLockers'
import { minutesSince } from '../../waiter/constants'
import { useNow } from '../../waiter/hooks/useNow'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'

export default function FeatureLiveRooms() {
  const { data: tables = [] } = useTables()
  const { data: orders = [] } = useOrders()
  const { data: lockers = [] } = useLockers()
  useNow()

  const seated = orders.filter((o) => o.tableId !== null)
  const free = lockers.filter((l) => l.condition === 'ok' && l.orderId === null).length

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Онлайн" title="Столы" highlight="и шкафы" subtitle={`Занято столов: ${seated.length} из ${tables.length} · свободно шкафов: ${free} из ${lockers.length}`} />

      <CusCard>
        <CusCardHeader title="Столы" />
        <div className="grid grid-cols-2 gap-3 p-5 tablet:grid-cols-3 desktop:grid-cols-4 wide:grid-cols-6">
          {tables.map((t) => {
            const o = seated.find((x) => x.tableId === t.id)
            return (
              <div key={t.id} className={cn('rounded-xl border-2 p-3', !o && 'border-dashed border-park-border2', o && o.status === 'open' && 'border-primary/40 bg-primary/5', o?.status === 'bill' && 'border-warning bg-warning/10')}>
                <p className="font-bold text-park-text">{t.name}</p>
                <p className="text-xs text-park-textMuted">{t.zone} · {t.seats} мест</p>
                {o ? (
                  <p className="mt-2 text-sm font-semibold text-park-text">{fmtMoney(billTotals(o, 0, false).total)}<span className="block text-xs font-normal text-park-textMuted">{minutesSince(o.openedAt)} мин{o.status === 'bill' ? ' · счёт' : ''}</span></p>
                ) : <p className="mt-2 text-sm font-semibold text-success">Свободен</p>}
              </div>
            )
          })}
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader title="Шкафы раздевалки" subtitle="Зелёные — свободны, синие — заняты, пунктир — неисправны" />
        <div className="p-5"><LockerGrid lockers={lockers} onPick={() => undefined} /></div>
      </CusCard>
    </div>
  )
}
