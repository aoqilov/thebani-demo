import { useEffect, useState } from 'react'

/** Перерисовывает компонент раз в `ms`, чтобы таймеры («12 мин») обновлялись. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
