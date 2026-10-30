import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { fmtMoney } from '@/utils/format'

export default function ChartMethods({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, r) => s + r.value, 0)
  return (
    <CusCard>
      <CusCardHeader title="Способы оплаты" subtitle="За выбранный период" />
      <div className="p-5">
        {data.length ? (
          <>
            <CusChart type="pie" data={data} xKey="name" series={['value']} format={fmtMoney} height={180} />
            <ul className="mt-2 space-y-1 text-sm">
              {data.map((r) => (
                <li key={r.name} className="flex justify-between gap-3">
                  <span className="text-park-textMuted">{r.name}</span>
                  <span className="font-semibold text-park-text">{fmtMoney(r.value)} <span className="font-normal text-park-textMuted">· {total ? Math.round((r.value / total) * 100) : 0}%</span></span>
                </li>
              ))}
            </ul>
          </>
        ) : <p className="py-12 text-center text-sm text-park-textMuted">Оплат за период нет</p>}
      </div>
    </CusCard>
  )
}
