import type { CusColor } from '@/types/common.types'
import type { OrderItemStatus } from '@/types/order.types'

/** Демо: текущий официант (в реальной версии берётся из авторизации). */
export const CURRENT_WAITER = 'Игорь Волков'

export const itemStatusColor: Record<OrderItemStatus, CusColor> = {
  sent: 'info',
  cooking: 'warning',
  ready: 'success',
  served: 'dark',
}

/** Минут с момента ISO-времени. */
export const minutesSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
