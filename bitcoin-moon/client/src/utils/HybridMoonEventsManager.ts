import AstroService from '../services/AstroService';
import { Event } from '../types';

/**
 * Гибридный менеджер лунных событий с Smart Cache + Viewport Optimization
 * Реализует алгоритм из Creative Phase для эффективной синхронизации
 * moon events с Bitcoin candlestick данными при infinite scroll
 */
export class HybridMoonEventsManager {
  // Smart Cache для эффективного хранения
  private cache: Map<string, Event[]> = new Map();
  private loadedRanges: Array<{start: number, end: number}> = [];
  
  // Viewport tracking для оптимизации загрузки
  private currentViewport: {from: number, to: number} | null = null;
  private bufferMultiplier = 3; // Агрессивная буферизация для smooth experience
  
  // Performance optimization
  private readonly maxCacheSize = 30 * 24 * 60 * 60; // 30 дней в секундах
  private lastCleanupTime = 0;
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 минут
  
  constructor() {
    console.log('🌙 HybridMoonEventsManager: Инициализирован с буфером x' + this.bufferMultiplier);
  }

  /**
   * Основной метод синхронизации moon events с Bitcoin данными
   * @param visibleTimeRange - Видимый временной диапазон chart
   * @param bitcoinData - Массив Bitcoin candlestick данных
   * @param direction - Направление infinite scroll (опционально)
   * @returns Promise<Event[]> - Moon events для отображения
   */
  async syncMoonEventsWithBitcoinData(
    visibleTimeRange: {from: number, to: number} | null,
    bitcoinData: Array<{time: number}>,
    direction?: 'left' | 'right'
  ): Promise<Event[]> {
    try {
      console.log('🌙 HybridMoonEventsManager: Синхронизация moon events', {
        visibleRange: visibleTimeRange,
        bitcoinDataLength: bitcoinData.length,
        direction
      });
      
      // 1. Определяем нужный диапазон на основе viewport + buffer
      const dataRange = this.calculateDataRange(bitcoinData);
      const viewportRange = this.calculateViewportRange(visibleTimeRange);
      const targetRange = this.mergeRanges(dataRange, viewportRange);
      
      if (!targetRange) {
        console.warn('🌙 HybridMoonEventsManager: Не удается определить target range');
        return [];
      }
      
      console.log('🌙 Target range:', {
        start: new Date(targetRange.start * 1000).toISOString(),
        end: new Date(targetRange.end * 1000).toISOString()
      });
      
      // 2. Проверяем кэш и загружаем недостающие данные
      const missingRanges = this.calculateMissingRanges(targetRange.start, targetRange.end);
      
      if (missingRanges.length > 0) {
        console.log('🌙 HybridMoonEventsManager: Загружаем недостающие диапазоны:', missingRanges.length);
        
        const loadPromises = missingRanges.map(range => 
          this.loadAndCacheRange(range)
        );
        await Promise.all(loadPromises);
      }
      
      // 3. Оптимизация памяти - периодическая очистка старых данных
      this.performPeriodicCleanup(targetRange);
      
      // 4. Возвращаем события для текущего диапазона
      const events = this.getEventsFromCache(targetRange.start, targetRange.end);
      
      console.log(`🌙 HybridMoonEventsManager: Возвращено ${events.length} moon events`);
      return events;
      
    } catch (error) {
      console.error('❌ HybridMoonEventsManager: Ошибка синхронизации:', error);
      return [];
    }
  }

  /**
   * Рассчитывает временной диапазон на основе Bitcoin данных
   * @param bitcoinData - Массив Bitcoin candlestick данных
   * @returns {start: number, end: number} | null
   */
  private calculateDataRange(bitcoinData: Array<{time: number}>): {start: number, end: number} | null {
    if (bitcoinData.length === 0) return null;
    
    const times = bitcoinData.map(d => d.time).sort((a, b) => a - b);
    return {
      start: times[0],
      end: times[times.length - 1]
    };
  }

  /**
   * Рассчитывает viewport range с буферизацией
   * @param visibleTimeRange - Видимый временной диапазон
   * @returns {start: number, end: number} | null
   */
  private calculateViewportRange(visibleTimeRange: {from: number, to: number} | null): {start: number, end: number} | null {
    if (!visibleTimeRange) return null;
    
    const visibleDuration = visibleTimeRange.to - visibleTimeRange.from;
    const bufferSize = visibleDuration * (this.bufferMultiplier - 1) / 2;
    
    return {
      start: Math.floor(visibleTimeRange.from - bufferSize),
      end: Math.ceil(visibleTimeRange.to + bufferSize)
    };
  }

  /**
   * Объединяет data range и viewport range в единый target range
   * @param dataRange - Диапазон Bitcoin данных
   * @param viewportRange - Диапазон viewport с буфером
   * @returns {start: number, end: number} | null
   */
  private mergeRanges(
    dataRange: {start: number, end: number} | null,
    viewportRange: {start: number, end: number} | null
  ): {start: number, end: number} | null {
    
    if (!dataRange && !viewportRange) return null;
    if (!dataRange) return viewportRange;
    if (!viewportRange) return dataRange;
    
    // Используем пересечение диапазонов для оптимизации
    return {
      start: Math.min(dataRange.start, viewportRange.start),
      end: Math.max(dataRange.end, viewportRange.end)
    };
  }

  /**
   * Рассчитывает недостающие диапазоны для загрузки
   * @param targetStart - Начало нужного диапазона
   * @param targetEnd - Конец нужного диапазона
   * @returns Array<{start: number, end: number}> - Недостающие диапазоны
   */
  private calculateMissingRanges(targetStart: number, targetEnd: number): Array<{start: number, end: number}> {
    if (this.loadedRanges.length === 0) {
      return [{start: targetStart, end: targetEnd}];
    }
    
    // Простая реализация - можно оптимизировать для сложных случаев
    const isFullyCovered = this.loadedRanges.some(range => 
      range.start <= targetStart && range.end >= targetEnd
    );
    
    if (isFullyCovered) {
      return [];
    }
    
    // Для простоты загружаем весь диапазон если не полностью покрыт
    // TODO: Можно оптимизировать для частичного покрытия
    return [{start: targetStart, end: targetEnd}];
  }

  /**
   * Загружает и кэширует диапазон moon events
   * @param range - Диапазон для загрузки
   */
  private async loadAndCacheRange(range: {start: number, end: number}): Promise<void> {
    try {
      const startDate = new Date(range.start * 1000);
      const endDate = new Date(range.end * 1000);
      
      console.log(`🌙 Загружаем moon events: ${startDate.toISOString()} - ${endDate.toISOString()}`);
      
      const events = await AstroService.getAstroEvents(startDate, endDate);
      
      // Преобразуем в правильный формат Event[]
      const formattedEvents: Event[] = events.map((event: any) => ({
        id: `moon_${event.time}_${event.type}`,
        title: event.title || event.phaseName || 'Moon Event',
        description: event.phaseName || event.title || 'Lunar phase event',
        date: new Date(event.time * 1000).toISOString(),
        timestamp: event.time,
        type: 'lunar' as const,
        subtype: event.type || 'moon_phase',
        category: 'astronomy',
        important: event.type === 'full_moon' || event.type === 'new_moon',
        name: event.phaseName || event.title
      }));
      
      // Добавляем в кэш
      const cacheKey = `${range.start}-${range.end}`;
      this.cache.set(cacheKey, formattedEvents);
      
      // Обновляем загруженные диапазоны
      this.loadedRanges.push(range);
      
      console.log(`🌙 Загружено и закэшировано ${formattedEvents.length} moon events`);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки moon events для диапазона:', range, error);
    }
  }

  /**
   * Получает события из кэша для указанного диапазона
   * @param start - Начало диапазона
   * @param end - Конец диапазона
   * @returns Event[] - События из кэша
   */
  private getEventsFromCache(start: number, end: number): Event[] {
    const allEvents: Event[] = [];
    
    // Проходим по всем закэшированным диапазонам
    for (const [cacheKey, events] of this.cache.entries()) {
      // Фильтруем события по временному диапазону
      const filteredEvents = events.filter(event => 
        event.timestamp >= start && event.timestamp <= end
      );
      
      allEvents.push(...filteredEvents);
    }
    
    // Сортируем по времени и удаляем дубликаты
    const uniqueEvents = this.removeDuplicates(allEvents);
    
    return uniqueEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Удаляет дублирующие события
   * @param events - Массив событий
   * @returns Event[] - Уникальные события
   */
  private removeDuplicates(events: Event[]): Event[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.timestamp}_${event.type}_${event.subtype}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Периодическая очистка старых данных из кэша
   * @param currentRange - Текущий активный диапазон
   */
  private performPeriodicCleanup(currentRange: {start: number, end: number}): void {
    const now = Date.now();
    
    if (now - this.lastCleanupTime < this.cleanupInterval) {
      return; // Слишком рано для очистки
    }
    
    this.lastCleanupTime = now;
    
    // Удаляем старые диапазоны из кэша
    const relevantRanges = this.loadedRanges.filter(range => {
      const isRelevant = !(
        range.end < currentRange.start - this.maxCacheSize || 
        range.start > currentRange.end + this.maxCacheSize
      );
      
      if (!isRelevant) {
        // Удаляем из кэша
        const cacheKey = `${range.start}-${range.end}`;
        this.cache.delete(cacheKey);
        console.log(`🧹 Очищен старый диапазон из кэша: ${cacheKey}`);
      }
      
      return isRelevant;
    });
    
    this.loadedRanges = relevantRanges;
    
    console.log(`🧹 Cleanup: осталось ${this.loadedRanges.length} диапазонов в кэше`);
  }

  /**
   * Принудительная очистка всего кэша
   */
  public clearCache(): void {
    this.cache.clear();
    this.loadedRanges = [];
    this.currentViewport = null;
    console.log('🧹 HybridMoonEventsManager: Кэш полностью очищен');
  }

  /**
   * Получение статистики кэша для отладки
   */
  public getCacheStats(): {ranges: number, events: number, memoryUsage: string} {
    let totalEvents = 0;
    for (const events of this.cache.values()) {
      totalEvents += events.length;
    }
    
    return {
      ranges: this.loadedRanges.length,
      events: totalEvents,
      memoryUsage: `${Math.round(totalEvents * 0.5)}KB` // Примерная оценка
    };
  }
} 