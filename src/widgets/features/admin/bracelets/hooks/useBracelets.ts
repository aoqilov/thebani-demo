import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteBracelet, fetchBraceletEvents, fetchBracelets, registerBracelets, replaceBracelet, setBraceletStatus } from '@/api/bracelets/bracelets.api'

/** Демо: текущий администратор смены (в реальной версии берётся из авторизации). */
export const CURRENT_ADMIN = 'Елена Смирнова'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useBracelets = () => useQuery({ queryKey: ['wh', 'bracelets'], queryFn: fetchBracelets })
export const useBraceletEvents = () => useQuery({ queryKey: ['wh', 'bracelet-events'], queryFn: fetchBraceletEvents })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useRegisterBracelets = () => useMutation({ mutationFn: registerBracelets, onSuccess: useDone() })
export const useSetBraceletStatus = () => useMutation({ mutationFn: setBraceletStatus, onSuccess: useDone() })
export const useDeleteBracelet = () => useMutation({ mutationFn: deleteBracelet, onSuccess: useDone() })
export const useReplaceBracelet = () => useMutation({ mutationFn: replaceBracelet, onSuccess: useDone() })
