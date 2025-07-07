import { MaritimeEventCode } from '../types';
import type { EventMapping, MaritimeEventCategories } from '../types';

/**
 * Maritime event mappings - organized and deduplicated
 * This is the new organized structure that replaces the old JSON approach
 */
export const MARITIME_EVENT_MAPPINGS: EventMapping[] = [
  // Notice events
  {
    code: MaritimeEventCode.NOR_TENDERED,
    label: 'NOR Tendered'
  },
  {
    code: MaritimeEventCode.NOR_ACCEPTED,
    label: 'NOR Accepted'
  },
  
  // Berthing events
  {
    code: MaritimeEventCode.BERTHED,
    label: 'Vessel Berthed'
  },
  {
    code: MaritimeEventCode.UNBERTHED,
    label: 'Vessel Unberthed'
  },
  
  // Cargo operation events
  {
    code: MaritimeEventCode.DISCHARGE_COMMENCED,
    label: 'Discharge Commenced'
  },
  {
    code: MaritimeEventCode.DISCHARGE_COMPLETED,
    label: 'Discharge Completed'
  },
  {
    code: MaritimeEventCode.LOAD_COMMENCED,
    label: 'Load Commenced'
  },
  {
    code: MaritimeEventCode.LOAD_COMPLETED,
    label: 'Load Completed'
  },
  {
    code: MaritimeEventCode.LOADING_SUSPEND,
    label: 'Load - Suspend'
  },
  {
    code: MaritimeEventCode.DISCHARGING_SUSPEND,
    label: 'Discharge - Suspend'
  },
  
  // Completion/technical events
  {
    code: MaritimeEventCode.SECURING_GANGWAY_END,
    label: 'Secure gangway - complete'
  },
  {
    code: MaritimeEventCode.MOORING_VESSEL_END,
    label: 'Mooring - complete (all fast)'
  },
  {
    code: MaritimeEventCode.HEAVING_ANCHOR_END,
    label: 'Heave anchor - complete'
  },
  {
    code: MaritimeEventCode.DISCONNECTING_HOSES_END,
    label: 'Disconnect hoses / arms - complete'
  },
  
  // Weather/waiting events
  {
    code: MaritimeEventCode.AWAITING,
    label: 'Awaiting Weather'
  },
  
  // Additional operational events
  { code: 'berthing_commenced' as MaritimeEventCode, label: 'First Line Ashore' },
  { code: 'anchored' as MaritimeEventCode, label: 'Anchored' },
  { code: 'connecting_hoses_end' as MaritimeEventCode, label: 'Hoses Connected' },
  { code: 'pilot_onboard' as MaritimeEventCode, label: 'Pilot Onboard' },
  { code: 'pilot_off' as MaritimeEventCode, label: 'Pilot Disembarked' },
  { code: 'tugs_alongside' as MaritimeEventCode, label: 'Tugs Made Fast' },
  { code: 'free_pratique' as MaritimeEventCode, label: 'Free Pratique Granted' },
  { code: 'end_sea_passage' as MaritimeEventCode, label: 'End of Sea Passage' },
  { code: 'ullage_gauge_complete' as MaritimeEventCode, label: 'Ullage/Gauge Complete' },
  { code: 'samples_complete' as MaritimeEventCode, label: 'Samples Complete' },
  { code: 'calculate_cargo_complete' as MaritimeEventCode, label: 'Calculate Cargo Complete' },
  { code: 'inert_purge_complete' as MaritimeEventCode, label: 'Inert/Purge Complete' },
  { code: 'inspect_holds_complete' as MaritimeEventCode, label: 'Inspect Holds Complete' },
  { code: 'pre_ops_meeting_complete' as MaritimeEventCode, label: 'Pre-ops Meeting Complete' },
  { code: 'prepare_documents_complete' as MaritimeEventCode, label: 'Documents Prepared' },
  { code: 'surveyor_embark' as MaritimeEventCode, label: 'Surveyor Embarked' },
  { code: 'surveyor_disembark' as MaritimeEventCode, label: 'Surveyor Disembarked' },
  
  // Specific events seen in the data
  { code: 'pilot_embark_pob' as MaritimeEventCode, label: 'Pilot - Embark POB' },
  { code: 'drop_anchor_complete' as MaritimeEventCode, label: 'Drop Anchor - Complete' },
  { code: 'heave_anchor_complete_anchors_aweigh' as MaritimeEventCode, label: 'Heave Anchor - Complete Anchors Aweigh' },
  { code: 'tug_s_alongside' as MaritimeEventCode, label: 'Tugs - Alongside' },
  { code: 'mooring_commence_first_line' as MaritimeEventCode, label: 'Mooring - Commence First Line' },
  { code: 'mooring_vessel_end' as MaritimeEventCode, label: 'All Fast' },
  { code: 'secure_gangway_complete' as MaritimeEventCode, label: 'Secure Gangway - Complete' },
  { code: 'pre_ops_meeting_commence' as MaritimeEventCode, label: 'Pre-ops Meeting - Commence' }
];

/**
 * Event categories for better organization
 */
export const MARITIME_EVENT_CATEGORIES: MaritimeEventCategories = {
  notices: [
    MaritimeEventCode.NOR_TENDERED,
    MaritimeEventCode.NOR_ACCEPTED
  ],
  berthing: [
    MaritimeEventCode.BERTHED,
    MaritimeEventCode.UNBERTHED
  ],
  cargoOperations: [
    MaritimeEventCode.DISCHARGE_COMMENCED,
    MaritimeEventCode.DISCHARGE_COMPLETED,
    MaritimeEventCode.LOAD_COMMENCED,
    MaritimeEventCode.LOAD_COMPLETED,
    MaritimeEventCode.LOADING_SUSPEND,
    MaritimeEventCode.DISCHARGING_SUSPEND
  ],
  completion: [
    MaritimeEventCode.SECURING_GANGWAY_END,
    MaritimeEventCode.MOORING_VESSEL_END,
    MaritimeEventCode.HEAVING_ANCHOR_END,
    MaritimeEventCode.DISCONNECTING_HOSES_END
  ],
  weather: [
    MaritimeEventCode.AWAITING
  ]
};

/**
 * Helper function to get event mapping by code
 */
export function getEventMappingByCode(code: MaritimeEventCode): EventMapping | undefined {
  return MARITIME_EVENT_MAPPINGS.find(mapping => mapping.code === code);
}

/**
 * Helper function to get event mapping by label - with fuzzy matching
 */
export function getEventMappingByLabel(label: string): EventMapping | undefined {
  if (!label) return undefined;
  
  // First try exact match
  const exactMatch = MARITIME_EVENT_MAPPINGS.find(mapping => 
    mapping.label.toLowerCase() === label.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Then try to find by code (in case label is actually a code)
  const codeMatch = MARITIME_EVENT_MAPPINGS.find(mapping => 
    mapping.code === label.toLowerCase()
  );
  if (codeMatch) return codeMatch;
  
  // Fuzzy matching for similar labels
  const lowerLabel = label.toLowerCase();
  const fuzzyMatch = MARITIME_EVENT_MAPPINGS.find(mapping => {
    const mappingLabel = mapping.label.toLowerCase();
    // Check if either contains the other as substring
    return mappingLabel.includes(lowerLabel) || lowerLabel.includes(mappingLabel);
  });
  if (fuzzyMatch) return fuzzyMatch;
  
  // Enhanced pattern matching for common maritime events
  if (lowerLabel.includes('pilot') && lowerLabel.includes('embark')) {
    return { code: 'pilot_onboard' as MaritimeEventCode, label: 'Pilot Embarked' };
  }
  if (lowerLabel.includes('pilot') && lowerLabel.includes('off')) {
    return { code: 'pilot_off' as MaritimeEventCode, label: 'Pilot Disembarked' };
  }
  if (lowerLabel.includes('heave') && lowerLabel.includes('anchor')) {
    return { code: 'heaving_anchor_end' as MaritimeEventCode, label: 'Heave Anchor - Complete' };
  }
  if (lowerLabel.includes('tug') && lowerLabel.includes('alongside')) {
    return { code: 'tugs_alongside' as MaritimeEventCode, label: 'Tugs - Alongside' };
  }
  if (lowerLabel.includes('mooring') && lowerLabel.includes('commence')) {
    return { code: 'berthing_commenced' as MaritimeEventCode, label: 'Mooring - Commence First Line' };
  }
  if (lowerLabel.includes('mooring') && lowerLabel.includes('end')) {
    return { code: 'mooring_vessel_end' as MaritimeEventCode, label: 'All Fast' };
  }
  if (lowerLabel.includes('secure') && lowerLabel.includes('gangway')) {
    return { code: 'securing_gangway_end' as MaritimeEventCode, label: 'Secure Gangway - Complete' };
  }
  if (lowerLabel.includes('surveyor') && lowerLabel.includes('embark')) {
    return { code: 'surveyor_embark' as MaritimeEventCode, label: 'Surveyor - Embark' };
  }
  if (lowerLabel.includes('pre') && lowerLabel.includes('ops') && lowerLabel.includes('meeting')) {
    return { code: 'pre_ops_meeting_complete' as MaritimeEventCode, label: 'Pre-ops Meeting - Commence' };
  }
  
  // If no match found, create a cleaned display label
  const cleanedLabel = label
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\//g, ' / ') // Clean up slashes
    .replace(/-/g, ' - ') // Clean up hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .split(' ')
    .map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'pob') return 'POB';
      if (word.toLowerCase() === 'nor') return 'NOR';
      if (word.toLowerCase() === 'eosp') return 'EOSP';
      if (word.toLowerCase() === 'sof') return 'SOF';
      if (word.toLowerCase() === 'eta') return 'ETA';
      if (word.toLowerCase() === 'etd') return 'ETD';
      // Regular title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  return {
    code: label.toLowerCase().replace(/\s+/g, '_') as MaritimeEventCode,
    label: cleanedLabel
  };
}

/**
 * Helper function to get all event codes for a specific category
 */
export function getEventCodesByCategory(category: keyof MaritimeEventCategories): MaritimeEventCode[] {
  return MARITIME_EVENT_CATEGORIES[category];
}

/**
 * Helper function to check if an event code belongs to a specific category
 */
export function isEventInCategory(eventCode: MaritimeEventCode, category: keyof MaritimeEventCategories): boolean {
  return MARITIME_EVENT_CATEGORIES[category].includes(eventCode);
}

/**
 * Get all available event codes as an array
 */
export function getAllEventCodes(): MaritimeEventCode[] {
  return Object.values(MaritimeEventCode);
}

/**
 * Get all available event labels as an array
 */
export function getAllEventLabels(): string[] {
  return MARITIME_EVENT_MAPPINGS.map(mapping => mapping.label);
}
