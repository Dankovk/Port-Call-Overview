import moment from 'moment';
import { mapEventLabelToCode, augmentEventsWithCodes } from '../utils/event-mapper';

// Types
interface Event {
  id: string;
  key: string;
  name: string;
  date: string;
  type: string;
  event_code?: string;
  sub_category_key?: string;
  originalKey?: string;
  sof?: {
    id: string;
    name?: string;
    isMain?: boolean;
  };
}

interface ContractClause {
  id: string;
  name: string;
  description: string;
  contractClauseIdentifier: string;
  conditionals: any[];
  startEventSelector: any;
  endEventSelector: any;
  isOn: boolean;
  effect: {
    type: string;
    operation: string;
    factor: number;
    rateType?: string;
    dontApplyWhenDemurrage: boolean;
  };
}

interface TimeRange {
  start: string;
  end: string;
  clauseId: string;
  operation: string;
  factor: number;
  rateType?: string;
}

interface ContractData {
  id: string;
  name: string;
  configuration: {
    demurrage: {
      general: {
        rates: Array<{
          uuid: string;
          rate: number;
          startTime: number;
          endTime: number;
        }>;
      };
    };
  };
  clauses: {
    demurrage: ContractClause[];
  };
}

let contractDataCache: ContractData | null = null;

// Main function to apply contract clauses - follows the backend pipeline approach
export async function applyContractClauses(events: Event[]): Promise<{
  events: Event[];
  add_events: TimeRange[];
  deduct_events: TimeRange[];
  contractData?: ContractData;
}> {
  // Define empty response
  const EMPTY_RESPONSE = {
    events,
    add_events: [],
    deduct_events: [],
    contractData: undefined
  };

  // Filter out any custom events (same as backend)
  const filteredEvents = events.filter(ev => !ev.key.startsWith('__custom'));
  
  try {
    // Load contract data if not already cached
    if (!contractDataCache) {
      contractDataCache = await fetchContractData();
    }
    
    // Ensure events have event_code set (use key as fallback)
    const eventsWithCodes = filteredEvents.map(event => ({
      ...event,
      key: event.event_code || event.key,
      event_code: event.event_code || event.key
    }));
    
    console.log('Events with codes:', eventsWithCodes.map(e => ({ 
      name: e.name,
      key: e.event_code,
      event_code: e.event_code 
    })));
    
    // Step 1: Check for active conditionals in the clause (similar to backend)
    const { activeClauses, updatedEvents } = getActiveContractClauses(eventsWithCodes, contractDataCache);
    if (!activeClauses?.length) return {
      ...EMPTY_RESPONSE,
      events: filteredEvents,
      contractData: contractDataCache
    };

    
    // Step 2: Resolve clauses to create time ranges
    const resolvedClauses = resolveClauses(updatedEvents, activeClauses);
    if (!resolvedClauses?.length) return {
      ...EMPTY_RESPONSE,
      events: filteredEvents,
      contractData: contractDataCache
    };
    
    // Step 3: Create laytime ranges
    const laytimeRanges = createLaytimeRanges(updatedEvents, resolvedClauses, contractDataCache);
    
    // Step 4: Merge events from multiple SOFs (simplified in our implementation)
    const { addEvents, deductEvents } = mergeEventsFromMultipleSofs(laytimeRanges);
    
    // Step 5: Handle deduction outside add range (simplified)
    const deductEventsRemapped = mapDeductOutsideRange(addEvents, deductEvents, laytimeRanges.events);
    
    return {
      events: laytimeRanges.events,
      add_events: removeDuplicatedRanges(addEvents),
      deduct_events: removeDuplicatedRanges(deductEventsRemapped),
      contractData: contractDataCache
    };
  } catch (error) {
    console.error('Error applying contract clauses:', error);
    return {
      ...EMPTY_RESPONSE,
      events: filteredEvents,
      contractData: contractDataCache || undefined
    };
  }
}

// Fetch contract data from the server
async function fetchContractData(): Promise<ContractData> {
  try {
    const response = await fetch('/contract.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch contract data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching contract data:', error);
    // Return a minimal default contract
    return {
      id: "default",
      name: "Default Contract",
      configuration: {
        demurrage: {
          general: {
            rates: [{
              uuid: "default",
              rate: 24000,
              startTime: 0,
              endTime: 0
            }]
          }
        }
      },
      clauses: {
        demurrage: []
      }
    };
  }
}

// Fetch SOF data and augment with event codes
export async function fetchSofData(): Promise<any> {
  try {
    const response = await fetch('/sof.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch SOF data: ${response.status}`);
    }
    
    const sofData = await response.json();
    
    // Augment events with event codes
    if (sofData.events && Array.isArray(sofData.events)) {
      // Process each event group
      sofData.events = sofData.events.map((eventGroup: any) => {
        if (eventGroup.events && Array.isArray(eventGroup.events)) {
          // Augment each event in the group with its event_code
          eventGroup.events = augmentEventsWithCodes(eventGroup.events);
        }
        return eventGroup;
      });
    }
    
    return sofData;
  } catch (error) {
    console.error('Error fetching SOF data:', error);
    return null;
  }
}

// Get active clauses from the contract - more aligned with backend implementation
function getActiveContractClauses(events: Event[], contractData: ContractData): {
  activeClauses: ContractClause[];
  updatedEvents: Event[];
} {
  const clauses = contractData?.clauses?.demurrage || [];
  const updatedEvents = [...events];
  
  // Process conditionals similar to backend
  const processConditionals = (conditionals: any[], clause: ContractClause): boolean => {
    // Map conditionals with their active state
    const conditionalsWithState = conditionals.map(conditional => ({
      ...conditional,
      isActive: evaluateConditional(conditional, events, contractData)
    }));
    
    // Process conditional relationships (AND/OR logic)
    const conditionalsInOperation = [...conditionalsWithState];
    
    while (conditionalsInOperation.length > 1) {
      const firstConditional = conditionalsInOperation.shift();
      const secondConditional = conditionalsInOperation.shift();
      
      if (firstConditional && secondConditional?.relation) {
        const relationType = secondConditional.relation.type;
        let result = false;
        
        // Apply logical operations
        if (relationType === 'and') {
          result = firstConditional.isActive && secondConditional.isActive;
        } else if (relationType === 'or') {
          result = firstConditional.isActive || secondConditional.isActive;
        }
        
        conditionalsInOperation.unshift({
          ...firstConditional,
          isActive: result
        });
      }
    }
    
    // Return final result
    return conditionalsInOperation[0]?.isActive || false;
  };
  
  // Evaluate a single conditional
  function evaluateConditional(conditional: any, events: Event[], contractData: ContractData): boolean {
    if (conditional.operation === 'if_exists') {
      const eventKey = conditional.arguments.event.key;
      return events.some(event => event.key === eventKey);
    }
    
    if (conditional.operation === 'is_event_before') {
      const firstEventKey = conditional.arguments.firstEvent.key;
      const secondEventKey = conditional.arguments.secondEvent.key;
      
      const firstEvent = events.find(event => event.event_code === firstEventKey || event.key === firstEventKey);
      const secondEvent = events.find(event => event.event_code === secondEventKey || event.key === secondEventKey);
      
      if (!firstEvent || !secondEvent) return false;
      
      // Check if first event is before second event
      const firstDate = new Date(firstEvent.date);
      const secondDate = new Date(secondEvent.date);
      
      // Apply modifier if present
      if (conditional.arguments.secondEventModifier) {
        secondDate.setHours(secondDate.getHours() + conditional.arguments.secondEventModifier);
      }
      
      return firstDate < secondDate;
    }
    
    if (conditional.operation === 'is_event_not_during_work_hours') {
      // Simplified implementation - in real backend this would check against work schedule
      const eventKey = conditional.arguments.event.key;
      const event = events.find(e => e.event_code === eventKey || e.key === eventKey);
      if (!event) return false;
      
      // For simplicity, we'll consider work hours 8am-5pm
      const eventDate = new Date(event.date);
      const hour = eventDate.getHours();
      return hour < 8 || hour >= 17;
    }
    
    return false;
  }
  
  // Filter active clauses
  const activeClauses = clauses
    .filter(clause => clause.isOn)
    .filter(clause => {
      if (!clause.conditionals || clause.conditionals.length === 0) return true;
      return processConditionals(clause.conditionals, clause);
    });
  
  return {
    activeClauses,
    updatedEvents
  };
}

// Resolve clauses to create time ranges
function resolveClausesToTimeRanges(events: Event[], clauses: ContractClause[]): TimeRange[] {
  const timeRanges: TimeRange[] = [];
  
  clauses.forEach(clause => {
    // Find start event
    const startEvent = findEventBySelector(events, clause.startEventSelector);
    // Find end event
    const endEvent = findEventBySelector(events, clause.endEventSelector);
    
    if (startEvent && endEvent) {
      timeRanges.push({
        start: startEvent.date,
        end: endEvent.date,
        clauseId: clause.id,
        operation: clause.effect.operation,
        factor: clause.effect.factor,
        rateType: clause.effect.rateType
      });
    }
  });
  
  return timeRanges;
}


// Apply date modifier - similar to backend implementation
function applyDateModifier(modifier: number, date: string): string {
  const operation = modifier >= 0 ? 'add' : 'subtract';
  return moment(date)
    [operation](Math.abs(modifier), 'hours')
    .format('YYYY-MM-DDTHH:mm:ss');
}

// Find an event based on a selector - more aligned with backend
function findEventBySelector(events: Event[], selector: any): Event | null {
  if (!selector) return null;
  
  if (selector.operation === 'single_event') {
    const eventKey = selector.arguments.event.key;
    // Look for exact match or partial match (for sub_category_key)
    
    const event = findEvent(events, selector.arguments.event);
    
    if (!event) {
      return null;
    }
    
    // Apply modifier if present
    if (selector.arguments.modifier) {
      const modifiedDate = applyDateModifier(selector.arguments.modifier, event.date);
      return {
        ...event,
        date: modifiedDate
      };
    }
    
    return event;
  }
  
// Find event utility function - similar to backend
function findEvent(events: Event[], eventSelector: any): Event | undefined {
  // First try to match by event_code
  const codeMatch = events.find(
    ({ event_code, type, sof }) => 
      event_code === eventSelector?.key 
  );
  
  if (codeMatch) return codeMatch;
  
  // Fall back to key match if no event_code match found
  return events.find(
    ({ key, type, sof }) => 
      key === eventSelector?.key && 
      (!type || type === eventSelector?.type) && 
      (!eventSelector.sub_category_key || key.includes(eventSelector.sub_category_key))
  );
}

  if (selector.operation === 'first_instance_of_event') {
    const eventKeys = selector.arguments.events.map((e: any) => e.key);
    
    // Find all events that match any of the selectors
    const matchingEvents = events.filter(e => {
      // Check for direct key match
      if (eventKeys.includes(e.key)) return true;
      
      // Check for partial matches with sub_category_key
      for (const selectorEvent of selector.arguments.events) {
        if (selectorEvent.sub_category_key && e.key.includes(selectorEvent.sub_category_key)) {
          return true;
        }
      }
      
      return false;
    });
    
    if (!matchingEvents.length) {
      console.log(`No matching events found for first_instance_of_event with keys: ${eventKeys.join(', ')}`);
      return null;
    }
    
    // Sort by date and return the first one
    return matchingEvents.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
  }
  
  if (selector.operation === 'last_instance_of_event') {
    const eventKeys = selector.arguments.events.map((e: any) => e.key);
    
    // Find all events that match any of the keys
    const matchingEvents = events.filter(e => {
      // Check for direct key match
      if (eventKeys.includes(e.key)) return true;
      
      // Check for partial matches with sub_category_key
      for (const selectorEvent of selector.arguments.events) {
        if (selectorEvent.sub_category_key && e.key.includes(selectorEvent.sub_category_key)) {
          return true;
        }
      }
      
      return false;
    });
    
    if (!matchingEvents.length) {
      console.log(`No matching events found for last_instance_of_event with keys: ${eventKeys.join(', ')}`);
      return null;
    }
    
    // Sort by date and return the last one
    return matchingEvents.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }
  
  return null;
}

// Resolve clauses to create time ranges - more aligned with backend
function resolveClauses(events: Event[], activeClauses: ContractClause[]): any[] {
  return activeClauses.map(clause => {
    // Find start event
    const startEvent = findEventBySelector(events, clause.startEventSelector);
    // Find end event
    const endEvent = findEventBySelector(events, clause.endEventSelector);
    
    if (startEvent && endEvent) {
      return {
        clause,
        startEvent,
        endEvent
      };
    }
    return null;
  }).filter(Boolean);
}

// Create laytime ranges - simplified version of backend implementation
function createLaytimeRanges(events: Event[], resolvedClauses: any[], contractData: ContractData): {
  events: Event[];
  add_events: TimeRange[];
  deduct_events: TimeRange[];
} {
  const addEvents: TimeRange[] = [];
  const deductEvents: TimeRange[] = [];
  
  // Process each resolved clause
  resolvedClauses.forEach(({ clause, startEvent, endEvent }) => {
    // Create range based on clause effect
    const range: TimeRange = {
      start: startEvent.date,
      end: endEvent.date,
      clauseId: clause.id,
      operation: clause.effect.operation,
      factor: clause.effect.factor,
      rateType: clause.effect.rateType
    };
    
    // Add to appropriate array
    if (clause.effect.operation === 'add') {
      addEvents.push(range);
    } else {
      deductEvents.push(range);
    }
  });
  
  return {
    events,
    add_events: addEvents,
    deduct_events: deductEvents
  };
}

// Merge events from multiple SOFs - simplified version
function mergeEventsFromMultipleSofs(laytimeRanges: {
  events: Event[];
  add_events: TimeRange[];
  deduct_events: TimeRange[];
}): {
  addEvents: TimeRange[];
  deductEvents: TimeRange[];
} {
  // In our simplified implementation, we just pass through the events
  return {
    addEvents: laytimeRanges.add_events,
    deductEvents: laytimeRanges.deduct_events
  };
}

// Map deduct outside range - simplified version
function mapDeductOutsideRange(
  addEvents: TimeRange[],
  deductEvents: TimeRange[],
  events: Event[]
): TimeRange[] {
  // For simplicity, we'll just return the deduct events
  // In a real implementation, this would handle deduct events that fall outside add ranges
  return deductEvents;
}

// Split time ranges into add and deduct events
function splitTimeRangesByOperation(timeRanges: TimeRange[]) {
  const addEvents = timeRanges.filter(range => range.operation === 'add');
  const deductEvents = timeRanges.filter(range => range.operation === 'deduct');
  
  return { addEvents, deductEvents };
}

// Remove duplicated ranges - similar to backend implementation
function removeDuplicatedRanges(ranges: TimeRange[]): TimeRange[] {
  // Use a unique key based on start and end
  const uniqueRanges = ranges.reduce((acc: {[key: string]: TimeRange}, range) => {
    const key = `${range.start}-${range.end}`;
    if (!acc[key]) {
      acc[key] = range;
    }
    return acc;
  }, {});
  
  return Object.values(uniqueRanges);
}

// Calculate time in minutes between two dates
export function calculateTimeInMinutes(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Return difference in minutes
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

// Create mock events for testing if real events are missing
export function createMockEvents(): Event[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return [
    {
      id: 'mock-nor-tendered',
      key: 'nor_tendered',
      name: 'NOR Tendered',
      event_code: 'nor_tendered',
      date: yesterday.toISOString(),
      type: 'timestamp'
    },
    {
      id: 'mock-berthed',
      key: 'berthed',
      name: 'Vessel Berthed',
      event_code: 'berthed',
      date: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      type: 'timestamp'
    },
    {
      id: 'mock-discharge-commenced',
      key: 'discharge_commenced',
      name: 'Discharge Commenced',
      event_code: 'discharge_commenced',
      date: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      type: 'timestamp'
    },
    {
      id: 'mock-weather-start',
      key: 'awaiting',
      name: 'Awaiting Weather',
      event_code: 'awaiting',
      date: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000).toISOString(),
      type: 'duration_start',
      sub_category_key: 'weather'
    },
    {
      id: 'mock-weather-end',
      key: 'awaiting',
      name: 'Awaiting Weather End',
      event_code: 'awaiting',
      date: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000).toISOString(),
      type: 'duration_end',
      sub_category_key: 'weather'
    },
    {
      id: 'mock-discharge-completed',
      key: 'discharge_completed',
      name: 'Discharge Completed',
      event_code: 'discharge_completed',
      date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'timestamp'
    },
    {
      id: 'mock-disconnecting-hoses',
      key: 'disconnecting_hoses_end',
      name: 'Disconnecting Hoses',
      event_code: 'disconnecting_hoses_end',
      date: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'timestamp'
    },
    {
      id: 'mock-unberthed',
      key: 'unberthed',
      name: 'Vessel Unberthed',
      event_code: 'unberthed',
      date: now.toISOString(),
      type: 'timestamp'
    }
  ];
}

// Calculate demurrage based on contract and time ranges
export async function calculateDemurrage(
  timeUsed: number, 
  timeAllowed: number, 
  addEvents: TimeRange[], 
  deductEvents: TimeRange[]
): Promise<{
  demurrageMinutes: number;
  demurrageAmount: number;
  addedMinutes: number;
  deductedMinutes: number;
}> {
  // Load contract data if not already cached
  if (!contractDataCache) {
    contractDataCache = await fetchContractData();
  }
  // Calculate total minutes from add events
  const addedMinutes = addEvents.reduce((total, event) => {
    const minutes = calculateTimeInMinutes(event.start, event.end);
    const factor = event.factor / 100; // Convert percentage to decimal
    return total + (minutes * factor);
  }, 0);
  
  // Calculate total minutes from deduct events
  const deductedMinutes = deductEvents.reduce((total, event) => {
    const minutes = calculateTimeInMinutes(event.start, event.end);
    const factor = event.factor / 100; // Convert percentage to decimal
    return total + (minutes * factor);
  }, 0);
  
  // Calculate net time used (in minutes)
  const netTimeUsed = timeUsed + addedMinutes - deductedMinutes;
  
  // Convert time allowed to minutes (assuming it's in days)
  const timeAllowedMinutes = timeAllowed * 24 * 60;
  
  // Calculate demurrage minutes
  const demurrageMinutes = Math.max(0, netTimeUsed - timeAllowedMinutes);
  
  // Calculate demurrage amount based on rate
  const demurrageRate = contractDataCache.configuration.demurrage.general.rates[0].rate || 0;
  const demurrageAmount = (demurrageMinutes / (24 * 60)) * demurrageRate;
  
  return {
    demurrageMinutes,
    demurrageAmount,
    addedMinutes,
    deductedMinutes
  };
}
