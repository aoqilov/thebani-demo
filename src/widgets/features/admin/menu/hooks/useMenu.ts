import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteCategory, deleteMenuItem, deleteModifierGroup, fetchMenuCategories, fetchMenuItems, fetchModifierGroups,
  moveCategory, saveCategory, saveMenuItem, saveModifierGroup, setItemStopped,
} from '@/api/menu/menu.api'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useMenuCategories = () => useQuery({ queryKey: ['wh', 'menu', 'categories'], queryFn: fetchMenuCategories })
export const useMenuItems = () => useQuery({ queryKey: ['wh', 'menu', 'items'], queryFn: fetchMenuItems })
export const useModifierGroups = () => useQuery({ queryKey: ['wh', 'menu', 'modifiers'], queryFn: fetchModifierGroups })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useSaveCategory = () => useMutation({ mutationFn: saveCategory, onSuccess: useDone() })
export const useDeleteCategory = () => useMutation({ mutationFn: deleteCategory, onSuccess: useDone() })
export const useMoveCategory = () => useMutation({ mutationFn: moveCategory, onSuccess: useDone() })
export const useSaveMenuItem = () => useMutation({ mutationFn: saveMenuItem, onSuccess: useDone() })
export const useDeleteMenuItem = () => useMutation({ mutationFn: deleteMenuItem, onSuccess: useDone() })
export const useSetItemStopped = () => useMutation({ mutationFn: setItemStopped, onSuccess: useDone() })
export const useSaveModifierGroup = () => useMutation({ mutationFn: saveModifierGroup, onSuccess: useDone() })
export const useDeleteModifierGroup = () => useMutation({ mutationFn: deleteModifierGroup, onSuccess: useDone() })
