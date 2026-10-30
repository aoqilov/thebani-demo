import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelItem, cleanTable, closeTable, fetchCleanings, fetchOrders, fetchTables, openTable, requestBill, scanBracelet, scanGuestBracelet, sendItems, setItemStatus } from '@/api/orders/orders.api'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useTables = () => useQuery({ queryKey: ['wh', 'tables'], queryFn: fetchTables })
export const useCleanings = () => useQuery({ queryKey: ['wh', 'cleanings'], queryFn: fetchCleanings })
export const useOrders = () => useQuery({ queryKey: ['wh', 'orders'], queryFn: fetchOrders })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useOpenTable = () => useMutation({ mutationFn: openTable, onSuccess: useDone() })
export const useSendItems = () => useMutation({ mutationFn: sendItems, onSuccess: useDone() })
export const useSetItemStatus = () => useMutation({ mutationFn: setItemStatus, onSuccess: useDone() })
export const useCancelItem = () => useMutation({ mutationFn: cancelItem, onSuccess: useDone() })
export const useCloseTable = () => useMutation({ mutationFn: closeTable, onSuccess: useDone() })
export const useCleanTable = () => useMutation({ mutationFn: cleanTable, onSuccess: useDone() })
export const useRequestBill = () => useMutation({ mutationFn: requestBill, onSuccess: useDone() })
export const useScanBracelet = () => useMutation({ mutationFn: scanBracelet })
export const useScanGuestBracelet = () => useMutation({ mutationFn: scanGuestBracelet })
