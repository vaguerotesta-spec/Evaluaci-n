'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { ClassifiedDimension, ImpactLevel } from '@/lib/impact-analyzer/types'
import { IMPACT_LEVELS, DIMENSION_LABELS, groupByImpactLevel, getEfficiencyMetrics, getProgramDuration } from '@/lib/impact-analyzer'
import { cn } from '@/lib/utils'

interface DimensionResultsProps {
  dimensions: ClassifiedDimension[]
  totalResponses: number
  programHours?: number
}

export function DimensionResults({ dimensions, totalResponses, programHours }: DimensionResultsProps) {
  const grouped = groupByImpactLevel(dimensions)
  const levels: ImpactLevel[] = ['transformation', 'solid', 'moderate', 'reinforcement']

  // Calculate summary stats
  const avgCohenD = dimensions.reduce((sum, d) => sum + d.cohenD, 0) / dimensions.length
  const maxCohenD = Math.max(...dimensions.map(d => d.cohenD))
  const minCohenD = Math.min(...dimensions.map(d => d.cohenD))
  
  // Efficiency metrics (only if program hours provided)
  const efficiencyMetrics = programHours && programHours > 0 
    ? getEfficiencyMetrics(dimensions, programHours) 
    : null
  const durationCategory = programHours && programHours > 0 
    ? getProgramDuration(programHours) 
    : null
  const highEfficiencyCount = dimensions.filter(d => d.isHighEfficiency).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dimensiones Analizadas</CardDescription>
            <CardTitle className="text-3xl">{dimensions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Respuestas</CardDescription>
            <CardTitle className="text-3xl">{totalResponses.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cohen&apos;s d Promedio</CardDescription>
            <CardTitle className="text-3xl">{avgCohenD.toFixed(3)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rango de Impacto</CardDescription>
            <CardTitle className="text-3xl">
              {minCohenD.toFixed(2)} - {maxCohenD.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Efficiency Analysis Card - Only show when program hours provided */}
      {efficiencyMetrics && programHours && programHours > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Análisis de Eficiencia Pedagógica</span>
              {durationCategory === 'short' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Programa Corto ({programHours}h)
                </Badge>
              )}
              {durationCategory === 'medium' && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  Duración Media ({programHours}h)
                </Badge>
              )}
              {durationCategory === 'long' && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Larga Duración ({programHours}h)
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Métricas ajustadas según la intensidad horaria del programa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground">Ratio Impacto/Hora</p>
                <p className="text-2xl font-bold font-mono text-blue-600">
                  {efficiencyMetrics.impactPerHour.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cohen&apos;s d / Horas del programa
                </p>
              </div>
              
              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground">Horas de Implementación</p>
                <p className="text-2xl font-bold">{programHours}h</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {durationCategory === 'short' ? '< 10h = Corta' : 
                   durationCategory === 'medium' ? '10-30h = Media' : '> 30h = Larga'}
                </p>
              </div>

              {highEfficiencyCount > 0 && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <p className="text-sm text-emerald-700">Alta Eficiencia</p>
                  <p className="text-2xl font-bold text-emerald-600">{highEfficiencyCount}</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Dimensiones con impacto significativo para la duración
                  </p>
                </div>
              )}
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <p className="text-sm font-medium mb-2">Interpretación</p>
              <p className="text-sm text-muted-foreground">
                {efficiencyMetrics.efficiencyInterpretation}
              </p>
            </div>

            {durationCategory === 'short' && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Nota sobre Programas de Corta Duración
                </p>
                <p className="text-sm text-amber-700">
                  En intervenciones de pocas horas, esperar un efecto &quot;grande&quot; (d ≥ 0.8) es estadísticamente 
                  irreal. Un efecto &quot;pequeño&quot; (0.10 ≤ d &lt; 0.30) con significancia estadística es un 
                  éxito de eficiencia pedagógica, demostrando transferencia efectiva de conocimientos 
                  en tiempo optimizado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Impact Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Nivel de Impacto</CardTitle>
          <CardDescription>
            Clasificación de dimensiones según el tamaño del efecto (Cohen&apos;s d)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {levels.map((level) => {
              const count = grouped[level].length
              const percentage = dimensions.length > 0 ? (count / dimensions.length) * 100 : 0
              const config = IMPACT_LEVELS[level]

              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', config.bgColor, config.borderColor, 'border')} />
                      <span className="font-medium">{config.label}</span>
                      <span className="text-muted-foreground">({config.range})</span>
                    </div>
                    <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={cn('h-2', config.bgColor)}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results by Impact Level */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados Detallados por Dimensión</CardTitle>
          <CardDescription>
            Haz clic en cada nivel para ver las dimensiones correspondientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['transformation', 'solid']} className="space-y-2">
            {levels.map((level) => {
              const dims = grouped[level]
              if (dims.length === 0) return null

              const config = IMPACT_LEVELS[level]

              return (
                <AccordionItem
                  key={level}
                  value={level}
                  className={cn('border rounded-lg px-4', config.borderColor, config.bgColor)}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className={cn('font-medium', config.bgColor, config.color, config.borderColor, 'border')}>
                        {dims.length}
                      </Badge>
                      <span className={cn('font-semibold', config.color)}>
                        {config.label}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {dims.map((dim) => (
                        <DimensionCard key={dim.dimension} dimension={dim} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

function DimensionCard({ dimension }: { dimension: ClassifiedDimension }) {
  // Use questionText if available, otherwise fall back to dimension labels or the dimension key
  const label = dimension.questionText || DIMENSION_LABELS[dimension.dimension] || dimension.dimension
  const change = dimension.postMean - dimension.preMean
  const changePercent = dimension.preMean !== 0 
    ? ((change / dimension.preMean) * 100).toFixed(1)
    : '0'

  return (
    <div className={cn(
      "bg-background rounded-lg p-4 border",
      dimension.isHighEfficiency && "ring-2 ring-emerald-300 border-emerald-200"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-base leading-snug">{label}</h4>
            {dimension.isHighEfficiency && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">
                Alta Eficiencia
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {dimension.interpretation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {change > 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : change < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={cn(
            'font-mono text-sm font-medium',
            change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
          )}>
            {change > 0 ? '+' : ''}{changePercent}%
          </span>
        </div>
      </div>

      <div className={cn(
        "grid gap-4 mt-4 text-sm",
        dimension.impactPerHour ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"
      )}>
        <div>
          <p className="text-muted-foreground">Media Pre</p>
          <p className="font-mono font-medium">{dimension.preMean.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Media Post</p>
          <p className="font-mono font-medium">{dimension.postMean.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Cohen&apos;s d</p>
          <p className="font-mono font-medium">{dimension.cohenD.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">N</p>
          <p className="font-mono font-medium">{dimension.n.toLocaleString()}</p>
        </div>
        {dimension.impactPerHour !== undefined && (
          <div>
            <p className="text-muted-foreground">Impacto/Hora</p>
            <p className="font-mono font-medium text-blue-600">{dimension.impactPerHour.toFixed(4)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
