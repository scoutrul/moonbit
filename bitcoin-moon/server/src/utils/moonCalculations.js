/**
 * Утилиты для расчета фаз луны
 */

/**
 * Вычисляет фазу Луны для указанной даты
 * @param {Date|number|string} date - Дата, для которой нужно вычислить фазу луны
 * @returns {number} - Значение от 0 до 1, где 0 и 1 - новолуние, 0.5 - полнолуние
 */
function calculateMoonPhase(date) {
  // Преобразуем дату в объект Date
  const targetDate = date instanceof Date ? date : new Date(date);

  // Для вычисления фазы луны используем алгоритм на основе синодического месяца
  // Синодический месяц (период между двумя одинаковыми фазами) = 29.53058867 дней

  // Опорная точка (известное новолуние)
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');

  // Разница в миллисекундах
  const diff = targetDate.getTime() - knownNewMoon.getTime();

  // Переводим в дни
  const days = diff / (1000 * 60 * 60 * 24);

  // Делим по модулю на синодический месяц и нормализуем от 0 до 1
  const phase = (days % 29.53058867) / 29.53058867;

  // Возвращаем значение от 0 до 1
  return phase >= 0 ? phase : phase + 1;
}

/**
 * Определяет имя фазы Луны по числовому значению
 * @param {number} phase - Фаза луны от 0 до 1
 * @returns {string} - Название фазы луны
 */
function getMoonPhaseName(phase) {
  // Деление на 8 основных фаз
  if (phase < 0.0625 || phase >= 0.9375) return 'Новолуние';
  if (phase < 0.1875) return 'Молодая луна (растущий серп)';
  if (phase < 0.3125) return 'Первая четверть';
  if (phase < 0.4375) return 'Растущая луна (горб)';
  if (phase < 0.5625) return 'Полнолуние';
  if (phase < 0.6875) return 'Убывающая луна (горб)';
  if (phase < 0.8125) return 'Последняя четверть';
  return 'Старая луна (убывающий серп)';
}

/**
 * Получает список фаз луны для указанного периода
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @returns {Array<Object>} - Массив дат и фаз луны
 */
function getMoonPhasesForPeriod(startDate, endDate) {
  const result = [];

  // Клонируем начальную дату, чтобы не изменять оригинал
  const currentDate = new Date(startDate);

  // Перебираем все дни в интервале
  while (currentDate <= endDate) {
    const phase = calculateMoonPhase(currentDate);
    result.push({
      date: new Date(currentDate),
      phase,
      phaseName: getMoonPhaseName(phase),
    });

    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Находит ближайшие значимые фазы луны (новолуние и полнолуние)
 * @param {Date} fromDate - Дата, от которой искать
 * @param {number} count - Количество фаз для поиска
 * @returns {Array<Object>} - Массив дат и фаз луны
 */
function findNextSignificantPhases(fromDate, count = 4) {
  const result = [];
  const currentDate = new Date(fromDate);

  // Вычисляем текущую фазу
  let currentPhase = calculateMoonPhase(currentDate);

  // Находим ближайшее новолуние и полнолуние
  while (result.length < count) {
    // Проверяем каждый день
    const prevPhase = currentPhase;
    currentDate.setDate(currentDate.getDate() + 1);
    currentPhase = calculateMoonPhase(currentDate);

    // Обнаружение новолуния (переход от 0.95+ к 0.05-)
    if ((prevPhase > 0.95 && currentPhase < 0.05) || (prevPhase < 0.05 && currentPhase > 0.95)) {
      result.push({
        date: new Date(currentDate),
        type: 'Новолуние',
        phase: 0,
      });
    }
    // Обнаружение полнолуния (фаза около 0.5)
    else if ((prevPhase < 0.5 && currentPhase >= 0.5) || (prevPhase >= 0.5 && currentPhase < 0.5)) {
      result.push({
        date: new Date(currentDate),
        type: 'Полнолуние',
        phase: 0.5,
      });
    }
  }

  return result;
}

// Экспортируем чистые функции для использования в сервисе и тестах
module.exports = {
  calculateMoonPhase,
  getMoonPhaseName,
  getMoonPhasesForPeriod,
  findNextSignificantPhases,
};
