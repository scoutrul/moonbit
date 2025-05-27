import React, { useState, useEffect } from 'react';
import CandlestickChart from './CandlestickChart';
import BitcoinChartWithLunarPhases from './BitcoinChartWithLunarPhases';
import CurrentPrice from './CurrentPrice';
import TimeframeSelector from './TimeframeSelector';
import UpcomingEvents from './UpcomingEvents';
import LunarEventsWidget from './LunarEventsWidget';
import ErrorWrapper from './ErrorWrapper';
import BitcoinService from '../services/BitcoinService';

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('1d'); // 1h, 1d, 1w
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Верхняя панель с текущей ценой */}
      <div className="lg:col-span-4">
        <ErrorWrapper fallbackText="Не удалось загрузить информацию о текущей цене">
          <CurrentPrice />
        </ErrorWrapper>
      </div>

      {/* Основная часть с графиком */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <ErrorWrapper fallbackText="Не удалось загрузить график цены биткоина">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="h-[400px] flex items-center justify-center text-red-500">
                {error}
              </div>
            ) : (
              <BitcoinChartWithLunarPhases data={chartData} timeframe={timeframe} />
            )}
          </ErrorWrapper>
        </div>

        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <ErrorWrapper fallbackText="Не удалось загрузить селектор таймфрейма">
            <TimeframeSelector timeframe={timeframe} onTimeframeChange={setTimeframe} />
          </ErrorWrapper>
        </div>
      </div>

      {/* Боковая панель с предстоящими событиями */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <ErrorWrapper fallbackText="Не удалось загрузить информацию о предстоящих событиях">
            <LunarEventsWidget />
          </ErrorWrapper>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <ErrorWrapper fallbackText="Не удалось загрузить информацию о пользовательских событиях">
            <UpcomingEvents />
          </ErrorWrapper>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
