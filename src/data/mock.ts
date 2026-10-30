import { RoleTypes } from '@/const/constData'
import type { ApiEmployee } from '@/types/employee.types'

/** Backend не подключаем — API-функции возвращают эти mock-данные. */
export const delay = <T,>(value: T, ms = 300) => new Promise<T>((r) => setTimeout(() => r(value), ms))

const R = RoleTypes

/** Фиксированный набор: по 1-3 сотрудника на каждую роль, разные статусы. */
const seed: Array<[string, string, ApiEmployee['role'], ApiEmployee['status']]> = [
  ['Алишер', 'Каримов', R.SUPERADMIN, 'active'],
  ['Мирзо', 'Рахимов', R.OWNER, 'active'],
  ['Дильшод', 'Юсупов', R.DIRECTOR, 'active'],
  ['Елена', 'Смирнова', R.ADMIN, 'active'],
  ['Сергей', 'Иванов', R.ADMIN, 'vacation'],
  ['Нодира', 'Алиева', R.ACCOUNTANT, 'active'],
  ['Анна', 'Петрова', R.MARKETING, 'active'],
  ['Малика', 'Саидова', R.HR, 'active'],
  ['Бахтиёр', 'Турсунов', R.SKLAD, 'active'],
  ['Лола', 'Исмоилова', R.PROCEDURE, 'active'],
  ['Зилола', 'Хасанова', R.RECEPTION, 'active'],
  ['Камола', 'Умарова', R.RECEPTION, 'active'],
  ['Мария', 'Козлова', R.CASHIER, 'active'],
  ['Отабек', 'Назаров', R.CASHIER, 'blocked'],
  ['Рустам', 'Абдуллаев', R.RAZDEVALKA, 'active'],
  ['Жасур', 'Холиков', R.RAZDEVALKA, 'active'],
  ['Игорь', 'Волков', R.WAITER, 'active'],
  ['Мадина', 'Орипова', R.WAITER, 'active'],
  ['Санжар', 'Мирзаев', R.WAITER, 'vacation'],
  ['Виктор', 'Попов', R.COOK, 'active'],
  ['Тимур', 'Эргашев', R.COOK, 'active'],
  ['Данияр', 'Бекмуратов', R.BARTENDER, 'active'],
  ['Гульнора', 'Каримова', R.CLEANER, 'active'],
  ['Дилфуза', 'Махмудова', R.CLEANER, 'active'],
  ['Ольга', 'Кузнецова', R.MASSEUR, 'active'],
  ['Азиз', 'Шарипов', R.MASSEUR, 'active'],
  ['Светлана', 'Морозова', R.MASSEUR, 'blocked'],
  ['Рустам', 'Каюмов', R.MASSEUR, 'active'],
  ['Денис', 'Орлов', R.MASSEUR, 'active'],
  ['Зафар', 'Мансуров', R.MASSEUR, 'vacation'],
  ['Ирина', 'Белова', R.MASSEUR, 'active'],
  ['Феруза', 'Салиева', R.ADMIN, 'active'],
  ['Владимир', 'Соколов', R.ADMIN, 'active'],
  ['Гулчехра', 'Рашидова', R.ACCOUNTANT, 'active'],
  ['Эльдор', 'Нематов', R.MARKETING, 'active'],
  ['Шахло', 'Абдурахмонова', R.HR, 'vacation'],
  ['Улугбек', 'Файзиев', R.SKLAD, 'active'],
  ['Марат', 'Гафуров', R.SKLAD, 'active'],
  ['Наргиза', 'Тохтаева', R.PROCEDURE, 'active'],
  ['Мохира', 'Эшонова', R.RECEPTION, 'active'],
  ['Сабина', 'Ли', R.RECEPTION, 'active'],
  ['Камилла', 'Ахмедова', R.RECEPTION, 'blocked'],
  ['Фарход', 'Содиков', R.CASHIER, 'active'],
  ['Нигора', 'Юлдашева', R.CASHIER, 'active'],
  ['Бобур', 'Рустамов', R.RAZDEVALKA, 'active'],
  ['Достон', 'Исаков', R.RAZDEVALKA, 'vacation'],
  ['Улмас', 'Рахматов', R.RAZDEVALKA, 'active'],
  ['Азамат', 'Тошматов', R.WAITER, 'active'],
  ['Севара', 'Рахмонова', R.WAITER, 'active'],
  ['Руслан', 'Ким', R.WAITER, 'active'],
  ['Лайло', 'Султанова', R.WAITER, 'blocked'],
  ['Хуршид', 'Базаров', R.COOK, 'active'],
  ['Ойбек', 'Норматов', R.COOK, 'active'],
  ['Андрей', 'Захаров', R.COOK, 'vacation'],
  ['Шерзод', 'Мавлонов', R.COOK, 'active'],
  ['Акмал', 'Журавлев', R.BARTENDER, 'active'],
  ['Дилшода', 'Хамидова', R.BARTENDER, 'active'],
  ['Эдуард', 'Пак', R.BARTENDER, 'vacation'],
  ['Мунира', 'Ганиева', R.CLEANER, 'active'],
  ['Зухра', 'Нурматова', R.CLEANER, 'active'],
  ['Хилола', 'Каримжонова', R.CLEANER, 'active'],
  ['Сайёра', 'Давронова', R.CLEANER, 'blocked'],
]

export const mockEmployees: ApiEmployee[] = seed.map(([firstname, lastname, role, status], i) => ({
  id: i + 1,
  firstname,
  lastname,
  phone: `+998 90 ${String(100 + i * 7).padStart(3, '0')} ${String(10 + i).padStart(2, '0')} ${String(20 + i * 3).padStart(2, '0')}`,
  role,
  status,
}))

export const mockRevenue = [
  { month: 'Янв', revenue: 4200, visitors: 2400 },
  { month: 'Фев', revenue: 5200, visitors: 3000 },
  { month: 'Мар', revenue: 4800, visitors: 2800 },
  { month: 'Апр', revenue: 7000, visitors: 4200 },
  { month: 'Май', revenue: 6500, visitors: 3900 },
  { month: 'Июн', revenue: 8200, visitors: 5000 },
]

export const mockPaymentTypes = [
  { type: 'Тарифы', value: 520 },
  { type: 'Кухня', value: 310 },
  { type: 'Услуги', value: 240 },
  { type: 'Бар', value: 140 },
]
