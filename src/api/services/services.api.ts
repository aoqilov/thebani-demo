import { delay } from '@/data/mock'
import { getWarehouse, updateWarehouse } from '@/data/warehouse.store'
import type { Charge } from '@/types/order.types'
import { masterName, type Master, type Service, type ServiceDirection } from '@/types/services.types'

// TODO: когда появится backend — заменить тела функций на вызовы axios (интерфейс не меняется).
const ms = 100
const nextId = (list: { id: number }[]) => Math.max(0, ...list.map((x) => x.id)) + 1

export const fetchDirections = (): Promise<ServiceDirection[]> => delay(getWarehouse().directions, ms)
export const fetchServices = (): Promise<Service[]> => delay(getWarehouse().services, ms)
export const fetchMasters = (): Promise<Master[]> => delay(getWarehouse().masters, ms)

export async function saveDirection(d: { id?: number; name: string }): Promise<void> {
  if (!d.name.trim()) throw new Error('Укажите название направления.')
  updateWarehouse((s) => ({
    ...s,
    directions: d.id ? s.directions.map((x) => (x.id === d.id ? { ...x, name: d.name.trim() } : x)) : [...s.directions, { id: nextId(s.directions), name: d.name.trim() }],
  }))
  await delay(null, ms)
}

export async function deleteDirection(id: number): Promise<void> {
  if (getWarehouse().services.some((x) => x.directionId === id)) throw new Error('В направлении есть услуги — сначала удалите или перенесите их.')
  updateWarehouse((s) => ({
    ...s,
    directions: s.directions.filter((d) => d.id !== id),
    masters: s.masters.map((m) => ({ ...m, directionIds: m.directionIds.filter((x) => x !== id) })),
  }))
  await delay(null, ms)
}

export async function saveService(v: Omit<Service, 'id'> & { id?: number }): Promise<void> {
  if (!v.name.trim()) throw new Error('Укажите название услуги.')
  if (!(v.price > 0)) throw new Error('Цена должна быть больше нуля.')
  if (!(v.durationMin > 0)) throw new Error('Укажите длительность в минутах.')
  updateWarehouse((s) => ({
    ...s,
    services: v.id ? s.services.map((x) => (x.id === v.id ? { ...v, id: v.id } : x)) : [...s.services, { ...v, id: nextId(s.services) }],
  }))
  await delay(null, ms)
}

export async function deleteService(id: number): Promise<void> {
  updateWarehouse((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) }))
  await delay(null, ms)
}

export async function saveMaster(m: Omit<Master, 'id'> & { id?: number }): Promise<void> {
  if (!m.firstname.trim() || !m.lastname.trim()) throw new Error('Укажите имя и фамилию.')
  if (m.directionIds.length === 0) throw new Error('Выберите хотя бы одно направление.')
  if (m.commissionPct < 0 || m.commissionPct > 100) throw new Error('Процент должен быть от 0 до 100.')
  updateWarehouse((s) => ({
    ...s,
    masters: m.id ? s.masters.map((x) => (x.id === m.id ? { ...m, id: m.id } : x)) : [...s.masters, { ...m, id: nextId(s.masters) }],
  }))
  await delay(null, ms)
}

export async function deleteMaster(id: number): Promise<void> {
  const used = getWarehouse().orders.some((o) => o.charges.some((c) => c.masterId === id))
  if (used) throw new Error('У мастера есть оказанные услуги — его можно только отключить.')
  updateWarehouse((s) => ({ ...s, masters: s.masters.filter((m) => m.id !== id) }))
  await delay(null, ms)
}

/**
 * Мастер добавляет оказанную услугу в счёт клиента (по браслету) — с любой кассы/POS.
 * Проверяется, что мастер активен и вправе оказывать это направление.
 */
export async function addServiceCharge({ orderId, serviceId, masterId }: { orderId: number; serviceId: number; masterId: number }): Promise<Charge> {
  const st = getWarehouse()
  const service = st.services.find((x) => x.id === serviceId)
  const master = st.masters.find((m) => m.id === masterId)
  const order = st.orders.find((o) => o.id === orderId)
  if (!service || !service.active) throw new Error('Услуга недоступна.')
  if (!master || !master.active) throw new Error('Мастер не активен.')
  if (!master.directionIds.includes(service.directionId)) throw new Error('Мастер не работает в этом направлении.')
  if (!order || order.status === 'closed') throw new Error('Счёт не найден или уже закрыт.')

  const charge: Charge = {
    id: Math.max(0, ...st.orders.flatMap((o) => o.charges.map((c) => c.id))) + 1,
    kind: 'service',
    title: `${service.name}, ${service.durationMin} мин`,
    amount: service.price,
    by: masterName(master),
    masterId,
    serviceId,
    at: new Date().toISOString(),
  }
  updateWarehouse((s) => ({ ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, charges: [...o.charges, charge] } : o)) }))
  return delay(charge, ms)
}

export interface ServiceRecord {
  charge: Charge
  orderId: number
  bracelet: string | null
  tableId: number | null
}

/** Все оказанные услуги (из открытых и закрытых счетов) — для истории мастера и отчёта. */
export const fetchServiceRecords = (): Promise<ServiceRecord[]> =>
  delay(
    getWarehouse().orders
      .flatMap((o) => o.charges.filter((c) => c.kind === 'service').map((charge) => ({ charge, orderId: o.id, bracelet: o.bracelet, tableId: o.tableId })))
      .sort((a, b) => (b.charge.at ?? '').localeCompare(a.charge.at ?? '')),
    ms,
  )
