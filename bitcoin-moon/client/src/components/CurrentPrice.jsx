import React, { useState, useEffect, useRef } from 'react';
import BitcoinService from '../services/BitcoinService';
import { subscribeToPriceUpdates } from '../utils/mockDataGenerator';

const CurrentPrice = () => {
  const [priceData, setPriceData] = useState({
    price: null,
    change_24h: null,
    change_percentage_24h: null,
    currency: 'usd',
    last_updated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceAnimation, setPriceAnimation] = useState(null); // 'up', 'down', null
  const unsubscribeRef = useRef(null);
  const lastPriceRef = useRef(null);

  // Обработчик обновления цены в реальном времени
  const handlePriceUpdate = (data) => {
    if (!priceData.price) return;

    // Определяем направление изменения цены
    if (lastPriceRef.current !== null) {
      const newAnimation = data.price > lastPriceRef.current ? 'up' : 'down';
      setPriceAnimation(newAnimation);
      
      // Сбрасываем анимацию через 2 секунды
      setTimeout(() => {
        setPriceAnimation(null);
      }, 2000);
    }
    
    // Обновляем последнюю цену
    lastPriceRef.current = data.price;
    
    // Обновляем данные о цене
    setPriceData(prevData => ({
      ...prevData,
      price: data.price,
      last_updated: new Date().toISOString(),
    }));
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const data = await BitcoinService.getCurrentPrice(priceData.currency);
        setPriceData(data);
        lastPriceRef.current = data.price;
        setError(null);
      } catch (err) {
        console.error('Ошибка при получении цены:', err);
        setError('Не удалось загрузить данные о цене');
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    // Подписываемся на обновления цены в реальном времени
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    unsubscribeRef.current = subscribeToPriceUpdates(handlePriceUpdate);

    // Обновляем полные данные каждую минуту
    const interval = setInterval(fetchPrice, 60000);

    return () => {
      clearInterval(interval);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [priceData.currency]);

  const formatPrice = (price) => {
    if (price === null) return '--';

    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: priceData.currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const renderChange = () => {
    const change = priceData.change_percentage_24h;
    if (change === null) return null;

    const isPositive = change >= 0;
    const changeValue = Math.abs(change).toFixed(2);

    return (
      <span
        className={`ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
        title={`Изменение за 24 часа: ${isPositive ? '+' : '-'}${changeValue}%`}
      >
        {isPositive ? '▲' : '▼'} {changeValue}%
      </span>
    );
  };

  const getPriceClass = () => {
    if (!priceAnimation) return 'text-2xl font-bold transition-colors duration-500';
    return `text-2xl font-bold transition-colors duration-500 ${
      priceAnimation === 'up' ? 'text-green-500' : 'text-red-500'
    }`;
  };

  if (loading) {
    return (
      <div data-testid="loading-skeleton" className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error-message" className="text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex items-center">
        <img
          src="/bitcoin-icon.svg"
          alt="Bitcoin"
          className="h-10 w-10 mr-3"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0iI2Y3OTMxYSI+PHBhdGggZD0iTTE1LjMgMjEuNGMtLjIgMS4yLTEuNyAxLjUtMy4yIDEuMWwuNyAyLjZjMi4xLjUgNC40LS4yIDQuOS0yLjMuNS0yLjEtMS4yLTMuMi0zLjMtMy45bC43LTIuNmMxLjUuNCAzIC43IDMuMi0uNS4yLTEuMi0xLjEtMS44LTIuNi0yLjJsLjctMi42LTEuNy0uNS0uNyAyLjZjLS40LS4xLS45LS4yLTEuMy0uM2wuNy0yLjYtMS43LS41LS43IDIuNmMtLjQtLjEtLjctLjItMS4xLS4zbC45LTMuNC0xLjctLjUtLjcgMi42Yy0yLjEtLjUtNC40LjItNC45IDIuMy0uNSAyLjEgMS4yIDMuMiAzLjMgMy45bC0uNyAyLjZjLTEuNS0uNC0zLS43LTMuMi41LS4yIDEuMiAxLjEgMS44IDIuNiAyLjJsLS43IDIuNiAxLjcuNS43LTIuNmMuNC4xLjkuMiAxLjMuM2wtLjcgMi42IDEuNy41LjctMi42Yy40LjEuNy4yIDEuMS4zbC0uOSAzLjQgMS43LjUuNy0yLjZ6Ii8+PC9zdmc+';
          }}
        />
        <div>
          <h2 className="text-lg font-semibold">Bitcoin</h2>
          <div className="flex items-center">
            <span data-testid="bitcoin-price" className={getPriceClass()}>
              {formatPrice(priceData.price)}
            </span>
            {renderChange()}
          </div>
          {priceData.last_updated && (
            <div
              data-testid="last-updated"
              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              Обновлено: {formatLastUpdated(priceData.last_updated)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentPrice;
