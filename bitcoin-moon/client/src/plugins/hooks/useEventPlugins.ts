import { useState, useEffect, useCallback, useMemo } from 'react';
import { IChartApi } from 'lightweight-charts';
import { PluginManager } from '../PluginManager';
import { EventPlugin, PluginManagerStats, PluginConfig } from '../EventPlugin';
import { ChartMemoryManager } from '../../components/organisms/charts/ChartMemoryManager';
import { Event } from '../../types';

/**
 * Options for useEventPlugins hook
 */
interface UseEventPluginsOptions {
  /** Current timeframe */
  timeframe?: string;
  /** Plugin configuration */
  config?: Record<string, any>;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Return type for useEventPlugins hook
 */
interface UseEventPluginsReturn {
  /** Plugin manager instance */
  pluginManager: PluginManager | null;
  /** Whether plugins are ready */
  isReady: boolean;
  /** Plugin system error */
  error: string | null;
  /** Register a new plugin */
  registerPlugin: (plugin: EventPlugin) => Promise<void>;
  /** Unregister a plugin */
  unregisterPlugin: (pluginId: string) => void;
  /** Render events on all active plugins */
  renderEvents: (events: Event[]) => void;
  /** Handle timeframe changes */
  onTimeframeChange: (timeframe: string) => void;
  /** Handle configuration changes */
  onConfigChange: (config: Record<string, any>) => void;
  /** Get plugin manager statistics */
  getStats: () => PluginManagerStats | null;
  /** Loading state */
  loading: boolean;
}

/**
 * React hook for event plugins integration with BaseChart
 */
export const useEventPlugins = (
  chart: IChartApi | null,
  options: UseEventPluginsOptions = {}
): UseEventPluginsReturn => {
  const { timeframe = '1D', config = {}, debug = false } = options;
  
  // Memoize config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [JSON.stringify(config)]);
  
  // State
  const [pluginManager, setPluginManager] = useState<PluginManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize PluginManager when chart is available
  useEffect(() => {
    if (chart) {
      try {
        setLoading(true);
        setError(null);
        
        const memoryManager = ChartMemoryManager.getInstance();
        const manager = new PluginManager({
          chart,
          memoryManager,
          timeframe,
          config: memoizedConfig
        });
        
        setPluginManager(manager);
        setIsReady(true);
        setLoading(false);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to initialize PluginManager: ${errorMessage}`);
        setLoading(false);
        console.error('❌ useEventPlugins: Initialization failed:', err);
      }
    } else {
      setPluginManager(null);
      setIsReady(false);
      setError(null);
      setLoading(false);
    }
  }, [chart, timeframe, memoizedConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pluginManager) {
        try {
          pluginManager.cleanup();
        } catch (err) {
          console.error('❌ useEventPlugins: Cleanup error:', err);
        }
      }
    };
  }, [pluginManager]);

  // Register plugin
  const registerPlugin = useCallback(async (plugin: EventPlugin) => {
    if (!pluginManager) {
      throw new Error('PluginManager not ready');
    }
    
    try {
      await pluginManager.register(plugin);
    } catch (err) {
      const errorMessage = `Failed to register plugin ${plugin.id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [pluginManager]);

  // Unregister plugin
  const unregisterPlugin = useCallback((pluginId: string) => {
    if (!pluginManager) {
      return;
    }
    
    try {
      pluginManager.unregister(pluginId);
    } catch (err) {
      const errorMessage = `Failed to unregister plugin ${pluginId}: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error('❌ useEventPlugins: Unregister error:', err);
    }
  }, [pluginManager]);

  // Render events
  const renderEvents = useCallback((events: Event[]) => {
    if (!pluginManager || !isReady) {
      return;
    }
    
    try {
      pluginManager.renderEvents(events);
    } catch (err) {
      const errorMessage = `Failed to render events: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error('❌ useEventPlugins: Render error:', err);
    }
  }, [pluginManager, isReady]);

  // Handle timeframe changes
  const onTimeframeChange = useCallback((newTimeframe: string) => {
    if (!pluginManager) {
      return;
    }
    
    try {
      pluginManager.onTimeframeChange(newTimeframe);
    } catch (err) {
      const errorMessage = `Failed to change timeframe: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error('❌ useEventPlugins: Timeframe change error:', err);
    }
  }, [pluginManager]);

  // Handle configuration changes
  const onConfigChange = useCallback((newConfig: Record<string, any>) => {
    if (!pluginManager) {
      return;
    }
    
    try {
      pluginManager.onConfigChange(newConfig);
    } catch (err) {
      const errorMessage = `Failed to change config: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error('❌ useEventPlugins: Config change error:', err);
    }
  }, [pluginManager]);

  // Get statistics
  const getStats = useCallback((): PluginManagerStats | null => {
    if (!pluginManager) {
      return null;
    }
    
    try {
      return pluginManager.getStats();
    } catch (err) {
      console.error('❌ useEventPlugins: Stats error:', err);
      return null;
    }
  }, [pluginManager]);

  return {
    pluginManager,
    isReady,
    error,
    registerPlugin,
    unregisterPlugin,
    renderEvents,
    onTimeframeChange,
    onConfigChange,
    getStats,
    loading
  };
}; 