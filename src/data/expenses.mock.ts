import { ExpenseCategory, type Expense } from '@/types/accounting.types'

/** Дата «n дней назад» в формате YYYY-MM-DD. */
const dayAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

type Row = [daysAgo: number, category: ExpenseCategory, amount: number, title: string, comment?: string]

const C = ExpenseCategory
const rows: Row[] = [
  // Расходы за последние ~20 дней (период, за который есть и закрытые счета)
  [19, C.RENT, 7_500_000, 'Аренда помещения', 'Октябрь, 1-я половина'],
  [18, C.UTILITIES, 3_850_000, 'Электричество'],
  [17, C.UTILITIES, 2_400_000, 'Природный газ'],
  [17, C.UTILITIES, 780_000, 'Вода и канализация'],
  [15, C.MARKETING, 2_200_000, 'Таргетированная реклама в Instagram'],
  [14, C.SUPPLIES, 640_000, 'Моющие средства, полотенца, простыни'],
  [12, C.REPAIRS, 1_350_000, 'Ремонт насоса в парной'],
  [10, C.PAYROLL, 19_500_000, 'Аванс сотрудникам'],
  [9, C.MARKETING, 900_000, 'Печать листовок и бейджей'],
  [7, C.TAXES, 2_100_000, 'Налог с оборота (аванс)'],
  [6, C.SUPPLIES, 520_000, 'Веники, масла, расходники для процедур'],
  [5, C.OTHER, 300_000, 'Вывоз мусора'],
  [4, C.REPAIRS, 480_000, 'Замена ламп и фурнитуры в раздевалке'],
  [2, C.PAYROLL, 21_000_000, 'Зарплата сотрудникам', 'За вторую половину месяца'],
  [1, C.RENT, 7_500_000, 'Аренда помещения', 'Октябрь, 2-я половина'],
  // Для проверки отображения: нулевая сумма и очень длинное название
  [3, C.OTHER, 0, 'Подарок партнёров (без оплаты) — оформлено для учёта, сумма не указана и должна показываться как «—» в списке'],
]

export const seedExpenses: Expense[] = rows.map(([d, category, amount, title, comment = ''], i) => ({ id: i + 1, date: dayAgo(d), category, amount, title, comment }))
