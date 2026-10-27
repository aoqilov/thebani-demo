import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addLockers, assignLocker, deleteLocker, fetchLockEvents, fetchLockers, openLocker, releaseLocker, setLockerCondition } from '@/api/lockers/lockers.api'

/** Демо: текущий раздевалщик (в реальной версии берётся из авторизации). */
export const CURRENT_ATTENDANT = 'Рустам Абдуллаев'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useLockers = () => useQuery({ queryKey: ['wh', 'lockers'], queryFn: fetchLockers })
export const useLockEvents = () => useQuery({ queryKey: ['wh', 'lock-events'], queryFn: fetchLockEvents })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useAssignLocker = () => useMutation({ mutationFn: assignLocker, onSuccess: useDone() })
export const useOpenLocker = () => useMutation({ mutationFn: openLocker, onSuccess: useDone() })
export const useReleaseLocker = () => useMutation({ mutationFn: releaseLocker, onSuccess: useDone() })
export const useSetLockerCondition = () => useMutation({ mutationFn: setLockerCondition, onSuccess: useDone() })
export const useAddLockers = () => useMutation({ mutationFn: addLockers, onSuccess: useDone() })
export const useDeleteLocker = () => useMutation({ mutationFn: deleteLocker, onSuccess: useDone() })
