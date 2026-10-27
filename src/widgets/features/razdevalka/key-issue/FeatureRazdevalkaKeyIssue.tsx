import { useState } from 'react'
import { LuClock, LuLockKeyhole, LuLockKeyholeOpen, LuNfc, LuSearch, LuUsers, LuWand } from 'react-icons/lu'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { cn } from '@/lib/cn'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { minutesSince } from '../../waiter/constants'
import { useOrders, useTables } from '../../waiter/hooks/useOrders'
import LockerGrid from '../components/LockerGrid'
import { CURRENT_ATTENDANT, useAssignLocker, useLockers, useOpenLocker, useReleaseLocker } from '../hooks/useLockers'

/** Раздевалщик считывает браслет гостя и выдаёт любой свободный шкаф. Шкаф открывается этим же браслетом. */
export default function FeatureRazdevalkaKeyIssue() {
  const { data: orders = [] } = useOrders()
  const { data: tables = [] } = useTables()
  const { data: lockers = [] } = useLockers()
  const assign = useAssignLocker()
  const open = useOpenLocker()
  const release = useReleaseLocker()

  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const order = orders.find((o) => o.id === orderId)
  const table = tables.find((t) => t.id === order?.tableId)
  const mine = order ? lockers.find((l) => l.orderId === order.id) : undefined
  const free = lockers.filter((l) => l.condition === 'ok' && l.orderId === null).length
  const busy = lockers.filter((l) => l.orderId !== null).length
  const broken = lockers.filter((l) => l.condition === 'broken').length

  function flash(msg: string) {
    setNotice(msg)
    setTimeout(() => setNotice(null), 4000)
  }

  function scan() {
    setScanning(true)
    setError(null)
    setNotice(null)
    setTimeout(() => {
      const withBracelet = orders.filter((o) => o.bracelet)
      const typed = code.trim().toLowerCase()
      // для демонстрации сначала предлагаем тех, у кого шкафа ещё нет
      const pool = withBracelet.filter((o) => !lockers.some((l) => l.orderId === o.id))
      const candidates = pool.length ? pool : withBracelet
      const found = typed ? withBracelet.find((o) => o.bracelet!.toLowerCase() === typed) : candidates[Math.floor(Math.random() * candidates.length)]
      if (found) { setOrderId(found.id); setCode(found.bracelet!); setPickedId(null) }
      else setError('Гость с таким браслетом не найден.')
      setScanning(false)
    }, 500)
  }

  async function run(fn: () => Promise<unknown>, ok: string) {
    setError(null)
    try { await fn(); flash(ok) } catch (e) { setError((e as Error).message) }
  }

  const left = order ? order.durationMin - minutesSince(order.openedAt) : 0

  return (
    <div className="space-y-4">
      <PageHeader label="Раздевалка" title="Выдача" highlight="шкафа" subtitle="Считайте браслет гостя и выдайте любой свободный шкаф. Открыть шкаф сможет только этот браслет." />

      <div className="grid grid-cols-3 gap-3">
        {[{ l: 'Свободно', n: free, c: 'text-success' }, { l: 'Занято', n: busy, c: 'text-primary' }, { l: 'Неисправно', n: broken, c: 'text-park-textMuted' }].map((s) => (
          <CusCard key={s.l} className="p-4 text-center"><p className={cn('text-3xl font-bold', s.c)}>{s.n}</p><p className="text-xs text-park-textMuted">{s.l}</p></CusCard>
        ))}
      </div>

      {error && <CusAlert color="danger">{error}</CusAlert>}
      {notice && <CusAlert color="success">{notice}</CusAlert>}

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <CusCard>
            <CusCardHeader title="1. Гость" />
            <div className="space-y-3 p-4">
              <CusButton size="lg" className="w-full" leftIcon={<LuNfc size={20} />} isLoading={scanning} onClick={scan}>Считать браслет</CusButton>
              <CusInput placeholder="или введите номер браслета" value={code} leftIcon={<LuSearch size={14} />} onChange={(e) => setCode(e.target.value)} />
            </div>
          </CusCard>

          {order && (
            <CusCard className="p-4">
              <p className="flex items-center gap-2 font-mono text-xl font-bold text-park-text"><LuNfc size={20} /> {order.bracelet}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-park-textMuted">
                <span className="flex items-center gap-1"><LuUsers size={12} /> {order.guests}</span>
                {table ? <CusBadge color="info">{table.name}</CusBadge> : <CusBadge color="dark">не за столом</CusBadge>}
                <span className={cn('flex items-center gap-1 font-semibold', left < 0 && 'text-danger')}><LuClock size={12} /> {left < 0 ? `превышено на ${-left} мин` : `осталось ${left} мин`}</span>
              </p>
            </CusCard>
          )}
        </div>

        <CusCard>
          <CusCardHeader title="2. Шкаф" subtitle={mine ? 'За гостем уже закреплён шкаф' : 'Выберите любой свободный шкаф'} />
          <div className="p-4">
            {!order && <p className="py-10 text-center text-sm text-park-textMuted">Сначала считайте браслет гостя.</p>}

            {order && mine && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-40 w-40 flex-col items-center justify-center rounded-3xl border-4 border-primary bg-primary/10">
                  <LuLockKeyhole size={28} className="text-primary" />
                  <p className="text-6xl font-bold text-primary">{mine.number}</p>
                </div>
                <p className="text-sm text-park-textMuted">Шкаф закреплён за браслетом <b className="font-mono text-park-text">{order.bracelet}</b></p>
                <div className="mx-auto flex max-w-md flex-col gap-2">
                  <CusButton size="lg" leftIcon={<LuLockKeyholeOpen size={20} />} isLoading={open.isPending} onClick={() => run(() => open.mutateAsync({ orderId: order.id, by: CURRENT_ATTENDANT }), `Шкаф №${mine.number} открыт браслетом.`)}>Открыть шкаф браслетом</CusButton>
                  <CusButton size="lg" variant="outline" color="danger" isLoading={release.isPending} onClick={() => run(() => release.mutateAsync({ lockerId: mine.id, by: CURRENT_ATTENDANT }), `Шкаф №${mine.number} освобождён.`)}>Освободить шкаф</CusButton>
                </div>
              </div>
            )}

            {order && !mine && (
              <div className="space-y-4">
                <LockerGrid lockers={lockers} selectedId={pickedId} onlyFreeSelectable onPick={(l) => setPickedId(l.id)} />
                <div className="flex flex-col gap-2 tablet:flex-row">
                  <CusButton size="lg" variant="outline" className="flex-1" leftIcon={<LuWand size={20} />} isLoading={assign.isPending && pickedId === null} isDisabled={free === 0} onClick={() => run(() => assign.mutateAsync({ orderId: order.id, by: CURRENT_ATTENDANT }), 'Шкаф выдан автоматически.')}>Автовыбор</CusButton>
                  <CusButton size="lg" color="success" className="flex-1" leftIcon={<LuLockKeyhole size={20} />} isDisabled={pickedId === null} isLoading={assign.isPending && pickedId !== null} onClick={() => run(async () => { await assign.mutateAsync({ orderId: order.id, lockerId: pickedId!, by: CURRENT_ATTENDANT }); setPickedId(null) }, 'Шкаф выдан.')}>
                    {pickedId ? `Выдать шкаф №${lockers.find((l) => l.id === pickedId)?.number}` : 'Выберите шкаф'}
                  </CusButton>
                </div>
              </div>
            )}
          </div>
        </CusCard>
      </div>
    </div>
  )
}
