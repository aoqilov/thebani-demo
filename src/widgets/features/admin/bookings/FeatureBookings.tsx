import { CusCard } from '@/components/shared/card/CusCard'
import PageHeader from '@/widgets/shared-ui/PageHeader'

export default function FeatureBookings() {
  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader title="Бронирования" subtitle="Брони приватных комнат." />
      <CusCard className="p-8 text-center text-sm text-park-textMuted">Раздел в разработке</CusCard>
    </div>
  )
}
