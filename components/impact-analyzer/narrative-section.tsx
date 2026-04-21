'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Copy, Check, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { ClassifiedDimension, HistoryEntry } from '@/lib/impact-analyzer/types'
import { cn } from '@/lib/utils'

interface NarrativeSectionProps {
  programName: string
  country: string
  dimensions: ClassifiedDimension[]
  totalResponses: number
  historicalData?: HistoryEntry[]
  initialNarrative?: string
}

export function NarrativeSection({
  programName,
  country,
  dimensions,
  totalResponses,
  historicalData,
  initialNarrative
}: NarrativeSectionProps) {
  const [narrative, setNarrative] = useState<string>(initialNarrative || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null)
  const [copied, setCopied] = useState(false)

  const generateNarrative = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programName,
          country,
          dimensions,
          totalResponses,
          historicalData,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al generar la narrativa')
      }

      const data = await response.json()
      setNarrative(data.narrative)
      setSource(data.source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(narrative)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  // Parse markdown-like formatting for display
  const formatNarrative = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">
              {line.replace('## ', '')}
            </h2>
          )
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">
              {line.replace('### ', '')}
            </h3>
          )
        }
        // Bold text
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i} className="mb-2">
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j}>{part}</strong>
                ) : (
                  part
                )
              )}
            </p>
          )
        }
        // List items
        if (line.startsWith('- ')) {
          return (
            <li key={i} className="ml-4 mb-1">
              {line.replace('- ', '')}
            </li>
          )
        }
        if (line.match(/^\d+\. /)) {
          return (
            <li key={i} className="ml-4 mb-1 list-decimal">
              {line.replace(/^\d+\. /, '')}
            </li>
          )
        }
        // Empty lines
        if (line.trim() === '') {
          return <br key={i} />
        }
        // Regular paragraphs
        return (
          <p key={i} className="mb-2">
            {line}
          </p>
        )
      })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Narrativa de Análisis
            </CardTitle>
            <CardDescription className="mt-1">
              Generación automática de análisis narrativo basado en los resultados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {narrative && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={generateNarrative}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Generando...
                </>
              ) : narrative ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerar
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Narrativa
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {narrative ? (
          <div className="space-y-2">
            {source && (
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium mb-4',
                source === 'ai' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              )}>
                <Sparkles className="h-3 w-3" />
                {source === 'ai' ? 'Generado con IA' : 'Narrativa Predeterminada'}
              </div>
            )}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {formatNarrative(narrative)}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Haz clic en &quot;Generar Narrativa&quot; para crear un análisis automático</p>
            <p className="text-sm mt-2">
              La narrativa incluirá un resumen ejecutivo, fortalezas, áreas de oportunidad y recomendaciones
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
