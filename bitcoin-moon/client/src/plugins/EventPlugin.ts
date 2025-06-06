import { IChartApi } from 'lightweight-charts';
import { ChartMemoryManager } from '../components/organisms/charts/ChartMemoryManager';
import { Event } from '../types';

/**
 * Plugin Context - Dependencies and configuration for plugin initialization
 */
export interface PluginContext {
  /** Chart API instance from Lightweight Charts */
  chart: IChartApi;
  /** Memory manager for proper cleanup */
  memoryManager: ChartMemoryManager;
  /** Current timeframe (1H, 1D, 1W, etc.) */
  timeframe: string;
  /** Plugin configuration object */
  config?: Record<string, any>;
}

/**
 * Plugin Instance - Active plugin with rendering and lifecycle methods
 */
export interface PluginInstance {
  /** Render events on the chart */
  render(events: Event[]): void;
  /** Cleanup plugin resources */
  cleanup(): void;
  /** Handle timeframe changes */
  onTimeframeChange?(timeframe: string): void;
  /** Handle configuration changes */
  onConfigChange?(config: Record<string, any>): void;
  /** Check if plugin is active */
  isActive(): boolean;
}

/**
 * Plugin Configuration Schema
 */
export interface PluginConfig {
  /** Whether plugin is enabled */
  enabled: boolean;
  /** Whether plugin is visible */
  visible: boolean;
  /** Custom styles for plugin rendering */
  styles?: Record<string, any>;
  /** Plugin-specific configuration */
  [key: string]: any;
}

/**
 * Main EventPlugin Interface - Blueprint for all event plugins
 */
export interface EventPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Initialize plugin and return active instance */
  init(context: PluginContext): Promise<PluginInstance>;
}

/**
 * Plugin Manager Statistics
 */
export interface PluginManagerStats {
  /** Total number of registered plugins */
  totalPlugins: number;
  /** Number of currently active plugins */
  activePlugins: number;
  /** Plugin details */
  plugins: Array<{
    id: string;
    active: boolean;
  }>;
}

/**
 * Plugin Error - Custom error type for plugin-related issues
 */
export class PluginError extends Error {
  constructor(
    public pluginId: string,
    message: string,
    public cause?: Error
  ) {
    super(`Plugin ${pluginId}: ${message}`);
    this.name = 'PluginError';
  }
}

/**
 * Plugin Lifecycle Events
 */
export enum PluginLifecycleEvent {
  INIT = 'init',
  MOUNT = 'mount',
  UNMOUNT = 'unmount',
  CLEANUP = 'cleanup',
  ERROR = 'error'
}

/**
 * Plugin Event Handler Type
 */
export type PluginEventHandler = (event: PluginLifecycleEvent, pluginId: string, data?: any) => void; 