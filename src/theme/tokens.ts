/** Цвета для графиков и динамических стилей (в паре с CSS-переменными). */
export const chartColors = {
  blue: '#3b82f6',
  green: '#22c55e',
  cyan: '#06b6d4',
  yellow: '#eab308',
  red: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#6b7280',
} as const

export const chartPalette = Object.values(chartColors)
