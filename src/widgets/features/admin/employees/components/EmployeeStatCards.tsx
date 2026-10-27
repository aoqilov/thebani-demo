import { LuTreePalm, LuUserCheck, LuUserX, LuUsers } from 'react-icons/lu'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { useEmployeeStats } from '../hooks/useApiEmployees'

export default function EmployeeStatCards() {
  const { data } = useEmployeeStats()
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
      <CusStatCard icon={<LuUsers size={22} />} label="Всего" value={data?.total ?? '—'} color="primary" />
      <CusStatCard icon={<LuUserCheck size={22} />} label="Активные" value={data?.active ?? '—'} color="success" />
      <CusStatCard icon={<LuUserX size={22} />} label="Заблокированные" value={data?.blocked ?? '—'} color="danger" />
      <CusStatCard icon={<LuTreePalm size={22} />} label="В отпуске" value={data?.vacation ?? '—'} color="warning" />
    </div>
  )
}
