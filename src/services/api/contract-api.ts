import type { ContractData } from '../../types'

let contractDataCache: ContractData | null = null

/**
 * Fetch contract data from the server with caching
 */
export async function fetchContractData(): Promise<ContractData> {
  // Return cached data if available
  if (contractDataCache) {
    return contractDataCache
  }

  try {
    const response = await fetch('/contract.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch contract data: ${response.status} ${response.statusText}`)
    }
    
    contractDataCache = await response.json()
    return contractDataCache as ContractData
  } catch (error) {
    console.error('Error fetching contract data:', error)
    
    // Return a minimal default contract for graceful degradation
    const defaultContract: ContractData = {
      id: "default",
      name: "Default Contract",
      configuration: {
        demurrage: {
          general: {
            rates: [{
              uuid: "default",
              rate: 24000,
              startTime: 0,
              endTime: 0
            }]
          }
        }
      },
      clauses: {
        demurrage: []
      }
    }
    
    contractDataCache = defaultContract
    return defaultContract
  }
}

/**
 * Clear the contract data cache
 */
export function clearContractCache(): void {
  contractDataCache = null
}

/**
 * Get cached contract data if available
 */
export function getCachedContractData(): ContractData | null {
  return contractDataCache
} 