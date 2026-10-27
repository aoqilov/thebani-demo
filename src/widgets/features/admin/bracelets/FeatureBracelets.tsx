import { useMemo, useState } from 'react'
import { LuBan, LuNfc, LuPackageCheck, LuPlus, LuSearch, LuUserCheck } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { BRACELET_EVENT_LABEL, BRACELET_STATUS_LABEL, type Bracelet, type BraceletStatus } from '@/types/bracelet.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useLockers } from '../../razdevalka/hooks/useLockers'
import { minutesSince } from '../../waiter/constants'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'
import { useBraceletEvents, useBracelets } from './hooks/useBracelets'
import ModalBracelet, { statusColor } from './modals/ModalBracelet'
import ModalRegister from './modals/ModalRegister'
import ModalReplaceBracelet from './modals/ModalReplaceBracelet'

type Filter = BraceletStatus | 'all'
const filters: Array<[Filter, string]> = [['all', 'Все'], ['free', 'Свободные'], ['issued', 'Выданные'], ['lost', 'Утерянные'], ['blocked', 'Заблокированные'], ['retired', 'Списанные']]
const hhmm = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function FeatureBracelets() {
  const { data: bracelets = [], isLoading } = useBracelets()
  const { data: events = [] } = useBraceletEvents()
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const { data: lockers = [] } = useLockers()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [replace, setReplace] = useState<{ orderId: number; code: string } | null>(null)

  const count = (s: BraceletStatus) => bracelets.filter((b) => b.status === s).length
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bracelets.filter((b) => (filter === 'all' || b.status === filter) && (!q || b.code.toLowerCase().includes(q)))
  }, [bracelets, filter, search])

  const selected = bracelets.find((b) => b.id === selectedId) ?? null
  const orderOf = (b?: Bracelet | null) => orders.find((o) => o.id === b?.orderId)

  const columns: ColumnDef<Bracelet>[] = [
    { key: 'code', header: 'Код', sortable: true, render: (b) => <span className="font-mono font-semibold text-park-text">{b.code}</span> },
    { key: 'status', header: 'Статус', render: (b) => <CusBadge color={statusColor[b.status]}>{BRACELET_STATUS_LABEL[b.status]}</CusBadge> },
    { key: 'guest', header: 'Гость', render: (b) => { const o = orderOf(b); return o ? `${o.guests} чел. · ${tables.find((t) => t.id === o.tableId)?.name ?? 'не за столом'}` : '—' } },
    { key: 'locker', header: 'Шкаф', render: (b) => lockers.find((l) => l.orderId === b.orderId && b.orderId !== null)?.number ?? '—' },
    { key: 'issuedAt', header: 'Выдан', render: (b) => (b.issuedAt ? `${minutesSince(b.issuedAt)} мин назад` : '—') },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader
        label="Управление"
        title="Браслеты"
        highlight="NFC"
        subtitle="Реестр браслетов. Ресепшн выдаёт только свободные, а при закрытии счёта браслет возвращается на склад."
        actions={<CusButton leftIcon={<LuPlus size={16} />} onClick={() => setRegisterOpen(true)}>Зарегистрировать</CusButton>}
      />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <CusStatCard icon={<LuNfc size={24} />} label="Всего браслетов" value={bracelets.length} color="info" />
        <CusStatCard icon={<LuPackageCheck size={24} />} label="Свободно" value={count('free')} color={count('free') < 10 ? 'warning' : 'success'} />
        <CusStatCard icon={<LuUserCheck size={24} />} label="У гостей" value={count('issued')} color="primary" />
        <CusStatCard icon={<LuBan size={24} />} label="Утеряно / заблокировано" value={count('lost') + count('blocked')} color="danger" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[1fr_340px]">
        <CusCard>
          <CusToolbar
            left={<div className="flex flex-wrap gap-1.5">{filters.map(([k, l]) => <CusChip key={k} active={filter === k} onClick={() => setFilter(k)}>{l}</CusChip>)}</div>}
            right={<CusInput placeholder="Код браслета…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />}
          />
          <CusTable data={rows} columns={columns} isLoading={isLoading} maxH="560px" stickyHeader interactive onRowClick={(b) => setSelectedId(b.id)} emptyText="Браслетов нет" />
          <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Показано: {rows.length}</div>
        </CusCard>

        <CusCard>
          <CusCardHeader title="Журнал" />
          <ul className="max-h-[560px] divide-y divide-park-border overflow-y-auto">
            {events.length === 0 && <li className="p-6 text-center text-sm text-park-textMuted">Событий нет</li>}
            {events.slice(0, 40).map((e) => (
              <li key={e.id} className="px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2"><span className="font-mono font-semibold text-park-text">{e.code}</span><span className="text-xs text-park-textMuted">{hhmm(e.at)}</span></div>
                <p className="text-xs text-park-textMuted">{BRACELET_EVENT_LABEL[e.kind]} · {e.by}{e.note && ` · ${e.note}`}</p>
              </li>
            ))}
          </ul>
        </CusCard>
      </div>

      <ModalBracelet
        bracelet={selected}
        order={orderOf(selected)}
        table={tables.find((t) => t.id === orderOf(selected)?.tableId)}
        lockerNumber={lockers.find((l) => l.orderId === selected?.orderId && selected?.orderId !== null)?.number}
        onClose={() => setSelectedId(null)}
        onReplace={(orderId, code) => setReplace({ orderId, code })}
      />
      <ModalRegister open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <ModalReplaceBracelet orderId={replace?.orderId ?? null} oldCode={replace?.code ?? null} onClose={() => setReplace(null)} />
    </div>
  )
}
