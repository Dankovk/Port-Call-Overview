<template>
  <div class="contract-clauses-panel">
    <DsRow class="details-header">
      <DsColumn :no-padding="true">
        <DsText size="md" color="marine4">
          <b>Contract Clauses</b>
        </DsText>
      </DsColumn>
    </DsRow>
    
    <div v-if="contractResults">
      <DsRow class="details-row">
        <DsColumn :no-padding="true" size="6" class="detail-item">
          <DsText size="sm" color="marine4" class="detail-label">
            <b>Demurrage Amount</b>
          </DsText>
          <DsText 
            size="md" 
            color="marine4" 
            class="detail-value"
            data-testid="demurrage-amount">
            {{ formattedDemurrageAmount }}
          </DsText>
        </DsColumn>
        
        <DsColumn :no-padding="true" size="6" class="detail-item">
          <DsText size="sm" color="marine4" class="detail-label">
            <b>Demurrage Time</b>
          </DsText>
          <DsText 
            size="md" 
            color="marine4" 
            class="detail-value"
            data-testid="demurrage-time">
            {{ formattedDemurrageTime }}
          </DsText>
        </DsColumn>
      </DsRow>
      
      <DsRow class="details-row">
        <DsColumn :no-padding="true" size="6" class="detail-item">
          <DsText size="sm" color="marine4" class="detail-label">
            <b>Added Time</b>
          </DsText>
          <DsText 
            size="md" 
            color="marine4" 
            class="detail-value"
            data-testid="added-time">
            {{ formattedAddedTime }}
          </DsText>
        </DsColumn>
        
        <DsColumn :no-padding="true" size="6" class="detail-item">
          <DsText size="sm" color="marine4" class="detail-label">
            <b>Deducted Time</b>
          </DsText>
          <DsText 
            size="md" 
            color="marine4" 
            class="detail-value"
            data-testid="deducted-time">
            {{ formattedDeductedTime }}
          </DsText>
        </DsColumn>
      </DsRow>
      
      <div class="clauses-section">
        <DsText size="sm" color="marine4" class="section-title">
          <b>Applied Clauses</b>
        </DsText>
        
        <div v-if="addEvents.length > 0" class="clause-list">
          <div v-for="event in addEvents" :key="event.clauseId" class="clause-item">
            <div class="clause-header">
              <DsText size="sm" color="green4" class="clause-operation">
                <b>ADD</b> ({{ event.factor }}%)
              </DsText>
              <DsText size="sm" color="marine4" class="clause-name">
                {{ getClauseName(event.clauseId) }}
              </DsText>
            </div>
            <DsText size="sm" color="marine4" class="clause-time">
              {{ formatDateRange(event.start, event.end) }}
            </DsText>
          </div>
        </div>
        
        <div v-if="deductEvents.length > 0" class="clause-list">
          <div v-for="event in deductEvents" :key="event.clauseId" class="clause-item">
            <div class="clause-header">
              <DsText size="sm" color="red4" class="clause-operation">
                <b>DEDUCT</b> ({{ event.factor }}%)
              </DsText>
              <DsText size="sm" color="marine4" class="clause-name">
                {{ getClauseName(event.clauseId) }}
              </DsText>
            </div>
            <DsText size="sm" color="marine4" class="clause-time">
              {{ formatDateRange(event.start, event.end) }}
            </DsText>
          </div>
        </div>
        
        <div v-if="addEvents.length === 0 && deductEvents.length === 0" class="no-clauses">
          <DsText size="sm" color="marine4">
            No contract clauses applied. Check that your events match the clause conditions.
          </DsText>
          <div class="debug-info">
            <DsText size="sm" color="marine4" class="debug-title">
              <b>Available Events:</b>
            </DsText>
            <div v-if="contractResults?.events?.length" class="debug-list">
              <div v-for="(event, index) in contractResults.events" :key="index" class="debug-item">
                <span class="debug-key">{{ event.key }}</span>
                <span v-if="event.event_code" class="debug-code">({{ event.event_code }})</span>
                <span class="debug-date">{{ formatDate(event.date) }}</span>
              </div>
            </div>
            <div v-else class="debug-empty">
              No events available
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="loading-state">
      <DsText size="sm" color="marine4">
        Loading contract data...
      </DsText>
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
  
  getClauseName(clauseId: string): string {
    if (clauseId === 'fallback') {
      return 'Default Time Range';
    }
    
    // Try to find the clause in the contract data
    const contractData = this.contractResults?.contractData;
    if (contractData?.clauses?.demurrage) {
      const clause = contractData.clauses.demurrage.find((c: any) => c.id === clauseId);
      if (clause) {
        return clause.name;
      }
    }
    
    // If we can't find the clause name, return the ID
    return `Clause ${clauseId.substring(0, 8)}`;
  }
}
</script>

<style scoped>
.contract-clauses-panel {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 24px;
  margin: 24px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.details-header {
  margin-bottom: 16px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 8px;
}

.details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 16px;
}

.detail-item {
  margin-bottom: 16px;
  background-color: white;
  padding: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.detail-label {
  margin-bottom: 4px;
}

.detail-value {
  font-weight: 500;
  font-size: 18px;
}

.clauses-section {
  margin-top: 24px;
  background-color: white;
  padding: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eaeaea;
}

.clause-list {
  margin-bottom: 16px;
}

.clause-item {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.clause-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.clause-operation {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f0f0f0;
  margin-right: 8px;
}

.clause-name {
  font-weight: 500;
}

.no-clauses {
  padding: 16px;
  color: #888;
}

.debug-info {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.debug-title {
  margin-bottom: 8px;
}

.debug-list {
  max-height: 200px;
  overflow-y: auto;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.debug-key {
  font-weight: bold;
}

.debug-code {
  color: #999;
  margin-left: 4px;
}

.debug-date {
  color: #666;
}

.debug-empty {
  font-style: italic;
  color: #999;
}

.loading-state {
  padding: 16px 0;
  text-align: center;
  color: #888;
}
</style>
