<template>
  <div class="cargo-details-panel">
    <DsRow class="details-header">
      <DsColumn :no-padding="true">
        <DsText size="md" color="marine4">
          <b>Cargo Details</b>
        </DsText>
      </DsColumn>
    </DsRow>
    
    <DsRow class="details-row">
      <DsColumn :no-padding="true" size="3" class="detail-item">
        <DsText size="sm" color="marine4" class="detail-label">
          <b>Cargoes</b>
        </DsText>
        <DsText 
          v-ds-tooltip="cargoesInOperationTooltip"
          size="md" 
          color="marine4" 
          class="detail-value"
          data-testid="cargo-details-cargoes">
          {{ formattedCargoesInOperation | emptyString }}
        </DsText>
      </DsColumn>
      
      <DsColumn :no-padding="true" size="3" class="detail-item">
        <DsText size="sm" color="marine4" class="detail-label">
          <b>{{ rateLabel }}</b>
        </DsText>
        <DsText 
          v-ds-tooltip="cargoHandlingRateTooltip"
          size="md" 
          color="marine4" 
          class="detail-value"
          data-testid="cargo-details-rate">
          {{ cargoHandlingRate | emptyString }}
        </DsText>
      </DsColumn>
      
      <DsColumn :no-padding="true" size="3" class="detail-item">
        <DsText size="sm" color="marine4" class="detail-label">
          <b>Operation</b>
        </DsText>
        <DsText 
          size="md" 
          color="marine4" 
          class="detail-value"
          data-testid="cargo-details-operation">
          {{ operationTypeLabel | emptyString }}
        </DsText>
      </DsColumn>
    </DsRow>
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

  get portCallCargoes(): Cargo[] | undefined {
    return this.portCall?.cargoes
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
    return this.rateTimeUnit === 'day' ? 'Rate/day' : 'Rate/hour'
  }
}
</script>

<style scoped>
.cargo-details-panel {
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
}
</style>
