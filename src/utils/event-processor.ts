import type { Event, SofEventDetail, RawSofEventDetail, EventSelector } from '../types'
import { getEventMappingByLabel } from './event-mapper'
import moment from 'moment'

/**
 * Centralized event processing utilities
 * Consolidates all event code augmentation, finding, and processing logic
 */

/**
 * Augment a single event with proper event_code and cleaned properties
 */
export function augmentEvent(event: Event | SofEventDetail | RawSofEventDetail): Event {
  const baseEvent = event as Event
  
  // If already has event_code, just ensure consistency
  if (baseEvent.event_code) {
    return {
      ...baseEvent,
      key: baseEvent.event_code || baseEvent.key,
      event_code: baseEvent.event_code
    }
  }
  
  // Try to get mapping from the event label/name
  const eventWithLabel = event as Event & { event_label?: string }
  const labelToUse = baseEvent.name || eventWithLabel.event_label || ''
  const mapping = getEventMappingByLabel(labelToUse)
  const eventCode = mapping?.code || baseEvent.key
  
  return {
    ...baseEvent,
    key: eventCode,
    event_code: eventCode,
    // Use clean label if available
    name: mapping?.label || baseEvent.name || eventWithLabel.event_label || ''
  }
}

/**
 * Augment an array of events with proper event codes and cleaned properties
 */
export function augmentEvents(events: Event[]): Event[] {
  return events.map(event => augmentEvent(event))
}

/**
 * Find an event by key or event_code
 */
export function findEventByKey(events: Event[], key: string): Event | null {
  // First try to match by event_code
  const codeMatch = events.find(event => event.event_code === key)
  if (codeMatch) return codeMatch
  
  // Fall back to key match
  const keyMatch = events.find(event => event.key === key)
  return keyMatch || null
}

/**
 * Find events by multiple keys (OR logic)
 */
export function findEventsByKeys(events: Event[], keys: string[]): Event[] {
  return events.filter(event => 
    keys.some(key => event.event_code === key || event.key === key)
  )
}

/**
 * Find first instance of events matching any of the provided keys
 */
export function findFirstEventByKeys(events: Event[], keys: string[]): Event | null {
  const matchingEvents = findEventsByKeys(events, keys)
  if (!matchingEvents.length) return null
  
  return matchingEvents.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )[0]
}

/**
 * Find last instance of events matching any of the provided keys
 */
export function findLastEventByKeys(events: Event[], keys: string[]): Event | null {
  const matchingEvents = findEventsByKeys(events, keys)
  if (!matchingEvents.length) return null
  
  return matchingEvents.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]
}

/**
 * Apply date modifier to an event date
 */
export function applyDateModifier(modifier: number, date: string): string {
  const operation = modifier >= 0 ? 'add' : 'subtract'
  return moment(date)
    [operation](Math.abs(modifier), 'hours')
    .format('YYYY-MM-DDTHH:mm:ss')
}

/**
 * Find event by selector (used in contract processing)
 */
export function findEventBySelector(events: Event[], selector: EventSelector): Event | null {
  if (!selector) return null
  
  const args = selector.arguments as Record<string, unknown>
  
  if (selector.operation === 'single_event') {
    const eventArg = args.event as { key: string }
    const modifier = args.modifier as number
    
    const event = findEventByKey(events, eventArg.key)
    
    if (!event) {
      return null
    }
    
    // Apply modifier if present
    if (modifier) {
      const modifiedDate = applyDateModifier(modifier, event.date)
      return {
        ...event,
        date: modifiedDate
      }
    }
    
    return event
  }
  
  if (selector.operation === 'first_instance_of_event') {
    const eventsArg = args.events as Array<{ key: string, sub_category_key?: string }>
    const eventKeys = eventsArg.map(e => e.key)
    
    // Also check for sub_category_key matches
    const matchingEvents = events.filter(e => {
      // Direct key match
      if (eventKeys.includes(e.key) || eventKeys.includes(e.event_code || '')) return true
      
      // Sub-category key partial match
      for (const selectorEvent of eventsArg) {
        if (selectorEvent.sub_category_key && 
            (e.key.includes(selectorEvent.sub_category_key) || 
             e.event_code?.includes(selectorEvent.sub_category_key))) {
          return true
        }
      }
      
      return false
    })
    
    return findFirstEventByKeys(matchingEvents, eventKeys)
  }
  
  if (selector.operation === 'last_instance_of_event') {
    const eventsArg = args.events as Array<{ key: string, sub_category_key?: string }>
    const eventKeys = eventsArg.map(e => e.key)
    
    // Also check for sub_category_key matches
    const matchingEvents = events.filter(e => {
      // Direct key match
      if (eventKeys.includes(e.key) || eventKeys.includes(e.event_code || '')) return true
      
      // Sub-category key partial match
      for (const selectorEvent of eventsArg) {
        if (selectorEvent.sub_category_key && 
            (e.key.includes(selectorEvent.sub_category_key) || 
             e.event_code?.includes(selectorEvent.sub_category_key))) {
          return true
        }
      }
      
      return false
    })
    
    return findLastEventByKeys(matchingEvents, eventKeys)
  }
  
  return null
}

/**
 * Filter out custom events (events starting with __custom)
 */
export function filterCustomEvents(events: Event[]): Event[] {
  return events.filter(event => !event.key.startsWith('__custom'))
}

/**
 * Check if an event matches a specific key or pattern
 */
export function eventMatches(event: Event, pattern: string): boolean {
  const lowerPattern = pattern.toLowerCase()
  const eventKey = event.event_code?.toLowerCase() || event.key.toLowerCase()
  const eventName = event.name?.toLowerCase() || ''
  
  return eventKey === lowerPattern || 
         eventKey.includes(lowerPattern) || 
         eventName.includes(lowerPattern)
}

/**
 * Group events by date for timeline display
 */
export function groupEventsByDate(events: Event[]): { [date: string]: Event[] } {
  return events.reduce((groups, event) => {
    const dateKey = new Date(event.date).toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(event)
    return groups
  }, {} as { [date: string]: Event[] })
}

/**
 * Sort events chronologically
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

/**
 * Get events within a specific time range
 */
export function getEventsInRange(events: Event[], startDate: string, endDate: string): Event[] {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  
  return events.filter(event => {
    const eventTime = new Date(event.date).getTime()
    return eventTime >= start && eventTime <= end
  })
} 