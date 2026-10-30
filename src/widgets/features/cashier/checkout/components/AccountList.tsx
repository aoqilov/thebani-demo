import { useState } from 'react'
import { LuClock, LuNfc, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { billTotals } from '@/data/billing'
import { cn } from '@/lib/cn'
import type { Order, TableDef } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import { minutesSince } from '../../../waiter/constants'

interface Props {
  orders: Order[]
  tables: TableDef[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export default function AccountList({ orders, tables, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [scanning, setScanning] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const name = (o: Order) => (o.tableId === null ? (o.closedTable ? `Был за: ${tables.find((t) => t.id === o.closedTable!.tableId)?.name ?? `стол ${o.closedTable.tableId}`}` : 'Без стола') : `${tables.find((t) => t.id === o.tableId)?.name ?? `Стол ${o.tableId}`}${o.guestLabel ? ` · ${o.guestLabel}` : ''}`)
  const q = search.trim().toLowerCase()
  const rows = orders
    .filter((o) => !q || name(o).toLowerCase().includes(q) || (o.bracelet ?? '').toLowerCase().includes(q))
    // счёт запрошен — выше всех
    .sort((a, b) => Number(b.status === 'bill') - Number(a.status === 'bill') || a.openedAt.localeCompare(b.openedAt))

  /** Имитация считывания браслета: находим счёт по номеру браслета или берём случайный открытый. */
  function scan() {
    setScanning(true)
    setNotFound(false)
    setTimeout(() => {
      const withBracelet = orders.filter((o) => o.bracelet)
      const exact = q ? withBracelet.find((o) => o.bracelet!.toLowerCase() === q) : undefined
      const target = exact ?? (q ? undefined : withBracelet[Math.floor(Math.random() * withBracelet.length)])
      if (target) onSelect(target.id)
      else setNotFound(true)
      setScanning(false)
    }, 600)
  }

  return (
    <CusCard>
      <div className="space-y-3 border-b border-park-border p-3">
        <CusButton size="lg" className="w-full" leftIcon={<LuNfc size={20} />} isLoading={scanning} onClick={scan}>Считать браслет</CusButton>
        <CusInput placeholder="Номер браслета или стол…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => { setSearch(e.target.value); setNotFound(false) }} />
        {notFound && <p className="text-xs font-semibold text-danger">Счёт с таким браслетом не найден.</p>}
      </div>
      <ul className="max-h-[620px] divide-y divide-park-border overflow-y-auto">
        {rows.length === 0 && <li className="p-8 text-center text-sm text-park-textMuted">Открытых счетов нет</li>}
        {rows.map((o) => {
          const total = billTotals(o, 0, false).total
          const unserved = o.items.filter((i) => i.status !== 'served').length
          return (
            <li
              key={o.id}
              onClick={() => onSelect(o.id)}
              className={cn('cursor-pointer px-4 py-3 transition', selectedId === o.id ? 'bg-primary/10' : 'hover:bg-park-bgHover')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-base font-bold text-park-text"><LuNfc size={15} className="text-primary" />{o.bracelet ?? 'без браслета'}</span>
                <span className="text-base font-bold text-park-text">{fmtMoney(total)}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-park-textMuted">
                <span className="flex items-center gap-1"><LuClock size={12} /> {minutesSince(o.openedAt)} мин</span>
                <span>{o.guests} чел.</span>
                {(o.tableId !== null || o.closedTable) && <span>{name(o)}</span>}
                {o.status === 'bill' ? <CusBadge color="warning">счёт запрошен</CusBadge> : <CusBadge color="info">открыт</CusBadge>}
                {unserved > 0 && <CusBadge color="danger">не подано: {unserved}</CusBadge>}
              </div>
            </li>
          )
        })}
      </ul>
    </CusCard>
  )
}
