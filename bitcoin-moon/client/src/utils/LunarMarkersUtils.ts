import { UTCTimestamp } from 'lightweight-charts';
import { Event } from '../types';

export interface LunarMarker {
  time: UTCTimestamp;
  position: 'aboveBar' | 'belowBar';
  shape: 'circle';
  color: string;
  size: number;
  text: string;
  price: number;
}

/**
 * Утилита для создания лунных маркеров - ПЕРЕИСПОЛЬЗОВАНИЕ из BitcoinChartWithLunarPhases.jsx
 */
export class LunarMarkersUtils {
  /**
   * Получает приблизительную цену для даты события
   * @param date - Дата события
   * @param candleData - Данные свечей
   * @returns Цена или null
   */
  static getApproximatePriceForDate(date: Date, candleData: any[]): number | null {
    if (!candleData || candleData.length === 0) return null;
    
    const targetTimestamp = Math.floor(date.getTime() / 1000);
    
    // Ищем ближайшую свечу
    let closestCandle = candleData[0];
    let minDiff = Math.abs(targetTimestamp - closestCandle.time);
    
    for (const candle of candleData) {
      const diff = Math.abs(targetTimestamp - candle.time);
      if (diff < minDiff) {
        minDiff = diff;
        closestCandle = candle;
      }
    }
    
    // Проверяем, находится ли событие в будущем (после последней свечи)
    if (targetTimestamp > candleData[candleData.length - 1].time) {
      // Используем последнюю доступную
      const lastCandle = candleData[candleData.length - 1];
      return lastCandle.close;
    }
    
    return closestCandle.close;
  }

  /**
   * Создает лунные маркеры из событий - ТОЧНАЯ КОПИЯ логики из BitcoinChartWithLunarPhases.jsx
   * @param lunarEvents - Массив лунных событий
   * @param candleData - Данные свечей Bitcoin
   * @param timeframe - Текущий таймфрейм
   * @param isDarkMode - Темная тема
   * @returns Массив маркеров для LightweightCharts
   */
  static createLunarMarkers(
    lunarEvents: Event[], 
    candleData: any[], 
    timeframe: string, 
    isDarkMode: boolean = true
  ): LunarMarker[] {
    if (!lunarEvents || lunarEvents.length === 0) return [];

    console.log('🌙 Creating lunar markers:', lunarEvents.length);

    const lunarMarkers = lunarEvents.map((event, index) => {
      // Определяем тип луны через subtype или title
      const isNewMoon = event.subtype === 'new_moon' || event.title === 'Новолуние';
      
      // Handle event time - используем timestamp поле из Event интерфейса
      let eventTime: number;
      if (event.timestamp) {
        eventTime = event.timestamp;
      } else if (event.date) {
        eventTime = Math.floor(new Date(event.date).getTime() / 1000);
      } else {
        console.warn('Lunar event without valid timestamp:', event);
        return null;
      }
      
      if (!eventTime || eventTime <= 0) {
        console.warn('Lunar event without valid timestamp:', event);
        return null;
      }
      
      // Adaptive marker size based on timeframe - КАК В ОСНОВНОМ ГРАФИКЕ
      let markerSize = 1;
      switch(timeframe) {
        case '1m':
        case '5m':
        case '15m':
          markerSize = 0.8;
          break;
        case '30m':
        case '1h':
          markerSize = 1;
          break;
        case '4h':
        case '1d':
          markerSize = 1.2;
          break;
        case '1w':
          markerSize = 1.5;
          break;
        default:
          markerSize = 1;
      }
      
      // Marker colors based on event type and theme - КАК В ОСНОВНОМ ГРАФИКЕ
      const markerColor = isNewMoon 
        ? (isDarkMode ? '#475569' : '#1e293b')  // Темно-серый для новолуния
        : (isDarkMode ? '#facc15' : '#eab308'); // Желтый для полнолуния
      
      // Get approximate price for marker
      const eventDate = new Date(eventTime * 1000);
      const price = this.getApproximatePriceForDate(eventDate, candleData);
      
      if (!price) return null;
      
      // Smart positioning to avoid overlaps - КАК В ОСНОВНОМ ГРАФИКЕ
      let priceOffset = 1.02;
      const nearbyEvents = lunarEvents.filter((otherEvent, otherIndex) => {
        if (otherIndex >= index) return false;
        
        const otherTime = otherEvent.timestamp || (otherEvent.date 
          ? Math.floor(new Date(otherEvent.date).getTime() / 1000)
          : 0);
        
        let proximityThreshold;
        switch(timeframe) {
          case '1m':
          case '5m':
            proximityThreshold = 60 * 60; // 1 hour
            break;
          case '15m':
          case '30m':
            proximityThreshold = 4 * 60 * 60; // 4 hours
            break;
          case '1h':
          case '4h':
            proximityThreshold = 24 * 60 * 60; // 1 day
            break;
          case '1d':
            proximityThreshold = 7 * 24 * 60 * 60; // 7 days
            break;
          case '1w':
            proximityThreshold = 30 * 24 * 60 * 60; // 30 days
            break;
          default:
            proximityThreshold = 24 * 60 * 60; // 1 day
        }
        
        return Math.abs(eventTime - otherTime) < proximityThreshold;
      });
      
      // Добавляем offset для ближайших событий
      priceOffset += nearbyEvents.length * 0.015;
      
      // Дополнительный offset для событий одного типа
      const sameTypeNearbyEvents = nearbyEvents.filter(otherEvent => {
        const otherIsNewMoon = otherEvent.subtype === 'new_moon' || otherEvent.title === 'Новолуние';
        return isNewMoon === otherIsNewMoon;
      });
      
      priceOffset += sameTypeNearbyEvents.length * 0.008;
      
      const markerIcon = isNewMoon ? '🌑' : '🌕';
      
      return {
        time: eventTime as UTCTimestamp,
        position: 'aboveBar' as const,
        shape: 'circle' as const,
        color: markerColor,
        size: markerSize,
        text: markerIcon,
        price: price * priceOffset
      };
    }).filter(marker => marker !== null) as LunarMarker[];
    
    // Sort markers by time
    lunarMarkers.sort((a, b) => a.time - b.time);

    console.log(`🌙 Created ${lunarMarkers.length} lunar phase markers`);
    return lunarMarkers;
  }
} 