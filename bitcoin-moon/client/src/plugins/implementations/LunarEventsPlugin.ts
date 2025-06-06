import { EventPlugin, PluginContext, PluginInstance } from '../EventPlugin';
import { Event } from '../../types';
import { ISeriesApi, UTCTimestamp, SeriesMarker } from 'lightweight-charts';

/**
 * Configuration for LunarEventsPlugin
 */
interface LunarEventsConfig {
  /** Whether to show full moon events */
  showFullMoon: boolean;
  /** Whether to show new moon events */
  showNewMoon: boolean;
  /** Whether to show quarter moon events */
  showQuarterMoon: boolean;
  /** Color for full moon markers */
  fullMoonColor: string;
  /** Color for new moon markers */
  newMoonColor: string;
  /** Color for quarter moon markers */
  quarterMoonColor: string;
  /** Marker size */
  markerSize: number;
  /** Whether to show text labels */
  showLabels: boolean;
}

/**
 * Default configuration for LunarEventsPlugin
 */
const DEFAULT_CONFIG: LunarEventsConfig = {
  showFullMoon: true,
  showNewMoon: true,
  showQuarterMoon: true,
  fullMoonColor: '#FFD700', // Gold
  newMoonColor: '#4A5568', // Dark gray
  quarterMoonColor: '#C0C0C0', // Silver
  markerSize: 2,
  showLabels: true
};

/**
 * LunarEventsPlugin - Displays lunar phase events on the chart
 * 
 * Features:
 * - Renders lunar events as markers on chart
 * - Configurable colors and visibility for different moon phases
 * - Timeframe-aware visibility (hides on short timeframes to avoid clutter)
 * - Lightweight Charts markers API integration
 * - Memory management and cleanup
 */
export const createLunarEventsPlugin = (userConfig?: Partial<LunarEventsConfig>): EventPlugin => ({
  id: 'lunar-events',
  name: 'Lunar Events',
  version: '1.0.0',
  
  init: async (context: PluginContext): Promise<PluginInstance> => {
    const config: LunarEventsConfig = { ...DEFAULT_CONFIG, ...userConfig };
    let markersApi: ISeriesApi<'Line'> | null = null;
    let isActive = true;
    let currentEvents: Event[] = [];
    
    try {
      // Create a transparent line series for markers
      // This is the standard approach in Lightweight Charts for adding markers
      const markersLine = context.chart.addLineSeries({
        color: 'transparent',
        lineWidth: 1,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
        visible: true
      });
      
      markersApi = markersLine;
      
      console.log('🌙 LunarEventsPlugin: Initialized with config', config);
      
    } catch (error) {
      console.error('❌ LunarEventsPlugin: Initialization error:', error);
      throw error;
    }
    
    return {
      render: (events: Event[]) => {
        if (!markersApi || !isActive) {
          console.warn('⚠️ LunarEventsPlugin: Cannot render, plugin not active');
          return;
        }
        
        try {
          // Filter lunar events
          const lunarEvents = events.filter(event => event.type === 'lunar');
          currentEvents = lunarEvents;
          
          // Convert events to markers
          const markers: SeriesMarker<UTCTimestamp>[] = lunarEvents
            .filter(event => shouldShowEvent(event, config))
            .map(event => createMarkerFromEvent(event, config))
            .filter(marker => marker !== null) as SeriesMarker<UTCTimestamp>[];
          
          // Set markers on the series
          markersApi.setMarkers(markers);
          
          console.log(`🌙 LunarEventsPlugin: Rendered ${markers.length} lunar events (${lunarEvents.length} total)`);
          
        } catch (error) {
          console.error('❌ LunarEventsPlugin: Render error:', error);
        }
      },
      
      cleanup: () => {
        if (markersApi && context.chart) {
          try {
            context.chart.removeSeries(markersApi);
            markersApi = null;
            isActive = false;
            currentEvents = [];
            console.log('🧹 LunarEventsPlugin: Cleaned up successfully');
          } catch (error) {
            console.error('❌ LunarEventsPlugin: Cleanup error:', error);
          }
        }
      },
      
      onTimeframeChange: (timeframe: string) => {
        if (!markersApi) return;
        
        try {
          // Hide markers on short timeframes to avoid clutter
          const visible = shouldShowForTimeframe(timeframe);
          markersApi.applyOptions({ visible });
          
          console.log(`🌙 LunarEventsPlugin: Timeframe changed to ${timeframe}, visible: ${visible}`);
          
        } catch (error) {
          console.error('❌ LunarEventsPlugin: Timeframe change error:', error);
        }
      },
      
      onConfigChange: (newConfig: Record<string, any>) => {
        try {
          // Update local config
          Object.assign(config, newConfig);
          
          // Re-render with new config using the instance's render method
          const instance = this as PluginInstance;
          if (currentEvents.length > 0) {
            instance.render(currentEvents);
          }
          
          console.log('🌙 LunarEventsPlugin: Configuration updated', newConfig);
          
        } catch (error) {
          console.error('❌ LunarEventsPlugin: Config change error:', error);
        }
      },
      
      isActive: () => isActive && !!markersApi
    };
  }
});

/**
 * Determine if an event should be shown based on configuration
 */
function shouldShowEvent(event: Event, config: LunarEventsConfig): boolean {
  if (!event.subtype) return true;
  
  const subtype = event.subtype.toLowerCase();
  
  if (subtype.includes('full') && !config.showFullMoon) return false;
  if (subtype.includes('new') && !config.showNewMoon) return false;
  if (subtype.includes('quarter') && !config.showQuarterMoon) return false;
  
  return true;
}

/**
 * Create a marker from a lunar event
 */
function createMarkerFromEvent(event: Event, config: LunarEventsConfig): SeriesMarker<UTCTimestamp> | null {
  try {
    // Get marker color based on moon phase
    const color = getMarkerColor(event, config);
    
    // Get marker text
    const text = config.showLabels ? getMarkerText(event) : '';
    
    return {
      time: event.timestamp as UTCTimestamp,
      position: 'inBar' as const,
      color,
      shape: 'circle' as const,
      text,
      size: config.markerSize
    };
    
  } catch (error) {
    console.error('❌ LunarEventsPlugin: Error creating marker for event:', event, error);
    return null;
  }
}

/**
 * Get marker color based on moon phase
 */
function getMarkerColor(event: Event, config: LunarEventsConfig): string {
  if (!event.subtype) return config.quarterMoonColor;
  
  const subtype = event.subtype.toLowerCase();
  
  if (subtype.includes('full')) return config.fullMoonColor;
  if (subtype.includes('new')) return config.newMoonColor;
  if (subtype.includes('quarter')) return config.quarterMoonColor;
  
  return config.quarterMoonColor;
}

/**
 * Get marker text for display
 */
function getMarkerText(event: Event): string {
  if (event.name) return event.name;
  if (event.subtype) return event.subtype;
  return event.title || '🌙';
}

/**
 * Determine if markers should be visible for the given timeframe
 */
function shouldShowForTimeframe(timeframe: string): boolean {
  // Hide on very short timeframes to avoid clutter
  const shortTimeframes = ['1H', '4H', '6H'];
  return !shortTimeframes.includes(timeframe.toUpperCase());
}

/**
 * Helper function to convert date string to timestamp
 */
export function dateToTimestamp(dateString: string): number {
  try {
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000); // Convert to seconds
  } catch (error) {
    console.error('❌ LunarEventsPlugin: Error converting date:', dateString, error);
    return Math.floor(Date.now() / 1000); // Fallback to current time
  }
} 