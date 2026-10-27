/**
 * free — на складе, готов к выдаче; issued — выдан гостю; lost — утерян/не найден;
 * blocked — заблокирован администратором; retired — списан (сломан)
 */
export type BraceletStatus = 'free' | 'issued' | 'lost' | 'blocked' | 'retired'

export const BRACELET_STATUS_LABEL: Record<BraceletStatus, string> = {
  free: 'Свободен',
  issued: 'Выдан',
  lost: 'Утерян',
  blocked: 'Заблокирован',
  retired: 'Списан',
}

export interface Bracelet {
  id: number
  /** Код NFC-метки, например NFC-4F2A91 */
  code: string
  status: BraceletStatus
  /** Счёт гостя, у которого браслет сейчас */
  orderId: number | null
  issuedAt?: string
  registeredAt: string
}

export type BraceletEventKind = 'registered' | 'issued' | 'returned' | 'lost' | 'blocked' | 'unblocked' | 'replaced' | 'retired' | 'found'

export const BRACELET_EVENT_LABEL: Record<BraceletEventKind, string> = {
  registered: 'Зарегистрирован',
  issued: 'Выдан гостю',
  returned: 'Возвращён на склад',
  lost: 'Отмечен утерянным',
  blocked: 'Заблокирован',
  unblocked: 'Разблокирован',
  replaced: 'Заменён гостю',
  retired: 'Списан',
  found: 'Найден',
}

export interface BraceletEvent {
  id: number
  at: string
  code: string
  kind: BraceletEventKind
  by: string
  note?: string
}

/** Штраф за утерю браслета, сум */
export const LOST_BRACELET_FINE = 50000
