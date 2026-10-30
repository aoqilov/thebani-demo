export const fmtMoney = (n: number) => Math.round(n).toLocaleString('ru-RU')

export const fmtQty = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 3 })

/** 2026-10-27 -> 27.10.2026 */
export const fmtDate = (iso: string) => iso.split('-').reverse().join('.')

export const today = () => new Date().toISOString().slice(0, 10)

/** Короткая запись суммы для осей графиков: 12,5 млн, 340 тыс. */
export const fmtCompact = (n: number) => {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  const r = (x: number) => x.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
  if (a >= 1e9) return `${sign}${r(a / 1e9)} млрд`
  if (a >= 1e6) return `${sign}${r(a / 1e6)} млн`
  if (a >= 1e3) return `${sign}${r(a / 1e3)} тыс.`
  return `${sign}${Math.round(a)}`
}
