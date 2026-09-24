'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { money } from '@/lib/goldcalc-data'

interface ChartCardProps {
  series?: number[]
  height?: number
  minimal?: boolean
}

export function ChartCard({ series = [], height = 250, minimal = false }: ChartCardProps) {
  const data = series.map((value, i) => ({ name: i, value }))

  return (
    <div style={{ height }} className="min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: minimal ? -60 : -20, bottom: 0 }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {!minimal && (
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
          )}
          <XAxis dataKey="name" hide />
          {!minimal && (
            <YAxis
              domain={['dataMin - 30', 'dataMax + 30']}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
          )}
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(value) => [money(Number(value ?? 0)), 'XAUUSD']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#goldFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
