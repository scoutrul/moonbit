import React, { useState, useEffect } from 'react';
import { BitcoinService } from '../services';

const CurrentPrice = () => {
  const [priceData, setPriceData] = useState({
    price: null,
    change_24h: null,
    change_percentage_24h: null,
    currency: 'usd',
    last_updated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const data = await BitcoinService.getCurrentPrice('usd');
        setPriceData(data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при получении цены:', err);
        setError('Не удалось загрузить данные о цене');
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    
    // Обновляем каждую минуту
    const interval = setInterval(fetchPrice, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: priceData.currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const renderChange = () => {
    const change = priceData.change_percentage_24h;
    if (!change) return null;
    
    const isPositive = change >= 0;
    
    return (
      <span 
        className={`ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
      >
        {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="animate-pulse flex items-center" data-testid="loading-skeleton">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex items-center">
        <img src="/bitcoin-icon.svg" alt="Bitcoin" className="h-10 w-10 mr-3" />
        <div>
          <h2 className="text-lg font-semibold">Bitcoin</h2>
          <div className="flex items-center">
            <span className="text-2xl font-bold">
              {priceData.price ? formatPrice(priceData.price) : '--'}
            </span>
            {renderChange()}
          </div>
          {priceData.last_updated && (
            <div className="text-xs text-gray-500 mt-1">
              Обновлено: {formatLastUpdated(priceData.last_updated)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentPrice; 