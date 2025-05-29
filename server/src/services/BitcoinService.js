getCurrentPrice(currency = config.api.coingecko.params.defaultCurrency) {
  if (!config.api.coingecko.params.supportedCurrencies.includes(currency)) {
    currency = config.api.coingecko.params.defaultCurrency;
  }

  const priceCache = bitcoinRepository.getPriceCache() || {};
  const cacheData = priceCache[currency] || {
    price: 0,
    last_updated: null,
    change_24h: 0,
    change_percentage_24h: 0
  };

  // Если данные устарели или отсутствуют, запускаем обновление
  const cacheAge = cacheData.last_updated
    ? (new Date() - new Date(cacheData.last_updated)) / 1000 / 60
    : 9999;

  if (cacheAge > config.cache.bitcoin.priceTtl) {
    logger.debug(`Кэш цены биткоина устарел (${Math.round(cacheAge)} мин), запуск обновления`);
    this.updatePriceData().catch((error) => {
      logger.error('Ошибка при фоновом обновлении цены биткоина', { error });
    });
  }

  return {
    price: cacheData.price || 0,
    currency,
    last_updated: cacheData.last_updated || new Date().toISOString(),
    change_24h: cacheData.change_24h || 0,
    change_percentage_24h: cacheData.change_percentage_24h || 0
  };
}