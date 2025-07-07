import { augmentEvent } from '../../utils/event-processor'
import type { RawSofData, RawSofEventGroup } from '../../types'

/**
 * Fetch SOF data and augment with event codes
 */
export async function fetchSofData(): Promise<RawSofData> {
  try {
    const response = await fetch('/sof.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch SOF data: ${response.status} ${response.statusText}`)
    }
    
    const sofData: RawSofData = await response.json()
    
    // Augment events with event codes using centralized utility
    if (sofData.events && Array.isArray(sofData.events)) {
      sofData.events = sofData.events.map((eventGroup: RawSofEventGroup) => {
        if (eventGroup.events && Array.isArray(eventGroup.events)) {
          eventGroup.events = eventGroup.events.map((e) => {
            const augmented = augmentEvent(e)
            return { 
              ...e, 
              event_code: augmented.event_code || e.event_key 
            }
          })
        }
        return eventGroup
      })
    }
    
    return sofData
  } catch (error) {
    console.error('Error fetching SOF data:', error)
    throw error
  }
}

/**
 * Validate SOF data structure
 */
export function validateSofData(sofData: unknown): sofData is RawSofData {
  if (!sofData || typeof sofData !== 'object') {
    return false
  }
  
  const data = sofData as Record<string, unknown>
  
  if (!data.id || !data.name) {
    return false
  }
  
  if (!Array.isArray(data.events)) {
    return false
  }
  
  return true
} 