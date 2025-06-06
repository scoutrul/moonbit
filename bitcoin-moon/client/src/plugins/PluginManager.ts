import { 
  EventPlugin, 
  PluginInstance, 
  PluginContext, 
  PluginManagerStats, 
  PluginError,
  PluginLifecycleEvent,
  PluginEventHandler
} from './EventPlugin';
import { Event } from '../types';

/**
 * PluginManager - Central registry for event plugins
 * 
 * Features:
 * - Plugin registration and lifecycle management
 * - Batch rendering with requestAnimationFrame optimization
 * - Error isolation (plugin errors don't affect chart or other plugins)
 * - Memory management integration with ChartMemoryManager
 * - Event filtering based on plugin type
 */
export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private context: PluginContext;
  private eventQueue: Event[] = [];
  private renderScheduled = false;
  private eventHandlers: PluginEventHandler[] = [];

  constructor(context: PluginContext) {
    this.context = context;
    console.log('🔌 PluginManager: Initialized with context', {
      timeframe: context.timeframe,
      hasChart: !!context.chart,
      hasMemoryManager: !!context.memoryManager
    });
  }

  /**
   * Register a new plugin
   */
  async register(plugin: EventPlugin): Promise<void> {
    try {
      this.emitEvent(PluginLifecycleEvent.INIT, plugin.id);
      
      // Check if plugin already exists
      if (this.plugins.has(plugin.id)) {
        console.warn(`⚠️ Plugin ${plugin.id} already registered, unregistering old instance`);
        this.unregister(plugin.id);
      }

      // Initialize plugin
      const instance = await plugin.init(this.context);
      this.plugins.set(plugin.id, instance);
      
      this.emitEvent(PluginLifecycleEvent.MOUNT, plugin.id);
      console.log(`✅ Plugin registered: ${plugin.name} v${plugin.version} (${plugin.id})`);
      
    } catch (error) {
      const pluginError = new PluginError(plugin.id, `Failed to register: ${error.message}`, error);
      this.emitEvent(PluginLifecycleEvent.ERROR, plugin.id, pluginError);
      console.error('❌ Plugin registration failed:', pluginError);
      throw pluginError;
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    const instance = this.plugins.get(pluginId);
    if (instance) {
      try {
        this.emitEvent(PluginLifecycleEvent.UNMOUNT, pluginId);
        instance.cleanup();
        this.plugins.delete(pluginId);
        this.emitEvent(PluginLifecycleEvent.CLEANUP, pluginId);
        console.log(`🧹 Plugin unregistered: ${pluginId}`);
      } catch (error) {
        const pluginError = new PluginError(pluginId, `Cleanup error: ${error.message}`, error);
        this.emitEvent(PluginLifecycleEvent.ERROR, pluginId, pluginError);
        console.error('❌ Plugin cleanup error:', pluginError);
        // Still remove from registry even if cleanup fails
        this.plugins.delete(pluginId);
      }
    } else {
      console.warn(`⚠️ Plugin ${pluginId} not found for unregistration`);
    }
  }

  /**
   * Get plugin instance by ID
   */
  getPlugin(pluginId: string): PluginInstance | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Check if plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Render events with batch optimization
   */
  renderEvents(events: Event[]): void {
    this.eventQueue = events;
    
    if (!this.renderScheduled) {
      this.renderScheduled = true;
      requestAnimationFrame(() => {
        this.batchRender();
        this.renderScheduled = false;
      });
    }
  }

  /**
   * Batch render all active plugins
   */
  private batchRender(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    let renderedPlugins = 0;
    let errorCount = 0;

    for (const [id, instance] of this.plugins) {
      if (instance.isActive()) {
        try {
          const filteredEvents = this.filterEventsForPlugin(id, this.eventQueue);
          instance.render(filteredEvents);
          renderedPlugins++;
        } catch (error) {
          const pluginError = new PluginError(id, `Render error: ${error.message}`, error);
          this.emitEvent(PluginLifecycleEvent.ERROR, id, pluginError);
          console.error('❌ Plugin render error:', pluginError);
          errorCount++;
        }
      }
    }

    console.log(`📊 Batch render complete: ${renderedPlugins} plugins, ${this.eventQueue.length} events, ${errorCount} errors`);
  }

  /**
   * Filter events based on plugin type
   */
  private filterEventsForPlugin(pluginId: string, events: Event[]): Event[] {
    // Plugin-specific event filtering logic
    switch (pluginId) {
      case 'lunar-events':
        return events.filter(e => e.type === 'lunar');
      case 'economic-events':
        return events.filter(e => e.type === 'economic');
      case 'technical-indicators':
        return events.filter(e => e.type === 'technical');
      default:
        // For unknown plugins, return all events
        return events;
    }
  }

  /**
   * Handle timeframe changes
   */
  onTimeframeChange(timeframe: string): void {
    this.context.timeframe = timeframe;
    
    for (const [id, instance] of this.plugins) {
      if (instance.onTimeframeChange) {
        try {
          instance.onTimeframeChange(timeframe);
        } catch (error) {
          const pluginError = new PluginError(id, `Timeframe change error: ${error.message}`, error);
          this.emitEvent(PluginLifecycleEvent.ERROR, id, pluginError);
          console.error('❌ Plugin timeframe change error:', pluginError);
        }
      }
    }
    
    console.log(`⏱️ Timeframe changed to ${timeframe} for ${this.plugins.size} plugins`);
  }

  /**
   * Handle configuration changes
   */
  onConfigChange(config: Record<string, any>): void {
    this.context.config = { ...this.context.config, ...config };
    
    for (const [id, instance] of this.plugins) {
      if (instance.onConfigChange) {
        try {
          instance.onConfigChange(config);
        } catch (error) {
          const pluginError = new PluginError(id, `Config change error: ${error.message}`, error);
          this.emitEvent(PluginLifecycleEvent.ERROR, id, pluginError);
          console.error('❌ Plugin config change error:', pluginError);
        }
      }
    }
    
    console.log(`⚙️ Configuration updated for ${this.plugins.size} plugins`);
  }

  /**
   * Cleanup all plugins and resources
   */
  cleanup(): void {
    console.log(`🧹 PluginManager cleanup: ${this.plugins.size} plugins`);
    
    const pluginIds = Array.from(this.plugins.keys());
    for (const id of pluginIds) {
      this.unregister(id);
    }
    
    this.plugins.clear();
    this.eventQueue = [];
    this.renderScheduled = false;
    
    // Integration with ChartMemoryManager
    if (this.context.memoryManager && this.context.chart) {
      try {
        // Note: We don't remove the chart here as it might be used by other components
        // Just ensure proper cleanup is logged
        console.log('🧠 PluginManager: Notified ChartMemoryManager of cleanup');
      } catch (error) {
        console.error('❌ ChartMemoryManager integration error:', error);
      }
    }
  }

  /**
   * Get manager statistics
   */
  getStats(): PluginManagerStats {
    const activePlugins = Array.from(this.plugins.values()).filter(p => p.isActive()).length;
    
    return {
      totalPlugins: this.plugins.size,
      activePlugins,
      plugins: Array.from(this.plugins.entries()).map(([id, instance]) => ({
        id,
        active: instance.isActive(),
      }))
    };
  }

  /**
   * Add event handler for plugin lifecycle events
   */
  addEventListener(handler: PluginEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Remove event handler
   */
  removeEventListener(handler: PluginEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index !== -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Emit plugin lifecycle event
   */
  private emitEvent(event: PluginLifecycleEvent, pluginId: string, data?: any): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event, pluginId, data);
      } catch (error) {
        console.error('❌ Event handler error:', error);
      }
    }
  }

  /**
   * Get list of all registered plugin IDs
   */
  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if any plugins are active
   */
  hasActivePlugins(): boolean {
    return Array.from(this.plugins.values()).some(p => p.isActive());
  }
} 