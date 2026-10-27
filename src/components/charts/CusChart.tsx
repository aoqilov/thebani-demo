import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartPalette } from '@/theme/tokens'

type Row = object

export function CusChart({ type, data, xKey, series, height = 260 }: {
  type: 'line' | 'area' | 'bar' | 'pie'; data: Row[]; xKey: string; series: string[]; height?: number
}) {
  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={series[0]} nameKey={xKey} innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={chartPalette[i % chartPalette.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  }
  const Chart = { line: LineChart, area: AreaChart, bar: BarChart }[type]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} stroke="var(--chart-tick)" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} stroke="var(--chart-tick)" />
        <Tooltip />
        {series.map((s, i) => {
          const c = chartPalette[i % chartPalette.length]
          if (type === 'bar') return <Bar key={s} dataKey={s} fill={c} radius={[6, 6, 0, 0]} />
          if (type === 'area') return <Area key={s} dataKey={s} stroke={c} fill={c} fillOpacity={0.15} strokeWidth={2} />
          return <Line key={s} dataKey={s} stroke={c} strokeWidth={2} dot={false} />
        })}
      </Chart>
    </ResponsiveContainer>
  )
}
