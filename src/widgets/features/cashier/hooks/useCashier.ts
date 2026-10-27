import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { closeOrder, closeShift, fetchClosedOrders, fetchShifts, openShift, settleOvertime } from '@/api/cashier/cashier.api'

export const CURRENT_CASHIER = 'Мария Козлова'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useShifts = () => useQuery({ queryKey: ['wh', 'shifts'], queryFn: fetchShifts })
export const useClosedOrders = () => useQuery({ queryKey: ['wh', 'orders', 'closed'], queryFn: fetchClosedOrders })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useCloseOrder = () => useMutation({ mutationFn: closeOrder, onSuccess: useDone() })
export const useOpenShift = () => useMutation({ mutationFn: openShift, onSuccess: useDone() })
export const useSettleOvertime = () => useMutation({ mutationFn: settleOvertime, onSuccess: useDone() })
export const useCloseShift = () => useMutation({ mutationFn: closeShift, onSuccess: useDone() })

/** Текущая открытая смена (если есть). */
export function useCurrentShift() {
  const q = useShifts()
  return { ...q, shift: q.data?.find((s) => !s.closedAt) }
}
