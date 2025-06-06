/**
 * Plugin System Exports
 * 
 * This file provides a central entry point for all plugin system components
 */

// Core plugin system interfaces and classes
export type {
  EventPlugin,
  PluginInstance,
  PluginContext,
  PluginConfig,
  PluginManagerStats,
  PluginEventHandler
} from './EventPlugin';

export { 
  PluginError, 
  PluginLifecycleEvent 
} from './EventPlugin';

export { PluginManager } from './PluginManager';

// React hooks
export { useEventPlugins } from './hooks/useEventPlugins';

// Plugin implementations
export { createLunarEventsPlugin } from './implementations/LunarEventsPlugin';

// Utilities
export * from './utils/eventUtils';

/**
 * Plugin System Version
 */
export const PLUGIN_SYSTEM_VERSION = '1.0.0';

/**
 * Available Plugin Types
 */
export const PLUGIN_TYPES = {
  LUNAR: 'lunar',
  ECONOMIC: 'economic', 
  TECHNICAL: 'technical',
  CUSTOM: 'custom'
} as const;

/**
 * Plugin System Configuration Defaults
 */
export const DEFAULT_PLUGIN_CONFIG = {
  enabled: true,
  visible: true,
  debug: false
};

/**
 * Re-export Event type for plugin development
 */
export type { Event } from '../types'; 