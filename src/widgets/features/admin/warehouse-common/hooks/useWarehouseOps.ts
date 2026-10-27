import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteInventory, deleteProduction, deletePurchaseOrder, fetchInventories, fetchInventory, fetchProduction, fetchProductions,
  fetchPurchaseOrder, fetchPurchaseOrders, postInventory, postProduction, receivePurchaseOrder, saveInventory, saveProduction,
  savePurchaseOrder, sendPurchaseOrder, unpostInventory, unpostProduction,
} from '@/api/warehouse/ops.api'

// Все ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useInventories = () => useQuery({ queryKey: ['wh', 'inventories'], queryFn: fetchInventories })
export const useInventory = (id: number | null) => useQuery({ queryKey: ['wh', 'inventory', id], queryFn: () => fetchInventory(id!), enabled: id !== null })
export const useProductions = () => useQuery({ queryKey: ['wh', 'productions'], queryFn: fetchProductions })
export const useProduction = (id: number | null) => useQuery({ queryKey: ['wh', 'production', id], queryFn: () => fetchProduction(id!), enabled: id !== null })
export const usePurchaseOrders = () => useQuery({ queryKey: ['wh', 'purchase-orders'], queryFn: fetchPurchaseOrders })
export const usePurchaseOrder = (id: number | null) => useQuery({ queryKey: ['wh', 'purchase-order', id], queryFn: () => fetchPurchaseOrder(id!), enabled: id !== null })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useSaveInventory = () => useMutation({ mutationFn: saveInventory, onSuccess: useDone() })
export const usePostInventory = () => useMutation({ mutationFn: postInventory, onSuccess: useDone() })
export const useUnpostInventory = () => useMutation({ mutationFn: unpostInventory, onSuccess: useDone() })
export const useDeleteInventory = () => useMutation({ mutationFn: deleteInventory, onSuccess: useDone() })

export const useSaveProduction = () => useMutation({ mutationFn: saveProduction, onSuccess: useDone() })
export const usePostProduction = () => useMutation({ mutationFn: postProduction, onSuccess: useDone() })
export const useUnpostProduction = () => useMutation({ mutationFn: unpostProduction, onSuccess: useDone() })
export const useDeleteProduction = () => useMutation({ mutationFn: deleteProduction, onSuccess: useDone() })

export const useSavePurchaseOrder = () => useMutation({ mutationFn: savePurchaseOrder, onSuccess: useDone() })
export const useSendPurchaseOrder = () => useMutation({ mutationFn: sendPurchaseOrder, onSuccess: useDone() })
export const useReceivePurchaseOrder = () => useMutation({ mutationFn: receivePurchaseOrder, onSuccess: useDone() })
export const useDeletePurchaseOrder = () => useMutation({ mutationFn: deletePurchaseOrder, onSuccess: useDone() })
