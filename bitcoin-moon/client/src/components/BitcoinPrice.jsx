import React, { useEffect, useState } from 'react';
import BitcoinService from '../services/BitcoinService';

const BitcoinPrice = () => {
  const [price, setPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загружаем текущую цену биткоина
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        const priceData = await BitcoinService.getCurrentPrice();
        
        if (priceData) {
          setPrice(priceData);
          setError(null);
        } else {
          setError('Не удалось получить данные о цене биткоина');
        }
      } catch (err) {
        console.error('Error fetching bitcoin price:', err);
        setError('Ошибка при получении цены биткоина');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();

    // Обновляем цену каждые 60 секунд
    const intervalId = setInterval(fetchPrice, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Форматирование цены
  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Форматирование изменения цены
  const formatChange = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always'
    }).format(value);
  };

  // Определение цвета для изменения цены
  const getChangeColor = (value) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-gray-300">Загрузка цены...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-800 rounded-lg shadow-md p-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!price) {
    return (
      <div className="w-full bg-gray-800 rounded-lg shadow-md p-4">
        <div className="text-gray-400">Нет данных о цене</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Bitcoin</h2>
          <div className="text-gray-400">BTC/USD</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {formatPrice(price.price)}
          </div>
          <div className={`${getChangeColor(price.change_24h)} flex items-center justify-end`}>
            <span>{formatChange(price.change_24h)}</span>
            <span className="ml-1">({price.change_percentage_24h > 0 ? '+' : ''}{price.change_percentage_24h.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinPrice; 