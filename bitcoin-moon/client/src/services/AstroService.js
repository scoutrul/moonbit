import { moonphase } from 'astronomia';

/**
 * Сервис для работы с астрономическими данными
 */
class AstroService {
  /**
   * Получает фазы луны (новолуния и полнолуния) для заданного диапазона дат
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} массив объектов с информацией о фазах луны
   */
  getLunarPhases(startDate, endDate) {
    try {
      // Убедимся, что даты валидны
      if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new Error('Невалидные даты');
      }
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Невалидные даты');
      }
      
      // Преобразуем даты в юлианские дни для библиотеки astronomia
      const startJD = this._dateToJulianDay(startDate);
      const endJD = this._dateToJulianDay(endDate);
      
      // Получаем все новолуния в диапазоне
      const newMoons = this._getNewMoons(startJD, endJD);
      
      // Получаем все полнолуния в диапазоне
      const fullMoons = this._getFullMoons(startJD, endJD);
      
      // Объединяем результаты и сортируем по дате
      const allPhases = [
        ...newMoons.map(date => ({ type: 'new_moon', date })),
        ...fullMoons.map(date => ({ type: 'full_moon', date }))
      ].sort((a, b) => a.date - b.date);
      
      return allPhases;
    } catch (error) {
      console.error('Ошибка при получении фаз луны:', error);
      return [];
    }
  }

  /**
   * Получает исторические фазы луны для заданного диапазона дат
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} массив объектов с информацией о фазах луны
   */
  getHistoricalLunarPhases(startDate, endDate) {
    return this.getLunarPhases(startDate, endDate);
  }

  /**
   * Получает предстоящие фазы луны на заданное количество дней вперед
   * @param {number} days - количество дней вперед
   * @returns {Array} массив объектов с информацией о фазах луны
   */
  getUpcomingLunarPhases(days = 30) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return this.getLunarPhases(startDate, endDate);
  }

  /**
   * Преобразует дату в юлианский день для библиотеки astronomia
   * @param {Date} date - дата для преобразования
   * @returns {number} юлианский день
   * @private
   */
  _dateToJulianDay(date) {
    // Копируем дату, чтобы не изменять оригинал
    const d = new Date(date);
    
    // Приводим к UTC, т.к. astronomia работает с UTC
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1; // JavaScript месяцы начинаются с 0
    const day = d.getUTCDate();
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();
    const second = d.getUTCSeconds();
    
    // Формула для расчета юлианского дня из даты
    // По формуле из astronomia
    let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4);
    jd += Math.floor(275 * month / 9) + day + 1721013.5;
    jd += (hour + minute / 60 + second / 3600) / 24;
    
    return jd;
  }

  /**
   * Преобразует юлианский день в JavaScript Date
   * @param {number} jd - юлианский день
   * @returns {Date} дата
   * @private
   */
  _julianDayToDate(jd) {
    // Формула для преобразования юлианского дня в дату
    // По формуле из astronomia
    const z = Math.floor(jd + 0.5);
    const f = (jd + 0.5) - z;
    
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    
    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    
    // Расчет дня, месяца и года
    const day = b - d - Math.floor(30.6001 * e) + f;
    let month = e - 1;
    if (month > 12) month -= 12;
    let year = c - 4715;
    if (month > 2) year -= 1;
    
    // Расчет часа, минуты и секунды
    const dayFraction = day - Math.floor(day);
    const hours = Math.floor(dayFraction * 24);
    const minutes = Math.floor((dayFraction * 24 - hours) * 60);
    const seconds = Math.floor(((dayFraction * 24 - hours) * 60 - minutes) * 60);
    
    // Создаем объект Date в UTC
    const date = new Date(Date.UTC(year, month - 1, Math.floor(day), hours, minutes, seconds));
    
    return date;
  }

  /**
   * Получает новолуния в заданном диапазоне юлианских дней
   * @param {number} startJD - начальный юлианский день
   * @param {number} endJD - конечный юлианский день
   * @returns {Array<Date>} массив дат новолуний
   * @private
   */
  _getNewMoons(startJD, endJD) {
    const results = [];
    
    // Находим ближайшее новолуние к начальной дате
    let currentJD = moonphase.newMoon(startJD);
    
    // Получаем все новолуния в диапазоне
    while (currentJD <= endJD) {
      results.push(this._julianDayToDate(currentJD));
      
      // Переходим к следующему новолунию (примерно через 29.53 дня)
      currentJD = moonphase.newMoon(currentJD + 25); // +25 для надежности
    }
    
    return results;
  }

  /**
   * Получает полнолуния в заданном диапазоне юлианских дней
   * @param {number} startJD - начальный юлианский день
   * @param {number} endJD - конечный юлианский день
   * @returns {Array<Date>} массив дат полнолуний
   * @private
   */
  _getFullMoons(startJD, endJD) {
    const results = [];
    
    // Находим ближайшее полнолуние к начальной дате
    let currentJD = moonphase.full(startJD);
    
    // Получаем все полнолуния в диапазоне
    while (currentJD <= endJD) {
      results.push(this._julianDayToDate(currentJD));
      
      // Переходим к следующему полнолунию (примерно через 29.53 дня)
      currentJD = moonphase.full(currentJD + 25); // +25 для надежности
    }
    
    return results;
  }
}

// Экспортируем синглтон
export default new AstroService(); 