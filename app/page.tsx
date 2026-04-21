'use client'

import { useState, useCallback } from 'react'
import { BarChart3, Upload, Settings, FileText, History as HistoryIcon, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import {
  FileUpload,
  AnalysisConfig,
  DimensionResults,
  ImpactChart,
  NarrativeSection,
  HistoryPanel
} from '@/components/impact-analyzer'
import {
  parseCSVFile,
  calculateDimensionStats,
  processDimensionStats,
  sortByImpact,
  saveHistory,
  getHistory
} from '@/lib/impact-analyzer'
import type { AnalysisConfig as AnalysisConfigType, ClassifiedDimension, ParsedSurvey } from '@/lib/impact-analyzer/types'

type AnalysisStep = 'upload' | 'config' | 'results'

export default function ImpactAnalyzerPage() {
  // Step management
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload')
  
  // File state
  const [preFile, setPreFile] = useState<File | null>(null)
  const [postFile, setPostFile] = useState<File | null>(null)
  const [preData, setPreData] = useState<ParsedSurvey | null>(null)
  const [postData, setPostData] = useState<ParsedSurvey | null>(null)
  
  // Config state
  const [config, setConfig] = useState<AnalysisConfigType>({
    programName: '',
    implementationDate: new Date().toISOString().split('T')[0],
    country: '',
    analysisType: 'single',
    programHours: 0
  })
  
  // Results state
  const [results, setResults] = useState<ClassifiedDimension[]>([])
  const [totalResponses, setTotalResponses] = useState(0)
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('analysis')

  // Handle file selection
  const handlePreFileSelect = useCallback(async (file: File) => {
    setPreFile(file)
    setError(null)
    try {
      const parsed = await parseCSVFile(file)
      setPreData(parsed)
      // Auto-detect country if available
      if (parsed.country && !config.country) {
        setConfig(prev => ({ ...prev, country: parsed.country || '' }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo PRE')
      setPreFile(null)
      setPreData(null)
    }
  }, [config.country])

  const handlePostFileSelect = useCallback(async (file: File) => {
    setPostFile(file)
    setError(null)
    try {
      const parsed = await parseCSVFile(file)
      setPostData(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo POST')
      setPostFile(null)
      setPostData(null)
    }
  }, [])

  // Process analysis
  const runAnalysis = useCallback(async () => {
    if (!preData || !postData) {
      setError('Por favor, carga ambos archivos (PRE y POST)')
      return
    }

    if (!config.programName || !config.country) {
      setError('Por favor, completa el nombre del programa y el país')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Calculate statistics
      const stats = calculateDimensionStats(preData, postData)
      
      if (stats.length === 0) {
        throw new Error('No se encontraron dimensiones comparables en los archivos. Verifica que las columnas tengan nombres consistentes.')
      }

      // Process and classify (pass program hours for efficiency analysis)
      const classified = stats.map(s => processDimensionStats(s, config.programHours || undefined))
      const sorted = sortByImpact(classified)
      
      // Calculate total responses
      const total = Math.max(preData.data.length, postData.data.length)
      
      setResults(sorted)
      setTotalResponses(total)
      setCurrentStep('results')

      // Save to history
      saveHistory({
        date: config.implementationDate || new Date().toISOString().split('T')[0],
        programName: config.programName,
        country: config.country,
        analysisType: config.analysisType,
        dimensions: sorted,
        totalResponses: total
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el análisis')
    } finally {
      setIsProcessing(false)
    }
  }, [preData, postData, config])

  // Reset analysis
  const resetAnalysis = useCallback(() => {
    setCurrentStep('upload')
    setPreFile(null)
    setPostFile(null)
    setPreData(null)
    setPostData(null)
    setResults([])
    setTotalResponses(0)
    setError(null)
    setConfig({
      programName: '',
      implementationDate: new Date().toISOString().split('T')[0],
      country: '',
      analysisType: 'single',
      programHours: 0
    })
  }, [])

  // Check if can proceed to next step
  const canProceedToConfig = preFile && postFile && preData && postData
  const canRunAnalysis = canProceedToConfig && config.programName && config.country

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">JA Impact Analyzer</h1>
                <p className="text-sm text-muted-foreground">Análisis de Impacto de Programas JA Americas</p>
              </div>
            </div>
            
            {currentStep === 'results' && (
              <Button variant="outline" onClick={resetAnalysis}>
                Nuevo Análisis
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <HistoryIcon className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step Indicator */}
            {currentStep !== 'results' && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                  <Upload className="h-4 w-4" />
                  <span>1. Cargar Archivos</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 ${currentStep === 'config' ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                  <Settings className="h-4 w-4" />
                  <span>2. Configurar</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>3. Resultados</span>
                </div>
              </div>
            )}

            {/* Upload Step */}
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FileUpload
                    label="Encuesta PRE"
                    description="Archivo CSV con los datos de la encuesta inicial"
                    onFileSelect={handlePreFileSelect}
                    selectedFile={preFile}
                    onClear={() => {
                      setPreFile(null)
                      setPreData(null)
                    }}
                    variant="pre"
                  />
                  <FileUpload
                    label="Encuesta POST"
                    description="Archivo CSV con los datos de la encuesta final"
                    onFileSelect={handlePostFileSelect}
                    selectedFile={postFile}
                    onClear={() => {
                      setPostFile(null)
                      setPostData(null)
                    }}
                    variant="post"
                  />
                </div>

                {preData && postData && (
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2">Archivos cargados correctamente:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>PRE: {preData.data.length} registros, {preData.headers.length} columnas</li>
                      <li>POST: {postData.data.length} registros, {postData.headers.length} columnas</li>
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep('config')}
                    disabled={!canProceedToConfig}
                    className="gap-2"
                  >
                    Continuar
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Config Step */}
            {currentStep === 'config' && (
              <div className="space-y-6">
                <AnalysisConfig config={config} onChange={setConfig} />

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                    Volver
                  </Button>
                  <Button
                    onClick={runAnalysis}
                    disabled={!canRunAnalysis || isProcessing}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4" />
                        Ejecutar Análisis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Results Step */}
            {currentStep === 'results' && results.length > 0 && (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                  <h2 className="text-2xl font-bold">{config.programName}</h2>
                  <p className="text-blue-100 mt-1">
                    {config.country} • {config.implementationDate}
                  </p>
                </div>

                {/* Results Content */}
                <DimensionResults dimensions={results} totalResponses={totalResponses} programHours={config.programHours} />
                
                <ImpactChart dimensions={results} />
                
                <NarrativeSection
                  programName={config.programName}
                  country={config.country}
                  dimensions={results}
                  totalResponses={totalResponses}
                  historicalData={getHistory().filter(h => h.programName === config.programName)}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <HistoryPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>JA Impact Analyzer - Herramienta de análisis de impacto para programas JA Americas</p>
          <p className="mt-1">Basado en Cohen&apos;s d para medición del tamaño del efecto</p>
        </div>
      </footer>
    </div>
  )
}
