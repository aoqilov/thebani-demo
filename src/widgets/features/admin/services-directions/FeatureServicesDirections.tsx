import { useState } from 'react'
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { masterName, type ServiceDirection } from '@/types/services.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useDeleteDirection, useDirections, useMasters, useServices } from '../services-list/hooks/useServices'
import ModalDirection from './modals/ModalDirection'

export default function FeatureServicesDirections() {
  const { data: directions = [] } = useDirections()
  const { data: services = [] } = useServices()
  const { data: masters = [] } = useMasters()
  const del = useDeleteDirection()
  const [editing, setEditing] = useState<ServiceDirection | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(id: number) {
    setError(null)
    try { await del.mutateAsync(id) } catch (e) { setError((e as Error).message) }
  }

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader
        label="Услуги"
        title="Направления"
        highlight="массажа"
        subtitle="Группы услуг. Мастер может оказывать только те направления, которые ему назначены."
        actions={<CusButton leftIcon={<LuPlus size={16} />} onClick={() => { setEditing(null); setOpen(true) }}>Новое направление</CusButton>}
      />
      {error && <CusAlert color="danger">{error}</CusAlert>}

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
        {directions.map((d) => {
          const list = services.filter((s) => s.directionId === d.id)
          const team = masters.filter((m) => m.active && m.directionIds.includes(d.id))
          return (
            <CusCard key={d.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-park-text">{d.name}</h3>
                  <p className="text-xs text-park-textMuted">{list.length} услуг · {team.length} мастеров</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(d); setOpen(true) }} className="rounded-md p-2 text-park-textMuted hover:bg-park-bgHover" aria-label="Переименовать"><LuPencil size={15} /></button>
                  <button onClick={() => remove(d.id)} className="rounded-md p-2 text-park-textMuted hover:bg-danger/10 hover:text-danger" aria-label="Удалить"><LuTrash2 size={15} /></button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {team.map((m) => <CusBadge key={m.id} color="info">{masterName(m)}</CusBadge>)}
                {team.length === 0 && <span className="text-xs text-park-textMuted">Нет мастеров</span>}
              </div>
            </CusCard>
          )
        })}
      </div>
      <ModalDirection open={open} onClose={() => setOpen(false)} direction={editing} />
    </div>
  )
}
