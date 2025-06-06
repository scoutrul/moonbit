import React from 'react';
import { ChartContainer } from '../organisms/charts/ChartContainer';
import ErrorWrapper from '../ErrorWrapper';

/**
 * Демо страница с экспериментальными возможностями графика
 */
const DemoPage: React.FC = () => {
  const handleError = (error: Error, errorInfo: any) => {
    console.error('Ошибка в компоненте DemoPage:', error, errorInfo);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg p-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                MoonBit - Демо экспериментальных возможностей
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Тестирование новых возможностей: Infinite Scroll, Plugin System, Advanced Features
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Infinite Scroll</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Auto Refresh</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Plugin System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Предупреждение */}
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Экспериментальная страница
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Здесь тестируются новые возможности графика. Некоторые функции могут работать нестабильно.
              </p>
            </div>
          </div>
        </div>

        {/* Основной контент с графиком */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <ErrorWrapper 
            fallbackText="Не удалось загрузить экспериментальный график"
            fallbackComponent={null}
            onError={handleError}
          >
            <ChartContainer 
              symbol="BTCUSDT"
              defaultTimeframe="1d"
              autoRefresh={true}
              refreshInterval={30000}
              height={600}
              className="demo-chart-container"
            />
          </ErrorWrapper>
        </div>

        {/* Информация о возможностях */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Infinite Scroll
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Автоматическая подгрузка исторических данных при прокрутке к краям графика.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 dark:text-green-400">Активно</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Plugin System
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Система плагинов для отображения дополнительных событий на графике.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-600 dark:text-yellow-400">В разработке</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Advanced Features
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Дополнительные возможности: масштабирование, сохранение состояния.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-600 dark:text-blue-400">Тестируется</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage; 