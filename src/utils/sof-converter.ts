import type { PortCall, Event, Sof, SofEvent, SofEventDetail } from '../types'
import moment from 'moment'
import { augmentEvent } from './event-processor'

export function createPortCallFromSof(sofData: {
  id: number | string
  name: string
  events: SofEvent[]
}) {
  // Extract events from SOF using centralized processing
  const events = sofData.events
    .flatMap((event: SofEvent) => event.events.map((e: SofEventDetail) => {
      // Create basic event structure and let centralized processor handle the mapping
      const baseEvent = {
        id: e.id,
        key: e.event_label.toLowerCase().replace(/\s+/g, '_'),
        name: e.event_label,
        date: e.timestamp,
        type: e.type === 'timestamp_event' ? 'timestamp' : 'duration',
        sof: {
          id: sofData.id.toString(),
          name: sofData.name,
          isMain: true
        }
      } as Event
      
      // Use centralized event processing for proper code assignment and label cleaning
      return augmentEvent(baseEvent)
    }))
    .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine operation type based on events
  const isLoading = events.some((e: Event) => e.key === 'load_commenced' || e.key.includes('load'));
  const operation = isLoading ? 'load' : 'discharge';

  // Create a simplified port call object
  return {
    portCall: {
      _id: `pc-${sofData.id}`,
      name: `Port Call from ${sofData.name}`,
      operation: operation,
      laycan: {
        startDate: getFirstDate(events, -2),
        endDate: getFirstDate(events, 2)
      },
      timeAllowedDuration: {
        days: 2,
        hours: 0,
        minutes: 0
      },
      cargoHandlingRate: 5000,
      cargoHandlingTimeUnit: 'day',
      netTime: calculateNetTime(events),
      cargoes: [{
        id: 'cargo-1',
        uuid: 'cargo-1',
        name: 'UMS',
        quantity: 25000,
        unit: 'MT'
      }],
      events: events,
      sofs: [{
        id: sofData.id.toString(),
        name: sofData.name,
        isMain: true
      }],
      addEvents: [],
      deductEvents: [],
      parallelOperations: []
    },
    terminal: {
      id: 'term-1',
      name: 'Terminal'
    },
    berth: {
      id: 'berth-1',
      name: 'Berth'
    },
    port: {
      id: 'port-1',
      name: 'Port'
    }
  };
}

function getFirstDate(events: Event[], dayOffset = 0): string | undefined {
  if (!events || events.length === 0) return undefined;
  const firstDate = moment(events[0].date);
  firstDate.add(dayOffset, 'days');
  return firstDate.toISOString();
}

function calculateNetTime(events: Event[]): number {
  // Find key events - use more flexible approach
  const norEvent = events.find(e => 
    e.key === 'nor_accepted' || e.key === 'nor_tendered'
  );
  
  const completion = events.find(e => 
    e.key === 'discharge_completed' || 
    e.key === 'load_completed' ||
    e.key === 'calculate_cargo_complete' ||
    e.key === 'prepare_documents_complete'
  );
  
  if (norEvent && completion) {
    const startTime = moment(norEvent.date);
    const endTime = moment(completion.date);
    const diffMinutes = endTime.diff(startTime, 'minutes');
    console.log(`Net time calculation: ${norEvent.name} (${norEvent.date}) to ${completion.name} (${completion.date}) = ${diffMinutes} minutes`);
    return Math.max(0, diffMinutes); // Ensure non-negative
  }
  
  // Fallback: if no clear start/end, estimate based on timeline
  if (events.length >= 2) {
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const diffMinutes = moment(lastEvent.date).diff(moment(firstEvent.date), 'minutes');
    console.log(`Fallback net time: ${firstEvent.name} to ${lastEvent.name} = ${diffMinutes} minutes`);
    return Math.max(0, diffMinutes);
  }
  
  console.log('No valid events found for net time calculation');
  return 0;
}
