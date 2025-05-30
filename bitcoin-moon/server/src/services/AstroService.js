import { moonphase } from 'astronomia';
import { julian } from 'astronomia';
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

  /**
   * Получает затмения на указанный период
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} - массив затмений
   */
  getEclipsesForPeriod(startDate, endDate) {
    const eclipses = [];
    
    // Мок-данные о солнечных затмениях (заглушка)
    const solarEclipses = [
      {
        date: '2023-04-20T00:00:00.000Z',
        type: 'solar_eclipse',
        description: 'Полное солнечное затмение',
        visibility: 'Австралия и Юго-Восточная Азия',
        icon: '☀️',
        title: 'Солнечное затмение'
      },
      {
        date: '2023-10-14T00:00:00.000Z',
        type: 'solar_eclipse',
        description: 'Кольцеобразное солнечное затмение',
        visibility: 'Северная и Южная Америка',
        icon: '☀️',
        title: 'Солнечное затмение'
      },
      {
        date: '2024-04-08T00:00:00.000Z',
        type: 'solar_eclipse',
        description: 'Полное солнечное затмение',
        visibility: 'Северная Америка',
        icon: '☀️',
        title: 'Солнечное затмение'
      },
      {
        date: '2024-10-02T00:00:00.000Z',
        type: 'solar_eclipse',
        description: 'Кольцеобразное солнечное затмение',
        visibility: 'Южная Америка и Тихий океан',
        icon: '☀️',
        title: 'Солнечное затмение'
      }
    ];
    
    // Мок-данные о лунных затмениях (заглушка)
    const lunarEclipses = [
      {
        date: '2023-05-05T00:00:00.000Z',
        type: 'lunar_eclipse',
        description: 'Полутеневое лунное затмение',
        visibility: 'Европа и Африка',
        icon: '🌙',
        title: 'Лунное затмение'
      },
      {
        date: '2023-10-28T00:00:00.000Z',
        type: 'lunar_eclipse',
        description: 'Частное лунное затмение',
        visibility: 'Европа, Азия, Австралия',
        icon: '🌙',
        title: 'Лунное затмение'
      },
      {
        date: '2024-03-25T00:00:00.000Z',
        type: 'lunar_eclipse',
        description: 'Полутеневое лунное затмение',
        visibility: 'Америка и Западная Европа',
        icon: '🌙',
        title: 'Лунное затмение'
      },
      {
        date: '2024-09-18T00:00:00.000Z',
        type: 'lunar_eclipse',
        description: 'Частное лунное затмение',
        visibility: 'Азия, Австралия',
        icon: '🌙',
        title: 'Лунное затмение'
      }
    ];
    
    // Фильтруем затмения по диапазону дат
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Добавляем солнечные затмения
    solarEclipses.forEach(eclipse => {
      const eclipseDate = new Date(eclipse.date);
      if (eclipseDate >= start && eclipseDate <= end) {
        eclipses.push(eclipse);
      }
    });
    
    // Добавляем лунные затмения
    lunarEclipses.forEach(eclipse => {
      const eclipseDate = new Date(eclipse.date);
      if (eclipseDate >= start && eclipseDate <= end) {
        eclipses.push(eclipse);
      }
    });
    
    return eclipses;
  }
  
  /**
   * Получает другие астрономические события на указанный период
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} - массив астрономических событий
   */
  getAstroEventsForPeriod(startDate, endDate) {
    const events = [];
    
    // Мок-данные об астрономических событиях (заглушка)
    const astroEvents = [
      {
        date: '2023-03-21T00:00:00.000Z',
        type: 'astro',
        description: 'Весеннее равноденствие',
        icon: '🌷',
        title: 'Весеннее равноденствие'
      },
      {
        date: '2023-06-21T00:00:00.000Z',
        type: 'astro',
        description: 'Летнее солнцестояние',
        icon: '☀️',
        title: 'Летнее солнцестояние'
      },
      {
        date: '2023-09-23T00:00:00.000Z',
        type: 'astro',
        description: 'Осеннее равноденствие',
        icon: '🍂',
        title: 'Осеннее равноденствие'
      },
      {
        date: '2023-12-22T00:00:00.000Z',
        type: 'astro',
        description: 'Зимнее солнцестояние',
        icon: '❄️',
        title: 'Зимнее солнцестояние'
      },
      {
        date: '2024-03-20T00:00:00.000Z',
        type: 'astro',
        description: 'Весеннее равноденствие',
        icon: '🌷',
        title: 'Весеннее равноденствие'
      },
      {
        date: '2024-06-20T00:00:00.000Z',
        type: 'astro',
        description: 'Летнее солнцестояние',
        icon: '☀️',
        title: 'Летнее солнцестояние'
      }
    ];
    
    // Фильтруем события по диапазону дат
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    astroEvents.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= start && eventDate <= end) {
        events.push(event);
      }
    });
    
    return events;
  }

  /**
   * Рассчитывает ближайшее новолуние до указанной даты
   * @param {Date} date - Дата для расчета
   * @returns {Date} Дата ближайшего предыдущего новолуния
   */
  getNewMoonBefore(date) {
    try {
      // Преобразуем дату в формат юлианского дня
      const jd = julian.DateToJDE(date);
      
      // Рассчитываем ближайшее новолуние до указанной даты
      const newMoonJD = moonphase.newMoon(jd);
      
      // Преобразуем обратно в JavaScript Date
      return julian.JDEToDate(newMoonJD);
    } catch (error) {
      logger.error('Error calculating new moon before date:', error);
      return null;
    }
  }

  /**
   * Рассчитывает ближайшее полнолуние до указанной даты
   * @param {Date} date - Дата для расчета
   * @returns {Date} Дата ближайшего предыдущего полнолуния
   */
  getFullMoonBefore(date) {
    try {
      // Преобразуем дату в формат юлианского дня
      const jd = julian.DateToJDE(date);
      
      // Рассчитываем ближайшее полнолуние до указанной даты
      const fullMoonJD = moonphase.full(jd);
      
      // Преобразуем обратно в JavaScript Date
      return julian.JDEToDate(fullMoonJD);
    } catch (error) {
      logger.error('Error calculating full moon before date:', error);
      return null;
    }
  }

  /**
   * Рассчитывает ближайшее новолуние после указанной даты
   * @param {Date} date - Дата для расчета
   * @returns {Date} Дата ближайшего следующего новолуния
   */
  getNewMoonAfter(date) {
    try {
      // Преобразуем дату в формат юлианского дня
      const jd = julian.DateToJDE(date);
      
      // Добавляем небольшое смещение, чтобы точно найти следующее новолуние
      const newMoonJD = moonphase.newMoon(jd + 1);
      
      // Преобразуем обратно в JavaScript Date
      return julian.JDEToDate(newMoonJD);
    } catch (error) {
      logger.error('Error calculating new moon after date:', error);
      return null;
    }
  }

  /**
   * Рассчитывает ближайшее полнолуние после указанной даты
   * @param {Date} date - Дата для расчета
   * @returns {Date} Дата ближайшего следующего полнолуния
   */
  getFullMoonAfter(date) {
    try {
      // Преобразуем дату в формат юлианского дня
      const jd = julian.DateToJDE(date);
      
      // Добавляем небольшое смещение, чтобы точно найти следующее полнолуние
      const fullMoonJD = moonphase.full(jd + 1);
      
      // Преобразуем обратно в JavaScript Date
      return julian.JDEToDate(fullMoonJD);
    } catch (error) {
      logger.error('Error calculating full moon after date:', error);
      return null;
    }
  }

  /**
   * Получает все лунные события (новолуния и полнолуния) в заданном периоде
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Array} Массив объектов с датами и типами лунных событий
   */
  getLunarEventsInPeriod(startDate, endDate) {
    try {
      logger.debug(`AstroService: получение лунных событий в периоде от ${startDate.toISOString()} до ${endDate.toISOString()}`);
      
      const events = [];
      let currentDate = new Date(startDate);
      
      // Получаем ближайшее новолуние после начальной даты
      let nextNewMoon = this.getNewMoonAfter(currentDate);
      
      // Генерируем события до конечной даты
      while (nextNewMoon <= endDate) {
        // Добавляем новолуние
        events.push({
          date: nextNewMoon.toISOString(),
          type: 'new_moon',
          title: 'Новолуние',
          phaseName: 'Новолуние',
          icon: '🌑'
        });
        
        // Получаем следующее полнолуние
        const nextFullMoon = this.getFullMoonAfter(nextNewMoon);
        
        // Добавляем полнолуние, если оно в пределах периода
        if (nextFullMoon <= endDate) {
          events.push({
            date: nextFullMoon.toISOString(),
            type: 'full_moon',
            title: 'Полнолуние',
            phaseName: 'Полнолуние',
            icon: '🌕'
          });
        }
        
        // Получаем следующее новолуние и продолжаем цикл
        nextNewMoon = this.getNewMoonAfter(nextNewMoon);
      }
      
      logger.debug(`AstroService: найдено ${events.length} лунных событий в периоде`);
      
      // Сортируем события по дате
      return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      logger.error('Error calculating lunar events in period:', error);
      
      // В случае ошибки возвращаем мок-данные
      return this._generateMockLunarEvents(startDate, endDate);
    }
  }
  
  /**
   * Генерирует мок-данные о лунных событиях в случае ошибки расчетов
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Array} Массив объектов с датами и типами лунных событий
   * @private
   */
  _generateMockLunarEvents(startDate, endDate) {
    const events = [];
    let currentDate = new Date(startDate);
    
    // Примерно 29.5 дней в лунном цикле
    const lunarCycleDays = 29.5;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const lunarCycleMs = lunarCycleDays * millisecondsPerDay;
    
    // Если мы начинаем не с новолуния, находим ближайшее новолуние
    // Предполагаем, что 2022-01-02 было новолуние
    const knownNewMoon = new Date('2022-01-02T18:33:00Z');
    const msSinceKnownNewMoon = currentDate.getTime() - knownNewMoon.getTime();
    const cyclesSinceKnown = msSinceKnownNewMoon / lunarCycleMs;
    const cycleOffset = cyclesSinceKnown - Math.floor(cyclesSinceKnown);
    
    // Корректируем начальную дату, чтобы найти ближайшее новолуние
    if (cycleOffset > 0) {
      const msToNextNewMoon = (1 - cycleOffset) * lunarCycleMs;
      currentDate = new Date(currentDate.getTime() + msToNextNewMoon);
    }
    
    // Генерируем события до конечной даты
    while (currentDate <= endDate) {
      // Добавляем новолуние
      events.push({
        date: new Date(currentDate).toISOString(),
        type: 'new_moon',
        title: 'Новолуние',
        phaseName: 'Новолуние',
        icon: '🌑'
      });
      
      // Добавляем полнолуние (примерно через 14.75 дней после новолуния)
      const fullMoonDate = new Date(currentDate.getTime() + lunarCycleMs / 2);
      if (fullMoonDate <= endDate) {
        events.push({
          date: fullMoonDate.toISOString(),
          type: 'full_moon',
          title: 'Полнолуние',
          phaseName: 'Полнолуние',
          icon: '🌕'
        });
      }
      
      // Переходим к следующему циклу
      currentDate = new Date(currentDate.getTime() + lunarCycleMs);
    }
    
    // Сортируем события по дате
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Рассчитывает текущую фазу Луны (значение от 0 до 1)
   * @param {Date} date - Дата для расчета фазы Луны
   * @returns {number} Фаза Луны от 0 до 1 (0 = новолуние, 0.5 = полнолуние, 1 = снова новолуние)
   */
  getMoonPhase(date = new Date()) {
    try {
      // Находим ближайшее предыдущее новолуние
      const prevNewMoon = this.getNewMoonBefore(date);
      
      // Находим следующее новолуние
      const nextNewMoon = this.getNewMoonAfter(prevNewMoon);
      
      // Рассчитываем лунный возраст как долю от лунного цикла
      const ageInMilliseconds = date.getTime() - prevNewMoon.getTime();
      const cycleInMilliseconds = nextNewMoon.getTime() - prevNewMoon.getTime();
      
      // Возвращаем фазу как число от 0 до 1
      return ageInMilliseconds / cycleInMilliseconds;
    } catch (error) {
      logger.error('Error calculating moon phase:', error);
      return 0;
    }
  }

  /**
   * Получает информацию о текущей фазе Луны
   * @param {Date} date - Дата для расчета фазы Луны
   * @returns {Object} Информация о текущей фазе Луны
   */
  getCurrentMoonPhaseInfo(date = new Date()) {
    try {
      // Получаем фазу Луны от 0 до 1
      const phase = this.getMoonPhase(date);
      
      // Определяем название фазы и иконку
      let phaseName, icon;
      
      if (phase < 0.025 || phase >= 0.975) {
        phaseName = 'Новолуние';
        icon = '🌑';
      } else if (phase < 0.225) {
        phaseName = 'Растущий серп';
        icon = '🌒';
      } else if (phase < 0.275) {
        phaseName = 'Первая четверть';
        icon = '🌓';
      } else if (phase < 0.475) {
        phaseName = 'Растущая луна';
        icon = '🌔';
      } else if (phase < 0.525) {
        phaseName = 'Полнолуние';
        icon = '🌕';
      } else if (phase < 0.725) {
        phaseName = 'Убывающая луна';
        icon = '🌖';
      } else if (phase < 0.775) {
        phaseName = 'Последняя четверть';
        icon = '🌗';
      } else {
        phaseName = 'Убывающий серп';
        icon = '🌘';
      }
      
      // Определяем ближайшие значимые фазы
      const prevNewMoon = this.getNewMoonBefore(date);
      const nextNewMoon = this.getNewMoonAfter(date);
      const prevFullMoon = this.getFullMoonBefore(date);
      const nextFullMoon = this.getFullMoonAfter(date);
      
      // Формируем информацию о следующей значимой фазе
      let nextPhaseTime, nextPhaseName;
      
      if (phase < 0.5) {
        // Ближайшая следующая фаза - полнолуние
        nextPhaseTime = Math.floor(nextFullMoon.getTime() / 1000);
        nextPhaseName = 'Полнолуние';
      } else {
        // Ближайшая следующая фаза - новолуние
        nextPhaseTime = Math.floor(nextNewMoon.getTime() / 1000);
        nextPhaseName = 'Новолуние';
      }
      
      // Возвращаем полную информацию
      return {
        phase: phase,
        phaseName: phaseName,
        icon: icon,
        date: date.toISOString(),
        prevNewMoon: prevNewMoon.toISOString(),
        nextNewMoon: nextNewMoon.toISOString(),
        prevFullMoon: prevFullMoon.toISOString(),
        nextFullMoon: nextFullMoon.toISOString(),
        nextPhaseTime: nextPhaseTime,
        nextPhaseName: nextPhaseName
      };
    } catch (error) {
      logger.error('Error getting current moon phase info:', error);
      return {
        phase: 0,
        phaseName: 'Неизвестно',
        icon: '❓',
        date: date.toISOString()
      };
    }
  }
}

const astroService = new AstroService();
export default astroService;
