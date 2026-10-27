import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteDoc, deleteProduct, deleteRecipe, deleteSupplier, fetchDoc, fetchDocs, fetchGroups, fetchMovements, fetchProducts, fetchRecipes, fetchStock, fetchSuppliers,
  postDoc, saveDoc, saveProduct, saveRecipe, saveSupplier, unpostDoc,
} from '@/api/warehouse/warehouse.api'
import type { DocType } from '@/types/warehouse.types'

// Все ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useGroups = () => useQuery({ queryKey: ['wh', 'groups'], queryFn: fetchGroups })
export const useSuppliers = () => useQuery({ queryKey: ['wh', 'suppliers'], queryFn: fetchSuppliers })
export const useProducts = () => useQuery({ queryKey: ['wh', 'products'], queryFn: fetchProducts })
export const useDocs = (type: DocType) => useQuery({ queryKey: ['wh', 'docs', type], queryFn: () => fetchDocs(type) })
export const useDoc = (id: number | null) => useQuery({ queryKey: ['wh', 'doc', id], queryFn: () => fetchDoc(id!), enabled: id !== null })
export const useRecipes = () => useQuery({ queryKey: ['wh', 'recipes'], queryFn: fetchRecipes })
export const useStock = () => useQuery({ queryKey: ['wh', 'stock'], queryFn: fetchStock })
export const useMovements = (productId?: number) => useQuery({ queryKey: ['wh', 'movements', productId], queryFn: () => fetchMovements(productId) })

function useInvalidateAll() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export function useSaveProduct() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: saveProduct, onSuccess: done })
}
export function useDeleteProduct() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: deleteProduct, onSuccess: done })
}
export function useSaveDoc() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: saveDoc, onSuccess: done })
}
export function usePostDoc() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: postDoc, onSuccess: done })
}
export function useUnpostDoc() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: unpostDoc, onSuccess: done })
}
export function useDeleteDoc() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: deleteDoc, onSuccess: done })
}
export function useSaveRecipe() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: saveRecipe, onSuccess: done })
}
export function useDeleteRecipe() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: deleteRecipe, onSuccess: done })
}
export function useSaveSupplier() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: saveSupplier, onSuccess: done })
}
export function useDeleteSupplier() {
  const done = useInvalidateAll()
  return useMutation({ mutationFn: deleteSupplier, onSuccess: done })
}
