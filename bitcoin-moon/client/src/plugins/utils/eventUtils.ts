import { Event } from '../../types';

/**
 * Event utility functions for plugin system
 */

/**
 * Convert date string to timestamp for chart rendering
 */
export function dateToTimestamp(dateString: string): number {
  try {
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000); // Convert to seconds
  } catch (error) {
    console.error('❌ eventUtils: Error converting date:', dateString, error);
    return Math.floor(Date.now() / 1000); // Fallback to current time
  }
}

/**
 * Normalize event data to ensure consistent format
 */
export function normalizeEvent(event: Event): Event {
  return {
    ...event,
    // Ensure timestamp exists
    timestamp: event.timestamp || dateToTimestamp(event.date),
    // Ensure type exists
    type: event.type || 'custom',
    // Ensure name exists for display
    name: event.name || event.title || event.description.slice(0, 20) + '...'
  };
}

/**
 * Filter events by type
 */
export function filterEventsByType(events: Event[], type: Event['type']): Event[] {
  return events.filter(event => event.type === type);
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(
  events: Event[], 
  startTimestamp: number, 
  endTimestamp: number
): Event[] {
  return events.filter(event => {
    const eventTimestamp = event.timestamp || dateToTimestamp(event.date);
    return eventTimestamp >= startTimestamp && eventTimestamp <= endTimestamp;
  });
}

/**
 * Sort events by timestamp
 */
export function sortEventsByTimestamp(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const aTimestamp = a.timestamp || dateToTimestamp(a.date);
    const bTimestamp = b.timestamp || dateToTimestamp(b.date);
    return aTimestamp - bTimestamp;
  });
}

/**
 * Group events by type
 */
export function groupEventsByType(events: Event[]): Record<string, Event[]> {
  return events.reduce((groups, event) => {
    const type = event.type || 'custom';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(event);
    return groups;
  }, {} as Record<string, Event[]>);
}

/**
 * Create a unique key for event
 */
export function createEventKey(event: Event): string {
  return `${event.type}-${event.id || event.date}-${event.title}`;
}

/**
 * Validate event data
 */
export function validateEvent(event: Event): boolean {
  if (!event.id || !event.title || !event.date) {
    console.warn('⚠️ eventUtils: Invalid event missing required fields:', event);
    return false;
  }
  
  // Check if date is valid
  if (isNaN(new Date(event.date).getTime())) {
    console.warn('⚠️ eventUtils: Invalid event date:', event.date);
    return false;
  }
  
  return true;
}

/**
 * Deduplicate events by key
 */
export function deduplicateEvents(events: Event[]): Event[] {
  const seen = new Set<string>();
  return events.filter(event => {
    const key = createEventKey(event);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Calculate event density for performance optimization
 */
export function calculateEventDensity(events: Event[], timeRangeSeconds: number): number {
  if (timeRangeSeconds <= 0) return 0;
  return events.length / timeRangeSeconds;
}

/**
 * Throttle events for performance (keep only most important ones)
 */
export function throttleEvents(events: Event[], maxEvents: number = 100): Event[] {
  if (events.length <= maxEvents) {
    return events;
  }
  
  // Sort by importance (important events first, then by date)
  const sorted = [...events].sort((a, b) => {
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    
    const aTimestamp = a.timestamp || dateToTimestamp(a.date);
    const bTimestamp = b.timestamp || dateToTimestamp(b.date);
    return bTimestamp - aTimestamp; // Most recent first
  });
  
  return sorted.slice(0, maxEvents);
} 