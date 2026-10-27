import { useState } from 'react'
import { useMasters } from '../../admin/services-list/hooks/useServices'

const KEY = 'thebani_current_master'

/**
 * Демо: какой мастер сейчас за экраном. В реальной версии определяется авторизацией;
 * здесь можно переключаться, чтобы показать работу разных мастеров.
 */
export function useCurrentMaster() {
  const { data: masters = [] } = useMasters()
  const active = masters.filter((m) => m.active)
  const [id, setId] = useState<number | null>(() => {
    try { return Number(localStorage.getItem(KEY)) || null } catch { return null }
  })
  const master = active.find((m) => m.id === id) ?? active[0]

  function select(next: number) {
    setId(next)
    try { localStorage.setItem(KEY, String(next)) } catch { /* без сохранения */ }
  }
  return { master, masters: active, select }
}
