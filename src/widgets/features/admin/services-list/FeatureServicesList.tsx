import { useMemo, useState } from 'react'
import { LuPlus, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusChip, CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import type { Service } from '@/types/services.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useDirections, useServices } from './hooks/useServices'
import ModalService from './modals/ModalService'

export default function FeatureServicesList() {
  const { data: directions = [] } = useDirections()
  const { data: services = [], isLoading } = useServices()
  const [direction, setDirection] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Service | null>(null)
  const [open, setOpen] = useState(false)

  const dirName = useMemo(() => new Map(directions.map((d) => [d.id, d.name])), [directions])
  const rows = services.filter((s) => (direction === 'all' || s.directionId === direction) && (!search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase())))

  const columns: ColumnDef<Service>[] = [
    { key: 'name', header: 'Услуга', sortable: true, render: (s) => <span className="font-semibold text-park-text">{s.name}</span> },
    { key: 'directionId', header: 'Направление', render: (s) => dirName.get(s.directionId) ?? '—' },
    { key: 'durationMin', header: 'Время', sortable: true, align: 'right', render: (s) => `${s.durationMin} мин` },
    { key: 'price', header: 'Цена, сум', sortable: true, align: 'right', render: (s) => fmtMoney(s.price) },
    { key: 'active', header: 'Статус', render: (s) => (s.active ? <CusBadge color="success">Активна</CusBadge> : <CusBadge color="dark">Отключена</CusBadge>) },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Услуги" title="Услуги" highlight="и цены" subtitle="Менеджер услуг задаёт цену — мастер выбирает услугу и добавляет её в счёт клиента." />
      <CusCard>
        <CusToolbar
          left={
            <>
              <CusButton size="sm" leftIcon={<LuPlus size={14} />} isDisabled={directions.length === 0} onClick={() => { setEditing(null); setOpen(true) }}>Добавить услугу</CusButton>
              <div className="ml-2 flex flex-wrap gap-1.5">
                <CusChip active={direction === 'all'} onClick={() => setDirection('all')}>Все</CusChip>
                {directions.map((d) => <CusChip key={d.id} active={direction === d.id} onClick={() => setDirection(d.id)}>{d.name}</CusChip>)}
              </div>
            </>
          }
          right={<CusInput placeholder="Поиск услуги…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />}
        />
        <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(s) => { setEditing(s); setOpen(true) }} />
        <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Услуг: {rows.length}</div>
      </CusCard>
      <ModalService open={open} onClose={() => setOpen(false)} service={editing} directions={directions} defaultDirectionId={direction === 'all' ? (directions[0]?.id ?? 1) : direction} />
    </div>
  )
}
