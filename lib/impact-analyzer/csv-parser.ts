import Papa from 'papaparse'
import type { ParsedSurvey, SurveyRow, DimensionStats } from './types'
import { calculateMean, calculateStdDev, calculateCohenD } from './statistics'

// Columns to exclude from analysis (metadata columns)
const EXCLUDED_PATTERN = /nombre|^name$|email|correo|^mail$|^id$|legajo|dni|cedula|rut|fecha|^date$|timestamp|hora|^time$|sexo|genero|gender|edad|^age$|telefono|phone|localidad|ciudad|pais|country|escuela|colegio|school|turno|cod|codigo|matricula|institucion/i

/**
 * Parse a CSV file and return structured data
 */
export function parseCSVFile(file: File): Promise<ParsedSurvey> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors)
        }
        
        const headers = results.meta.fields || []
        const data = results.data as SurveyRow[]
        
        // Try to detect country from data or filename
        const country = detectCountry(data, file.name)
        
        resolve({
          headers,
          data,
          country
        })
      },
      error: (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`))
      }
    })
  })
}

/**
 * Detect country from data or filename
 */
function detectCountry(data: SurveyRow[], filename: string): string | undefined {
  // Check if there's a country column
  if (data.length > 0) {
    const firstRow = data[0]
    const countryKeys = ['country', 'pais', 'país', 'Country', 'Pais', 'País']
    
    for (const key of countryKeys) {
      if (key in firstRow && firstRow[key]) {
        return String(firstRow[key])
      }
    }
  }
  
  // Try to extract from filename
  const countryPatterns = [
    /_(ARG|BRA|MEX|COL|PER|CHI|ECU|VEN|URU|PAR|BOL|CRI|PAN|DOM|GTM|HND|SLV|NIC)_/i,
    /-(argentina|brazil|mexico|colombia|peru|chile|ecuador|venezuela|uruguay|paraguay|bolivia|costa rica|panama|dominican|guatemala|honduras|salvador|nicaragua)-/i
  ]
  
  for (const pattern of countryPatterns) {
    const match = filename.match(pattern)
    if (match) {
      return match[1].toUpperCase()
    }
  }
  
  return undefined
}

/**
 * Check if a column contains Likert scale values (1-4, 1-5, or 1-10)
 */
function isLikertColumn(columnName: string, data: SurveyRow[]): boolean {
  // Skip excluded columns
  if (EXCLUDED_PATTERN.test(columnName)) {
    return false
  }
  
  // Get numeric values from column
  const nums = data
    .map(row => Number(row[columnName]))
    .filter(n => !isNaN(n) && n > 0)
  
  // Need at least 50% of rows to have valid numbers
  if (nums.length < data.length * 0.5) {
    return false
  }
  
  // Most values should be integers
  const ints = nums.filter(n => Number.isInteger(n))
  if (ints.length < nums.length * 0.85) {
    return false
  }
  
  // Max value should be in Likert range (2-10)
  const max = Math.max(...nums)
  return max >= 2 && max <= 10
}

/**
 * Extract numeric responses from data for given columns
 */
function extractResponses(data: SurveyRow[], columns: string[]): number[] {
  const responses: number[] = []
  
  for (const row of data) {
    for (const col of columns) {
      const value = row[col]
      if (typeof value === 'number' && !isNaN(value) && value > 0) {
        responses.push(value)
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value)
        if (!isNaN(parsed) && parsed > 0) {
          responses.push(parsed)
        }
      }
    }
  }
  
  return responses
}

/**
 * Calculate dimension statistics by finding common Likert columns
 * between PRE and POST surveys
 */
export function calculateDimensionStats(
  preData: ParsedSurvey,
  postData: ParsedSurvey
): DimensionStats[] {
  // Find Likert columns in each dataset
  const preLikertCols = preData.headers.filter(col => isLikertColumn(col, preData.data))
  const postLikertCols = postData.headers.filter(col => isLikertColumn(col, postData.data))
  
  // Find common columns between PRE and POST
  const commonCols = preLikertCols.filter(col => postLikertCols.includes(col))
  
  if (commonCols.length === 0) {
    console.warn('No common Likert columns found between PRE and POST surveys')
    return []
  }
  
  const stats: DimensionStats[] = []
  
  for (const col of commonCols) {
    const preResponses = extractResponses(preData.data, [col])
    const postResponses = extractResponses(postData.data, [col])
    
    if (preResponses.length < 2 || postResponses.length < 2) {
      continue
    }
    
    const preMean = calculateMean(preResponses)
    const postMean = calculateMean(postResponses)
    const preStd = calculateStdDev(preResponses, preMean)
    const postStd = calculateStdDev(postResponses, postMean)
    const cohenD = calculateCohenD(
      preMean,
      postMean,
      preStd,
      postStd,
      preResponses.length,
      postResponses.length
    )
    
    // Use the full column header as the question text
    // The dimension key is a normalized version for internal use
    const dimension = normalizeKey(col)
    const questionText = cleanQuestionText(col)
    
    stats.push({
      dimension,
      questionText,
      preMean,
      postMean,
      preStd,
      postStd,
      cohenD,
      n: Math.min(preResponses.length, postResponses.length),
      preResponses,
      postResponses
    })
  }
  
  return stats
}

/**
 * Normalize a column name to create a consistent key
 */
function normalizeKey(col: string): string {
  return col
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 60) || 'dimension'
}

/**
 * Clean up question text for display
 * Removes common prefixes like "q06_4 - " or "P1. "
 */
function cleanQuestionText(col: string): string {
  // Remove patterns like "q06_4 - ", "P1. ", "Q1: ", "1. ", "q1_", etc.
  let text = col
    .replace(/^[qpQP]?\d+[._\-:\s]+/g, '') // q06_4 - , P1. , Q1: 
    .replace(/^[qpQP]\d+_\d+[._\-:\s]*/g, '') // q06_4_, p1_2_
    .replace(/^\d+[._\-:\s]+/g, '') // 1. , 2- 
    .trim()
  
  // If cleaning removed too much, use original
  if (text.length < 5) {
    text = col
  }
  
  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1)
}
