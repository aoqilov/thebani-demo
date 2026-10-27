export type TariffKind = 'adult' | 'senior' | 'child' | 'family' | 'vip'

export const TARIFF_KIND_LABEL: Record<TariffKind, string> = {
  adult: 'Взрослый',
  senior: 'Пенсионер',
  child: 'Детский',
  family: 'Семейный',
  vip: 'VIP',
}

/** Тариф входа: сколько стоит, на сколько часов и что входит. */
export interface Tariff {
  id: number
  name: string
  kind: TariffKind
  /** Длительность пребывания, минут */
  durationMin: number
  price: number
  /** Сколько гостей входит в один тариф (семейный — 6) */
  guests: number
  /** Цена продления на 1 час */
  extraHourPrice: number
  /** Что входит: простыня, тапочки, чай… */
  includes: string[]
  description: string
  active: boolean
}
