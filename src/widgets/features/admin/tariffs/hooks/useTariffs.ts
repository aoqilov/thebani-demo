import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checkIn, deleteTariff, extendStay, fetchTariffs, issueBracelet, saveTariff } from '@/api/reception/reception.api'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useTariffs = () => useQuery({ queryKey: ['wh', 'tariffs'], queryFn: fetchTariffs })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useSaveTariff = () => useMutation({ mutationFn: saveTariff, onSuccess: useDone() })
export const useDeleteTariff = () => useMutation({ mutationFn: deleteTariff, onSuccess: useDone() })
export const useCheckIn = () => useMutation({ mutationFn: checkIn, onSuccess: useDone() })
export const useExtendStay = () => useMutation({ mutationFn: extendStay, onSuccess: useDone() })
export const useIssueBracelet = () => useMutation({ mutationFn: issueBracelet })
