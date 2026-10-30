import type { Bracelet, BraceletEvent, BraceletStatus } from '@/types/bracelet.types'

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

/** Коды, которые уже используются в демо-счетах (см. order.mock.ts). */
const issued: Record<string, number> = { 'NFC-4F2A91': 1, 'NFC-9C03B7': 2, 'NFC-17D8E2': 3, 'NFC-1DCB3E': 7, 'NFC-1DEA2D': 8, 'NFC-1E091C': 9 }
const lost = new Set(['NFC-1A2B3C', 'NFC-1A4A0B'])
const blocked = new Set(['NFC-1A5964'])

const generated = Array.from({ length: 117 }, (_, i) => `NFC-${(0x1a2b3c + i * 7919).toString(16).toUpperCase().padStart(6, '0')}`)
const codes = [...Object.keys(issued), ...generated.filter((c) => !(c in issued))]

const statusOf = (code: string): BraceletStatus => (code in issued ? 'issued' : lost.has(code) ? 'lost' : blocked.has(code) ? 'blocked' : 'free')

export const seedBracelets: Bracelet[] = codes.map((code, i) => ({
  id: i + 1,
  code,
  status: statusOf(code),
  orderId: issued[code] ?? null,
  issuedAt: code in issued ? ago(60) : undefined,
  registeredAt: ago(60 * 24 * 30),
}))

export const seedBraceletEvents: BraceletEvent[] = [
  { id: 4, at: ago(15), code: 'NFC-9C03B7', kind: 'issued', by: 'Зилола Хасанова' },
  { id: 3, at: ago(42), code: 'NFC-4F2A91', kind: 'issued', by: 'Зилола Хасанова' },
  { id: 2, at: ago(300), code: 'NFC-1A2B3C', kind: 'lost', by: 'Елена Смирнова', note: 'Гость не сдал при выходе' },
  { id: 1, at: ago(400), code: 'NFC-1A5964', kind: 'blocked', by: 'Елена Смирнова', note: 'Подозрение на копирование метки' },
]
