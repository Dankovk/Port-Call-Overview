import moment from 'moment'
import type { TimeRange, DemurrageCalculation, ContractData } from '../../types'
import { fetchContractData } from '../api/contract-api'

/**
 * Calculate time difference in minutes between two dates
 */
export function calculateTimeInMinutes(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return (end.getTime() - start.getTime()) / (1000 * 60)
}

/**
 * Calculate demurrage based on contract and time ranges
 */
export async function calculateDemurrage(
  timeUsed: number, 
  timeAllowed: number, 
  addEvents: TimeRange[], 
  deductEvents: TimeRange[]
): Promise<DemurrageCalculation> {
  try {
    // Load contract data
    const contractData = await fetchContractData()
    
    console.log('=== DEMURRAGE CALCULATION DEBUG ===')
    console.log('Input timeUsed (minutes):', timeUsed)
    console.log('Input timeAllowed (minutes):', timeAllowed)
    console.log('Add events:', addEvents)
    console.log('Deduct events:', deductEvents)
    
    // Calculate total minutes from add events
    const addedMinutes = addEvents.reduce((total, event) => {
      const minutes = calculateTimeInMinutes(event.start, event.end)
      const factor = event.factor / 100 // Convert percentage to decimal
      const adjustedMinutes = minutes * factor
      console.log(`Add event: ${minutes} minutes * ${factor} factor = ${adjustedMinutes} minutes`)
      return total + adjustedMinutes
    }, 0)
    
    // Calculate total minutes from deduct events
    const deductedMinutes = deductEvents.reduce((total, event) => {
      const minutes = calculateTimeInMinutes(event.start, event.end)
      const factor = event.factor / 100 // Convert percentage to decimal
      const adjustedMinutes = minutes * factor
      console.log(`Deduct event: ${minutes} minutes * ${factor} factor = ${adjustedMinutes} minutes`)
      return total + adjustedMinutes
    }, 0)
    
    console.log('Total added minutes:', addedMinutes)
    console.log('Total deducted minutes:', deductedMinutes)
    
    // Calculate net time used (in minutes)
    const netTimeUsed = timeUsed + addedMinutes - deductedMinutes
    console.log('Net time used calculation:', `${timeUsed} + ${addedMinutes} - ${deductedMinutes} = ${netTimeUsed} minutes`)
    
    // Convert time allowed to minutes if it's in a different unit
    const timeAllowedMinutes = timeAllowed
    console.log('Time allowed (minutes):', timeAllowedMinutes)
    
    // Calculate demurrage minutes
    const demurrageMinutes = Math.max(0, netTimeUsed - timeAllowedMinutes)
    console.log('Demurrage minutes calculation:', `max(0, ${netTimeUsed} - ${timeAllowedMinutes}) = ${demurrageMinutes}`)
    
    // Calculate demurrage amount based on rate
    const demurrageRate = contractData.configuration.demurrage.general.rates[0]?.rate || 0
    console.log('Demurrage rate (per day):', demurrageRate)
    
    const demurrageAmount = (demurrageMinutes / (24 * 60)) * demurrageRate
    console.log('Demurrage amount calculation:', `(${demurrageMinutes} / ${24 * 60}) * ${demurrageRate} = ${demurrageAmount}`)
    
    console.log('=== FINAL DEMURRAGE RESULT ===')
    console.log('Demurrage minutes:', demurrageMinutes)
    console.log('Demurrage amount:', demurrageAmount)
    console.log('Added minutes:', addedMinutes)
    console.log('Deducted minutes:', deductedMinutes)
    
    return {
      demurrageMinutes,
      demurrageAmount,
      addedMinutes,
      deductedMinutes
    }
  } catch (error) {
    console.error('Error calculating demurrage:', error)
    throw new Error(`Failed to calculate demurrage: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = Math.floor(minutes % 60)
  
  let result = ''
  if (days > 0) result += `${days}d `
  if (hours > 0 || days > 0) result += `${hours}h `
  result += `${mins}m`
  
  return result.trim()
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0 
  }).format(Math.abs(amount))
} 