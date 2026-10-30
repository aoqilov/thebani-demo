import { useState } from 'react'
import { LuBellRing, LuBrush, LuClock, LuNfc, LuUsers } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { cn } from '@/lib/cn'
import { orderTotal, type TableDef, type TableZone } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { minutesSince } from '../constants'
import { useNow } from '../hooks/useNow'
import { CURRENT_WAITER } from '../constants'
import { useCleanTable, useCleanings, useOrders, useTables } from '../hooks/useOrders'
import ModalOpenTable from './components/ModalOpenTable'

const zones: Array<TableZone | 'all'> = ['all', 'Зал', 'Терраса', 'VIP']

export default function FeatureWaiterTables() {
  const navigate = useNavigate()
  const { data: tables = [] } = useTables()
  const { data: orders = [] } = useOrders()
  const { data: cleanings = [] } = useCleanings()
  const clean = useCleanTable()
  const [zone, setZone] = useState<TableZone | 'all'>('all')
  const [opening, setOpening] = useState<TableDef | null>(null)
  useNow()

  const visible = tables.filter((t) => zone === 'all' || t.zone === zone)
  const busy = new Set(orders.filter((o) => o.tableId !== null).map((o) => o.tableId)).size

  return (
    <div className="space-y-4">
      <PageHeader label="Официант" title="Столы" subtitle={`Занято ${busy} из ${tables.length}`} />

      <div className="flex flex-wrap gap-1.5">
        {zones.map((z) => <CusChip key={z} active={zone === z} onClick={() => setZone(z)}>{z === 'all' ? 'Все' : z}</CusChip>)}
      </div>

      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
        {visible.map((t) => {
          const here = orders.filter((o) => o.tableId === t.id)
          const order = here[0]
          const ready = here.flatMap((o) => o.items).filter((i) => i.status === 'ready').reduce((s, i) => s + i.qty, 0)
          const bill = here.some((o) => o.status === 'bill')
          const sum = here.reduce((s, o) => s + orderTotal(o), 0)
          const perGuest = here.some((o) => o.guestLabel)
          const dirty = !order ? cleanings.find((c) => c.tableId === t.id && !c.cleanedAt) : undefined
          return (
            <button
              key={t.id}
              onClick={() => (order ? navigate(`/waiter/table/${t.id}`) : dirty ? navigate('/waiter/closed') : setOpening(t))}
              className={cn(
                'relative flex min-h-36 flex-col justify-between rounded-2xl border-2 p-4 text-left transition active:scale-[0.97]',
                !order && !dirty && 'border-dashed border-park-border2 bg-park-bgCard hover:border-success',
                dirty && 'border-warning/60 bg-warning/5',
                order && !bill && 'border-primary/40 bg-primary/5',
                bill && 'border-warning bg-warning/10',
              )}
            >
              {ready > 0 && (
                <span className="absolute -right-2 -top-2 flex h-8 min-w-8 animate-pulse items-center justify-center gap-1 rounded-full bg-success px-2 text-sm font-bold text-white shadow-lg">
                  <LuBellRing size={14} /> {ready}
                </span>
              )}
              <div>
                <p className="text-lg font-bold text-park-text">{t.name}</p>
                <p className="flex items-center gap-1 text-xs text-park-textMuted"><LuUsers size={12} /> {t.seats} мест · {t.zone}</p>
              </div>
              {order ? (
                <div>
                  <p className="text-xl font-bold text-park-text">{fmtMoney(sum)}<span className="ml-1 text-xs font-normal text-park-textMuted">сум</span></p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-park-textMuted">
                    <span className="flex items-center gap-1"><LuClock size={12} /> {minutesSince(order.openedAt)} мин</span>
                    {perGuest ? <span className="flex items-center gap-1 font-semibold text-info"><LuUsers size={12} /> {here.length} счёт(а)</span> : order.bracelet && <span className="flex items-center gap-1"><LuNfc size={12} /> есть</span>}
                    {bill && <span className="font-semibold text-warning">счёт</span>}
                  </p>
                </div>
              ) : (
                dirty ? (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-warning"><LuBrush size={14} /> Ждёт уборки · {minutesSince(dirty.closedAt)} мин</p>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); clean.mutate({ id: dirty.id, by: CURRENT_WAITER }) }}
                      className="flex h-11 items-center justify-center rounded-xl bg-success text-sm font-bold text-white active:scale-95"
                    >Стол убран</span>
                  </div>
                ) : <p className="text-sm font-semibold text-success">Свободен</p>
              )}
            </button>
          )
        })}
      </div>

      <ModalOpenTable table={opening} onClose={() => setOpening(null)} onOpened={(o) => { setOpening(null); navigate(`/waiter/table/${o.tableId}?o=${o.id}`) }} />
    </div>
  )
}
