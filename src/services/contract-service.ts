// Backwards compatibility wrapper for the refactored services
export { applyContractClauses } from './laytime/clause-processor'
export { calculateDemurrage } from './laytime/demurrage-calculator' 
export { fetchSofData } from './api/sof-api'

import type { Event } from '../types'

/**
 * Creates mock events for testing when SOF data is not available
 */
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
