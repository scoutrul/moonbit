import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CurrentPrice = () => {
  const [price, setPrice] = useState(null);
  const [change24h, setChange24h] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bitcoin/price');
        setPrice(response.data.price);
        setChange24h(response.data.change24h);
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
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const renderChange = () => {
    if (!change24h) return null;
    
    const isPositive = change24h >= 0;
    
    return (
      <span 
        className={`ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
      >
        {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
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
            <span className="text-2xl font-bold">{price ? formatPrice(price) : '--'}</span>
            {renderChange()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentPrice; 