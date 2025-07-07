<template>
  <div class="port-call-dashboard">
    <!-- Overview Cards Section -->
    <section class="overview-section">
      <div class="overview-grid">
        <!-- Time Performance Card -->
        <div class="metric-card time-performance">
          <div class="card-header">
            <div class="card-icon">⏱️</div>
            <h3>Time Performance</h3>
          </div>
          <div class="card-content">
            <div class="primary-metric">
              <span class="metric-value">{{ portCallNetTimeValue || '—' }}</span>
              <span class="metric-label">Time Used</span>
            </div>
            <div class="secondary-metric">
              <span class="metric-value">{{ timeAllowed || '—' }}</span>
              <span class="metric-label">Time Allowed</span>
            </div>
            <div class="progress-section">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: timeProgressPercentage + '%' }"></div>
              </div>
              <span class="progress-text">{{ timeProgressPercentage }}% utilized</span>
            </div>
          </div>
        </div>

        <!-- Schedule Card -->
        <div class="metric-card schedule-info">
          <div class="card-header">
            <div class="card-icon">📅</div>
            <h3>Schedule</h3>
          </div>
          <div class="card-content">
            <div class="schedule-item">
              <span class="schedule-label">Laycan</span>
              <span class="schedule-value">{{ laycan || '—' }}</span>
            </div>
            <div class="schedule-item">
              <span class="schedule-label">Contract</span>
              <span class="schedule-value">{{ contractClauseLabel || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Financial Impact Card -->
        <div class="metric-card financial-impact" v-if="portCallStore.demurrageCalculation">
          <div class="card-header">
            <div class="card-icon">💰</div>
            <h3>Financial Impact</h3>
          </div>
          <div class="card-content">
            <div class="primary-metric">
              <span class="metric-value financial" :class="{ 'negative': portCallStore.demurrageCalculation.demurrageAmount > 0 }">
                ${{ formatCurrency(portCallStore.demurrageCalculation.demurrageAmount) }}
              </span>
              <span class="metric-label">{{ portCallStore.demurrageCalculation.demurrageAmount > 0 ? 'Demurrage' : 'Dispatch' }}</span>
            </div>
            <div class="financial-breakdown">
              <div class="breakdown-item positive">
                <span>+{{ formatDuration(portCallStore.demurrageCalculation.addedMinutes) }}</span>
                <small>Added Time</small>
              </div>
              <div class="breakdown-item negative">
                <span>-{{ formatDuration(portCallStore.demurrageCalculation.deductedMinutes) }}</span>
                <small>Deducted Time</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Card -->
        <div class="metric-card status-card">
          <div class="card-header">
            <div class="card-icon">📊</div>
            <h3>Current Status</h3>
          </div>
          <div class="card-content">
            <div class="status-indicator-large" :class="currentStatusClass">
              <div class="status-dot"></div>
              <span class="status-text">{{ currentStatusText }}</span>
            </div>
            <div class="status-details">
              <div class="detail-item">
                <span class="detail-label">Operation</span>
                <span class="detail-value">{{ operationTypeLabel || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Rate</span>
                <span class="detail-value">{{ cargoHandlingRate || '—' }} {{ rateLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Details Section -->
    <section class="details-section">
      <div class="details-grid">
        <!-- Cargo Information -->
        <div class="detail-panel">
          <cargo-details-panel
            v-if="shouldShowCalculator"
            :port-call="portCallStore.portCall" />
        </div>

        <!-- Contract Clauses -->
        <div class="detail-panel">
          <contract-clauses-panel
            v-if="shouldShowCalculator && portCallStore.contractResults"
            :contract-results="portCallStore.contractResults"
            :demurrage-calculation="portCallStore.demurrageCalculation" />
        </div>
      </div>
    </section>

    <!-- Events Timeline Section -->
    <section class="timeline-section">
      <h2 class="section-title">Events Timeline</h2>
      <div class="timeline-container">
        <calculator
          v-if="shouldShowCalculator"
          data-testid="port-call-calculator"
          :dynamic-port-call="portCallStore.portCall"
          :list-rows="listRows"
          :selected-sof="portCallStore.selectedSof" />
      </div>
    </section>

    <!-- Empty State -->
    <div v-if="!shouldShowCalculator" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No Port Call Data</h3>
      <p>Please load a port call to view the dashboard.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import moment from 'moment'
import type { ListRow } from '../types'
import Calculator from './Calculator.vue'
import CargoDetailsPanel from './CargoDetailsPanel.vue'
import ContractClausesPanel from './ContractClausesPanel.vue'
import { usePortCallStore } from '../stores/port-call-store'

@Component({
  components: {
    Calculator,
    CargoDetailsPanel,
    ContractClausesPanel
  }
})
export default class PortCallContainer extends Vue {
  portCallStore = usePortCallStore()
  listRows: ListRow[] = []

  @Watch('portCallStore.portCall', { immediate: true })
  onPortCallChange() {
    if (this.portCallStore.portCall) {
      this.loadEventList()
    }
  }

  get shouldShowCalculator(): boolean {
    return Boolean(this.portCallStore.portCall)
  }

  get timeProgressPercentage(): number {
    return this.portCallStore.timeProgressPercentage
  }

  get currentStatusClass(): string {
    return this.portCallStore.currentStatus
  }

  get currentStatusText(): string {
    if (!this.portCallStore.demurrageCalculation) return 'In Progress'
    if (this.portCallStore.demurrageCalculation.demurrageAmount > 0) return 'Demurrage Incurred'
    return 'On Schedule'
  }

  get laycan(): string | null {
    const portCallLaycan = this.portCallStore.portCall?.laycan
    
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

  get timeAllowed(): string | null {
    if (!this.portCallStore.timeAllowedInDays) {
      return null
    }

    return this.toDuration(this.portCallStore.timeAllowedInDays)
  }

  get cargoHandlingRate(): number | undefined {
    return this.portCallStore.portCall?.cargoHandlingRate
  }

  get contractClauseLabel(): string {
    return 'ASBATANKVOY 2012 Contract'
  }

  get operationTypeLabel(): string {
    const operationMap: { [key: string]: string } = {
      'discharge': 'Discharge',
      'load': 'Load'
    }
    return operationMap[this.portCallStore.portCall?.operation || ''] || ''
  }

  get rateTimeUnit(): string {
    return this.portCallStore.portCall?.cargoHandlingTimeUnit || 'day'
  }

  get rateLabel(): string {
    return this.rateTimeUnit === 'day' ? 'Rate/day' : 'Rate/hour'
  }

  get portCallNetTimeValue(): string {
    if (!this.portCallStore.portCallInDaysInDecimal) return ''

    const isNegative = this.portCallStore.portCall?.netTime ? this.portCallStore.portCall.netTime < 0 : false
    const negativeSign = isNegative ? '-' : ''
    const timeString = this.toDuration(this.portCallStore.portCallInDaysInDecimal)

    return `${negativeSign}${timeString}`
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: 0 
    }).format(Math.abs(amount))
  }

  formatDuration(minutes: number): string {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    const mins = Math.floor(minutes % 60)
    
    let result = ''
    if (days > 0) result += `${days}d `
    if (hours > 0 || days > 0) result += `${hours}h `
    result += `${mins}m`
    
    return result.trim()
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

  loadEventList(): void {
    if (!this.portCallStore.portCall?.events) return
    
    const events = this.portCallStore.portCall.events.map(event => ({
      ...event,
      rowType: 'event',
    }))
    
    // Sort events by date
    const sortedEvents = events.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    // Group events by date
    const eventsByDate: { [key: string]: typeof events } = {}
    for (const event of sortedEvents) {
      const date = moment(event.date).format('YYYY-MM-DD')
      if (!eventsByDate[date]) {
        eventsByDate[date] = []
      }
      eventsByDate[date].push(event)
    }
    
    // Create list rows with date headers
    const listRows: ListRow[] = []
    for (const [date, dateEvents] of Object.entries(eventsByDate)) {
      listRows.push({
        id: `date_header_${date}`,
        rowType: 'dateHeader',
        date: new Date(date),
      })
      listRows.push(...dateEvents)
    }
    
    this.listRows = listRows
  }
}
</script>

<style scoped>
.port-call-dashboard {
  max-width: 100%;
  margin: 0 auto;
}

/* Section Styling */
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title:before {
  content: '';
  width: 4px;
  height: 1.5rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 2px;
}

/* Overview Section */
.overview-section {
  margin-bottom: 3rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Metric Cards */
.metric-card {
  background: white;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

.card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Primary Metrics */
.primary-metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.metric-value.financial {
  color: #059669;
}

.metric-value.financial.negative {
  color: #dc2626;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Secondary Metrics */
.secondary-metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.secondary-metric .metric-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4b5563;
}

/* Progress Bar */
.progress-section {
  margin-top: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Schedule Items */
.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.schedule-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}

/* Financial Breakdown */
.financial-breakdown {
  display: flex;
  gap: 1rem;
}

.breakdown-item {
  flex: 1;
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f9fafb;
}

.breakdown-item span {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
}

.breakdown-item small {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.breakdown-item.positive span {
  color: #059669;
}

.breakdown-item.negative span {
  color: #dc2626;
}

/* Status Indicator */
.status-indicator-large {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.status-indicator-large.in-progress {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.status-indicator-large.on-time {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.status-indicator-large.demurrage {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.status-text {
  font-weight: 600;
  font-size: 1rem;
}

/* Status Details */
.status-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}

/* Details Section */
.details-section {
  margin-bottom: 3rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.detail-panel {
  background: white;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Timeline Section */
.timeline-section {
  margin-bottom: 2rem;
}

.timeline-container {
  background: white;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .financial-breakdown {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .metric-card {
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
}
</style>
