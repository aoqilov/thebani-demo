import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { Expense } from '@/types/accounting.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 100

export const fetchExpenses = (): Promise<Expense[]> =>
  delay([...getWarehouse().expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), ms)

export async function saveExpense(e: Omit<Expense, 'id'> & { id?: number }): Promise<Expense> {
  if (!e.title.trim()) throw new Error('Укажите, на что потрачены деньги.')
  if (!(e.amount >= 0)) throw new Error('Сумма не может быть отрицательной.')
  if (!e.date) throw new Error('Укажите дату расхода.')
  let saved!: Expense
  updateWarehouse((s) => {
    if (e.id) {
      saved = { ...e, id: e.id, title: e.title.trim() }
      return { ...s, expenses: s.expenses.map((x) => (x.id === e.id ? saved : x)) }
    }
    saved = { ...e, id: Math.max(0, ...s.expenses.map((x) => x.id)) + 1, title: e.title.trim() }
    return { ...s, expenses: [...s.expenses, saved] }
  })
  return delay(saved, ms)
}

export async function deleteExpense(id: number): Promise<void> {
  updateWarehouse((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) }))
  await delay(null, ms)
}
