/** Статьи расходов для журнала расходов и отчёта о прибылях и убытках. */
export const ExpenseCategory = {
  PAYROLL: 'payroll',
  RENT: 'rent',
  UTILITIES: 'utilities',
  MARKETING: 'marketing',
  REPAIRS: 'repairs',
  SUPPLIES: 'supplies',
  OTHER: 'other',
  TAXES: 'taxes',
} as const
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory]

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  payroll: 'Зарплата и взносы',
  rent: 'Аренда',
  utilities: 'Коммунальные услуги',
  marketing: 'Маркетинг и реклама',
  repairs: 'Ремонт и обслуживание',
  supplies: 'Хозяйственные расходы',
  other: 'Прочие расходы',
  taxes: 'Налоги',
}

/** Порядок статей в отчёте. Налоги считаются отдельно — после операционной прибыли. */
export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]
export const OPEX_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c !== ExpenseCategory.TAXES)

export interface Expense {
  id: number
  /** YYYY-MM-DD */
  date: string
  category: ExpenseCategory
  /** Сумма, сум */
  amount: number
  title: string
  comment: string
}
