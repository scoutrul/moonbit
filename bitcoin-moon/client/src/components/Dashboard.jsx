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
  /** @type {[CandlestickData[], (data: CandlestickData[]) => void]} */
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Обработчик события изменения таймфрейма из компонента графика
  useEffect(() => {
    const handleTimeframeChanged = (event) => {
      const newTimeframe = event.detail.timeframe;
      console.log('Получено событие изменения таймфрейма от графика:', newTimeframe);
      setTimeframe(newTimeframe);
    };

    window.addEventListener('timeframe-changed', handleTimeframeChanged);

    return () => {
      window.removeEventListener('timeframe-changed', handleTimeframeChanged);
    };
  }, []);

  // Загрузка данных при изменении таймфрейма
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загрузка данных для графика
        const data = await BitcoinService.getCandlestickData(timeframe);
        setChartData(data);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeframe]);

  // Обработчик ошибок
  const handleError = (error, errorInfo) => {
    console.error('Ошибка в компоненте Dashboard:', error, errorInfo);
  };

  return (
    <div className="w-full px-2">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:h-[556px]">
        {/* Правая колонка с графиком - на мобильных отображается первой */}
        <div className="order-1 lg:order-2 lg:col-span-10 h-[500px] lg:h-full mb-2 lg:mb-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 h-full">
            <ErrorWrapper 
              fallbackText="Не удалось загрузить график цены биткоина"
              fallbackComponent={null}
              onError={handleError}
            >
              {loading ? (
                <div className="h-[450px] lg:h-[500px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="h-[450px] lg:h-[500px] flex items-center justify-center text-red-500">
                  {error}
                </div>
              ) : (
                <BitcoinChartWithLunarPhases 
                  data={chartData} 
                  timeframe={timeframe} 
                />
              )}
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
