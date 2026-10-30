import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { STRUCTURE_LABEL, type Structure } from '@/data/analytics'
import { chartPalette } from '@/theme/tokens'
import { fmtMoney } from '@/utils/format'

export default function ChartStructure({ data }: { data: Structure }) {
  const rows = (Object.keys(data) as (keyof Structure)[]).map((k) => ({ name: STRUCTURE_LABEL[k], value: data[k] })).filter((r) => r.value > 0)
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <CusCard>
      <CusCardHeader title="Структура выручки" subtitle="Тарифы, услуги, кухня, бар — за выбранный период" />
      <div className="p-5">
        {rows.length ? (
          <div className="grid grid-cols-1 items-center gap-6 tablet:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <CusChart type="pie" data={rows} xKey="name" series={['value']} format={fmtMoney} />
            <div>
              <ul className="divide-y divide-park-border">
                {rows.map((r, i) => (
                  <li key={r.name} className="flex items-center gap-3 py-2.5">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: chartPalette[i % chartPalette.length] }} />
                    <span className="flex-1 text-sm text-park-text3">{r.name}</span>
                    <span className="text-sm font-semibold text-park-text">{fmtMoney(r.value)}</span>
                    <span className="w-12 text-right text-xs text-park-textMuted">{Math.round((r.value / total) * 100)}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-park-border pt-3 text-sm font-bold text-park-text"><span>Итого</span><span>{fmtMoney(total)} сум</span></p>
            </div>
          </div>
        ) : <p className="py-16 text-center text-sm text-park-textMuted">За период нет закрытых счетов</p>}
      </div>
    </CusCard>
  )
}
