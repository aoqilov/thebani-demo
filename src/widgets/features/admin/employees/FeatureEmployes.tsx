import PageHeader from '@/widgets/shared-ui/PageHeader'
import EmployeeStatCards from './components/EmployeeStatCards'
import EmployeeTableCard from './components/EmployeeTableCard'

export default function FeatureEmployes() {
  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader title="Сотрудники" highlight="и роли" label="Control" />
      <EmployeeStatCards />
      <EmployeeTableCard />
    </div>
  )
}
