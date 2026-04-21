import type { HistoryEntry } from './types'

const STORAGE_KEY = 'ja-impact-analyzer-history'

/**
 * Get all history entries from localStorage
 */
export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    
    return parsed
  } catch (error) {
    console.error('Error reading history from localStorage:', error)
    return []
  }
}

/**
 * Save a new history entry
 */
export function saveHistory(entry: Omit<HistoryEntry, 'id'>): HistoryEntry {
  const history = getHistory()
  
  const newEntry: HistoryEntry = {
    ...entry,
    id: generateId()
  }
  
  history.unshift(newEntry)
  
  // Keep only last 50 entries
  const trimmed = history.slice(0, 50)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Error saving history to localStorage:', error)
  }
  
  return newEntry
}

/**
 * Delete a history entry by ID
 */
export function deleteHistoryEntry(id: string): void {
  const history = getHistory()
  const filtered = history.filter(entry => entry.id !== id)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting history entry:', error)
  }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing history:', error)
  }
}

/**
 * Get history entries for a specific program
 */
export function getHistoryByProgram(programName: string): HistoryEntry[] {
  const history = getHistory()
  return history.filter(entry => 
    entry.programName.toLowerCase() === programName.toLowerCase()
  )
}

/**
 * Get history entries for a specific country
 */
export function getHistoryByCountry(country: string): HistoryEntry[] {
  const history = getHistory()
  return history.filter(entry => 
    entry.country.toLowerCase() === country.toLowerCase()
  )
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Export history as JSON
 */
export function exportHistory(): string {
  const history = getHistory()
  return JSON.stringify(history, null, 2)
}

/**
 * Import history from JSON
 */
export function importHistory(json: string): boolean {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid history format')
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    return true
  } catch (error) {
    console.error('Error importing history:', error)
    return false
  }
}
