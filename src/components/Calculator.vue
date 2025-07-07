<template>
  <div class="timeline-calculator">
    <div class="timeline-header">
      <h3 class="timeline-title">
        <span class="timeline-icon">📋</span>
        Events Timeline
      </h3>
      <div class="timeline-summary">
        <span class="event-count">{{ totalEvents }} events</span>
        <span class="time-span">{{ timeSpanText }}</span>
      </div>
    </div>

    <div class="timeline-container">
      <div class="timeline-line"></div>
      
      <div 
        v-for="row in listRows" 
        :key="row.id" 
        class="timeline-item"
        :class="getTimelineItemClass(row)"
      >
        <!-- Date Header -->
        <div v-if="row.rowType === 'dateHeader'" class="date-header">
          <div class="date-marker">
            <div class="date-circle"></div>
          </div>
          <div class="date-content">
            <h4 class="date-title">{{ formatDateHeader(row.date) }}</h4>
            <span class="date-subtitle">{{ getDayOfWeek(row.date) }}</span>
          </div>
        </div>

        <!-- Event Item -->
        <div v-else-if="row.rowType === 'event'" class="event-item">
          <div class="event-marker">
            <div class="event-dot" :class="getEventTypeClass(row)"></div>
          </div>
          
          <div class="event-content">
            <div class="event-main">
              <div class="event-time">
                {{ formatTime(row.date) }}
              </div>
              
              <div class="event-details">
                <h5 class="event-name">{{ row.name }}</h5>
                <div class="event-meta">
                  <span v-if="getEventCode(row)" class="event-code">{{ getEventCode(row) }}</span>
                  <span class="event-type-badge" :class="getEventTypeClass(row)">
                    {{ getEventTypeLabel(getEventType(row)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Footer -->
    <div class="timeline-footer">
      <div class="legend">
        <h4 class="legend-title">Event Types</h4>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-dot operational"></div>
            <span>Operational</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot commercial"></div>
            <span>Commercial</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot weather"></div>
            <span>Weather</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot administrative"></div>
            <span>Administrative</span>
          </div>
        </div>
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

  get totalEvents(): number {
    return this.listRows.filter(row => row.rowType === 'event').length
  }

  get timeSpanText(): string {
    const events = this.listRows.filter(row => row.rowType === 'event')
    if (events.length < 2) return ''
    
    const firstEvent = events[0]
    const lastEvent = events[events.length - 1]
    const duration = moment(lastEvent.date).diff(moment(firstEvent.date), 'hours')
    
    if (duration < 24) {
      return `${duration}h span`
    } else {
      const days = Math.floor(duration / 24)
      const hours = duration % 24
      return `${days}d ${hours}h span`
    }
  }

  formatDateHeader(date: string | Date): string {
    if (!date) return ''
    return moment(date).format('MMMM D, YYYY')
  }

  getDayOfWeek(date: string | Date): string {
    if (!date) return ''
    return moment(date).format('dddd')
  }

  formatTime(dateString: string | Date): string {
    if (!dateString) return ''
    return moment(dateString).format('HH:mm')
  }

  getTimelineItemClass(row: ListRow): string {
    if (row.rowType === 'dateHeader') return 'is-date-header'
    if (row.rowType === 'event') return 'is-event'
    return ''
  }

  getEventTypeClass(event: any): string {
    const eventName = event.name?.toLowerCase() || ''
    const eventCode = event.event_code?.toLowerCase() || ''
    
    // Operational events
    if (eventName.includes('berth') || eventName.includes('unberthed') || 
        eventName.includes('mooring') || eventName.includes('anchor')) {
      return 'operational'
    }
    
    // Commercial events
    if (eventName.includes('nor') || eventName.includes('notice') ||
        eventName.includes('discharge') || eventName.includes('load')) {
      return 'commercial'
    }
    
    // Weather events
    if (eventName.includes('weather') || eventName.includes('awaiting') ||
        eventCode.includes('weather')) {
      return 'weather'
    }
    
    // Administrative events
    if (eventName.includes('document') || eventName.includes('clearance') ||
        eventName.includes('customs')) {
      return 'administrative'
    }
    
    return 'operational' // default
  }

  getEventTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'timestamp': 'Timestamp',
      'duration_start': 'Start',
      'duration_end': 'End',
      'duration': 'Duration'
    }
    return typeMap[type] || type
  }

  getEventStatusClass(event: any): string {
    // This could be enhanced with actual status logic
    return 'completed'
  }

  getEventCode(row: ListRow): string {
    return (row as any).event_code || ''
  }

  getEventType(row: ListRow): string {
    return (row as any).type || ''
  }
}
</script>

<style scoped>
.timeline-calculator {
  padding: 2rem;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Timeline Header */
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.timeline-icon {
  font-size: 1.5rem;
}

.timeline-summary {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

.event-count {
  padding: 0.25rem 0.75rem;
  background: #f1f5f9;
  border-radius: 12px;
  font-weight: 500;
}

.time-span {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border-radius: 12px;
  font-weight: 500;
}

/* Timeline Container */
.timeline-container {
  position: relative;
  margin-left: 1rem;
}

.timeline-line {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e2e8f0, #cbd5e1, #e2e8f0);
  border-radius: 1px;
}

/* Timeline Items */
.timeline-item {
  position: relative;
  margin-bottom: 1.5rem;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

/* Date Headers */
.date-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1rem 0;
}

.date-marker {
  position: relative;
  z-index: 10;
}

.date-circle {
  width: 20px;
  height: 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 0 0 2px #e2e8f0;
  margin-left: -9px;
}

.date-content {
  background: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.date-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.date-subtitle {
  font-size: 0.875rem;
  color: #64748b;
}

/* Event Items */
.event-item {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
}

.event-marker {
  position: relative;
  z-index: 5;
  flex-shrink: 0;
}

.event-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px currentColor;
  background: currentColor;
  margin-left: -7px;
}

.event-dot.operational {
  color: #3b82f6;
}

.event-dot.commercial {
  color: #10b981;
}

.event-dot.weather {
  color: #f59e0b;
}

.event-dot.administrative {
  color: #8b5cf6;
}

.event-content {
  flex: 1;
  margin-left: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  overflow: hidden;
}

.event-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.event-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  min-width: 60px;
  text-align: center;
  flex-shrink: 0;
}

.event-details {
  flex: 1;
  min-width: 0;
}

.event-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.event-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.event-code {
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
}

.event-type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.event-type-badge.operational {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.event-type-badge.commercial {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.event-type-badge.weather {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.event-type-badge.administrative {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

/* Timeline Footer */
.timeline-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.legend {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
}

.legend-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 1rem 0;
}

.legend-items {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.operational {
  background: #3b82f6;
}

.legend-dot.commercial {
  background: #10b981;
}

.legend-dot.weather {
  background: #f59e0b;
}

.legend-dot.administrative {
  background: #8b5cf6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .timeline-calculator {
    padding: 1rem;
  }
  
  .timeline-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .timeline-summary {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .event-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .event-meta {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .legend-items {
    gap: 1rem;
  }
  
  .timeline-container {
    margin-left: 0.5rem;
  }
  
  .date-circle {
    width: 16px;
    height: 16px;
    margin-left: -7px;
  }
  
  .event-dot {
    width: 12px;
    height: 12px;
    margin-left: -5px;
  }
}
</style>
