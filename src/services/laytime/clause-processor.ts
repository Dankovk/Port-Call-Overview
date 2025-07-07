import moment from 'moment'
import type { Event, ContractData, ContractClause, TimeRange, ContractResults, Conditional, EventSelector } from '../../types'
import { fetchContractData } from '../api/contract-api'
import { augmentEvents, filterCustomEvents, findEventBySelector } from '../../utils/event-processor'

/**
 * Main function to apply contract clauses - follows the backend pipeline approach
 */
export async function applyContractClauses(events: Event[]): Promise<ContractResults> {
  // Define empty response
  const EMPTY_RESPONSE: ContractResults = {
    events,
    add_events: [],
    deduct_events: [],
    contractData: undefined
  }

  // Filter out any custom events and augment with proper codes
  const filteredEvents = filterCustomEvents(events)
  
  try {
    // Load contract data
    const contractData = await fetchContractData()
    
    // Ensure events have proper event_code set using centralized utility
    const eventsWithCodes = augmentEvents(filteredEvents)
    
    console.log('Events with codes:', eventsWithCodes.map(e => ({ 
      name: e.name,
      key: e.event_code,
      event_code: e.event_code 
    })))
    
    // Step 1: Check for active conditionals in the clause
    const { activeClauses, updatedEvents } = getActiveContractClauses(eventsWithCodes, contractData)
    if (!activeClauses?.length) {
      return {
        ...EMPTY_RESPONSE,
        events: filteredEvents,
        contractData
      }
    }

    // Step 2: Resolve clauses to create time ranges
    const resolvedClauses = resolveClauses(updatedEvents, activeClauses)
    if (!resolvedClauses?.length) {
      return {
        ...EMPTY_RESPONSE,
        events: filteredEvents,
        contractData
      }
    }
    
    // Step 3: Create laytime ranges
    const laytimeRanges = createLaytimeRanges(updatedEvents, resolvedClauses, contractData)
    
    // Step 4: Process and return results
    const { addEvents, deductEvents } = mergeEventsFromMultipleSofs(laytimeRanges)
    
    return {
      events: laytimeRanges.events,
      add_events: removeDuplicatedRanges(addEvents),
      deduct_events: removeDuplicatedRanges(deductEvents),
      contractData
    }
  } catch (error) {
    console.error('Error applying contract clauses:', error)
    return {
      ...EMPTY_RESPONSE,
      events: filteredEvents,
      contractData: await fetchContractData().catch(() => undefined)
    }
  }
}

/**
 * Get active clauses from the contract
 */
function getActiveContractClauses(events: Event[], contractData: ContractData): {
  activeClauses: ContractClause[]
  updatedEvents: Event[]
} {
  const clauses = contractData?.clauses?.demurrage || []
  const updatedEvents = [...events]
  
  // Filter active clauses
  const activeClauses = clauses
    .filter(clause => clause.isOn)
    .filter(clause => {
      if (!clause.conditionals || clause.conditionals.length === 0) return true
      return processConditionals(clause.conditionals, events, contractData)
    })
  
  return {
    activeClauses,
    updatedEvents
  }
}

/**
 * Process conditionals with AND/OR logic
 */
function processConditionals(conditionals: Conditional[], events: Event[], contractData: ContractData): boolean {
  // Map conditionals with their active state
  const conditionalsWithState = conditionals.map(conditional => ({
    ...conditional,
    isActive: evaluateConditional(conditional, events, contractData)
  }))
  
  // Process conditional relationships (AND/OR logic)
  const conditionalsInOperation = [...conditionalsWithState]
  
  while (conditionalsInOperation.length > 1) {
    const firstConditional = conditionalsInOperation.shift()
    const secondConditional = conditionalsInOperation.shift()
    
    if (firstConditional && secondConditional?.relation) {
      const relationType = secondConditional.relation.type
      let result = false
      
      // Apply logical operations
      if (relationType === 'and') {
        result = firstConditional.isActive && secondConditional.isActive
      } else if (relationType === 'or') {
        result = firstConditional.isActive || secondConditional.isActive
      }
      
      conditionalsInOperation.unshift({
        ...firstConditional,
        isActive: result
      })
    }
  }
  
  // Return final result
  return conditionalsInOperation[0]?.isActive || false
}

/**
 * Evaluate a single conditional
 */
function evaluateConditional(conditional: Conditional, events: Event[], contractData: ContractData): boolean {
  const args = conditional.arguments as Record<string, unknown>
  
  if (conditional.operation === 'if_exists') {
    const eventArg = args.event as { key: string }
    return events.some(event => event.key === eventArg.key)
  }
  
  if (conditional.operation === 'is_event_before') {
    const firstEventArg = args.firstEvent as { key: string }
    const secondEventArg = args.secondEvent as { key: string }
    const modifier = args.secondEventModifier as number
    
    const firstEvent = events.find(event => event.event_code === firstEventArg.key || event.key === firstEventArg.key)
    const secondEvent = events.find(event => event.event_code === secondEventArg.key || event.key === secondEventArg.key)
    
    if (!firstEvent || !secondEvent) return false
    
    // Check if first event is before second event
    const firstDate = new Date(firstEvent.date)
    const secondDate = new Date(secondEvent.date)
    
    // Apply modifier if present
    if (modifier) {
      secondDate.setHours(secondDate.getHours() + modifier)
    }
    
    return firstDate < secondDate
  }
  
  return false
}

/**
 * Resolve clauses to create time ranges
 */
function resolveClauses(events: Event[], activeClauses: ContractClause[]): Array<{
  clause: ContractClause
  startEvent: Event
  endEvent: Event
}> {
  return activeClauses.map(clause => {
    // Find start event
    const startEvent = findEventBySelector(events, clause.startEventSelector)
    // Find end event
    const endEvent = findEventBySelector(events, clause.endEventSelector)
    
    if (startEvent && endEvent) {
      return {
        clause,
        startEvent,
        endEvent
      }
    }
    return null
  }).filter(Boolean) as Array<{
    clause: ContractClause
    startEvent: Event
    endEvent: Event
  }>
}

/**
 * Create laytime ranges
 */
function createLaytimeRanges(events: Event[], resolvedClauses: Array<{
  clause: ContractClause
  startEvent: Event
  endEvent: Event
}>, contractData: ContractData): {
  events: Event[]
  add_events: TimeRange[]
  deduct_events: TimeRange[]
} {
  const addEvents: TimeRange[] = []
  const deductEvents: TimeRange[] = []
  
  // Process each resolved clause
  for (const { clause, startEvent, endEvent } of resolvedClauses) {
    // Create range based on clause effect
    const range: TimeRange = {
      start: startEvent.date,
      end: endEvent.date,
      clauseId: clause.id,
      operation: clause.effect.operation,
      factor: clause.effect.factor,
      rateType: clause.effect.rateType
    }
    
    // Add to appropriate array
    if (clause.effect.operation === 'add') {
      addEvents.push(range)
    } else {
      deductEvents.push(range)
    }
  }
  
  return {
    events,
    add_events: addEvents,
    deduct_events: deductEvents
  }
}

/**
 * Merge events from multiple SOFs (simplified)
 */
function mergeEventsFromMultipleSofs(laytimeRanges: {
  events: Event[]
  add_events: TimeRange[]
  deduct_events: TimeRange[]
}): {
  addEvents: TimeRange[]
  deductEvents: TimeRange[]
} {
  return {
    addEvents: laytimeRanges.add_events,
    deductEvents: laytimeRanges.deduct_events
  }
}

/**
 * Remove duplicated ranges
 */
function removeDuplicatedRanges(ranges: TimeRange[]): TimeRange[] {
  const uniqueRanges = ranges.reduce((acc: {[key: string]: TimeRange}, range) => {
    const key = `${range.start}-${range.end}`
    if (!acc[key]) {
      acc[key] = range
    }
    return acc
  }, {})
  
  return Object.values(uniqueRanges)
} 