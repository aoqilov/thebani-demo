import RoleAppLayout from '@/components/layout/role-app/RoleAppLayout'
import ReadyToasts from './components/ReadyToasts'
import { useReadyAlerts } from './hooks/useReadyAlerts'

/** Рабочее место официанта: общий layout плюс уведомления о готовых блюдах и бейдж на «Заказы». */
export default function WaiterLayout() {
  const { alerts, dismiss, readyCount } = useReadyAlerts()
  return <RoleAppLayout appKey="waiter" badges={{ '/waiter/orders': readyCount }} overlay={<ReadyToasts alerts={alerts} onDismiss={dismiss} />} />
}
