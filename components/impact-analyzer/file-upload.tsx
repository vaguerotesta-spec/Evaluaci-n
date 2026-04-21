'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  label: string
  description: string
  accept?: string
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onClear: () => void
  variant?: 'pre' | 'post'
}

export function FileUpload({
  label,
  description,
  accept = '.csv',
  onFileSelect,
  selectedFile,
  onClear,
  variant = 'pre'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  const variantStyles = {
    pre: {
      border: 'border-blue-200 hover:border-blue-300',
      bg: 'bg-blue-50/50',
      icon: 'text-blue-500',
      dragBg: 'bg-blue-100'
    },
    post: {
      border: 'border-emerald-200 hover:border-emerald-300',
      bg: 'bg-emerald-50/50',
      icon: 'text-emerald-500',
      dragBg: 'bg-emerald-100'
    }
  }

  const styles = variantStyles[variant]

  return (
    <Card className={cn('transition-all', styles.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedFile ? (
          <div className={cn('flex items-center justify-between p-4 rounded-lg', styles.bg)}>
            <div className="flex items-center gap-3">
              <CheckCircle className={cn('h-5 w-5', styles.icon)} />
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label
            className={cn(
              'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all',
              styles.border,
              isDragging ? styles.dragBg : 'bg-muted/30 hover:bg-muted/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={cn('p-3 rounded-full', styles.bg)}>
              <Upload className={cn('h-6 w-6', styles.icon)} />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">
                Arrastra tu archivo aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                o haz clic para seleccionar
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Solo archivos CSV</span>
            </div>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </CardContent>
    </Card>
  )
}
