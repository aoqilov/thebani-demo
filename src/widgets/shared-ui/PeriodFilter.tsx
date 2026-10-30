import { useState } from 'react'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { today } from '@/utils/format'

export interface Period {
  from: string
  to: string
}

const daysBack = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

const PRESETS = [
  { key: 'today', label: 'Сегодня', range: (): Period => ({ from: today(), to: today() }) },
  { key: '7', label: '7 дней', range: (): Period => ({ from: daysBack(6), to: today() }) },
  { key: '20', label: '20 дней', range: (): Period => ({ from: daysBack(19), to: today() }) },
  { key: 'month', label: 'Этот месяц', range: (): Period => ({ from: `${today().slice(0, 7)}-01`, to: today() }) },
] as const

/** Начальный период для отчётов: последние 20 дней. */
export const defaultPeriod = (): Period => PRESETS[2].range()

/** Быстрые периоды и ручной выбор дат для отчётов. */
export default function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [preset, setPreset] = useState<string>('20')

  return (
    <>
      <div className="flex gap-1.5">
        {PRESETS.map((p) => <CusChip key={p.key} active={preset === p.key} onClick={() => { setPreset(p.key); onChange(p.range()) }}>{p.label}</CusChip>)}
      </div>
      <div className="ml-2 w-40"><CusInput type="date" value={value.from} onChange={(e) => { setPreset(''); onChange({ ...value, from: e.target.value }) }} /></div>
      <span className="text-park-textMuted">—</span>
      <div className="w-40"><CusInput type="date" value={value.to} onChange={(e) => { setPreset(''); onChange({ ...value, to: e.target.value }) }} /></div>
    </>
  )
}
