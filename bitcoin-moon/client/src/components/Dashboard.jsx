import { useState, useEffect } from 'react';
import BitcoinChartWithLunarPhases from './BitcoinChartWithLunarPhases';
import UpcomingEvents from './UpcomingEvents';
import ErrorWrapper from './ErrorWrapper';
import BitcoinService from '../services/BitcoinService';

/**
 * @typedef {Object} CandlestickData
 * @property {number} time - временная метка
 * @property {number} open - цена открытия
 * @property {number} high - максимальная цена
 * @property {number} low - минимальная цена
 * @property {number} close - цена закрытия
 */

/**
 * Компонент панели инструментов
 * @returns {JSX.Element}
 */
const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('1d'); // По умолчанию дневной таймфрейм

  // Обработчик события изменения таймфрейма из компонента графика
  useEffect(() => {
    const handleTimeframeChanged = (event) => {
      const newTimeframe = event.detail.timeframe;
      setTimeframe(newTimeframe);
    };

    window.addEventListener('timeframe-changed', handleTimeframeChanged);

    return () => {
      window.removeEventListener('timeframe-changed', handleTimeframeChanged);
    };
  }, []);

  // Обработчик ошибок
  const handleError = (error, errorInfo) => {
    console.error('Ошибка в компоненте Dashboard:', error, errorInfo);
  };

  return (
    <div className="w-full px-2" data-testid="dashboard">
      {/* Заголовок с информацией о новых возможностях */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Мунбит - Enhanced Edition
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Крипто аналитика с лунными фазами и infinite scroll
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-300">Infinite Scroll</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-300">Auto Refresh</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-300">Dynamic Loading</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:h-[556px]">
        {/* Правая колонка с графиком - на мобильных отображается первой */}
        <div className="order-1 lg:order-2 lg:col-span-10 h-[500px] lg:h-full mb-2 lg:mb-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 h-full">
            <ErrorWrapper 
              fallbackText="Не удалось загрузить график цены биткоина"
              fallbackComponent={null}
              onError={handleError}
            >
              {/* Возвращаем старый рабочий график */}
              <BitcoinChartWithLunarPhases 
                timeframe={timeframe}
              />
            </ErrorWrapper>
          </div>
        </div>
        
        {/* Левая колонка с экономическими событиями - на мобильных отображается второй */}
        <div className="order-2 lg:order-1 lg:col-span-2 h-[400px] lg:h-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 h-full">
            <ErrorWrapper 
              fallbackText="Не удалось загрузить информацию о предстоящих событиях"
              fallbackComponent={null}
              onError={handleError}
            >
              <UpcomingEvents />
            </ErrorWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
