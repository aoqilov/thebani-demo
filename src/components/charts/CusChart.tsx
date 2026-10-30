import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartPalette } from '@/theme/tokens'

type Row = object

/** Строка водопада: `total` — итоговый столбец от нуля, иначе — изменение от предыдущего уровня. */
export interface WaterfallRow {
  name: string
  value: number
  total?: boolean
  color?: string
}

interface Props {
  type: 'line' | 'area' | 'bar' | 'pie' | 'waterfall'
  data: Row[]
  xKey?: string
  series?: string[]
  height?: number
  /** Формат чисел на оси и в подсказке (например, суммы в сумах) */
  format?: (n: number) => string
  /** Свои цвета серий вместо общей палитры */
  colors?: string[]
}

const GRID = 'var(--chart-grid)'
const TICK = 'var(--chart-tick)'

/** Превращает ряды водопада в плавающие столбцы [от, до] с подписями. */
function waterfall(rows: WaterfallRow[], format: (n: number) => string) {
  let level = 0
  return rows.map((r) => {
    const from = r.total ? 0 : level
    const to = r.total ? r.value : level + r.value
    level = to
    return { name: r.name, range: [Math.min(from, to), Math.max(from, to)] as [number, number], value: r.value, label: format(r.value), color: r.color }
  })
}

export function CusChart({ type, data, xKey = 'name', series = [], height = 260, format, colors }: Props) {
  const palette = colors ?? chartPalette
  const fmt = format ?? ((n: number) => n.toLocaleString('ru-RU'))

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={series[0]} nameKey={xKey} innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => (format ? format(Number(v)) : (v as number))} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'waterfall') {
    const rows = waterfall(data as WaterfallRow[], fmt)
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} interval={0} stroke={TICK} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={58} stroke={TICK} tickFormatter={(v) => fmt(Number(v))} />
          <ReferenceLine y={0} stroke={TICK} />
          <Tooltip cursor={{ fill: 'transparent' }} formatter={(_, __, item) => fmt((item.payload as { value: number }).value)} labelStyle={{ fontWeight: 600 }} />
          <Bar dataKey="range" radius={[4, 4, 4, 4]} maxBarSize={56}>
            {rows.map((r, i) => <Cell key={i} fill={r.color ?? palette[0]} />)}
            <LabelList dataKey="label" position="top" fontSize={12} fill="var(--chart-tick)" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const Chart = { line: LineChart, area: AreaChart, bar: BarChart }[type]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} stroke={TICK} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={format ? 58 : 36} stroke={TICK} tickFormatter={format ? (v) => format(Number(v)) : undefined} />
        <Tooltip formatter={(v) => (format ? format(Number(v)) : (v as number))} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => {
          const c = palette[i % palette.length]
          if (type === 'bar') return <Bar key={s} dataKey={s} fill={c} radius={[6, 6, 0, 0]} />
          if (type === 'area') return <Area key={s} dataKey={s} stroke={c} fill={c} fillOpacity={0.15} strokeWidth={2} />
          return <Line key={s} dataKey={s} stroke={c} strokeWidth={2} dot={false} />
        })}
      </Chart>
    </ResponsiveContainer>
  )
}
