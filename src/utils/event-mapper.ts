import eventMappings from '../timestamped_events.json';
import { SofEvent, SofEventDetail, SofEventDetailCode} from "../types";

interface EventMapping {
  code: string;
  label: string;
}

/**
 * Maps an event label to its corresponding event code
 * @param label The event label to map
 * @returns The corresponding event code or null if not found
 */
export function mapEventLabelToCode(label: string): string  {
  if (!label) return "none";
  
  // Find the mapping with the matching label (exact or close match)
  const exactMapping = eventMappings.find((mapping: EventMapping) => 
    mapping.label.toLowerCase() === label.toLowerCase()
  );
  
  if (exactMapping) return exactMapping.code;
  
  // Try partial matching if no exact match
  for (const mapping of eventMappings) {
    const mappingLabel = mapping.label.toLowerCase();
    const inputLabel = label.toLowerCase();
    
    // Check for key terms in the label
    if (mappingLabel.includes('nor') && mappingLabel.includes('tender') && 
        inputLabel.includes('nor') && inputLabel.includes('tender')) {
      return 'nor_tendered';
    }
    if (mappingLabel.includes('nor') && mappingLabel.includes('accept') && 
        inputLabel.includes('nor') && inputLabel.includes('accept')) {
      return 'nor_accepted';
    }
    if ((mappingLabel.includes('berth') || mappingLabel.includes('all fast')) && 
        (inputLabel.includes('berth') || inputLabel.includes('all fast'))) {
      return 'berthed';
    }
    if ((mappingLabel.includes('unberthed') || mappingLabel.includes('last line')) && 
        (inputLabel.includes('unberthed') || inputLabel.includes('last line'))) {
      return 'unberthed';
    }
    // Add more pattern matching as needed
  }
  
  return "none";
}

/**
 * Maps an event code to its corresponding event label
 * @param code The event code to map
 * @returns The corresponding event label or null if not found
 */
export function mapEventCodeToLabel(code: string): string {
  if (!code) return "none";
  
  // Find the mapping with the matching code
  const mapping = eventMappings.find((mapping: EventMapping) => 
    mapping.code === code
  );
  
  return mapping ? mapping.label : "none";
}

/**
 * Augments an event object with an event_code field based on its event_label
 * @param event The event object to augment
 * @returns The augmented event object
 */
export function augmentEventWithCode(event: SofEventDetail): SofEventDetailCode {
  if (!event || !event.event_label) return { ...event, event_code: "none" };
  
  const eventCode = mapEventLabelToCode(event.event_label);
  
  return {
    ...event,
    event_code: eventCode
  };
}

/**
 * Augments an array of events with event_code fields based on their event_labels
 * @param events The array of events to augment
 * @returns The augmented events array
 */
export function augmentEventsWithCodes(events: SofEventDetail[]): SofEventDetailCode[] {
  if (!events || !Array.isArray(events)) return events;
  
  return events.map(event => augmentEventWithCode(event));
}
