/** Направление услуг: классический массаж, парение, спа-уход… */
export interface ServiceDirection {
  id: number
  name: string
}

export interface Service {
  id: number
  directionId: number
  name: string
  durationMin: number
  price: number
  active: boolean
}

/** Мастер (массажист/парильщик). Создаётся менеджером услуг и работает на любой кассе/POS. */
export interface Master {
  id: number
  firstname: string
  lastname: string
  phone: string
  /** Какие направления мастер вправе оказывать */
  directionIds: number[]
  /** Процент мастеру от стоимости услуги */
  commissionPct: number
  active: boolean
}

export const masterName = (m: Pick<Master, 'firstname' | 'lastname'>) => `${m.firstname} ${m.lastname}`
