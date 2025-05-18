import React, { useState } from 'react';
import CandlestickChart from './CandlestickChart';
import CurrentPrice from './CurrentPrice';
import TimeframeSelector from './TimeframeSelector';
import UpcomingEvents from './UpcomingEvents';
import BuggyCounter from './BuggyCounter';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('1d'); // 1h, 1d, 1w

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Верхняя панель с текущей ценой */}
      <div className="lg:col-span-4">
        <CurrentPrice />
      </div>
      
      {/* Основная часть с графиком */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <CandlestickChart timeframe={timeframe} />
        </div>
        
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <TimeframeSelector 
            timeframe={timeframe} 
            onTimeframeChange={setTimeframe} 
          />
        </div>
        
        {/* Тестовый компонент с ошибкой */}
        <div className="mt-4">
          <ErrorBoundary>
            <BuggyCounter />
          </ErrorBoundary>
        </div>
      </div>
      
      {/* Боковая панель с предстоящими событиями */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
