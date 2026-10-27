import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addServiceCharge, deleteDirection, deleteMaster, deleteService, fetchDirections, fetchMasters, fetchServiceRecords, fetchServices,
  saveDirection, saveMaster, saveService,
} from '@/api/services/services.api'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useDirections = () => useQuery({ queryKey: ['wh', 'directions'], queryFn: fetchDirections })
export const useServices = () => useQuery({ queryKey: ['wh', 'services'], queryFn: fetchServices })
export const useMasters = () => useQuery({ queryKey: ['wh', 'masters'], queryFn: fetchMasters })
export const useServiceRecords = () => useQuery({ queryKey: ['wh', 'service-records'], queryFn: fetchServiceRecords })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useSaveDirection = () => useMutation({ mutationFn: saveDirection, onSuccess: useDone() })
export const useDeleteDirection = () => useMutation({ mutationFn: deleteDirection, onSuccess: useDone() })
export const useSaveService = () => useMutation({ mutationFn: saveService, onSuccess: useDone() })
export const useDeleteService = () => useMutation({ mutationFn: deleteService, onSuccess: useDone() })
export const useSaveMaster = () => useMutation({ mutationFn: saveMaster, onSuccess: useDone() })
export const useDeleteMaster = () => useMutation({ mutationFn: deleteMaster, onSuccess: useDone() })
export const useAddServiceCharge = () => useMutation({ mutationFn: addServiceCharge, onSuccess: useDone() })
