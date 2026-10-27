export const fmtMoney = (n: number) => Math.round(n).toLocaleString('ru-RU')

export const fmtQty = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 3 })

/** 2026-10-27 -> 27.10.2026 */
export const fmtDate = (iso: string) => iso.split('-').reverse().join('.')

export const today = () => new Date().toISOString().slice(0, 10)
