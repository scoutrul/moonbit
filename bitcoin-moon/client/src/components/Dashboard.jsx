import React, { useState } from 'react';
import CandlestickChart from './CandlestickChart';
import CurrentPrice from './CurrentPrice';
import TimeframeSelector from './TimeframeSelector';
import UpcomingEvents from './UpcomingEvents';
import ErrorWrapper from './ErrorWrapper';

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('1d'); // 1h, 1d, 1w

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
            <CandlestickChart timeframe={timeframe} />
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <ErrorWrapper fallbackText="Не удалось загрузить информацию о предстоящих событиях">
            <UpcomingEvents />
          </ErrorWrapper>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
