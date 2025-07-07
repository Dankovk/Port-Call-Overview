<template>
  <div class="app">
    <!-- Modern Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo">
            <div class="logo-icon">⚓</div>
            <h1 class="app-title">Port Call Overview</h1>
          </div>

        </div>

      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <div class="container">
        <port-call-container
          :port-call="portCall"
          :terminal="terminal"
          :berth="berth"
          :port="port"
          :selected-sof="selectedSof"
          :sofs="sofs"
        />
      </div>
    </main>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Loading port call data...</p>
      </div>
    </div>
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
  isLoading = true

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
    } finally {
      this.isLoading = false
    }
  }
}
</script>

<style>
/* Global Reset and Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Modern Header */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.breadcrumb-item.active {
  color: #667eea;
  font-weight: 500;
}

.breadcrumb-separator {
  color: #d1d5db;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Main Content */
.app-main {
  flex: 1;
  padding: 2rem 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: #6b7280;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Enhanced Design System Components */
.ds-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -12px;
}

.ds-column {
  padding: 0 12px;
  box-sizing: border-box;
}

.ds-column.no-padding {
  padding: 0;
}

.ds-text {
  margin: 0;
  line-height: 1.5;
}

.ds-text.size-xs {
  font-size: 0.75rem;
}

.ds-text.size-sm {
  font-size: 0.875rem;
}

.ds-text.size-md {
  font-size: 1rem;
}

.ds-text.size-lg {
  font-size: 1.125rem;
}

.ds-text.size-xl {
  font-size: 1.25rem;
}

.ds-text.color-marine4 {
  color: #374151;
}

.ds-text.color-green4 {
  color: #059669;
}

.ds-text.color-red4 {
  color: #dc2626;
}

.ds-text.color-blue4 {
  color: #2563eb;
}

.ds-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ds-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ds-button.theme-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.ds-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ds-progress-circular {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

.ds-progress-circular.size-small {
  width: 16px;
  height: 16px;
}

.ds-progress-circular.size-large {
  width: 32px;
  height: 32px;
}

.ds-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
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

.ds-icon.size-lg {
  width: 24px;
  height: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .header-left {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .container {
    padding: 0 1rem;
  }

  .app-main {
    padding: 1rem 0;
  }
}
</style>
