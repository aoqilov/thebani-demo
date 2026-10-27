import type { LockEvent, Locker } from '@/types/locker.types'

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

const TOTAL = 60

/** 60 шкафов: №7, №18, №33 заняты гостями из демо-счетов, №12 неисправен. */
const taken: Record<number, number> = { 7: 1, 18: 2, 33: 3 }

export const seedLockers: Locker[] = Array.from({ length: TOTAL }, (_, i) => {
  const n = i + 1
  return {
    id: n,
    number: String(n),
    condition: n === 12 ? 'broken' : 'ok',
    orderId: taken[n] ?? null,
    assignedAt: taken[n] ? ago(40) : undefined,
  }
})

export const seedLockEvents: LockEvent[] = [
  { id: 3, at: ago(14), lockerNumber: '7', bracelet: 'NFC-4F2A91', kind: 'opened', by: 'Рустам Абдуллаев' },
  { id: 2, at: ago(15), lockerNumber: '18', bracelet: 'NFC-9C03B7', kind: 'assigned', by: 'Рустам Абдуллаев' },
  { id: 1, at: ago(42), lockerNumber: '7', bracelet: 'NFC-4F2A91', kind: 'assigned', by: 'Жасур Холиков' },
]
