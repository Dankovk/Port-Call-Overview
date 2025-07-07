<template>
  <div class="port-call-container">
    <!-- Port Call Summary Panel -->
    <div class="port-call-summary">
      <DsColumn
        :no-padding="true"
        size="12"
        class="actions-column-wrapper">
      </DsColumn>
      
      <!-- Time Information Panel -->
      <div class="time-info-panel">
        <div class="info-card">
          <DsText
            size="sm"
            color="marine4"
            data-testid="port-call-used-label"
            class="info-label">
            <b>Time used</b>
          </DsText>
          <DsText
            v-ds-tooltip="portCallNetTimeTooltip"
            class="info-value"
            size="md"
            color="marine4"
            data-testid="port-call-nettime-value">
            {{ portCallNetTimeValue | emptyString }}
          </DsText>
        </div>
        
        <div class="info-card">
          <DsText
            size="sm"
            color="marine4"
            data-testid="port-call-laytime-allowed-label"
            class="info-label">
            <b>Time allowed</b>
          </DsText>
          <DsText
            v-ds-tooltip="timeAllowedTooltip"
            class="info-value"
            size="md"
            color="marine4"
            data-testid="port-call-laytime-allowed-value">
            {{ timeAllowed | emptyString }}
          </DsText>
        </div>
        
        <div class="info-card">
          <DsText
            size="sm"
            color="marine4"
            data-testid="port-call-laycan-label"
            class="info-label">
            <b>Laycan</b>
          </DsText>
          <DsText
            v-ds-tooltip="laycanTooltip"
            class="info-value"
            size="md"
            color="marine4"
            data-testid="port-call-laycan-value">
            {{ laycan | emptyString }}
          </DsText>
        </div>
        
        <div class="info-card">
          <DsText
            size="sm"
            color="marine4"
            data-testid="port-call-contract-clause-label"
            class="info-label">
            <b>Contract</b>
          </DsText>
          <DsText
            v-ds-tooltip="contractClauseTooltip"
            class="info-value"
            size="md"
            color="marine4"
            data-testid="port-call-contract-clause-value">
            {{ contractClauseLabel | emptyString }}
          </DsText>
        </div>
      </div>
    </div>
    <cargo-details-panel
      v-if="shouldShowCalculator"
      :port-call="dynamicPortCall" />
      
    <contract-clauses-panel
      v-if="shouldShowCalculator && contractResults"
      :contract-results="contractResults"
      :demurrage-calculation="demurrageCalculation" />
      
    <calculator
      v-if="shouldShowCalculator"
      data-testid="port-call-calculator"
      :dynamic-port-call="dynamicPortCall"
      :list-rows="listRows"
      :selected-sof="selectedSof" />
    <div v-else class="empty-bg" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import moment from 'moment'
import { PortCall, Terminal, Berth, Port, Sof, Cargo, ListRow } from '../types'
import Calculator from './Calculator.vue'
import CargoDetailsPanel from './CargoDetailsPanel.vue'
import ContractClausesPanel from './ContractClausesPanel.vue'
import { applyContractClauses, calculateDemurrage, fetchSofData } from '../services/contract-service'
import { mapEventLabelToCode } from '../utils/event-mapper'

@Component({
  components: {
    Calculator,
    CargoDetailsPanel,
    ContractClausesPanel
  }
})
export default class PortCallContainer extends Vue {
  @Prop() readonly portCall!: PortCall | null
  @Prop() readonly terminal!: Terminal | null
  @Prop() readonly berth!: Berth | null
  @Prop() readonly port!: Port | null
  @Prop() readonly selectedSof!: Sof | null
  @Prop({ default: () => [] }) readonly sofs!: Sof[]

  dynamicPortCall: PortCall | null = null
  listRows: ListRow[] = []
  totalAddTime: number | null = null
  totalDeductTime: number | null = null
  contractResults: any = null
  demurrageCalculation: any = null

  @Watch('portCall', { immediate: true })
  onPortCallChange(newPortCall: PortCall | null) {
    if (newPortCall) {
      this.dynamicPortCall = { ...newPortCall }
      this.loadEventList()
      this.applyContract()
    }
  }
  
  async applyContract() {
    if (!this.dynamicPortCall) return
    
    try {
      // Ensure we have events to work with
        // Try to fetch SOF data first
        console.log('No events found, trying to fetch SOF data')
        const sofData = await fetchSofData()
        
        if (sofData && sofData.events) {
          // Extract events from SOF data
          const sofEvents = sofData.events.flatMap((eventGroup: any) => 
            eventGroup.events.map((event: any) => ({
              id: event.id,
              key: event.event_code || event.event_key,
              name: event.event_label,
              date: event.timestamp,
              type: event.type,
              event_code: event.event_code,
              sub_category_key: event.sub_category_key
            }))
          )
          
          if (sofEvents.length > 0) {
            console.log('Using events from SOF data')
            // Make sure each event has an event_code
            const eventsWithCodes = sofEvents.map((event: ({name:string, key:string, event_code:string}) ) => {
              if (!event.event_code) {
                const code = mapEventLabelToCode(event.name);
                return {
                  ...event,
                  event_code: code || event.key
                };
              }
              return event;
            });
            this.dynamicPortCall.events = eventsWithCodes
            await this.processContractWithEvents()
            return
          }
        }
        
        // If no SOF data, fall back to mock events
        console.log('No SOF data found, creating mock events')
        const contractService = await import('../services/contract-service')
        this.dynamicPortCall.events = contractService.createMockEvents()
        await this.processContractWithEvents()
    } catch (error) {
      console.error('Error applying contract:', error)
    }
  }
  
  async processContractWithEvents() {
    if (!this.dynamicPortCall?.events) return

    
    // Apply contract clauses to events
    this.contractResults = await applyContractClauses(this.dynamicPortCall.events)
    console.log("results from contract", this.contractResults);
    
    // Calculate demurrage if we have the necessary data
    if (this.portCallInDaysInDecimal !== null && this.timeAllowedInDaysInDecimal !== null) {
      this.demurrageCalculation = await calculateDemurrage(
        this.dynamicPortCall.netTime || 0, // Time used in minutes
        this.timeAllowedInDaysInDecimal * 24 * 60, // Time allowed in minutes
        this.contractResults.add_events,
        this.contractResults.deduct_events
      )
      
      // Update total add/deduct time
      this.totalAddTime = this.demurrageCalculation.addedMinutes / 1440 // Convert to days
      this.totalDeductTime = this.demurrageCalculation.deductedMinutes / 1440 // Convert to days
    }
  }

  get shouldShowCalculator(): boolean {
    return !!this.dynamicPortCall
  }

  get laycan(): string | null {
    const portCallLaycan = this.dynamicPortCall?.laycan
    
    if (!portCallLaycan?.startDate && !portCallLaycan?.endDate) {
      return null
    }

    const startDate = portCallLaycan?.startDate
      ? moment(portCallLaycan?.startDate).format('DD MMM')
      : 'Date TBD'
    const endDate = portCallLaycan?.endDate
      ? moment(portCallLaycan?.endDate).format('DD MMM')
      : 'Date TBD'
    return `${startDate} to ${endDate}`
  }

  get timeAllowedInDaysInDecimal(): number | null {
    if (!this.dynamicPortCall) {
      return null
    }

    const allowedDuration = this.dynamicPortCall?.timeAllowedDuration
    const allowedDurationDays = allowedDuration
      ? this.getTotal(allowedDuration) : this.dynamicPortCall?.timeAllowed

    return allowedDurationDays || null
  }

  get timeAllowed(): string | null {
    if (!this.timeAllowedInDaysInDecimal) {
      return null
    }

    const humanFriendlyTime = this.toDuration(this.timeAllowedInDaysInDecimal)
    return humanFriendlyTime
  }

  get timeAllowedTooltip(): string {
    if (!this.timeAllowed) {
      return ''
    }

    const tooltip = this.getFormattedTimeTooltip(this.timeAllowedInDaysInDecimal)
    return tooltip
  }

  get operation(): string | undefined {
    return this.dynamicPortCall?.operation
  }

  get cargoHandlingRate(): number | undefined {
    return this.dynamicPortCall?.cargoHandlingRate
  }

  get laycanTooltip(): string {
    return this.laycan || ''
  }

  get contractClauseTooltip(): string {
    return this.contractClauseLabel || ''
  }

  get cargoesInOperationTooltip(): string {
    return this.formattedCargoesInOperation || ''
  }

  get cargoHandlingRateTooltip(): string {
    return this.cargoHandlingRate?.toString() || ''
  }

  get formattedCargoesInOperation(): string | null {
    if (!this.portCallCargoes?.length) return null
    const cargoNames = this.portCallCargoes.map(({ name }) => name)
    return [...new Set(cargoNames)].join(', ')
  }

  get contractClauseLabel(): string {
    return 'ASBATANKVOY 2012 Contract'
  }

  get operationTypeLabel(): string {
    const operationMap: { [key: string]: string } = {
      'discharge': 'Discharge',
      'load': 'Load'
    }
    return operationMap[this.dynamicPortCall?.operation || ''] || ''
  }

  get portCallCargoes(): Cargo[] | undefined {
    return this.dynamicPortCall?.cargoes
  }

  get rateTimeUnit(): string {
    return this.dynamicPortCall?.cargoHandlingTimeUnit || 'day'
  }

  get rateLabel(): string {
    return this.rateTimeUnit === 'day' ? 'Rate/day' : 'Rate/hour'
  }

  get portCallInDaysInDecimal(): number | null {
    return this.dynamicPortCall?.netTime ? this.dynamicPortCall?.netTime / 1440 : null
  }

  get portCallNetTime(): string | null {
    if (!this.portCallInDaysInDecimal) {
      return null
    }

    const humanFriendlyTime = this.toDuration(this.portCallInDaysInDecimal)
    return humanFriendlyTime
  }

  get portCallNetTimeValue(): string {
    if (!this.portCallNetTime) return ''

    const isNegative = this.dynamicPortCall?.netTime ? this.dynamicPortCall.netTime < 0 : false
    const negativeSign = isNegative ? '-' : ''

    return `${negativeSign}${this.portCallNetTime}`
  }

  get portCallNetTimeTooltip(): string {
    if (!this.portCallNetTime) {
      return ''
    }

    const tooltip = this.getFormattedTimeTooltip(this.portCallInDaysInDecimal)
    return tooltip
  }

  getTotal(duration: { days: number, hours: number, minutes: number }): number {
    return duration.days + (duration.hours / 24) + (duration.minutes / 1440)
  }

  toDuration(days: number | null): string | null {
    if (!days) return null
    
    const totalMinutes = Math.abs(days * 1440)
    const d = Math.floor(totalMinutes / 1440)
    const h = Math.floor((totalMinutes % 1440) / 60)
    const m = Math.floor(totalMinutes % 60)
    
    let result = ''
    if (d > 0) result += `${d}d `
    if (h > 0 || d > 0) result += `${h}h `
    result += `${m}m`
    
    return result.trim()
  }

  getFormattedTimeTooltip(days: number | null): string {
    if (!days) return ''
    
    const totalMinutes = Math.abs(days * 1440)
    const d = Math.floor(totalMinutes / 1440)
    const h = Math.floor((totalMinutes % 1440) / 60)
    const m = Math.floor(totalMinutes % 60)
    
    let parts = []
    if (d > 0) parts.push(`${d} day${d !== 1 ? 's' : ''}`)
    if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`)
    if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`)
    
    return parts.join(', ')
  }

  loadEventList(): void {
    if (!this.dynamicPortCall?.events) return
    
    const events = this.dynamicPortCall.events.map(event => ({
      ...event,
      rowType: 'event',
    }))
    
    // Sort events by date
    const sortedEvents = events.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    // Group events by date
    const eventsByDate: { [key: string]: any[] } = {}
    sortedEvents.forEach(event => {
      const date = moment(event.date).format('YYYY-MM-DD')
      if (!eventsByDate[date]) {
        eventsByDate[date] = []
      }
      eventsByDate[date].push(event)
    })
    
    // Create list rows with date headers
    const listRows: ListRow[] = []
    Object.entries(eventsByDate).forEach(([date, dateEvents]) => {
      listRows.push({
        id: `date_header_${date}`,
        rowType: 'dateHeader',
        date: new Date(date),
      })
      listRows.push(...dateEvents)
    })
    
    this.listRows = listRows
  }
}
</script>

<style scoped>
.port-call-container {
  height: 100%;
}
.empty-bg {
  background-color: #f2f2f2;
  width: 100%;
  height: 100vh;
}
.port-call-summary {
  background-color: #ffffff;
  border-bottom: 1px solid #eaeaea;
  padding: 16px;
}
.time-info-panel {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16px;
  gap: 24px;
}
.info-card {
  flex: 1;
  min-width: 150px;
  max-width: 250px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.info-label {
  margin-bottom: 8px;
  display: block;
}
.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.actions-column-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
}
</style>
