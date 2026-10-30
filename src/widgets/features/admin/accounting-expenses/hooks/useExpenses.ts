import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteExpense, fetchExpenses, saveExpense } from '@/api/accounting/expenses.api'

// Ключи начинаются с 'wh' — так их инвалидирует и синхронизация между вкладками.
export const useExpenses = () => useQuery({ queryKey: ['wh', 'expenses'], queryFn: fetchExpenses })

function useDone() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['wh'] })
}

export const useSaveExpense = () => useMutation({ mutationFn: saveExpense, onSuccess: useDone() })
export const useDeleteExpense = () => useMutation({ mutationFn: deleteExpense, onSuccess: useDone() })
