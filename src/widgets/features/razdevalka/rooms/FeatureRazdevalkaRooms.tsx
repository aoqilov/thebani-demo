import { useMemo, useState } from 'react'
import { LuSearch } from 'react-icons/lu'
import { CusCard, CusCardHeader, CusInfoRow } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { LOCK_EVENT_LABEL, type Locker } from '@/types/locker.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { minutesSince } from '../../waiter/constants'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'
import LockerGrid from '../components/LockerGrid'
import { CURRENT_ATTENDANT, useLockEvents, useLockers, useReleaseLocker, useSetLockerCondition } from '../hooks/useLockers'

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export default function FeatureRazdevalkaRooms() {
  const { data: lockers = [] } = useLockers()
  const { data: events = [] } = useLockEvents()
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const release = useReleaseLocker()
  const condition = useSetLockerCondition()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = lockers.find((l) => l.id === selectedId)
  const order = orders.find((o) => o.id === selected?.orderId)
  const table = tables.find((t) => t.id === order?.tableId)

  /** Подсветка по номеру шкафа или браслету. */
  const highlight = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return new Set<number>()
    return new Set(lockers.filter((l) => l.number === q || orders.find((o) => o.id === l.orderId)?.bracelet?.toLowerCase().includes(q)).map((l) => l.id))
  }, [search, lockers, orders])

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try { await fn(); setSelectedId(null) } catch (e) { setError((e as Error).message) }
  }

  const state = (l: Locker) => (l.condition === 'broken' ? 'Неисправен' : l.orderId === null ? 'Свободен' : 'Занят')

  return (
    <div className="space-y-4">
      <PageHeader label="Раздевалка" title="Все" highlight="шкафы" subtitle="Карта раздевалки. Нажмите на шкаф, чтобы увидеть гостя или выполнить действие." />
      {error && <CusAlert color="danger">{error}</CusAlert>}

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_340px]">
        <CusCard>
          <div className="space-y-3 border-b border-park-border p-4">
            <CusInput placeholder="Найти по номеру шкафа или браслета…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
            <div className="flex flex-wrap gap-4 text-xs text-park-textMuted">
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border-2 border-success/50 bg-success/5" /> Свободен</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border-2 border-primary/40 bg-primary/10" /> Занят</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border-2 border-dashed border-park-border2 bg-park-bgHover" /> Неисправен</span>
            </div>
          </div>
          <div className="p-4"><LockerGrid lockers={lockers} highlightIds={highlight} onPick={(l) => setSelectedId(l.id)} /></div>
        </CusCard>

        <CusCard>
          <CusCardHeader title="Журнал замков" />
          <ul className="max-h-[560px] divide-y divide-park-border overflow-y-auto">
            {events.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">Событий нет</li>}
            {events.slice(0, 30).map((e) => (
              <li key={e.id} className="px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-park-text">Шкаф №{e.lockerNumber}</span>
                  <span className="text-xs text-park-textMuted">{hhmm(e.at)}</span>
                </div>
                <p className="text-xs text-park-textMuted">{LOCK_EVENT_LABEL[e.kind]}{e.bracelet && <> · <span className="font-mono">{e.bracelet}</span></>} · {e.by}</p>
              </li>
            ))}
          </ul>
        </CusCard>
      </div>

      <CusDialog open={!!selected} onClose={() => setSelectedId(null)} size="sm" title={selected ? `Шкаф №${selected.number}` : ''}
        footer={selected && (
          <div className="flex w-full flex-col gap-2">
            {selected.orderId !== null && (
              <>
                <CusButton color="warning" isLoading={release.isPending} onClick={() => run(() => release.mutateAsync({ lockerId: selected.id, emergency: true, by: CURRENT_ATTENDANT }))}>Аварийно открыть и освободить</CusButton>
                <CusButton variant="outline" isLoading={release.isPending} onClick={() => run(() => release.mutateAsync({ lockerId: selected.id, by: CURRENT_ATTENDANT }))}>Освободить</CusButton>
              </>
            )}
            {selected.orderId === null && selected.condition === 'ok' && <CusButton variant="outline" color="danger" isLoading={condition.isPending} onClick={() => run(() => condition.mutateAsync({ lockerId: selected.id, broken: true }))}>Пометить неисправным</CusButton>}
            {selected.condition === 'broken' && <CusButton color="success" isLoading={condition.isPending} onClick={() => run(() => condition.mutateAsync({ lockerId: selected.id, broken: false }))}>Вернуть в работу</CusButton>}
          </div>
        )}
      >
        {selected && (
          <div className="divide-y divide-park-border">
            <CusInfoRow label="Состояние" value={<CusBadge color={selected.condition === 'broken' ? 'dark' : selected.orderId === null ? 'success' : 'primary'}>{state(selected)}</CusBadge>} />
            {order && (
              <>
                <CusInfoRow label="Браслет" value={<span className="font-mono">{order.bracelet}</span>} />
                <CusInfoRow label="Гостей" value={order.guests} />
                <CusInfoRow label="Стол" value={table?.name ?? 'не за столом'} />
                <CusInfoRow label="Выдан" value={selected.assignedAt ? `${minutesSince(selected.assignedAt)} мин назад` : '—'} />
              </>
            )}
          </div>
        )}
      </CusDialog>
    </div>
  )
}
