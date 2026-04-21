import { NextRequest, NextResponse } from 'next/server'
import type { NarrativeRequest, ClassifiedDimension, HistoryEntry, ImpactLevel } from '@/lib/impact-analyzer/types'
import { IMPACT_LEVELS, groupByImpactLevel } from '@/lib/impact-analyzer'

export async function POST(request: NextRequest) {
  try {
    const body: NarrativeRequest = await request.json()
    const { programName, country, dimensions, totalResponses, historicalData } = body

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      // Return fallback narrative if no API key
      return NextResponse.json({
        narrative: generateFallbackNarrative(programName, country, dimensions, totalResponses),
        source: 'fallback'
      })
    }

    // Build the prompt
    const prompt = buildPrompt(programName, country, dimensions, totalResponses, historicalData)

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      return NextResponse.json({
        narrative: generateFallbackNarrative(programName, country, dimensions, totalResponses),
        source: 'fallback',
        error: 'API call failed'
      })
    }

    const data = await response.json()
    const narrative = data.content?.[0]?.text || generateFallbackNarrative(programName, country, dimensions, totalResponses)

    return NextResponse.json({
      narrative,
      source: 'ai'
    })
  } catch (error) {
    console.error('Error generating narrative:', error)
    return NextResponse.json(
      { error: 'Failed to generate narrative' },
      { status: 500 }
    )
  }
}

function buildPrompt(
  programName: string,
  country: string,
  dimensions: ClassifiedDimension[],
  totalResponses: number,
  historicalData?: HistoryEntry[]
): string {
  const grouped = groupByImpactLevel(dimensions)
  
  let prompt = `Eres un experto en evaluación de programas educativos de JA Americas (Junior Achievement). 
Genera un análisis narrativo profesional en español para el siguiente informe de impacto.

PROGRAMA: ${programName}
PAÍS/REGIÓN: ${country}
TOTAL DE RESPUESTAS: ${totalResponses}

RESULTADOS POR DIMENSIÓN (usando Cohen's d como medida de efecto):

`

  const levels: ImpactLevel[] = ['transformation', 'solid', 'moderate', 'reinforcement']
  
  for (const level of levels) {
    const dims = grouped[level]
    if (dims.length > 0) {
      prompt += `\n### ${IMPACT_LEVELS[level].label} (${IMPACT_LEVELS[level].range}):\n`
      for (const dim of dims) {
        // Use questionText for better context, fallback to dimension key
        const label = dim.questionText || dim.dimension
        prompt += `- ${label}: d = ${dim.cohenD.toFixed(3)} (Pre: ${dim.preMean.toFixed(2)}, Post: ${dim.postMean.toFixed(2)})\n`
      }
    }
  }

  if (historicalData && historicalData.length > 0) {
    prompt += `\n\nDATOS HISTÓRICOS DISPONIBLES:\n`
    for (const entry of historicalData.slice(0, 3)) {
      prompt += `- ${entry.date}: ${entry.programName} en ${entry.country}\n`
    }
  }

  prompt += `\n\nGenera un análisis narrativo que incluya:
1. Resumen ejecutivo (2-3 oraciones)
2. Fortalezas del programa (dimensiones con mayor impacto)
3. Áreas de oportunidad (dimensiones que requieren refuerzo)
4. Recomendaciones específicas basadas en los datos
5. Conclusión

El tono debe ser profesional pero accesible, orientado a tomadores de decisiones educativas.
Usa formato con encabezados claros y bullets cuando sea apropiado.`

  return prompt
}

function generateFallbackNarrative(
  programName: string,
  country: string,
  dimensions: ClassifiedDimension[],
  totalResponses: number
): string {
  const grouped = groupByImpactLevel(dimensions)
  const sorted = [...dimensions].sort((a, b) => Math.abs(b.cohenD) - Math.abs(a.cohenD))
  
  let narrative = `## Análisis de Impacto: ${programName}\n\n`
  narrative += `**País/Región:** ${country}\n`
  narrative += `**Total de respuestas:** ${totalResponses}\n\n`
  
  narrative += `### Resumen Ejecutivo\n\n`
  narrative += `El programa ${programName} muestra resultados variados en las diferentes dimensiones evaluadas. `
  
  if (grouped.transformation.length > 0 || grouped.solid.length > 0) {
    narrative += `Se observa un impacto positivo significativo en ${grouped.transformation.length + grouped.solid.length} dimensiones. `
  }
  
  if (grouped.reinforcement.length > 0) {
    narrative += `Se identificaron ${grouped.reinforcement.length} áreas que requieren atención adicional.`
  }
  
  narrative += `\n\n### Fortalezas del Programa\n\n`
  
  const strengths = [...grouped.transformation, ...grouped.solid]
  if (strengths.length > 0) {
    for (const dim of strengths) {
      const label = dim.questionText || dim.dimension
      narrative += `- **${label}**: Cohen's d = ${dim.cohenD.toFixed(3)} - ${dim.interpretation}\n`
    }
  } else {
    narrative += `No se identificaron dimensiones con impacto alto o transformador.\n`
  }
  
  narrative += `\n### Áreas de Oportunidad\n\n`
  
  if (grouped.reinforcement.length > 0) {
    for (const dim of grouped.reinforcement) {
      const label = dim.questionText || dim.dimension
      narrative += `- **${label}**: Cohen's d = ${dim.cohenD.toFixed(3)} - ${dim.interpretation}\n`
    }
  } else {
    narrative += `Todas las dimensiones muestran al menos impacto moderado.\n`
  }
  
  narrative += `\n### Recomendaciones\n\n`
  narrative += `1. Mantener y fortalecer las estrategias utilizadas en las dimensiones de alto impacto.\n`
  narrative += `2. Revisar y ajustar las metodologías para las áreas que requieren refuerzo.\n`
  narrative += `3. Considerar la implementación de actividades específicas para las dimensiones con impacto moderado.\n`
  
  return narrative
}
