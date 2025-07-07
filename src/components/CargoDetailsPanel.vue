<template>
  <div class="cargo-details-panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">🚢</div>
        <div class="header-text">
          <h3 class="panel-title">Cargo Details</h3>
          <p class="panel-subtitle">Operation and handling information</p>
        </div>
      </div>
    </div>
    
    <div class="panel-content">
      <div class="cargo-grid">
        <!-- Cargoes Card -->
        <div class="detail-card">
          <div class="card-header">
            <div class="card-icon cargo-icon">📦</div>
            <div class="card-title">
              <h4>Cargoes</h4>
              <span class="card-subtitle">Types in operation</span>
            </div>
          </div>
          <div class="card-value">
            <span class="value-text" :title="cargoesInOperationTooltip">
              {{ formattedCargoesInOperation || '—' }}
            </span>
            <div class="value-meta">
              <span class="meta-badge">{{ cargoCount }} type{{ cargoCount !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <!-- Rate Card -->
        <div class="detail-card">
          <div class="card-header">
            <!-- <div class="card-icon rate-icon">⚡</div> -->
            <div class="card-title">
              <h4>{{ rateLabel }}</h4>
              <span class="card-subtitle">Handling rate</span>
            </div>
          </div>
          <div class="card-value">
            <span class="value-text" :title="cargoHandlingRateTooltip">
              {{ formatHandlingRate(cargoHandlingRate) }}
            </span>
            <div class="value-meta">
              <span class="meta-unit">{{ rateUnit }}</span>
            </div>
          </div>
        </div>

        <!-- Operation Card -->
        <div class="detail-card operation-card">
          <div class="card-header">
            <div class="card-icon operation-icon" :class="operationClass">
              {{ operationIcon }}
            </div>
            <div class="card-title">
              <h4>Operation</h4>
              <span class="card-subtitle">Current activity</span>
            </div>
          </div>
          <div class="card-value">
            <span class="value-text">{{ operationTypeLabel || '—' }}</span>
            <div class="value-meta">
              <span class="status-badge" :class="operationStatusClass">
                {{ operationStatus }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cargo Summary -->
      <div class="performance-section">
        <h4 class="section-title">
          <span class="section-icon">📋</span>
          Cargo Summary
        </h4>
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-label">Total Quantity</span>
            <span class="metric-value">{{ totalCargoQuantity }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Estimated Duration</span>
            <span class="metric-value">{{ estimatedDuration }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { PortCall, Cargo } from '../types'

@Component
export default class CargoDetailsPanel extends Vue {
  @Prop() readonly portCall!: PortCall | null

  get operationTypeLabel(): string {
    const operationMap: { [key: string]: string } = {
      'discharge': 'Discharge',
      'load': 'Load'
    }
    return operationMap[this.portCall?.operation || ''] || ''
  }

  get operationIcon(): string {
    const iconMap: { [key: string]: string } = {
      'discharge': '⬇️',
      'load': '⬆️'
    }
    return iconMap[this.portCall?.operation || ''] || '🔄'
  }

  get operationClass(): string {
    return this.portCall?.operation || 'default'
  }

  get operationStatus(): string {
    // Determine status based on actual events if available
    const events = this.portCall?.events || []
    const hasLoadComplete = events.some(e => e.key === 'load_completed' || e.key === 'load_complete')
    const hasDischargeComplete = events.some(e => e.key === 'discharge_completed' || e.key === 'discharge_complete')
    const hasLoadCommence = events.some(e => e.key === 'load_commenced' || e.key === 'load_commence')
    const hasDischargeCommence = events.some(e => e.key === 'discharge_commenced' || e.key === 'discharge_commence')
    
    if (hasLoadComplete || hasDischargeComplete) return 'Complete'
    if (hasLoadCommence || hasDischargeCommence) return 'In Progress'
    return 'Pending'
  }

  get operationStatusClass(): string {
    const status = this.operationStatus.toLowerCase()
    return status.replace(' ', '-')
  }

  get portCallCargoes(): Cargo[] | undefined {
    return this.portCall?.cargoes
  }

  get totalCargoQuantity(): string {
    if (!this.portCallCargoes?.length) return '—'
    
    const total = this.portCallCargoes.reduce((sum, cargo) => sum + (cargo.quantity || 0), 0)
    const unit = this.portCallCargoes[0]?.unit || 'MT'
    
    return total > 0 ? `${new Intl.NumberFormat('en-US').format(total)} ${unit}` : '—'
  }

  get cargoCount(): number {
    return this.portCallCargoes?.length || 0
  }

  get formattedCargoesInOperation(): string | null {
    if (!this.portCallCargoes?.length) return null
    const cargoNames = this.portCallCargoes.map(({ name }) => name)
    return [...new Set(cargoNames)].join(', ')
  }

  get cargoesInOperationTooltip(): string {
    return this.formattedCargoesInOperation || ''
  }

  get cargoHandlingRate(): number | undefined {
    return this.portCall?.cargoHandlingRate
  }

  get cargoHandlingRateTooltip(): string {
    return this.cargoHandlingRate?.toString() || ''
  }

  get rateTimeUnit(): string {
    return this.portCall?.cargoHandlingTimeUnit || 'day'
  }

  get rateLabel(): string {
    return this.rateTimeUnit === 'day' ? 'Rate/Day' : 'Rate/Hour'
  }

  get rateUnit(): string {
    return this.rateTimeUnit === 'day' ? 'MT/day' : 'MT/hour'
  }

  get estimatedDuration(): string {
    // Calculate estimated duration based on cargo quantity and rate
    if (!this.cargoHandlingRate || !this.portCallCargoes?.length) return '—'
    
    const totalQuantity = this.portCallCargoes.reduce((sum, cargo) => sum + (cargo.quantity || 0), 0)
    const durationDays = totalQuantity / this.cargoHandlingRate
    
    if (durationDays < 1) {
      return `${Math.round(durationDays * 24)}h`
    } else {
      return `${Math.round(durationDays * 10) / 10}d`
    }
  }

  formatHandlingRate(rate: number | undefined): string {
    if (!rate) return '—'
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: 0 
    }).format(rate)
  }
}
</script>

<style scoped>
.cargo-details-panel {
  background: white;
  overflow: hidden;
  
  
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

.cargo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Detail Cards */
.detail-card {
  background: #f8fafc;
  
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}





.card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 1.5rem;
  opacity: 0.8;
  margin-top: 0.125rem;
}

.cargo-icon {
  color: #3b82f6;
}

.rate-icon {
  color: #10b981;
}

.operation-icon {
  color: #f59e0b;
}

.operation-icon.discharge {
  color: #ef4444;
}

.operation-icon.load {
  color: #10b981;
}

.card-title {
  flex: 1;
}

.card-title h4 {
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.value-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
  word-break: break-word;
}

.value-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.meta-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
  background: #e2e8f0;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.meta-unit {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

/* Performance Section */
.performance-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.section-icon {
  font-size: 1.125rem;
  opacity: 0.7;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

/* Operation Card Specific Styling */
.operation-card {
  border-left: 4px solid #f59e0b;
}

.operation-card.discharge {
  border-left-color: #ef4444;
}

.operation-card.load {
  border-left-color: #10b981;
}

/* Responsive Design */
@media (max-width: 768px) {
  .panel-content {
    padding: 1rem;
  }
  
  .cargo-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .detail-card {
    padding: 1rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .panel-header {
    padding: 1rem 1.5rem;
  }
  
  .header-content {
    gap: 0.75rem;
  }
  
  .header-icon {
    font-size: 1.5rem;
  }
}
</style>
