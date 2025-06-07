import React, { useState, useEffect } from 'react';
import { ChartContainer } from '../organisms/ChartContainer';
import { HybridDataFetcher } from '../../services/HybridDataFetcher';
import { MoonPhasePlugin } from '../../plugins/implementations/MoonPhasePlugin';
import { EventPlugin } from '../../plugins';

// ОТЛАДКА: Проверяем импорт lightweight-charts
console.log('🔍 Demo: Проверяем импорт lightweight-charts...');
try {
  import('lightweight-charts').then((module) => {
    console.log('✅ Demo: lightweight-charts успешно импортирован!', module);
    console.log('✅ Demo: createChart доступен:', typeof module.createChart === 'function');
  }).catch((error) => {
    console.error('❌ Demo: Ошибка импорта lightweight-charts:', error);
  });
} catch (error) {
  console.error('❌ Demo: Синхронная ошибка импорта lightweight-charts:', error);
}

export const Demo: React.FC = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currencyInfo, setCurrencyInfo] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1d');

  // Hybrid Data Fetcher для демо
  const dataFetcher = new HybridDataFetcher();

  // Plugin system для демо
  const plugins: EventPlugin[] = [
    new MoonPhasePlugin()
  ];

  const pluginConfig = {
    moonPhase: {
      showLabels: true,
      colorScheme: 'cosmic',
      eventTypes: ['new_moon', 'full_moon', 'first_quarter', 'last_quarter']
    }
  };

  // Загрузка данных
  useEffect(() => {
    const loadDemoData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Demo: Загружаем данные...');
        
        const result = await dataFetcher.fetchDemoData('BTC', timeframe, 200);
        
        console.log('✅ Demo: Данные загружены:', {
          chartData: result.chartData.length,
          currencyInfo: result.currencyInfo,
          events: result.events.length
        });

        setChartData(result.chartData);
        setCurrencyInfo(result.currencyInfo);
        setEvents(result.events);
        
      } catch (err) {
        console.error('❌ Demo: Ошибка загрузки данных:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    loadDemoData();
  }, [timeframe]);

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log('🔄 Demo: Изменение timeframe:', newTimeframe);
    setTimeframe(newTimeframe);
  };

  const handleRefreshData = () => {
    console.log('🔄 Demo: Обновление данных...');
    setChartData([]);
    setCurrencyInfo(null);
    setEvents([]);
    setLoading(true);
    
    // Trigger reload
    setTimeout(() => {
      setTimeframe(prev => prev); // Force re-render
    }, 100);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            MoonBit - Демо экспериментальных возможностей
          </h1>
          <p className="text-moon-silver">
            Полнофункциональный график с котировками Bitcoin, лунными фазами и интерактивными возможностями
          </p>
        </div>

        {/* Info Panel */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-white">MoonBit Demo Chart</h2>
              <div className="flex items-center space-x-4 text-sm text-moon-silver">
                <span>Timeframe: <span className="text-bitcoin-orange">{timeframe}</span></span>
                <span>Data: <span className="text-green-400">{chartData.length} точек</span></span>
                <span>Events: <span className="text-purple-400">{events.length} лунных фаз</span></span>
              </div>
            </div>
            
            {/* Control Panel */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefreshData}
                className="flex items-center space-x-2 px-3 py-1 bg-bitcoin-orange hover:bg-orange-600 text-white rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Data</span>
              </button>
              
              <button
                onClick={() => handleTimeframeChange(timeframe === '1d' ? '1h' : '1d')}
                className="flex items-center space-x-2 px-3 py-1 bg-dark-hover hover:bg-gray-600 text-white rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Change Timeframe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-widget">
          <ChartContainer
            symbol="BTC"
            timeframe={timeframe}
            onTimeframeChange={handleTimeframeChange}
            
            // Chart data
            data={chartData}
            currency={currencyInfo}
            loading={loading}
            error={error}
            
            // Plugin system - ENABLED for demo
            enablePlugins={true}
            plugins={plugins}
            pluginConfig={pluginConfig}
            events={events}
            
            // Advanced features
            enableInfiniteScroll={true}
            loadMoreThreshold={15}
            enableZoomPersistence={true}
            
            // Demo-specific props
            height={600}
            className="min-h-[600px]"
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-dark-card border border-dark-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Возможности демо графика</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-moon-silver">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>🖱️ <strong>Перетаскивание</strong> - двигайте график мышью</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>🔍 <strong>Масштабирование</strong> - колесико мыши для зума</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>🌙 <strong>Лунные фазы</strong> - цветные маркеры событий</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>⏳ <strong>Infinite scroll</strong> - прокрутите к краям для загрузки</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>🔄 <strong>Auto refresh</strong> - данные обновляются каждые 30 сек</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>ℹ️ <strong>Hover детали</strong> - наведите на свечи для подробностей</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 