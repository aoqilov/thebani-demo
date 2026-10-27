import ru from './ru.json'

/** Приложение только на русском языке (см. CLAUDE.md). */
function lookup(obj: unknown, path: string): string | undefined {
  const v = path.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], obj)
  return typeof v === 'string' ? v : undefined
}

/** `useTranslation('sidebar.')` -> t('dashboard') = sidebar.dashboard */
export function useTranslation(prefix = '') {
  const t = (key: string, params?: Record<string, string | number>) => {
    const raw = lookup(ru, prefix + key) ?? key
    return params ? raw.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : raw
  }
  return { t }
}
