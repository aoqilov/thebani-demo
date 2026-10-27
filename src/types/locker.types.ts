/** ok — исправен; broken — неисправен, не выдаётся */
export type LockerCondition = 'ok' | 'broken'

/** Шкаф в раздевалке с электронным замком: открывается NFC-браслетом гостя. */
export interface Locker {
  id: number
  number: string
  condition: LockerCondition
  /** Счёт (гость), за которым закреплён шкаф; null — свободен */
  orderId: number | null
  assignedAt?: string
}

export type LockEventKind = 'assigned' | 'opened' | 'released' | 'emergency'

export const LOCK_EVENT_LABEL: Record<LockEventKind, string> = {
  assigned: 'Выдан',
  opened: 'Открыт браслетом',
  released: 'Освобождён',
  emergency: 'Аварийно открыт',
}

export interface LockEvent {
  id: number
  at: string
  lockerNumber: string
  bracelet: string | null
  kind: LockEventKind
  by: string
}
