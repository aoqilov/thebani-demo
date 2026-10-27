import { LuEye } from 'react-icons/lu'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { useHasRole, useIsReadOnly } from '@/hooks/useHasRole'
import { RoleTypes } from '@/const/constData'
import { useNow } from '../../waiter/hooks/useNow'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { ActivityFeed } from './components/ActivityFeed'
import DeptCard from './components/DeptCard'
import WorkersNow from './components/WorkersNow'
import { useOpsCenter } from './hooks/useOpsCenter'

/** Операционный центр: вся работа комплекса на одном экране — для владельца, директора и администратора смены. */
export default function FeatureOpsCenter() {
  const { depts, workers, feed, issues } = useOpsCenter()
  const readOnly = useIsReadOnly()
  const isAdmin = useHasRole(RoleTypes.ADMIN, RoleTypes.SUPERADMIN)
  useNow(20_000)

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Руководство" title="Операционный" highlight="центр" subtitle="Ресепшн, раздевалка, массаж, кухня, бар, зал, касса, склад и браслеты — состояние каждого участка в реальном времени." />

      {issues === 0
        ? <CusAlert color="success">Все участки работают в штатном режиме.</CusAlert>
        : <CusAlert color={depts.some((d) => d.tone === 'bad') ? 'danger' : 'warning'}>Требуют внимания: {issues} из {depts.length} участков. Нажмите на карточку, чтобы перейти к деталям.</CusAlert>}

      {readOnly && !isAdmin && <p className="flex items-center gap-2 text-xs text-park-textMuted"><LuEye size={14} /> Режим просмотра: вы видите всё, но ничего не меняете.</p>}

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {depts.map((d) => <DeptCard key={d.id} dept={d} />)}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[3fr_2fr]">
        <ActivityFeed events={feed} />
        <WorkersNow workers={workers} />
      </div>
    </div>
  )
}
