import type { Station } from '@/types/menu.types'

/** Демо: кто сейчас за экраном кухни/бара (в реальной версии берётся из авторизации). */
export const CURRENT_COOK = 'Виктор Попов'
export const CURRENT_BARTENDER = 'Данияр Бекмуратов'

export const stationWorker = (station: Station) => (station === 'kitchen' ? CURRENT_COOK : CURRENT_BARTENDER)
