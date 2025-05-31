import { useState, useEffect } from 'react';
import BitcoinChartWithLunarPhases from './BitcoinChartWithLunarPhases';
import UpcomingEvents from './UpcomingEvents';
import ErrorWrapper from './ErrorWrapper';
import BitcoinService from '../services/BitcoinService';

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('1d'); // 1h, 1d, 1w
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

  return (
    <div className="w-full px-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-[556px]">
        {/* Левая колонка с экономическими событиями */}
        <div className="lg:col-span-2 h-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 h-full">
            <ErrorWrapper fallbackText="Не удалось загрузить информацию о предстоящих событиях">
              <UpcomingEvents />
            </ErrorWrapper>
          </div>
        </div>
        
        {/* Правая колонка с графиком */}
        <div className="lg:col-span-10 h-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 h-full">
            <ErrorWrapper fallbackText="Не удалось загрузить график цены биткоина">
              {loading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="h-[500px] flex items-center justify-center text-red-500">
                  {error}
                </div>
              ) : (
                <BitcoinChartWithLunarPhases data={chartData} timeframe={timeframe} />
              )}
            </ErrorWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
