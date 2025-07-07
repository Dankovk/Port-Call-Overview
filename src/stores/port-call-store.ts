import { defineStore } from 'pinia'
import type { PortCall, ContractResults, DemurrageCalculation, Terminal, Berth, Port, Sof } from '../types'
import { createPortCallFromSof } from '../utils/sof-converter'
import { applyContractClauses } from '../services/laytime/clause-processor'
import { calculateDemurrage } from '../services/laytime/demurrage-calculator'
import { fetchSofData } from '../services/api/sof-api'
import { augmentEvents } from '../utils/event-processor'

// Helper to fetch JSON data with error handling
async function fetchData(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    throw error
  }
}

export const usePortCallStore = defineStore('portCall', {
  state: () => ({
    // Core data
    portCall: null as PortCall | null,
    terminal: null as Terminal | null,
    berth: null as Berth | null,
    port: null as Port | null,
    selectedSof: null as Sof | null,
    sofs: [] as Sof[],
    
    // Contract and calculation results
    contractResults: null as ContractResults | null,
    demurrageCalculation: null as DemurrageCalculation | null,
    
    // Loading and error states
    isLoading: false,
    isLoadingContract: false,
    isLoadingDemurrage: false,
    error: null as string | null,
    contractError: null as string | null,
    demurrageError: null as string | null
  }),

  getters: {
    // Time calculations
    timeAllowedInDays(state): number | null {
      if (!state.portCall) return null
      const duration = state.portCall.timeAllowedDuration
      return duration ? duration.days + (duration.hours / 24) + (duration.minutes / 1440) : (state.portCall.timeAllowed || null)
    },

    portCallInDaysInDecimal(state): number | null {
      return state.portCall?.netTime ? state.portCall.netTime / 1440 : null
    },

    timeProgressPercentage(): number {
      if (!this.portCallInDaysInDecimal || !this.timeAllowedInDays) return 0
      const percentage = (Math.abs(this.portCallInDaysInDecimal) / this.timeAllowedInDays) * 100
      return Math.min(Math.round(percentage), 100)
    },

    // Status indicators
    currentStatus(): string {
      if (!this.demurrageCalculation) return 'in-progress'
      if (this.demurrageCalculation.demurrageAmount > 0) return 'demurrage'
      return 'on-time'
    },

    // Data availability flags
    hasData(state): boolean {
      return Boolean(state.portCall)
    },

    hasContractResults(state): boolean {
      return Boolean(state.contractResults)
    },

    hasDemurrageCalculation(state): boolean {
      return Boolean(state.demurrageCalculation)
    },

    // Combined loading state
    isAnyLoading(state): boolean {
      return state.isLoading || state.isLoadingContract || state.isLoadingDemurrage
    }
  },

  actions: {
    // Initialize the entire port call data flow
    async initializePortCall() {
      if (this.portCall && !this.error) {
        console.log('Port call already initialized')
        return // Already initialized and successful
      }

      this.isLoading = true
      this.error = null

      try {
        // 1. Fetch and process SOF data to create the base port call
        console.log('Fetching SOF data...')
        const sofData = await fetchData('/sof.json')
        const portCallData = createPortCallFromSof(sofData)
        
        // 2. Set all the basic data
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

        // 3. Process contract logic
        await this.processContractLogic()

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while initializing port call data.'
        console.error('Error initializing port call:', error)
        this.error = errorMessage
      } finally {
        this.isLoading = false
      }
    },

    // Process contract logic separately for better error isolation
    async processContractLogic() {
      if (!this.portCall?.events) {
        console.log('No events available for contract processing')
        return
      }

      this.isLoadingContract = true
      this.contractError = null

      try {
        // Ensure events have proper event codes using centralized utility
        const eventsWithCodes = augmentEvents(this.portCall.events)

        // Update events in port call
        this.portCall.events = eventsWithCodes

        // Apply contract clauses
        console.log('Applying contract clauses...')
        this.contractResults = await applyContractClauses(eventsWithCodes)
        
        // Calculate demurrage if we have the necessary data
        await this.calculateDemurrage()

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing contract logic.'
        console.error('Error processing contract logic:', error)
        this.contractError = errorMessage
      } finally {
        this.isLoadingContract = false
      }
    },

    // Calculate demurrage separately for better error handling
    async calculateDemurrage() {
      if (!this.portCall?.netTime || !this.timeAllowedInDays || !this.contractResults) {
        console.log('Missing data for demurrage calculation:', {
          netTime: this.portCall?.netTime,
          timeAllowedInDays: this.timeAllowedInDays,
          hasContractResults: Boolean(this.contractResults)
        })
        return
      }

      this.isLoadingDemurrage = true
      this.demurrageError = null

      try {
        console.log('=== STORE DEMURRAGE CALCULATION ===')
        console.log('Port call netTime (minutes):', this.portCall.netTime)
        console.log('Time allowed in days:', this.timeAllowedInDays)
        console.log('Time allowed in minutes:', this.timeAllowedInDays * 24 * 60)
        console.log('Add events count:', this.contractResults.add_events.length)
        console.log('Deduct events count:', this.contractResults.deduct_events.length)
        
        console.log('Calculating demurrage...')
        this.demurrageCalculation = await calculateDemurrage(
          this.portCall.netTime, // Time used in minutes
          this.timeAllowedInDays * 24 * 60, // Time allowed in minutes
          this.contractResults.add_events,
          this.contractResults.deduct_events
        )
        
        console.log('=== DEMURRAGE CALCULATION COMPLETE ===')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while calculating demurrage.'
        console.error('Error calculating demurrage:', error)
        this.demurrageError = errorMessage
      } finally {
        this.isLoadingDemurrage = false
      }
    },

    // Refresh contract processing
    async refreshContractProcessing() {
      if (!this.portCall) {
        console.log('No port call data to refresh')
        return
      }
      await this.processContractLogic()
    },

    // Clear all errors
    clearErrors() {
      this.error = null
    },

    // Reset all loading states  
    resetLoadingStates() {
      this.isLoading = false
      this.isLoadingContract = false
      this.isLoadingDemurrage = false
    },

    // Reset store to initial state
    reset() {
      this.$patch({
        portCall: null,
        terminal: null,
        berth: null,
        port: null,
        selectedSof: null,
        sofs: [],
        contractResults: null,
        demurrageCalculation: null,
        isLoading: false,
        isLoadingContract: false,
        isLoadingDemurrage: false,
        error: null,
        contractError: null,
        demurrageError: null
      })
    }
  }
}) 