'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ClassifiedDimension } from '@/lib/impact-analyzer/types'
import { DIMENSION_LABELS } from '@/lib/impact-analyzer'

interface ImpactChartProps {
  dimensions: ClassifiedDimension[]
}

export function ImpactChart({ dimensions }: ImpactChartProps) {
  // Helper to get display name - prefer questionText over predefined labels
  const getDisplayName = (d: ClassifiedDimension) => 
    d.questionText || DIMENSION_LABELS[d.dimension] || d.dimension
  
  // Truncate text for chart display
  const truncate = (text: string, maxLength: number) => 
    text.length > maxLength ? text.substring(0, maxLength - 1) + '…' : text

  // Prepare data for Cohen's d chart
  const cohenDData = dimensions
    .sort((a, b) => Math.abs(b.cohenD) - Math.abs(a.cohenD))
    .map(d => ({
      name: getDisplayName(d),
      shortName: truncate(getDisplayName(d), 25),
      cohenD: parseFloat(d.cohenD.toFixed(3)),
      level: d.impactLevel
    }))

  // Prepare data for Pre/Post comparison
  const prePostData = dimensions.map(d => ({
    name: getDisplayName(d),
    shortName: truncate(getDisplayName(d), 20),
    pre: parseFloat(d.preMean.toFixed(2)),
    post: parseFloat(d.postMean.toFixed(2)),
    change: parseFloat((d.postMean - d.preMean).toFixed(2))
  }))

  const getBarColor = (level: string) => {
    switch (level) {
      case 'transformation': return '#10b981' // emerald-500
      case 'solid': return '#3b82f6' // blue-500
      case 'moderate': return '#f59e0b' // amber-500
      case 'reinforcement': return '#ef4444' // red-500
      default: return '#6b7280' // gray-500
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualización de Resultados</CardTitle>
        <CardDescription>
          Gráficos interactivos del impacto por dimensión
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cohend" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cohend">Cohen&apos;s d (Efecto)</TabsTrigger>
            <TabsTrigger value="prepost">Pre vs Post</TabsTrigger>
          </TabsList>

          <TabsContent value="cohend" className="space-y-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cohenDData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    domain={[-0.5, 'auto']}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={180}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(3), "Cohen's d"]}
                    labelFormatter={(label) => cohenDData.find(d => d.shortName === label)?.name || label}
                  />
                  <ReferenceLine x={0.2} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'd=0.2', position: 'top', fontSize: 10 }} />
                  <ReferenceLine x={0.5} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: 'd=0.5', position: 'top', fontSize: 10 }} />
                  <ReferenceLine x={0.8} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'd=0.8', position: 'top', fontSize: 10 }} />
                  <Bar dataKey="cohenD" name="Cohen's d" radius={[0, 4, 4, 0]}>
                    {cohenDData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.level)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Transformación (d ≥ 0.8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Sólido (0.5 ≤ d &lt; 0.8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Moderado (0.2 ≤ d &lt; 0.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>Refuerzo (d &lt; 0.2)</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prepost" className="space-y-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prePostData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="shortName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 'auto']} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toFixed(2),
                      name === 'pre' ? 'Media Pre' : 'Media Post'
                    ]}
                    labelFormatter={(label) => prePostData.find(d => d.shortName === label)?.name || label}
                  />
                  <Legend
                    formatter={(value) => value === 'pre' ? 'Media Pre' : 'Media Post'}
                  />
                  <Bar dataKey="pre" fill="#94a3b8" name="pre" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="post" fill="#3b82f6" name="post" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
