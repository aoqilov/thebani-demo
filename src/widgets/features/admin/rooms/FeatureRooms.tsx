import { useState } from 'react'
import { LuLayoutGrid, LuLock, LuPlus, LuTrash2, LuWrench } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import type { Locker } from '@/types/locker.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useOrders } from '../../waiter/hooks/useOrders'
import { useAddLockers, useDeleteLocker, useLockers, useSetLockerCondition } from '../../razdevalka/hooks/useLockers'

const minutes = (iso?: string) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)) : 0)

export default function FeatureRooms() {
  const { data: lockers = [], isLoading } = useLockers()
  const { data: orders = [] } = useOrders()
  const add = useAddLockers()
  const del = useDeleteLocker()
  const condition = useSetLockerCondition()
  const [from, setFrom] = useState('61')
  const [to, setTo] = useState('80')
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn() } catch (e) { setError((e as Error).message) } }
  const sorted = [...lockers].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))

  const columns: ColumnDef<Locker>[] = [
    { key: 'number', header: '№', width: 80, render: (l) => <span className="font-bold text-park-text">{l.number}</span> },
    {
      key: 'state', header: 'Состояние',
      render: (l) => (l.condition === 'broken' ? <CusBadge color="dark">Неисправен</CusBadge> : l.orderId === null ? <CusBadge color="success">Свободен</CusBadge> : <CusBadge color="primary">Занят</CusBadge>),
    },
    { key: 'bracelet', header: 'Браслет гостя', render: (l) => <span className="font-mono text-park-textMuted">{orders.find((o) => o.id === l.orderId)?.bracelet ?? '—'}</span> },
    { key: 'assignedAt', header: 'Занят', render: (l) => (l.orderId === null ? '—' : `${minutes(l.assignedAt)} мин`) },
    {
      key: 'actions', header: '', align: 'right',
      render: (l) => (
        <span className="inline-flex gap-1">
          <button onClick={() => run(() => condition.mutateAsync({ lockerId: l.id, broken: l.condition === 'ok' }))} className="rounded-md p-1.5 text-park-textMuted hover:bg-park-bgHover" title={l.condition === 'ok' ? 'Пометить неисправным' : 'Вернуть в работу'}><LuWrench size={15} /></button>
          <button onClick={() => run(() => del.mutateAsync(l.id))} className="rounded-md p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger" title="Удалить"><LuTrash2 size={15} /></button>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Управление" title="Раздевалка" highlight="и шкафы" subtitle="Единая раздевалка с электронными замками. Гость получает любой свободный шкаф, открывается он его браслетом." />
      {error && <CusAlert color="danger">{error}</CusAlert>}

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <CusStatCard icon={<LuLayoutGrid size={24} />} label="Всего шкафов" value={lockers.length} color="info" />
        <CusStatCard icon={<LuLock size={24} />} label="Занято" value={lockers.filter((l) => l.orderId !== null).length} color="primary" />
        <CusStatCard icon={<LuWrench size={24} />} label="Неисправно" value={lockers.filter((l) => l.condition === 'broken').length} color="warning" />
      </div>

      <CusCard>
        <CusCardHeader title="Добавить шкафы" subtitle="Диапазон номеров, которые есть физически на замках" />
        <div className="flex flex-wrap items-end gap-3 p-5">
          <div className="w-32"><CusInput label="С номера" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="w-32"><CusInput label="По номер" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <CusButton leftIcon={<LuPlus size={16} />} isLoading={add.isPending} onClick={() => run(() => add.mutateAsync({ from: Number(from), to: Number(to) }))}>Добавить</CusButton>
        </div>
      </CusCard>

      <CusCard>
        <CusTable data={sorted} columns={columns} isLoading={isLoading} maxH="520px" stickyHeader />
        <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Шкафов: {lockers.length}</div>
      </CusCard>
    </div>
  )
}
