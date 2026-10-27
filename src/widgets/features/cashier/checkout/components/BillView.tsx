import { useState, type ReactNode } from 'react'
import { LuClock, LuHandHelping, LuHistory, LuLock, LuNfc, LuPlus, LuShoppingBag, LuTicket, LuTriangleAlert, LuUsers, LuUtensils } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import type { Overtime } from '@/data/overtime'
import { STATION_LABEL } from '@/types/menu.types'
import { ITEM_STATUS_LABEL, type Charge, type Order, type TableDef } from '@/types/order.types'
import { fmtMoney } from '@/utils/format'
import { itemStatusColor, minutesSince } from '../../../waiter/constants'

const hhmm = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '')
const sumCharges = (list: Charge[]) => list.reduce((s, c) => s + c.amount, 0)

function Block({ icon, title, total, children }: { icon: ReactNode; title: string; total: number; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-1.5 flex items-center justify-between text-sm font-bold text-park-text">
        <span className="flex items-center gap-2 text-primary">{icon}<span className="text-park-text">{title}</span></span>
        <span className="font-semibold text-park-textMuted">{fmtMoney(total)}</span>
      </h4>
      <ul className="divide-y divide-park-border rounded-lg border border-park-border">{children}</ul>
    </section>
  )
}

function Row({ title, sub, amount, badge }: { title: ReactNode; sub?: ReactNode; amount: number; badge?: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="text-park-text">{title}</p>
        {sub && <p className="text-xs text-park-textMuted">{sub}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">{badge}<span className="font-semibold text-park-text">{fmtMoney(amount)}</span></div>
    </li>
  )
}

interface Props {
  order: Order
  table?: TableDef
  locker?: string
  /** Если передан — в шапке появляется кнопка продажи товаров магазина */
  onAddGoods?: () => void
  /** Время сверх оплаченного, ещё не начисленное (правило: больше 15 минут — экстра-час) */
  overtime?: Overtime | null
  onSettleOvertime?: () => void
}

/**
 * Единая карта гостя по браслету: вход и тариф, услуги мастеров, еда и напитки, товары магазина, штрафы.
 * Кассир видит всё, что гость получил за визит, и итог — независимо от того, сидел ли он за столом.
 */
export default function BillView({ order, table, locker, onAddGoods, overtime, onSettleOvertime }: Props) {
  const [timeline, setTimeline] = useState(false)

  const tariffs = order.charges.filter((c) => c.kind === 'tariff')
  const services = order.charges.filter((c) => c.kind === 'service')
  const goods = order.charges.filter((c) => c.kind === 'goods')
  const fines = order.charges.filter((c) => c.kind === 'fine')
  const kitchen = order.items.filter((i) => i.station === 'kitchen')
  const bar = order.items.filter((i) => i.station === 'bar')
  const unserved = order.items.filter((i) => i.status !== 'served')
  const itemsTotal = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const total = sumCharges(order.charges) + itemsTotal

  const elapsed = minutesSince(order.openedAt)
  const left = order.durationMin - elapsed

  // хронология: вход → тариф/услуги/товары → заказы кухни и бара
  const events = [
    { at: order.openedAt, text: `Вход, выдан браслет ${order.bracelet ?? ''}` },
    ...order.charges.map((c) => ({ at: c.at ?? order.openedAt, text: `${c.title} — ${fmtMoney(c.amount)}` })),
    ...order.items.map((i) => ({ at: i.sentAt, text: `${i.qty} × ${i.name} (${STATION_LABEL[i.station].toLowerCase()})` })),
  ].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <CusCard>
      <header className="space-y-3 border-b border-park-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-2xl font-bold text-park-text"><LuNfc size={22} className="text-primary" /> {order.bracelet ?? 'без браслета'}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-park-textMuted">
              <span className="flex items-center gap-1"><LuUsers size={12} /> {order.guests} чел.</span>
              <span className="flex items-center gap-1"><LuClock size={12} /> в зале {elapsed} мин · {left < 0 ? <b className="text-danger">превышено на {-left} мин</b> : `осталось ${left} мин`}</span>
              {table && <span>стол: {table.name}</span>}
              {locker && <span className="flex items-center gap-1 font-semibold text-primary"><LuLock size={12} /> шкаф №{locker}</span>}
            </p>
          </div>
          {order.status === 'bill' ? <CusBadge color="warning">счёт запрошен</CusBadge> : <CusBadge color="info">в зале</CusBadge>}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <CusBadge color="primary">Тариф: {tariffs.length}</CusBadge>
          <CusBadge color="secondary">Массаж и услуги: {services.length}</CusBadge>
          <CusBadge color="warning">Еда и напитки: {order.items.reduce((s, i) => s + i.qty, 0)}</CusBadge>
          <CusBadge color="success">Товары: {goods.length}</CusBadge>
          {fines.length > 0 && <CusBadge color="danger">Штрафы: {fines.length}</CusBadge>}
          {onAddGoods && <CusButton size="sm" variant="outline" className="ml-auto" leftIcon={<LuPlus size={14} />} onClick={onAddGoods}>Добавить товар</CusButton>}
        </div>
      </header>

      <div className="space-y-5 p-5">
        {overtime && (
          <CusAlert color="danger">
            <p className="font-bold">Время сверх оплаченного: {overtime.overMin} мин</p>
            <p className="mt-0.5">По правилам начисляется экстра-час: {overtime.hours} ч × {fmtMoney(overtime.perHour)}{overtime.people > 1 ? ` × ${overtime.people} чел.` : ''} = <b>{fmtMoney(overtime.amount)} сум</b>.</p>
            {onSettleOvertime && <CusButton size="sm" color="danger" className="mt-2" onClick={onSettleOvertime}>Начислить экстра-час</CusButton>}
          </CusAlert>
        )}

        {unserved.length > 0 && (
          <CusAlert color="warning">
            Не подано гостю ({unserved.reduce((s, i) => s + i.qty, 0)} шт.): {unserved.map((i) => i.name).join(', ')}. Уточните у официанта перед закрытием.
          </CusAlert>
        )}

        {tariffs.length > 0 && (
          <Block icon={<LuTicket size={16} />} title="Вход и время" total={sumCharges(tariffs)}>
            {tariffs.map((c) => <Row key={c.id} title={c.title} sub={`Ресепшн · ${c.by}${c.at ? ` · ${hhmm(c.at)}` : ''}`} amount={c.amount} />)}
          </Block>
        )}

        {services.length > 0 && (
          <Block icon={<LuHandHelping size={16} />} title="Массаж и услуги" total={sumCharges(services)}>
            {services.map((c) => <Row key={c.id} title={c.title} sub={`Мастер: ${c.by}${c.at ? ` · ${hhmm(c.at)}` : ''}`} amount={c.amount} />)}
          </Block>
        )}

        {[{ list: kitchen, st: 'kitchen' as const }, { list: bar, st: 'bar' as const }].map(({ list, st }) => list.length > 0 && (
          <Block key={st} icon={<LuUtensils size={16} />} title={`Еда и напитки — ${STATION_LABEL[st].toLowerCase()}`} total={list.reduce((s, i) => s + i.unitPrice * i.qty, 0)}>
            {list.map((i) => (
              <Row
                key={i.id}
                title={`${i.qty} × ${i.name}`}
                sub={<>{hhmm(i.sentAt)}{i.mods.length > 0 && ` · ${i.mods.map((m) => m.option).join(', ')}`}</>}
                amount={i.unitPrice * i.qty}
                badge={i.status !== 'served' ? <CusBadge color={itemStatusColor[i.status]}>{ITEM_STATUS_LABEL[i.status]}</CusBadge> : undefined}
              />
            ))}
          </Block>
        ))}

        {goods.length > 0 && (
          <Block icon={<LuShoppingBag size={16} />} title="Товары из магазина" total={sumCharges(goods)}>
            {goods.map((c) => <Row key={c.id} title={c.title} sub={`Продал: ${c.by}${c.at ? ` · ${hhmm(c.at)}` : ''}`} amount={c.amount} />)}
          </Block>
        )}

        {fines.length > 0 && (
          <Block icon={<LuTriangleAlert size={16} />} title="Штрафы" total={sumCharges(fines)}>
            {fines.map((c) => <Row key={c.id} title={c.title} sub={c.by} amount={c.amount} />)}
          </Block>
        )}

        {order.items.length === 0 && order.charges.length === 0 && <p className="py-6 text-center text-sm text-park-textMuted">В карте пока ничего нет.</p>}

        <div className="flex items-end justify-between rounded-xl bg-park-bgHover/60 px-4 py-3">
          <span className="text-sm font-bold text-park-text">Итого по карте гостя</span>
          <span className="text-2xl font-bold text-park-text">{fmtMoney(total)} <span className="text-sm font-normal text-park-textMuted">сум</span></span>
        </div>

        <div>
          <button onClick={() => setTimeline((t) => !t)} className="flex items-center gap-2 text-sm font-semibold text-primary"><LuHistory size={15} /> {timeline ? 'Скрыть хронологию визита' : 'Показать хронологию визита'}</button>
          {timeline && (
            <ol className="mt-3 space-y-2 border-l-2 border-park-border pl-4">
              {events.map((e, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <span className="mr-2 font-mono text-xs text-park-textMuted">{hhmm(e.at)}</span>
                  <span className="text-park-text3">{e.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </CusCard>
  )
}
