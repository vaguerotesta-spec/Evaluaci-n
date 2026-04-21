// Survey data types
export interface SurveyRow {
  [key: string]: string | number
}

export interface ParsedSurvey {
  headers: string[]
  data: SurveyRow[]
  country?: string
}

// Dimension analysis types
export interface DimensionStats {
  dimension: string
  /** Full question text from the CSV header */
  questionText: string
  preMean: number
  postMean: number
  preStd: number
  postStd: number
  cohenD: number
  n: number
  preResponses: number[]
  postResponses: number[]
}

export type ImpactLevel = 'transformation' | 'solid' | 'moderate' | 'reinforcement'

export interface ClassifiedDimension extends DimensionStats {
  impactLevel: ImpactLevel
  interpretation: string
  /** Whether this is considered high efficiency for short programs */
  isHighEfficiency?: boolean
  /** Impact per hour ratio */
  impactPerHour?: number
}

// Country data for regional analysis
export interface CountryData {
  country: string
  dimensions: ClassifiedDimension[]
  totalResponses: number
}

// Program duration categories
export type ProgramDuration = 'short' | 'medium' | 'long'

// Analysis configuration
export interface AnalysisConfig {
  programName: string
  implementationDate: string
  country: string
  analysisType: 'single' | 'regional'
  /** Total implementation hours */
  programHours: number
  countries?: string[]
}

// Efficiency metrics
export interface EfficiencyMetrics {
  impactPerHour: number
  durationCategory: ProgramDuration
  efficiencyInterpretation: string
}

// History types
export interface HistoryEntry {
  id: string
  date: string
  programName: string
  country: string
  analysisType: 'single' | 'regional'
  dimensions: ClassifiedDimension[]
  totalResponses: number
  narrative?: string
}

// Narrative generation
export interface NarrativeRequest {
  programName: string
  country: string
  dimensions: ClassifiedDimension[]
  totalResponses: number
  historicalData?: HistoryEntry[]
}

// Impact level configuration
export const IMPACT_LEVELS: Record<ImpactLevel, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  range: string
  description: string
}> = {
  transformation: {
    label: 'Transformación',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    range: 'd ≥ 0.8',
    description: 'Impacto transformador - Cambio muy significativo'
  },
  solid: {
    label: 'Impacto Sólido',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    range: '0.5 ≤ d < 0.8',
    description: 'Impacto sólido - Cambio significativo'
  },
  moderate: {
    label: 'Impacto Moderado',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    range: '0.2 ≤ d < 0.5',
    description: 'Impacto moderado - Cambio perceptible'
  },
  reinforcement: {
    label: 'Requiere Refuerzo',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    range: 'd < 0.2',
    description: 'Requiere refuerzo - Cambio mínimo o nulo'
  }
}

// Dimension mappings (Spanish labels)
export const DIMENSION_LABELS: Record<string, string> = {
  'trabajo_equipo': 'Trabajo en Equipo',
  'educacion_financiera': 'Educación Financiera',
  'autoeficacia': 'Autoeficacia',
  'mentalidad_emprendedora': 'Mentalidad Emprendedora',
  'preparacion_laboral': 'Preparación Laboral',
  'pensamiento_critico': 'Pensamiento Crítico',
  'comunicacion': 'Comunicación',
  'liderazgo': 'Liderazgo',
  'resolucion_problemas': 'Resolución de Problemas',
  'creatividad': 'Creatividad',
  'responsabilidad_social': 'Responsabilidad Social',
  'toma_decisiones': 'Toma de Decisiones'
}
