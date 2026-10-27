import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addGoods, fetchShopItems } from '@/api/shop/shop.api'

// Ключи начинаются с 'wh' — их инвалидирует и синхронизация между вкладками.
export const useShopItems = () => useQuery({ queryKey: ['wh', 'shop-items'], queryFn: fetchShopItems })

export function useAddGoods() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: addGoods, onSuccess: () => qc.invalidateQueries({ queryKey: ['wh'] }) })
}
