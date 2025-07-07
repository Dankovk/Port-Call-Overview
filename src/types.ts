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
  addEvents?: any[]
  deductEvents?: any[]
  parallelOperations?: any[]
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
  sof?: {
    id: string
    isMain?: boolean
  }
}
