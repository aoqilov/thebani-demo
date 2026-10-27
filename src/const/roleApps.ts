import type { IconType } from 'react-icons'
import { LuBrush, LuChefHat, LuClipboardList, LuFileText, LuHeartHandshake, LuHistory, LuLayoutGrid, LuLockKeyhole, LuMartini, LuPlay, LuReceipt, LuTicket, LuUser, LuUsers, LuUtensils } from 'react-icons/lu'
import { RoleTypes } from './constData'

export interface RoleAppScreen {
  /** путь относительно base ('' = индекс) */
  path: string
  label: string
  icon: IconType
}

export interface RoleAppDef {
  key: string
  role: RoleTypes
  base: string
  title: string
  /** Широкий контент (планшет/desktop) вместо 768px */
  wide?: boolean
  screens: RoleAppScreen[]
}

/** Мобильные рабочие места. Генерируется из scratchpad/gen2.mjs, дальше правится вручную. */
export const roleApps: RoleAppDef[] = [
  {
    key: 'reception',
    role: RoleTypes.RECEPTION,
    base: '/reception',
    title: 'Ресепшн',
    wide: true,
    screens: [
      { path: '', label: 'Новый гость', icon: LuTicket },
      { path: 'guests', label: 'Гости', icon: LuUsers },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
  {
    key: 'cashier',
    role: RoleTypes.CASHIER,
    base: '/cashier',
    title: 'Кассир',
    wide: true,
    screens: [
      { path: '', label: 'Счета', icon: LuReceipt },
      { path: 'smena', label: 'Смена', icon: LuPlay },
      { path: 'otchet', label: 'Отчёт', icon: LuFileText },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
  {
    key: 'razdevalka',
    role: RoleTypes.RAZDEVALKA,
    base: '/razdevalka',
    title: 'Раздевалка',
    wide: true,
    screens: [
      { path: '', label: 'Шкаф', icon: LuLockKeyhole },
      { path: 'rooms', label: 'Шкафы', icon: LuLayoutGrid },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
  {
    key: 'waiter',
    role: RoleTypes.WAITER,
    base: '/waiter',
    title: 'Официант',
    wide: true,
    screens: [
      { path: '', label: 'Столы', icon: LuUtensils },
      { path: 'orders', label: 'Заказы', icon: LuClipboardList },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
  {
    key: 'cook',
    role: RoleTypes.COOK,
    base: '/cook',
    title: 'Повар',
    wide: true,
    screens: [
      { path: '', label: 'Заказы', icon: LuChefHat },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
  {
    key: 'bartender',
    role: RoleTypes.BARTENDER,
    base: '/bar',
    title: 'Бармен',
    wide: true,
    screens: [
      { path: '', label: 'Заказы бара', icon: LuMartini },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
  {
    key: 'cleaner',
    role: RoleTypes.CLEANER,
    base: '/cleaner',
    title: 'Уборщик',
    screens: [
      { path: '', label: 'Уборка', icon: LuBrush },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
  {
    key: 'masseur',
    role: RoleTypes.MASSEUR,
    base: '/masseur',
    title: 'Массажист',
    wide: true,
    screens: [
      { path: '', label: 'Услуга', icon: LuHeartHandshake },
      { path: 'history', label: 'Мои услуги', icon: LuHistory },
      { path: 'profile', label: 'Профиль', icon: LuUser },
    ],
  },
]

export const getRoleApp = (key: string) => roleApps.find((a) => a.key === key)
