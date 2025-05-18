import React from 'react';

const TimeframeSelector = ({ timeframe, onTimeframeChange }) => {
  const timeframes = [
    { id: '1h', label: '1 час' },
    { id: '1d', label: '1 день' },
    { id: '1w', label: '1 неделя' }
  ];

  return (
    <div className="flex justify-center items-center space-x-4">
      {timeframes.map((option) => (
        <button
          key={option.id}
          className={`px-4 py-2 rounded-lg ${
            timeframe === option.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          onClick={() => onTimeframeChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector; 