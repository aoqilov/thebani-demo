import { LuCheck, LuClock, LuMinus, LuPlus, LuUsers } from 'react-icons/lu'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { cn } from '@/lib/cn'
import { TARIFF_KIND_LABEL, type Tariff } from '@/types/tariff.types'
import { fmtMoney } from '@/utils/format'

interface Props {
  tariff: Tariff
  qty: number
  onChange: (qty: number) => void
}

export default function TariffCard({ tariff, qty, onChange }: Props) {
  const stepper = 'flex h-12 w-12 items-center justify-center rounded-xl border border-park-border text-park-text active:scale-95 disabled:opacity-40'
  return (
    <div className={cn('flex flex-col justify-between rounded-2xl bg-park-bgCard p-4 shadow-card transition', qty > 0 && 'ring-2 ring-primary')}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-park-text">{tariff.name}</h3>
          <CusBadge color={tariff.kind === 'vip' ? 'secondary' : tariff.kind === 'family' ? 'success' : tariff.kind === 'child' ? 'warning' : 'info'}>{TARIFF_KIND_LABEL[tariff.kind]}</CusBadge>
        </div>
        <p className="mt-1 flex items-center gap-3 text-xs text-park-textMuted">
          <span className="flex items-center gap-1"><LuClock size={12} /> {tariff.durationMin >= 960 ? 'безлимит' : `${tariff.durationMin / 60} ч`}</span>
          <span className="flex items-center gap-1"><LuUsers size={12} /> {tariff.guests} {tariff.guests > 1 ? 'гостей' : 'гость'}</span>
        </p>
        <p className="mt-3 text-2xl font-bold text-primary">{tariff.price === 0 ? 'Бесплатно' : <>{fmtMoney(tariff.price)} <span className="text-sm font-normal text-park-textMuted">сум</span></>}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tariff.includes.map((i) => <li key={i} className="flex items-center gap-1 rounded-md bg-park-bgHover px-2 py-1 text-xs text-park-text3"><LuCheck size={11} className="text-success" />{i}</li>)}
        </ul>
        {tariff.description && <p className="mt-3 text-xs text-park-textMuted">{tariff.description}</p>}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5">
        <button className={stepper} disabled={qty <= 0} onClick={() => onChange(qty - 1)} aria-label="Меньше"><LuMinus size={20} /></button>
        <span className="w-10 text-center text-3xl font-bold text-park-text">{qty}</span>
        <button className={stepper} onClick={() => onChange(qty + 1)} aria-label="Больше"><LuPlus size={20} /></button>
      </div>
    </div>
  )
}
