<template>
  <div class="calculator-container">
    <div v-for="row in listRows" :key="row.id" class="row-container">
      <div v-if="row.rowType === 'dateHeader'" class="date-header">
        {{ formatDateHeader(row.date) }}
      </div>
      <div v-else-if="row.rowType === 'event'" class="event-row">
        <div class="event-time">{{ formatTime(row.date) }}</div>
        <div class="event-name">{{ row.name }}</div>
        <div v-if="row.event_code" class="event-code">({{ row.event_code }})</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import moment from 'moment'
import { PortCall, Sof, ListRow } from '../types'

@Component
export default class Calculator extends Vue {
  @Prop() readonly dynamicPortCall!: PortCall
  @Prop() readonly listRows!: ListRow[]
  @Prop() readonly selectedSof!: Sof

  formatDateHeader(date: string | Date): string {
    if (!date) return ''
    return moment(date).format('dddd, MMMM D, YYYY')
  }

  formatTime(dateString: string): string {
    if (!dateString) return ''
    return moment(dateString).format('h:mm A')
  }
}
</script>

<style scoped>
.calculator-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-top: 20px;
}

.date-header {
  background-color: #f0f0f0;
  padding: 8px 16px;
  margin: 16px -16px;
  font-weight: bold;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}

.date-header:first-child {
  margin-top: -16px;
}

.event-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.event-time {
  width: 100px;
  color: #666;
}

.event-name {
  flex: 1;
}

.event-code {
  color: #999;
  font-size: 0.8em;
  margin-left: 8px;
}
</style>
