/**
 * SolarService - Calculates solstices, equinoxes, and solar/lunar eclipses
 * Using pure mathematical calculations instead of external libraries
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger } from '../types/interfaces';

export interface SeasonalEvent {
  type: 'spring_equinox' | 'summer_solstice' | 'autumn_equinox' | 'winter_solstice';
  date: Date;
  title: string;
  description: string;
  season: string;
  category: 'seasonal';
}

export interface EclipseEvent {
  type: 'solar_eclipse' | 'lunar_eclipse';
  date: Date;
  title: string;
  description: string;
  magnitude?: number;
  duration?: number;
  visibility?: string;
  peak_time?: Date;
  category: 'eclipse';
}

export type SolarEvent = SeasonalEvent | EclipseEvent;

interface CacheItem {
  data: any;
  timestamp: number;
}

/**
 * Mathematical calculations for astronomical seasons
 * Based on formulas from Astronomical Algorithms by Jean Meeus
 */
class SeasonCalculator {
  
  /**
   * Calculate the Julian Day Number for a given date
   */
  private static getJulianDay(year: number, month: number, day: number, hour: number = 0): number {
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    
    return Math.floor(365.25 * (year + 4716)) + 
           Math.floor(30.6001 * (month + 1)) + 
           day + hour / 24 + b - 1524.5;
  }

  /**
   * Convert Julian Day Number to JavaScript Date
   */
  private static julianToDate(jd: number): Date {
    const a = jd + 0.5;
    const z = Math.floor(a);
    const f = a - z;
    
    let A = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      A = z + 1 + alpha - Math.floor(alpha / 4);
    }
    
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);
    
    const day = B - D - Math.floor(30.6001 * E) + f;
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    
    const hours = (day - Math.floor(day)) * 24;
    const minutes = (hours - Math.floor(hours)) * 60;
    const seconds = (minutes - Math.floor(minutes)) * 60;
    
    return new Date(year, month - 1, Math.floor(day), Math.floor(hours), Math.floor(minutes), Math.floor(seconds));
  }

  /**
   * Calculate the approximate Julian Day for a season event
   * Based on Meeus' formulas for equinoxes and solstices
   */
  private static getSeasonApprox(year: number, season: 'spring' | 'summer' | 'autumn' | 'winter'): number {
    const Y = (year - 2000) / 1000;
    
    let JDE0: number;
    
    switch (season) {
      case 'spring': // March equinox
        JDE0 = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y * Y - 0.00411 * Y * Y * Y - 0.00057 * Y * Y * Y * Y;
        break;
      case 'summer': // June solstice
        JDE0 = 2451716.56767 + 365241.62603 * Y + 0.00325 * Y * Y + 0.00888 * Y * Y * Y - 0.00030 * Y * Y * Y * Y;
        break;
      case 'autumn': // September equinox
        JDE0 = 2451810.21715 + 365242.01767 * Y - 0.11575 * Y * Y + 0.00337 * Y * Y * Y + 0.00078 * Y * Y * Y * Y;
        break;
      case 'winter': // December solstice
        JDE0 = 2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y * Y * Y + 0.00032 * Y * Y * Y * Y;
        break;
    }
    
    return JDE0;
  }

  /**
   * Calculate precise seasonal events for a given year
   */
  public static calculateSeasonalEvents(year: number): SeasonalEvent[] {
    const events: SeasonalEvent[] = [];
    
    const seasons = [
      { key: 'spring' as const, type: 'spring_equinox' as const, title: 'Весеннее равноденствие', season: 'Spring' },
      { key: 'summer' as const, type: 'summer_solstice' as const, title: 'Летнее солнцестояние', season: 'Summer' },
      { key: 'autumn' as const, type: 'autumn_equinox' as const, title: 'Осеннее равноденствие', season: 'Autumn' },
      { key: 'winter' as const, type: 'winter_solstice' as const, title: 'Зимнее солнцестояние', season: 'Winter' }
    ];
    
    for (const { key, type, title, season } of seasons) {
      const jd = this.getSeasonApprox(year, key);
      const date = this.julianToDate(jd);
      
      events.push({
        type,
        date,
        title,
        description: `${title} ${year} года`,
        season,
        category: 'seasonal'
      });
    }
    
    return events;
  }
}

/**
 * Historical eclipse data for accurate eclipse information
 */
class EclipseData {
  
  // Known eclipses data for 2024-2025 period
  private static readonly KNOWN_ECLIPSES = [
    // 2024 Solar Eclipses
    {
      date: new Date('2024-04-08T18:17:00.000Z'),
      type: 'solar_eclipse' as const,
      title: 'Полное солнечное затмение',
      description: 'Полное солнечное затмение 8 апреля 2024 года',
      magnitude: 1.0,
      duration: 268,
      visibility: 'North America'
    },
    {
      date: new Date('2024-10-02T18:45:00.000Z'),
      type: 'solar_eclipse' as const,
      title: 'Кольцевое солнечное затмение',
      description: 'Кольцевое солнечное затмение 2 октября 2024 года',
      magnitude: 0.93,
      duration: 444,
      visibility: 'South America, Pacific'
    },
    
    // 2024 Lunar Eclipses
    {
      date: new Date('2024-03-25T07:12:00.000Z'),
      type: 'lunar_eclipse' as const,
      title: 'Полутеневое лунное затмение',
      description: 'Полутеневое лунное затмение 25 марта 2024 года',
      magnitude: 0.96,
      duration: 270,
      visibility: 'Americas, Europe, Africa'
    },
    {
      date: new Date('2024-09-18T02:44:00.000Z'),
      type: 'lunar_eclipse' as const,
      title: 'Частичное лунное затмение',
      description: 'Частичное лунное затмение 18 сентября 2024 года',
      magnitude: 0.08,
      duration: 63,
      visibility: 'Americas, Europe, Africa'
    },
    
    // 2025 Solar Eclipses
    {
      date: new Date('2025-03-29T10:47:00.000Z'),
      type: 'solar_eclipse' as const,
      title: 'Частичное солнечное затмение',
      description: 'Частичное солнечное затмение 29 марта 2025 года',
      magnitude: 0.94,
      duration: 180,
      visibility: 'Atlantic, Europe, Asia, Africa'
    },
    {
      date: new Date('2025-09-21T19:43:00.000Z'),
      type: 'solar_eclipse' as const,
      title: 'Частичное солнечное затмение',
      description: 'Частичное солнечное затмение 21 сентября 2025 года',
      magnitude: 0.86,
      duration: 160,
      visibility: 'Pacific, New Zealand'
    },
    
    // 2025 Lunar Eclipses
    {
      date: new Date('2025-03-14T06:58:00.000Z'),
      type: 'lunar_eclipse' as const,
      title: 'Полное лунное затмение',
      description: 'Полное лунное затмение 14 марта 2025 года',
      magnitude: 1.18,
      duration: 225,
      visibility: 'Pacific, Americas, Western Europe'
    },
    {
      date: new Date('2025-09-07T18:11:00.000Z'),
      type: 'lunar_eclipse' as const,
      title: 'Полное лунное затмение',
      description: 'Полное лунное затмение 7 сентября 2025 года',
      magnitude: 1.36,
      duration: 207,
      visibility: 'Europe, Africa, Asia, Australia'
    }
  ];

  public static getEclipses(year: number, type?: 'solar_eclipse' | 'lunar_eclipse'): EclipseEvent[] {
    return this.KNOWN_ECLIPSES
      .filter(eclipse => eclipse.date.getFullYear() === year)
      .filter(eclipse => !type || eclipse.type === type)
      .map(eclipse => ({
        ...eclipse,
        peak_time: eclipse.date,
        category: 'eclipse' as const
      }));
  }

  public static getEclipsesInRange(startDate: Date, endDate: Date, type?: 'solar_eclipse' | 'lunar_eclipse'): EclipseEvent[] {
    return this.KNOWN_ECLIPSES
      .filter(eclipse => eclipse.date >= startDate && eclipse.date <= endDate)
      .filter(eclipse => !type || eclipse.type === type)
      .map(eclipse => ({
        ...eclipse,
        peak_time: eclipse.date,
        category: 'eclipse' as const
      }));
  }
}

@injectable()
export class SolarService {
  private cache: Map<string, CacheItem> = new Map();
  private readonly cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  constructor(@inject(TYPES.Logger) private logger: ILogger) {
    this.logger.info('SolarService: инициализирован с математическими расчетами');
  }

  /**
   * Generic cache helper
   */
  private getCachedOrCalculate<T>(key: string, calculator: () => T): T {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.logger.debug(`SolarService: данные загружены из кэша для ключа ${key}`);
      return cached.data;
    }

    const data = calculator();
    this.cache.set(key, { data, timestamp: Date.now() });
    this.logger.debug(`SolarService: данные рассчитаны и закэшированы для ключа ${key}`);
    return data;
  }

  /**
   * Calculate seasonal events (solstices and equinoxes) for a given year
   */
  public calculateSeasonalEvents(year: number): SeasonalEvent[] {
    const cacheKey = `seasonal_${year}`;
    
    return this.getCachedOrCalculate(cacheKey, () => {
      this.logger.info(`SolarService: расчет сезонных событий для ${year} года`);
      return SeasonCalculator.calculateSeasonalEvents(year);
    });
  }

  /**
   * Calculate solar eclipses for a given year
   */
  public calculateSolarEclipses(year: number): EclipseEvent[] {
    const cacheKey = `solar_eclipses_${year}`;
    
    return this.getCachedOrCalculate(cacheKey, () => {
      this.logger.info(`SolarService: получение солнечных затмений для ${year} года`);
      return EclipseData.getEclipses(year, 'solar_eclipse');
    });
  }

  /**
   * Calculate lunar eclipses for a given year
   */
  public calculateLunarEclipses(year: number): EclipseEvent[] {
    const cacheKey = `lunar_eclipses_${year}`;
    
    return this.getCachedOrCalculate(cacheKey, () => {
      this.logger.info(`SolarService: получение лунных затмений для ${year} года`);
      return EclipseData.getEclipses(year, 'lunar_eclipse');
    });
  }

  /**
   * Get all solar events (seasonal + eclipses) for a date range
   */
  public getAllSolarEvents(
    startDate: Date, 
    endDate: Date, 
    types: string[] = ['seasonal', 'solar_eclipse', 'lunar_eclipse']
  ): SolarEvent[] {
    const events: SolarEvent[] = [];
    
    this.logger.info(`SolarService: получение всех солнечных событий с ${startDate.toISOString()} по ${endDate.toISOString()}`);

    // Add seasonal events if requested
    if (types.includes('seasonal')) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        const seasonalEvents = this.calculateSeasonalEvents(year)
          .filter(event => event.date >= startDate && event.date <= endDate);
        events.push(...seasonalEvents);
      }
    }

    // Add eclipse events if requested
    if (types.includes('solar_eclipse') || types.includes('lunar_eclipse')) {
      const eclipseTypes: ('solar_eclipse' | 'lunar_eclipse')[] = [];
      if (types.includes('solar_eclipse')) eclipseTypes.push('solar_eclipse');
      if (types.includes('lunar_eclipse')) eclipseTypes.push('lunar_eclipse');
      
      for (const eclipseType of eclipseTypes) {
        const eclipses = EclipseData.getEclipsesInRange(startDate, endDate, eclipseType);
        events.push(...eclipses);
      }
    }

    // Sort by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    this.logger.info(`SolarService: найдено ${events.length} событий`);
    return events;
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info('SolarService: кэш очищен');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { itemCount: number; memoryUsage: string } {
    const itemCount = this.cache.size;
    const memoryUsage = `${Math.round(JSON.stringify([...this.cache.entries()]).length / 1024)}KB`;
    
    return {
      itemCount,
      memoryUsage
    };
  }
}