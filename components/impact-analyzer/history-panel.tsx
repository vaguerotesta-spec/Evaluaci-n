'use client'

import { useState, useEffect } from 'react'
import { History, Trash2, Download, Upload, ChevronDown, ChevronUp, Calendar, MapPin, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { HistoryEntry } from '@/lib/impact-analyzer/types'
import { getHistory, deleteHistoryEntry, clearHistory, exportHistory, importHistory } from '@/lib/impact-analyzer/storage'
import { IMPACT_LEVELS, groupByImpactLevel } from '@/lib/impact-analyzer'
import { cn } from '@/lib/utils'

interface HistoryPanelProps {
  onSelectEntry?: (entry: HistoryEntry) => void
}

export function HistoryPanel({ onSelectEntry }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id)
    setHistory(getHistory())
  }

  const handleClearAll = () => {
    clearHistory()
    setHistory([])
  }

  const handleExport = () => {
    const data = exportHistory()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ja-impact-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        if (importHistory(text)) {
          setHistory(getHistory())
        }
      }
    }
    input.click()
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Análisis
            </CardTitle>
            <CardDescription className="mt-1">
              {history.length} {history.length === 1 ? 'análisis guardado' : 'análisis guardados'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={history.length === 0} className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Limpiar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar todo el historial?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todos los análisis guardados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                      Eliminar Todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay análisis guardados</p>
            <p className="text-sm mt-1">Los análisis completados aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const grouped = groupByImpactLevel(entry.dimensions)
              const isExpanded = expanded === entry.id

              return (
                <div
                  key={entry.id}
                  className="border rounded-lg overflow-hidden transition-all hover:shadow-sm"
                >
                  <button
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{entry.programName}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {entry.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {entry.dimensions.length} dimensiones
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1">
                        {grouped.transformation.length > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            {grouped.transformation.length}
                          </Badge>
                        )}
                        {grouped.solid.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            {grouped.solid.length}
                          </Badge>
                        )}
                        {grouped.moderate.length > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            {grouped.moderate.length}
                          </Badge>
                        )}
                        {grouped.reinforcement.length > 0 && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            {grouped.reinforcement.length}
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-muted/30">
                      <div className="pt-4 space-y-4">
                        {/* Impact summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div className={cn('p-2 rounded', IMPACT_LEVELS.transformation.bgColor)}>
                            <p className={IMPACT_LEVELS.transformation.color}>Transformación</p>
                            <p className="font-bold">{grouped.transformation.length}</p>
                          </div>
                          <div className={cn('p-2 rounded', IMPACT_LEVELS.solid.bgColor)}>
                            <p className={IMPACT_LEVELS.solid.color}>Sólido</p>
                            <p className="font-bold">{grouped.solid.length}</p>
                          </div>
                          <div className={cn('p-2 rounded', IMPACT_LEVELS.moderate.bgColor)}>
                            <p className={IMPACT_LEVELS.moderate.color}>Moderado</p>
                            <p className="font-bold">{grouped.moderate.length}</p>
                          </div>
                          <div className={cn('p-2 rounded', IMPACT_LEVELS.reinforcement.bgColor)}>
                            <p className={IMPACT_LEVELS.reinforcement.color}>Refuerzo</p>
                            <p className="font-bold">{grouped.reinforcement.length}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                          {onSelectEntry && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSelectEntry(entry)}
                            >
                              Ver Detalles
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este análisis?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará el análisis de &quot;{entry.programName}&quot; del historial.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(entry.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
