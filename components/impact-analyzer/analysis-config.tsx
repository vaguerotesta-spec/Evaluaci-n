'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { AnalysisConfig as AnalysisConfigType } from '@/lib/impact-analyzer/types'

interface AnalysisConfigProps {
  config: AnalysisConfigType
  onChange: (config: AnalysisConfigType) => void
}

export function AnalysisConfig({ config, onChange }: AnalysisConfigProps) {
  const handleChange = (field: keyof AnalysisConfigType, value: string) => {
    onChange({ ...config, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuración del Análisis</CardTitle>
        <CardDescription>
          Ingresa los datos del programa para el análisis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="programName">Nombre del Programa</Label>
            <Input
              id="programName"
              placeholder="Ej: JA Company Program"
              value={config.programName}
              onChange={(e) => handleChange('programName', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">País / Región</Label>
            <Input
              id="country"
              placeholder="Ej: México, Regional"
              value={config.country}
              onChange={(e) => handleChange('country', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="implementationDate">Fecha de Implementación</Label>
            <Input
              id="implementationDate"
              type="date"
              value={config.implementationDate}
              onChange={(e) => handleChange('implementationDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programHours">Horas Totales de Implementación</Label>
            <Input
              id="programHours"
              type="number"
              min="1"
              placeholder="Ej: 12"
              value={config.programHours || ''}
              onChange={(e) => onChange({ ...config, programHours: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              {config.programHours < 10 && config.programHours > 0 
                ? 'Programa corto: Se aplicará análisis de eficiencia pedagógica'
                : config.programHours >= 10 && config.programHours <= 30
                ? 'Programa de duración media: Escala estándar de Cohen'
                : config.programHours > 30
                ? 'Programa de larga duración'
                : 'Ingresa las horas para el análisis de eficiencia'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Tipo de Análisis</Label>
          <RadioGroup
            value={config.analysisType}
            onValueChange={(value) => handleChange('analysisType', value as 'single' | 'regional')}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="single" id="single" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="single" className="cursor-pointer font-medium">
                  País Individual
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Análisis de un solo país con datos pre y post
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="regional" id="regional" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="regional" className="cursor-pointer font-medium">
                  Regional (Multi-país)
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Análisis consolidado de múltiples países
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}
