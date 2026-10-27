export const RoleTypes = {
  // Админ-панель (desktop)
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  DIRECTOR: 'director',
  ADMIN: 'admin', // администратор смены
  ACCOUNTANT: 'accountant',
  MARKETING: 'marketing',
  HR: 'hr',
  SKLAD: 'sklad', // склад: приход/расход, рецепты (тех. карты)
  PROCEDURE: 'procedure', // менеджер услуг: услуги, цены, мастера
  // Мобильные рабочие места
  RECEPTION: 'reception', // тариф + браслет + открытие счёта
  CASHIER: 'cashier', // закрытие счёта на выходе
  RAZDEVALKA: 'razdevalka', // NFC -> комната -> ключ
  WAITER: 'waiter', // счёт на столе, привязка браслета
  COOK: 'cook', // заказы кухни по столам
  BARTENDER: 'bartender', // заказы бара
  CLEANER: 'cleaner', // уборка комнат
  MASSEUR: 'masseur', // оказание услуг -> NFC клиента
} as const

export type RoleTypes = (typeof RoleTypes)[keyof typeof RoleTypes]

/** Только просмотр. */
export const READ_ONLY_ROLES: RoleTypes[] = [RoleTypes.DIRECTOR, RoleTypes.OWNER]

export const RoleLabel: Record<RoleTypes, string> = {
  superadmin: 'Суперадмин',
  owner: 'Владелец',
  director: 'Директор',
  admin: 'Администратор смены',
  accountant: 'Бухгалтер',
  marketing: 'Маркетолог',
  hr: 'HR',
  sklad: 'Склад',
  procedure: 'Менеджер услуг',
  reception: 'Ресепшн',
  cashier: 'Кассир',
  razdevalka: 'Раздевалка',
  waiter: 'Официант',
  cook: 'Повар',
  bartender: 'Бармен',
  cleaner: 'Уборщик',
  masseur: 'Массажист',
}

const R = RoleTypes
const TOP = [R.SUPERADMIN, R.OWNER, R.DIRECTOR]

/** Группы ролей для sidebar и маршрутов. */
export const RoleGroups = {
  TOP,
  OPS: [...TOP, R.ADMIN],
  DASH: [...TOP, R.ADMIN, R.ACCOUNTANT, R.MARKETING],
  FINANCE: [...TOP, R.ACCOUNTANT],
  FINANCE_SHIFT: [...TOP, R.ACCOUNTANT, R.ADMIN],
  PEOPLE: [...TOP, R.ADMIN, R.HR],
  SERVICES: [...TOP, R.ADMIN, R.PROCEDURE],
  STOCK: [...TOP, R.ADMIN, R.SKLAD, R.ACCOUNTANT],
  MENU: [...TOP, R.ADMIN, R.MARKETING, R.SKLAD],
  PRICING: [...TOP, R.ADMIN, R.MARKETING],
  ALL_ADMIN: [...TOP, R.ADMIN, R.ACCOUNTANT, R.MARKETING, R.HR, R.SKLAD, R.PROCEDURE],
} satisfies Record<string, RoleTypes[]>

export const ADMIN_ROLES: RoleTypes[] = RoleGroups.ALL_ADMIN
