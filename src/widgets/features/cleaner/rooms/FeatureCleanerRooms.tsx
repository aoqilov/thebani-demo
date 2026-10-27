import { CusCard } from '@/components/shared/card/CusCard'
import PageHeader from '@/widgets/shared-ui/PageHeader'

export default function FeatureCleanerRooms() {
  return (
    <div className="space-y-4">
      <PageHeader title="Уборка комнат" subtitle="Комнаты, ожидающие уборки. Обязанности уточним позже." />
      <CusCard className="p-8 text-center text-sm text-park-textMuted">Раздел в разработке</CusCard>
    </div>
  )
}
