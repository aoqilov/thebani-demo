import { CusCard } from '@/components/shared/card/CusCard'
import PageHeader from '@/widgets/shared-ui/PageHeader'

export default function FeatureReceptionProfile() {
  return (
    <div className="space-y-4">
      <PageHeader title="Профиль" subtitle="Данные сотрудника и смена." />
      <CusCard className="p-8 text-center text-sm text-park-textMuted">Раздел в разработке</CusCard>
    </div>
  )
}
