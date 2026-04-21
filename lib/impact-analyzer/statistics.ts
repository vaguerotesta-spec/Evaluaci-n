import type { DimensionStats, ClassifiedDimension, ImpactLevel, ProgramDuration, EfficiencyMetrics } from './types'

/**
 * Calculate the mean (average) of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * Calculate the standard deviation of an array of numbers
 */
export function calculateStdDev(values: number[], mean?: number): number {
  if (values.length < 2) return 0
  const avg = mean ?? calculateMean(values)
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2))
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Calculate Cohen's d effect size
 * Cohen's d = (M2 - M1) / pooled standard deviation
 */
export function calculateCohenD(
  preMean: number,
  postMean: number,
  preStd: number,
  postStd: number,
  preN: number,
  postN: number
): number {
  // Pooled standard deviation formula
  const pooledStd = Math.sqrt(
    ((preN - 1) * Math.pow(preStd, 2) + (postN - 1) * Math.pow(postStd, 2)) /
    (preN + postN - 2)
  )
  
  if (pooledStd === 0) return 0
  
  return (postMean - preMean) / pooledStd
}

/**
 * Get program duration category based on hours
 */
export function getProgramDuration(hours: number): ProgramDuration {
  if (hours < 10) return 'short'
  if (hours <= 30) return 'medium'
  return 'long'
}

/**
 * Check if a dimension qualifies as "High Efficiency Impact" for short programs
 * For programs < 10 hours: 0.10 ≤ d < 0.30 is considered high efficiency
 */
export function isHighEfficiencyImpact(cohenD: number, programHours: number): boolean {
  const absD = Math.abs(cohenD)
  const duration = getProgramDuration(programHours)
  
  // Only applies to short duration programs
  if (duration !== 'short') return false
  
  // High efficiency range for short programs
  return absD >= 0.10 && absD < 0.30
}

/**
 * Calculate impact per hour ratio
 */
export function calculateImpactPerHour(cohenD: number, programHours: number): number {
  if (programHours <= 0) return 0
  return Math.abs(cohenD) / programHours
}

/**
 * Classify impact level based on Cohen's d value and program duration
 */
export function classifyImpact(cohenD: number, programHours?: number): ImpactLevel {
  const absD = Math.abs(cohenD)
  
  // Standard classification
  if (absD >= 0.8) return 'transformation'
  if (absD >= 0.5) return 'solid'
  if (absD >= 0.2) return 'moderate'
  return 'reinforcement'
}

/**
 * Get interpretation text based on Cohen's d value and program duration
 */
export function getInterpretation(cohenD: number, dimension: string, programHours?: number): string {
  const absD = Math.abs(cohenD)
  const direction = cohenD >= 0 ? 'positivo' : 'negativo'
  
  // Check for high efficiency impact in short programs
  if (programHours && isHighEfficiencyImpact(cohenD, programHours)) {
    return `Impacto de Alta Eficiencia en ${dimension}. Considerando la breve duración del programa (${programHours}h), el cambio detectado es altamente positivo, demostrando una transferencia de conocimientos efectiva en un tiempo optimizado.`
  }
  
  if (absD >= 0.8) {
    return `Efecto ${direction} muy grande en ${dimension}. El programa ha generado un cambio transformador.`
  }
  if (absD >= 0.5) {
    return `Efecto ${direction} grande en ${dimension}. El programa ha logrado un impacto significativo.`
  }
  if (absD >= 0.2) {
    return `Efecto ${direction} moderado en ${dimension}. Se observa un cambio perceptible.`
  }
  return `Efecto ${direction} pequeño en ${dimension}. Se recomienda reforzar esta área.`
}

/**
 * Get efficiency metrics for a set of dimensions
 */
export function getEfficiencyMetrics(dimensions: ClassifiedDimension[], programHours: number): EfficiencyMetrics {
  const avgCohenD = dimensions.reduce((sum, d) => sum + Math.abs(d.cohenD), 0) / dimensions.length
  const impactPerHour = calculateImpactPerHour(avgCohenD, programHours)
  const durationCategory = getProgramDuration(programHours)
  
  let efficiencyInterpretation: string
  
  if (durationCategory === 'short') {
    if (impactPerHour >= 0.05) {
      efficiencyInterpretation = `Excelente eficiencia pedagógica. El programa logró un ratio de ${impactPerHour.toFixed(4)} unidades de impacto por hora, demostrando alta efectividad en intervenciones cortas.`
    } else if (impactPerHour >= 0.02) {
      efficiencyInterpretation = `Buena eficiencia pedagógica. El ratio de ${impactPerHour.toFixed(4)} indica una transferencia efectiva de conocimientos considerando la duración limitada.`
    } else {
      efficiencyInterpretation = `Eficiencia moderada. El ratio de ${impactPerHour.toFixed(4)} sugiere oportunidad para optimizar la metodología en futuras implementaciones cortas.`
    }
  } else if (durationCategory === 'medium') {
    efficiencyInterpretation = `Programa de duración estándar. El ratio de impacto por hora es ${impactPerHour.toFixed(4)}, aplicando la escala tradicional de Cohen.`
  } else {
    efficiencyInterpretation = `Programa de larga duración. El ratio de ${impactPerHour.toFixed(4)} permite una comparación proporcional con intervenciones más cortas.`
  }
  
  return {
    impactPerHour,
    durationCategory,
    efficiencyInterpretation
  }
}

/**
 * Process dimension data and return classified results
 */
export function processDimensionStats(stats: DimensionStats, programHours?: number): ClassifiedDimension {
  const impactLevel = classifyImpact(stats.cohenD, programHours)
  const interpretation = getInterpretation(stats.cohenD, stats.questionText || stats.dimension, programHours)
  const highEfficiency = programHours ? isHighEfficiencyImpact(stats.cohenD, programHours) : false
  const impactPerHour = programHours ? calculateImpactPerHour(stats.cohenD, programHours) : undefined
  
  return {
    ...stats,
    impactLevel,
    interpretation,
    isHighEfficiency: highEfficiency,
    impactPerHour
  }
}

/**
 * Sort dimensions by Cohen's d value (descending)
 */
export function sortByImpact(dimensions: ClassifiedDimension[]): ClassifiedDimension[] {
  return [...dimensions].sort((a, b) => Math.abs(b.cohenD) - Math.abs(a.cohenD))
}

/**
 * Group dimensions by impact level
 */
export function groupByImpactLevel(
  dimensions: ClassifiedDimension[]
): Record<ImpactLevel, ClassifiedDimension[]> {
  return {
    transformation: dimensions.filter(d => d.impactLevel === 'transformation'),
    solid: dimensions.filter(d => d.impactLevel === 'solid'),
    moderate: dimensions.filter(d => d.impactLevel === 'moderate'),
    reinforcement: dimensions.filter(d => d.impactLevel === 'reinforcement')
  }
}
