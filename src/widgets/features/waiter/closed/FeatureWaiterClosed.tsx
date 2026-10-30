import { useState } from 'react'
import { LuBrush, LuCheck, LuClock, LuUsers } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusAccordion } from '@/components/ui/accordion/CusAccordion'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import type { TableCleaning } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { CURRENT_WAITER } from '../constants'
import { useNow } from '../hooks/useNow'
import { useCleanTable, useCleanings, useTables } from '../hooks/useOrders'

type Filter = 'all' | 'dirty' | 'clean'

const mins = (from: string, to = Date.now()) => Math.max(0, Math.round((to - new Date(from).getTime()) / 60_000))
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
const day = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
const isToday = (iso: string) => day(iso) === day(new Date().toISOString())

/** История закрытых столов: что заказывали, кто закрыл, ждёт ли стол уборки. */
export default function FeatureWaiterClosed() {
  const { data: rows = [] } = useCleanings()
  const { data: tables = [] } = useTables()
  const clean = useCleanTable()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Record<number, boolean>>({})
  useNow()

  const dirty = rows.filter((r) => !r.cleanedAt).length
  const shown = rows.filter((r) => filter === 'all' || (filter === 'dirty' ? !r.cleanedAt : !!r.cleanedAt))
  const tableName = (id: number) => tables.find((t) => t.id === id)?.name ?? `Стол ${id}`

  return (
    <div className="space-y-4">
      <PageHeader label="Официант" title="Закрытые" highlight="столы" subtitle="Столы, за которыми гости уже поели. Стол освобождается после уборки." />

      <div className="flex flex-wrap gap-1.5">
        <CusChip active={filter === 'all'} onClick={() => setFilter('all')}>Все ({rows.length})</CusChip>
        <CusChip active={filter === 'dirty'} onClick={() => setFilter('dirty')}>Ждут уборки ({dirty})</CusChip>
        <CusChip active={filter === 'clean'} onClick={() => setFilter('clean')}>Убраны ({rows.length - dirty})</CusChip>
      </div>

      {shown.length === 0 && <CusCard className="p-8 text-center text-sm text-park-textMuted">Закрытых столов пока нет</CusCard>}

      {shown.map((c: TableCleaning) => {
        const isOpen = open[c.id] ?? !c.cleanedAt
        return (
          <CusCard key={c.id}>
            <CusAccordion
              open={isOpen}
              onToggle={() => setOpen((o) => ({ ...o, [c.id]: !isOpen }))}
              title={
                <>
                  <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-park-text">
                    {tableName(c.tableId)}
                    {c.cleanedAt
                      ? <CusBadge color="success">убран</CusBadge>
                      : <CusBadge color="warning">ждёт уборки · {mins(c.closedAt)} мин</CusBadge>}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-park-textMuted">
                    <span className="flex items-center gap-1"><LuClock size={12} /> {isToday(c.closedAt) ? '' : `${day(c.closedAt)} `}{hhmm(c.closedAt)}</span>
                    <span className="flex items-center gap-1"><LuUsers size={12} /> {c.guests} гост. · {c.bills.length} счёт(а)</span>
                    <span>закрыл: {c.closedBy}</span>
                  </p>
                </>
              }
              aside={<p className="text-lg font-bold text-park-text">{fmtMoney(c.total)}</p>}
            >
              <div className="divide-y divide-park-border">
                {c.bills.map((b) => (
                  <section key={b.orderId} className="px-4 py-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-park-text">{b.label ?? 'Весь стол'}{b.cancelled > 0 && <span className="ml-2 text-xs font-normal text-park-textMuted">отменено позиций: {b.cancelled}</span>}</p>
                      <p className="text-sm font-semibold text-park-text3">{fmtMoney(b.total)}</p>
                    </div>
                    <ul className="text-sm text-park-textMuted">
                      {b.items.map((i, idx) => <li key={idx}>{i.qty} × {i.name}</li>)}
                      {b.items.length === 0 && <li>Блюд не заказывали</li>}
                    </ul>
                  </section>
                ))}

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  {c.cleanedAt ? (
                    <p className="flex items-center gap-1.5 text-sm text-success"><LuCheck size={16} /> Убран в {hhmm(c.cleanedAt)} · {c.cleanedBy} · на уборку ушло {mins(c.closedAt, new Date(c.cleanedAt).getTime())} мин</p>
                  ) : (
                    <>
                      <p className="text-sm text-park-textMuted">Пока стол не убран, посадить за него гостей нельзя.</p>
                      <CusButton size="lg" color="success" leftIcon={<LuBrush size={18} />} isLoading={clean.isPending} onClick={() => clean.mutate({ id: c.id, by: CURRENT_WAITER })}>Стол убран</CusButton>
                    </>
                  )}
                </div>
              </div>
            </CusAccordion>
          </CusCard>
        )
      })}
    </div>
  )
}
