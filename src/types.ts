export interface PortCall {
  _id: string
  name: string
  operation: string
  laycan?: {
    startDate?: string
    endDate?: string
  }
  timeAllowedDuration?: {
    days: number
    hours: number
    minutes: number
  }
  timeAllowed?: number
  cargoHandlingRate?: number
  cargoHandlingTimeUnit?: string
  netTime?: number
  cargoes?: Cargo[]
  events?: Event[]
  addEvents?: TimeRange[]
  deductEvents?: TimeRange[]
  parallelOperations?: ParallelOperation[]
  sofs?: Sof[]
  grossTime?: number
}

export interface Cargo {
  id: string
  uuid: string
  name: string
  quantity?: number
  unit?: string
  counterparty?: {
    id: string
    name: string
  }
}

export interface Event {
  id: string
  key: string
  name: string
  date: string
  type: string
  event_code?: string
  sof?: {
    id: string
    name?: string
    isMain?: boolean
  }
  tags?: Tag[]
  comment?: string
  related_id?: string
  sub_category_key?: string
  sub_category_label?: string
  rowType?: string
}

export interface Tag {
  id: string
  name: string
  type: string
}

export interface Terminal {
  id: string
  name: string
}

export interface Berth {
  id: string
  name: string
}

export interface Port {
  id: string
  name: string
}

export interface Sof {
  id: string
  name: string
  isMain?: boolean
  events?: SofEvent[]
}

export interface SofEvent {
  id: string
  line: number
  page: number
  event_string: string
  events: SofEventDetail[]
}

export interface SofEventDetail {
  id: string
  type: string
  end_date: string
  start_date: string
  timestamp: string
  event_label: string
}

export interface SofEventDetailCode {
  id: string
  type: string
  end_date: string
  start_date: string
  timestamp: string
  event_label: string
  event_code: string
}

export interface ListRow {
  id: string
  rowType: string
  date: string | Date
  name?: string
  key?: string
  type?: string
  event_code?: string
  sof?: {
    id: string
    isMain?: boolean
  }
}

export interface ContractResults {
  events: Event[];
  add_events: TimeRange[];
  deduct_events: TimeRange[];
  contractData?: ContractData;
}

export interface ContractData {
  id: string;
  name: string;
  configuration: {
    demurrage: {
      general: {
        rates: DemurrageRate[];
      };
    };
  };
  clauses: {
    demurrage: ContractClause[];
  };
}

export interface DemurrageRate {
  uuid: string;
  rate: number;
  startTime: number;
  endTime: number;
}

export interface ContractClause {
  id: string;
  name: string;
  description: string;
  contractClauseIdentifier: string;
  conditionals: Conditional[];
  startEventSelector: EventSelector;
  endEventSelector: EventSelector;
  isOn: boolean;
  effect: ClauseEffect;
}

export interface Conditional {
  id: string;
  operation: string;
  arguments: Record<string, unknown>;
  relation?: {
    conditionalId: string;
    type: string;
  };
}

export interface EventSelector {
  operation: string;
  arguments: Record<string, unknown>;
}

export interface ClauseEffect {
  type: string;
  operation: string;
  factor: number;
  rateType?: string;
  dontApplyWhenDemurrage: boolean;
}

export interface DemurrageCalculation {
  demurrageMinutes: number;
  demurrageAmount: number;
  addedMinutes: number;
  deductedMinutes: number;
}

export interface TimeRange {
  start: string;
  end: string;
  clauseId: string;
  operation: string;
  factor: number;
  rateType?: string;
}

export enum MaritimeEventCode {
  NOR_TENDERED = 'nor_tendered',
  NOR_ACCEPTED = 'nor_accepted',
  BERTHED = 'berthed',
  UNBERTHED = 'unberthed',
  DISCHARGE_COMMENCED = 'discharge_commenced',
  DISCHARGE_COMPLETED = 'discharge_completed',
  LOAD_COMMENCED = 'load_commenced',
  LOAD_COMPLETED = 'load_completed',
  LOADING_SUSPEND = 'loading_suspend',
  DISCHARGING_SUSPEND = 'discharging_suspend',
  SECURING_GANGWAY_END = 'securing_gangway_end',
  MOORING_VESSEL_END = 'mooring_vessel_end',
  HEAVING_ANCHOR_END = 'heaving_anchor_end',
  DISCONNECTING_HOSES_END = 'disconnecting_hoses_end',
  AWAITING = 'awaiting'
}

export interface EventMapping {
  code: MaritimeEventCode;
  label: string;
}

export interface MaritimeEventCategories {
  notices: MaritimeEventCode[];
  berthing: MaritimeEventCode[];
  cargoOperations: MaritimeEventCode[];
  completion: MaritimeEventCode[];
  weather: MaritimeEventCode[];
}

export interface ParallelOperation {
  id: string
  name: string
  startDate?: string
  endDate?: string
}

export interface RawSofData {
  id: number | string
  name: string
  events: RawSofEventGroup[]
}

export interface RawSofEventGroup {
  id: string
  line: number
  page: number
  event_string: string
  events: RawSofEventDetail[]
}

export interface RawSofEventDetail {
  id: string
  type: string
  end_date: string
  start_date: string
  timestamp: string
  event_label: string
  event_key?: string
  event_code?: string
}
