import logger from '../utils/logger.js';
import astroRepository from '../repositories/AstroRepository.js';

/**
 * Сервис для работы с астрологическими данными
 * Использует репозиторий для получения данных и предоставляет бизнес-логику
 */
class AstroService {
  /**
   * Обновляет астрологические данные
   * @returns {Promise<Object>} Обновленные астрологические данные
   */
  async updateAstroData() {
    logger.debug('AstroService: запрос обновления астрологических данных');
    return await astroRepository.fetchAstroData();
  }

  /**
   * Получает текущие астрологические данные
   * @returns {Object} Текущие астрологические данные
   */
  getCurrentAstroData() {
    const astroCache = astroRepository.getAstroCache();

    // Если данные устарели (более 24 часов), запускаем обновление
    const cacheAge = astroCache.last_updated
      ? (new Date() - new Date(astroCache.last_updated)) / 1000 / 60 / 60
      : 9999;

    if (cacheAge > 24) {
      logger.debug(
        `Кэш астрологических данных устарел (${Math.round(cacheAge)} ч), запуск обновления`
      );
      this.updateAstroData().catch((error) => {
        logger.error('Ошибка при фоновом обновлении астрологических данных', { error });
      });
    }

    return {
      retrograde: astroCache.retrograde,
      aspects: astroCache.aspects,
      last_updated: astroCache.last_updated,
    };
  }

  /**
   * Получает список ретроградных планет на заданную дату
   * @param {Date|string} date - Дата для получения данных
   * @returns {Array} Список ретроградных планет
   */
  getRetrogradePlanets(date) {
    date = date ? new Date(date) : new Date();

    if (isNaN(date.getTime())) {
      throw new Error('Некорректный формат даты');
    }

    const astroCache = astroRepository.getAstroCache();

    // Если в кэше нет данных или дата не сегодня, вычисляем для заданной даты
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday && astroCache.retrograde.length > 0) {
      return astroCache.retrograde;
    } else {
      return astroRepository.calculateRetrogradePlanets(date);
    }
  }

  /**
   * Получает планетарные аспекты на заданную дату
   * @param {Date|string} date - Дата для получения аспектов
   * @returns {Array} Список планетарных аспектов
   */
  getPlanetaryAspects(date) {
    date = date ? new Date(date) : new Date();

    if (isNaN(date.getTime())) {
      throw new Error('Некорректный формат даты');
    }

    const astroCache = astroRepository.getAstroCache();

    // Если в кэше нет данных или дата не сегодня, вычисляем для заданной даты
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday && astroCache.aspects.length > 0) {
      return astroCache.aspects;
    } else {
      return astroRepository.calculatePlanetaryAspects(date);
    }
  }

  /**
   * Анализирует влияние астрологических факторов на рынок биткоина
   * @returns {Object} Результат анализа
   */
  analyzeAstroInfluence() {
    const astroData = this.getCurrentAstroData();

    // Анализируем влияние ретроградных планет
    const retrogradeInfluence = this.analyzeRetrogradeInfluence(astroData.retrograde);

    // Анализируем влияние планетарных аспектов
    const aspectsInfluence = this.analyzeAspectsInfluence(astroData.aspects);

    return {
      retrogradeInfluence,
      aspectsInfluence,
      overallForecast: this.generateOverallForecast(retrogradeInfluence, aspectsInfluence),
    };
  }

  /**
   * Анализирует влияние ретроградных планет
   * @param {Array} retrogradeData - Данные о ретроградных планетах
   * @returns {Object} Результат анализа
   */
  analyzeRetrogradeInfluence(retrogradeData) {
    const influence = {
      volatility: 'нормальная',
      trend: 'нейтральный',
      strength: 0,
    };

    // Если нет ретроградных планет, возвращаем нейтральное влияние
    if (!retrogradeData || retrogradeData.length === 0) {
      return influence;
    }

    // Простая система оценки влияния
    let strengthScore = 0;

    retrogradeData.forEach((planet) => {
      // Меркурий в ретрограде считается наиболее влияющим на рынки
      if (planet.planet === 'Меркурий') {
        strengthScore += 3;
      }
      // Венера и Марс тоже имеют заметное влияние
      else if (planet.planet === 'Венера' || planet.planet === 'Марс') {
        strengthScore += 2;
      }
      // Остальные планеты имеют менее заметное влияние
      else {
        strengthScore += 1;
      }
    });

    // Определяем силу влияния
    influence.strength = strengthScore;

    // Определяем тренд и волатильность на основе оценки
    if (strengthScore > 5) {
      influence.volatility = 'очень высокая';
      influence.trend = 'негативный';
    } else if (strengthScore > 3) {
      influence.volatility = 'высокая';
      influence.trend = 'слабо негативный';
    } else if (strengthScore > 1) {
      influence.volatility = 'повышенная';
      influence.trend = 'неопределенный';
    }

    return influence;
  }

  /**
   * Анализирует влияние планетарных аспектов
   * @param {Array} aspectsData - Данные о планетарных аспектах
   * @returns {Object} Результат анализа
   */
  analyzeAspectsInfluence(aspectsData) {
    const influence = {
      volatility: 'нормальная',
      trend: 'нейтральный',
      strength: 0,
    };

    // Если нет аспектов, возвращаем нейтральное влияние
    if (!aspectsData || aspectsData.length === 0) {
      return influence;
    }

    // Карта весов для различных типов аспектов
    const aspectWeights = {
      соединение: 3,
      оппозиция: -2,
      квадрат: -1,
      трин: 2,
      секстиль: 1,
    };

    let scoreSum = 0;

    aspectsData.forEach((aspect) => {
      const weight = aspectWeights[aspect.aspect] || 0;
      scoreSum += weight;
    });

    // Определяем силу влияния, тренд и волатильность
    influence.strength = Math.abs(scoreSum);

    if (scoreSum > 3) {
      influence.trend = 'положительный';
      influence.volatility = 'умеренная';
    } else if (scoreSum > 0) {
      influence.trend = 'слабо положительный';
      influence.volatility = 'низкая';
    } else if (scoreSum < -3) {
      influence.trend = 'негативный';
      influence.volatility = 'высокая';
    } else if (scoreSum < 0) {
      influence.trend = 'слабо негативный';
      influence.volatility = 'умеренная';
    }

    return influence;
  }

  /**
   * Генерирует общий прогноз на основе всех астрологических факторов
   * @param {Object} retrogradeInfluence - Влияние ретроградных планет
   * @param {Object} aspectsInfluence - Влияние планетарных аспектов
   * @returns {Object} Общий прогноз
   */
  generateOverallForecast(retrogradeInfluence, aspectsInfluence) {
    // Общий вес для ретроградов и аспектов
    const retroWeight = 0.4;
    const aspectWeight = 0.6;

    // Общая сила влияния
    const strengthScore =
      retrogradeInfluence.strength * retroWeight + aspectsInfluence.strength * aspectWeight;

    // Направление тренда (от -1 до 1)
    const trendMap = {
      положительный: 1,
      'слабо положительный': 0.5,
      нейтральный: 0,
      'слабо негативный': -0.5,
      негативный: -1,
    };

    const retroTrendScore = trendMap[retrogradeInfluence.trend] || 0;
    const aspectTrendScore = trendMap[aspectsInfluence.trend] || 0;

    const trendScore = retroTrendScore * retroWeight + aspectTrendScore * aspectWeight;

    // Общий прогноз
    let trend;
    if (trendScore > 0.5) {
      trend = 'положительный';
    } else if (trendScore > 0.1) {
      trend = 'слабо положительный';
    } else if (trendScore > -0.1) {
      trend = 'нейтральный';
    } else if (trendScore > -0.5) {
      trend = 'слабо негативный';
    } else {
      trend = 'негативный';
    }

    // Волатильность
    let volatility;
    if (strengthScore > 4) {
      volatility = 'очень высокая';
    } else if (strengthScore > 3) {
      volatility = 'высокая';
    } else if (strengthScore > 2) {
      volatility = 'умеренная';
    } else if (strengthScore > 1) {
      volatility = 'низкая';
    } else {
      volatility = 'очень низкая';
    }

    return {
      trend,
      volatility,
      strength: Math.round(strengthScore * 10) / 10,
      description: this.generateForecastDescription(trend, volatility, strengthScore),
    };
  }

  /**
   * Генерирует текстовое описание прогноза
   * @param {string} trend - Направление тренда
   * @param {string} volatility - Уровень волатильности
   * @param {number} strength - Сила влияния
   * @returns {string} Текстовое описание прогноза
   */
  generateForecastDescription(trend, volatility, strength) {
    const trendDescription = {
      положительный: 'рост цены биткоина',
      'слабо положительный': 'умеренный рост цены биткоина',
      нейтральный: 'стабильность цены биткоина',
      'слабо негативный': 'умеренное снижение цены биткоина',
      негативный: 'снижение цены биткоина',
    };

    const volatilityDescription = {
      'очень высокая': 'значительными колебаниями',
      высокая: 'заметными колебаниями',
      умеренная: 'умеренными колебаниями',
      низкая: 'низкой волатильностью',
      'очень низкая': 'минимальной волатильностью',
    };

    if (strength < 1) {
      return 'Астрологические факторы оказывают минимальное влияние на рынок биткоина';
    }

    return `Астрологические факторы указывают на ${trendDescription[trend]} с ${volatilityDescription[volatility]}`;
  }
}

const astroService = new AstroService();
export default astroService;
