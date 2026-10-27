import { useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusAvatar } from '@/components/ui/avatar/CusAvatar'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { masterName, type Master } from '@/types/services.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useDirections, useMasters } from '../services-list/hooks/useServices'
import ModalMaster from './modals/ModalMaster'

export default function FeatureServicesMasters() {
  const { data: masters = [], isLoading } = useMasters()
  const { data: directions = [] } = useDirections()
  const [editing, setEditing] = useState<Master | null>(null)
  const [open, setOpen] = useState(false)

  const columns: ColumnDef<Master>[] = [
    {
      key: 'name', header: 'Мастер', sortable: true,
      render: (m) => (
        <span className="flex items-center gap-3">
          <CusAvatar name={masterName(m)} size={34} />
          <span className="font-semibold text-park-text">{masterName(m)}</span>
        </span>
      ),
    },
    { key: 'phone', header: 'Телефон' },
    {
      key: 'directionIds', header: 'Направления',
      render: (m) => (
        <span className="flex flex-wrap gap-1">
          {m.directionIds.map((id) => <CusBadge key={id} color="info">{directions.find((d) => d.id === id)?.name ?? id}</CusBadge>)}
        </span>
      ),
    },
    { key: 'commissionPct', header: 'Процент', align: 'right', render: (m) => `${m.commissionPct}%` },
    { key: 'active', header: 'Статус', render: (m) => (m.active ? <CusBadge color="success">Работает</CusBadge> : <CusBadge color="dark">Отключён</CusBadge>) },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Услуги" title="Мастера" highlight="и направления" subtitle="Сотрудники, которые оказывают услуги. После создания они могут работать с любой кассы или POS." />
      <CusCard>
        <CusToolbar left={<CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => { setEditing(null); setOpen(true) }}>Новый мастер</CusButton>} />
        <CusTable data={masters} columns={columns} isLoading={isLoading} interactive onRowClick={(m) => { setEditing(m); setOpen(true) }} />
        <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Мастеров: {masters.length}</div>
      </CusCard>
      <ModalMaster open={open} onClose={() => setOpen(false)} master={editing} directions={directions} />
    </div>
  )
}
