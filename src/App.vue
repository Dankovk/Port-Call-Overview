<template>
  <div class="app-container">
    <h1>Port Call Viewer</h1>
    <port-call-container 
      :port-call="portCall" 
      :terminal="terminal"
      :berth="berth"
      :port="port"
      :selected-sof="selectedSof"
      :sofs="sofs"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import PortCallContainer from './components/PortCallContainer.vue'
import { PortCall, Terminal, Berth, Port, Sof } from './types'
import { createPortCallFromSof } from './utils/sof-converter'

@Component({
  components: {
    PortCallContainer
  }
})
export default class App extends Vue {
  portCall: PortCall | null = null
  terminal: Terminal | null = null
  berth: Berth | null = null
  port: Port | null = null
  selectedSof: Sof | null = null
  sofs: Sof[] = []

  async mounted() {
    try {
      // Load SOF data
      const sofResponse = await fetch('sof.json')
      const sofData = await sofResponse.json()
      
      // Create port call data from SOF
      const portCallData = createPortCallFromSof(sofData)
      
      this.portCall = portCallData.portCall
      this.terminal = portCallData.terminal
      this.berth = portCallData.berth
      this.port = portCallData.port
      this.selectedSof = {
        id: sofData.id.toString(),
        name: sofData.name,
        isMain: true
      }
      this.sofs = [this.selectedSof]
      
    } catch (error) {
      console.error('Error loading SOF data:', error)
    }
  }
}
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #3E8A6E;
}

/* Mock design system styles */
.ds-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
}

.ds-column {
  padding: 0 8px;
  box-sizing: border-box;
}

.ds-column.no-padding {
  padding: 0;
}

.ds-text {
  margin: 0;
}

.ds-text.size-sm {
  font-size: 14px;
}

.ds-text.size-md {
  font-size: 16px;
}

.ds-text.color-marine4 {
  color: #2c3e50;
}

.ds-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: #3E8A6E;
  color: white;
}

.ds-button.theme-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.ds-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ds-progress-circular {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #3E8A6E;
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

.ds-progress-circular.size-small {
  width: 12px;
  height: 12px;
}

.ds-progress-circular.size-large {
  width: 24px;
  height: 24px;
}

.ds-progress-circular.color-white {
  border-top-color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ds-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.ds-icon.size-xs {
  width: 12px;
  height: 12px;
}

.ds-icon.size-sm {
  width: 16px;
  height: 16px;
}
</style>
