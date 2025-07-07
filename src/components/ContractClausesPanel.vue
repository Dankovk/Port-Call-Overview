<template>
  <div class="contract-clauses-panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">📋</div>
        <div class="header-text">
          <h3 class="panel-title">Contract Clauses</h3>
          <p class="panel-subtitle">Demurrage calculation and applied clauses</p>
        </div>
      </div>
    </div>
    
    <div class="panel-content" v-if="contractResults">
      <!-- Financial Summary Cards -->
      <div class="financial-summary">
        <div class="summary-grid">
          <!-- Demurrage Amount Card -->
          <div class="summary-card demurrage-card">
            <div class="card-header">
              <div class="card-icon">💰</div>
              <div class="card-info">
                <h4 class="card-title">Demurrage Amount</h4>
                <span class="card-subtitle">Financial impact</span>
              </div>
            </div>
            <div class="card-value">
              <span class="amount-value" :class="demurrageAmountClass">
                {{ formattedDemurrageAmount }}
              </span>
              <span class="amount-label">{{ demurrageAmountLabel }}</span>
            </div>
          </div>

          <!-- Time Summary Card -->
          <div class="summary-card time-card">
            <div class="card-header">
              <div class="card-icon">⏱️</div>
              <div class="card-info">
                <h4 class="card-title">Time Analysis</h4>
                <span class="card-subtitle">Breakdown summary</span>
              </div>
            </div>
            <div class="time-breakdown">
              <div class="time-item">
                <span class="time-label">Demurrage Time</span>
                <span class="time-value">{{ formattedDemurrageTime }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">Added Time</span>
                <span class="time-value positive">+{{ formattedAddedTime }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">Deducted Time</span>
                <span class="time-value negative">-{{ formattedDeductedTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Applied Clauses Section -->
      <div class="clauses-section">
        <div class="section-header">
          <h4 class="section-title">
            <span class="section-icon">⚖️</span>
            Applied Clauses
          </h4>
          <span class="clause-count">{{ totalClausesCount }} clause{{ totalClausesCount !== 1 ? 's' : '' }} applied</span>
        </div>

        <div class="clauses-content">
          <!-- Add Events -->
          <div v-if="addEvents.length > 0" class="clause-group add-group">
            <div class="group-header">
              <div class="group-badge add-badge">
                <span class="badge-icon">➕</span>
                <span class="badge-text">ADD Events</span>
              </div>
              <span class="group-count">{{ addEvents.length }} event{{ addEvents.length !== 1 ? 's' : '' }}</span>
            </div>
            
            <div class="clause-list">
              <div 
                v-for="event in addEvents" 
                :key="event.clauseId" 
                class="clause-item add-item"
              >
                <div class="clause-header">
                  <div class="clause-info">
                    <h5 class="clause-name">{{ getClauseName(event.clauseId) }}</h5>
                    <span class="clause-factor">{{ event.factor }}% factor</span>
                  </div>
                  <div class="clause-impact positive">
                    +{{ calculateClauseTime(event) }}
                  </div>
                </div>
                <div class="clause-period">
                  <span class="period-label">Period:</span>
                  <span class="period-value">{{ formatDateRange(event.start, event.end) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Deduct Events -->
          <div v-if="deductEvents.length > 0" class="clause-group deduct-group">
            <div class="group-header">
              <div class="group-badge deduct-badge">
                <span class="badge-icon">➖</span>
                <span class="badge-text">DEDUCT Events</span>
              </div>
              <span class="group-count">{{ deductEvents.length }} event{{ deductEvents.length !== 1 ? 's' : '' }}</span>
            </div>
            
            <div class="clause-list">
              <div 
                v-for="event in deductEvents" 
                :key="event.clauseId" 
                class="clause-item deduct-item"
              >
                <div class="clause-header">
                  <div class="clause-info">
                    <h5 class="clause-name">{{ getClauseName(event.clauseId) }}</h5>
                    <span class="clause-factor">{{ event.factor }}% factor</span>
                  </div>
                  <div class="clause-impact negative">
                    -{{ calculateClauseTime(event) }}
                  </div>
                </div>
                <div class="clause-period">
                  <span class="period-label">Period:</span>
                  <span class="period-value">{{ formatDateRange(event.start, event.end) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- No Clauses State -->
          <div v-if="addEvents.length === 0 && deductEvents.length === 0" class="no-clauses">
            <div class="empty-icon">⚖️</div>
            <h4 class="empty-title">No Contract Clauses Applied</h4>
            <p class="empty-description">
              Check that your events match the clause conditions. Available events are listed below for debugging.
            </p>
            
            <!-- Debug Information -->
            <div class="debug-section">
              <details class="debug-details">
                <summary class="debug-summary">
                  <span class="debug-title">Available Events ({{ contractResults?.events?.length || 0 }})</span>
                  <span class="debug-toggle">Show/Hide</span>
                </summary>
                <div class="debug-content">
                  <div v-if="contractResults?.events?.length" class="debug-list">
                    <div 
                      v-for="(event, index) in contractResults.events" 
                      :key="index" 
                      class="debug-item"
                    >
                      <div class="debug-event-info">
                        <span class="debug-event-name">{{ event.key }}</span>
                        <span v-if="event.event_code" class="debug-event-code">{{ event.event_code }}</span>
                      </div>
                      <span class="debug-event-date">{{ formatDate(event.date) }}</span>
                    </div>
                  </div>
                  <div v-else class="debug-empty">
                    <span>No events available for processing</span>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading contract analysis...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import moment from 'moment'

@Component
export default class ContractClausesPanel extends Vue {
  @Prop() readonly contractResults!: any
  @Prop() readonly demurrageCalculation!: any
  
  get addEvents() {
    return this.contractResults?.add_events || []
  }
  
  get deductEvents() {
    return this.contractResults?.deduct_events || []
  }

  get totalClausesCount(): number {
    return this.addEvents.length + this.deductEvents.length
  }

  get demurrageAmountClass(): string {
    if (!this.demurrageCalculation) return ''
    return this.demurrageCalculation.demurrageAmount > 0 ? 'negative' : 'positive'
  }

  get demurrageAmountLabel(): string {
    if (!this.demurrageCalculation) return ''
    return this.demurrageCalculation.demurrageAmount > 0 ? 'Demurrage Due' : 'Dispatch Earned'
  }
  
  get formattedDemurrageAmount() {
    if (!this.demurrageCalculation) return '—'
    return `$${this.demurrageCalculation.demurrageAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
  
  get formattedDemurrageTime() {
    if (!this.demurrageCalculation) return '—'
    return this.formatDuration(this.demurrageCalculation.demurrageMinutes)
  }
  
  get formattedAddedTime() {
    if (!this.demurrageCalculation) return '—'
    return this.formatDuration(this.demurrageCalculation.addedMinutes)
  }
  
  get formattedDeductedTime() {
    if (!this.demurrageCalculation) return '—'
    return this.formatDuration(this.demurrageCalculation.deductedMinutes)
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
  
  formatDateRange(start: string, end: string): string {
    const startDate = moment(start)
    const endDate = moment(end)
    
    return `${startDate.format('DD MMM HH:mm')} - ${endDate.format('DD MMM HH:mm')}`
  }
  
  formatDate(date: string): string {
    return moment(date).format('DD MMM YYYY HH:mm')
  }

  calculateClauseTime(event: any): string {
    const start = moment(event.start)
    const end = moment(event.end)
    const minutes = end.diff(start, 'minutes')
    const adjustedMinutes = (minutes * event.factor) / 100
    return this.formatDuration(adjustedMinutes)
  }
  
  getClauseName(clauseId: string): string {
    if (clauseId === 'fallback') {
      return 'Default Time Range'
    }
    
    // Try to find the clause in the contract data
    const contractData = this.contractResults?.contractData
    if (contractData?.clauses?.demurrage) {
      const clause = contractData.clauses.demurrage.find((c: any) => c.id === clauseId)
      if (clause) {
        return clause.name
      }
    }
    
    // If we can't find the clause name, return the ID
    return `Clause ${clauseId.substring(0, 8)}`
  }
}
</script>

<style scoped>
.contract-clauses-panel {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Panel Header */
.panel-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.header-text {
  flex: 1;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.panel-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Panel Content */
.panel-content {
  padding: 2rem;
}

/* Financial Summary */
.financial-summary {
  margin-bottom: 2rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.summary-card:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(45deg, #667eea, #764ba2);
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

.card-info {
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
}

.card-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.card-value {
  text-align: center;
  padding: 1rem 0;
}

.amount-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.amount-value.positive {
  color: #059669;
}

.amount-value.negative {
  color: #dc2626;
}

.amount-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Time Breakdown */
.time-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.time-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.time-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.time-value.positive {
  color: #059669;
}

.time-value.negative {
  color: #dc2626;
}

/* Clauses Section */
.clauses-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.section-icon {
  font-size: 1.125rem;
  opacity: 0.7;
}

.clause-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  background: #e2e8f0;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

/* Clause Groups */
.clause-group {
  margin-bottom: 1.5rem;
}

.clause-group:last-child {
  margin-bottom: 0;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.group-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.add-badge {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.deduct-badge {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.badge-icon {
  font-size: 1rem;
}

.group-count {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Clause Items */
.clause-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.clause-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.clause-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.add-item {
  border-left: 3px solid #10b981;
}

.deduct-item {
  border-left: 3px solid #ef4444;
}

.clause-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.clause-info {
  flex: 1;
}

.clause-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.clause-factor {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  background: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.clause-impact {
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
}

.clause-impact.positive {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.clause-impact.negative {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.clause-period {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.period-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.period-value {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
}

/* No Clauses State */
.no-clauses {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

/* Debug Section */
.debug-section {
  margin-top: 1.5rem;
}

.debug-details {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.debug-summary {
  padding: 0.75rem 1rem;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #374151;
}

.debug-title {
  font-size: 0.875rem;
}

.debug-toggle {
  font-size: 0.75rem;
  color: #6b7280;
}

.debug-content {
  padding: 1rem;
  background: white;
  max-height: 300px;
  overflow-y: auto;
}

.debug-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 0.75rem;
}

.debug-event-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.debug-event-name {
  font-weight: 600;
  color: #374151;
}

.debug-event-code {
  color: #6b7280;
  background: #e2e8f0;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-family: monospace;
}

.debug-event-date {
  color: #6b7280;
}

.debug-empty {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 1rem;
}

/* Loading State */
.loading-state {
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .panel-content {
    padding: 1rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .clause-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .time-breakdown {
    gap: 0.5rem;
  }
  
  .group-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
