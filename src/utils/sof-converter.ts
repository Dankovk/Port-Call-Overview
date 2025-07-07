import { PortCall, Event, Sof, SofEvent, SofEventDetail } from '../types'
import moment from 'moment'

export function createPortCallFromSof(sofData: any) {
  // Extract events from SOF
  const events = sofData.events
    .flatMap((event: SofEvent) => event.events.map((e: SofEventDetail) => ({
      id: e.id,
      key: getEventKey(e.event_label),
      name: e.event_label,
      date: e.timestamp,
      type: e.type === 'timestamp_event' ? 'timestamp' : 'duration',
      sof: {
        id: sofData.id.toString(),
        name: sofData.name,
        isMain: true
      }
    })))
    .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine operation type based on events
  const isLoading = events.some((e: Event) => e.key === 'load_commenced' || e.key.includes('load'));
  const operation = isLoading ? 'load' : 'discharge';

  // Create a simplified port call object
  return {
    portCall: {
      _id: 'pc-' + sofData.id,
      name: 'Port Call from ' + sofData.name,
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

function getEventKey(label: string): string {
  label = label.toLowerCase();
  if (label.includes('nor') && label.includes('tender')) return 'nor_tendered';
  if (label.includes('nor') && label.includes('accept')) return 'nor_accepted';
  if (label.includes('berth') || label.includes('all fast')) return 'berthed';
  if (label.includes('unberthed') || label.includes('last line')) return 'unberthed';
  if (label.includes('discharge') && label.includes('commence')) return 'discharge_commenced';
  if (label.includes('discharge') && label.includes('complet')) return 'discharge_completed';
  if (label.includes('load') && label.includes('commence')) return 'load_commenced';
  if (label.includes('load') && label.includes('complet')) return 'load_completed';
  
  // Default key based on label
  return label.toLowerCase().replace(/\s+/g, '_');
}

function getFirstDate(events: Event[], dayOffset = 0): string | undefined {
  if (!events || events.length === 0) return undefined;
  const firstDate = moment(events[0].date);
  firstDate.add(dayOffset, 'days');
  return firstDate.toISOString();
}

function calculateNetTime(events: Event[]): number {
  // Find key events
  const norAccepted = events.find(e => e.key === 'nor_accepted');
  const completion = events.find(e => 
    e.key === 'discharge_completed' || 
    e.key === 'load_completed' || 
    e.key === 'unberthed'
  );
  
  if (norAccepted && completion) {
    const startTime = moment(norAccepted.date);
    const endTime = moment(completion.date);
    const diffMinutes = endTime.diff(startTime, 'minutes');
    return diffMinutes;
  }
  
  return 0;
}
