import { IChartApi } from 'lightweight-charts';

interface ChartManagerStats {
  totalCharts: number;
  charts: Array<{
    id: string;
    containerId: string;
    idleTime: number;
    isDisposed: boolean;
  }>;
}

interface ChartInstance {
  id: string;
  chart: IChartApi;
  createdAt: number;
  lastAccessedAt: number;
  containerId: string;
}

export class ChartMemoryManager {
  private static instance: ChartMemoryManager;
  private charts: Map<string, { chart: any; containerId: string; lastAccessed: number; isDisposed: boolean }> = new Map();
  private maxInstances = 5; // Maximum number of chart instances
  private maxIdleTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  private cleanupInterval: number | null = null;
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly MAX_IDLE_TIME = 60000; // 1 minute

  private constructor() {
    console.log('🧠 ChartMemoryManager: Singleton instance created');
    this.startCleanupInterval();
  }

  static getInstance(): ChartMemoryManager {
    if (!ChartMemoryManager.instance) {
      ChartMemoryManager.instance = new ChartMemoryManager();
    }
    return ChartMemoryManager.instance;
  }

  registerChart(chartId: string, chart: any, containerId: string): void {
    console.log(`📊 ChartMemoryManager: Registering chart ${chartId} with container ${containerId}`);
    
    // If chart with this ID already exists, clean it up first
    if (this.charts.has(chartId)) {
      console.log(`⚠️ Chart ${chartId} already exists, cleaning up old instance`);
      this.removeChart(chartId);
    }

    this.charts.set(chartId, {
      chart,
      containerId,
      lastAccessed: Date.now(),
      isDisposed: false
    });
  }

  accessChart(id: string): IChartApi | null {
    const instance = this.charts.get(id);
    if (instance) {
      instance.lastAccessed = Date.now();
      return instance.chart;
    }
    return null;
  }

  hasChart(chartId: string): boolean {
    return this.charts.has(chartId);
  }

  isChartDisposed(chartId: string): boolean {
    const chartInfo = this.charts.get(chartId);
    return chartInfo ? chartInfo.isDisposed : true; // If not found, consider it disposed
  }

  removeChart(chartId: string): void {
    const chartInfo = this.charts.get(chartId);
    if (!chartInfo) {
      console.log(`⚠️ ChartMemoryManager: Chart ${chartId} not found in registry`);
      return;
    }

    console.log(`🧹 ChartMemoryManager: Removing chart ${chartId}`);
    
    try {
      // Check if chart is already disposed
      if (chartInfo.isDisposed) {
        console.log(`✅ Chart ${chartId} already marked as disposed, skipping removal`);
        this.charts.delete(chartId);
        return;
      }

      // Try to check if chart is still valid before removing
      const chart = chartInfo.chart;
      if (chart && typeof chart.remove === 'function') {
        // Check if chart is already disposed by trying to access a property
        try {
          // This will throw if chart is disposed
          chart.timeScale();
          console.log(`🔄 Removing chart ${chartId} - chart is still valid`);
          chart.remove();
          chartInfo.isDisposed = true;
        } catch (disposedError) {
          if (disposedError.message.includes('disposed')) {
            console.log(`✅ Chart ${chartId} already disposed externally, just removing from registry`);
            chartInfo.isDisposed = true;
          } else {
            console.error(`❌ Error checking chart ${chartId} state:`, disposedError);
            // Try to remove anyway
            chart.remove();
            chartInfo.isDisposed = true;
          }
        }
      } else {
        console.log(`⚠️ Chart ${chartId} has no remove method or is invalid`);
      }
    } catch (error) {
      if (error.message.includes('disposed')) {
        console.log(`✅ Chart ${chartId} was already disposed: ${error.message}`);
        chartInfo.isDisposed = true;
      } else {
        console.error(`❌ Error removing chart ${chartId}:`, error);
      }
    } finally {
      // Always remove from registry
      this.charts.delete(chartId);
    }
  }

  private removeOldestChart(): void {
    let oldestId = '';
    let oldestTime = Date.now();

    for (const [id, instance] of this.charts) {
      if (instance.lastAccessed < oldestTime) {
        oldestTime = instance.lastAccessed;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.removeChart(oldestId);
    }
  }

  private startCleanupInterval(): void {
    // Run cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleCharts();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupIdleCharts(): void {
    const now = Date.now();
    const chartsToRemove: string[] = [];

    for (const [id, instance] of this.charts) {
      // Check if chart has been idle for too long
      if (now - instance.lastAccessed > this.MAX_IDLE_TIME) {
        chartsToRemove.push(id);
      }
      
      // Also check if the container still exists in DOM
      const container = document.getElementById(instance.containerId);
      if (!container) {
        chartsToRemove.push(id);
      }
    }

    chartsToRemove.forEach(id => {
      console.log(`Cleaning up idle chart: ${id}`);
      this.removeChart(id);
    });

    if (chartsToRemove.length > 0) {
      console.log(`Memory cleanup completed. Removed ${chartsToRemove.length} charts.`);
    }
  }

  getStats(): ChartManagerStats {
    const now = Date.now();
    const chartStats = Array.from(this.charts.entries()).map(([id, instance]) => ({
      id,
      containerId: instance.containerId,
      idleTime: now - instance.lastAccessed,
      isDisposed: instance.isDisposed
    }));

    return {
      totalCharts: this.charts.size,
      charts: chartStats
    };
  }

  destroy(): void {
    // Clean up all charts and intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Remove all remaining charts
    for (const id of this.charts.keys()) {
      this.removeChart(id);
    }

    ChartMemoryManager.instance = undefined as any;
  }

  // Configuration methods
  setMaxInstances(max: number): void {
    this.maxInstances = Math.max(1, max);
  }

  setMaxIdleTime(milliseconds: number): void {
    this.maxIdleTime = Math.max(30000, milliseconds); // Minimum 30 seconds
  }

  updateLastAccessed(id: string): void {
    const instance = this.charts.get(id);
    if (instance) {
      instance.lastAccessed = Date.now();
    }
  }
}

// Hook for React components
export const useChartMemoryManager = () => {
  return ChartMemoryManager.getInstance();
};

export default ChartMemoryManager; 