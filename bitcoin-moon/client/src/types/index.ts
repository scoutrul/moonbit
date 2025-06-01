/**
 * Типы данных для проекта MoonBit
 */

/**
 * Данные о текущей цене биткоина
 */
export interface BitcoinPrice {
  price: number;
  currency: string;
  last_updated: string;
  change_24h: number;
  change_percentage_24h: number;
}

/**
 * Исторические данные о цене биткоина
 */
export interface BitcoinHistoricalData {
  currency: string;
  days: number;
  data: BitcoinHistoricalDataPoint[];
}

/**
 * Точка данных для исторических данных о цене биткоина
 */
export interface BitcoinHistoricalDataPoint {
  date: string;
  price: number;
}

/**
 * Фаза луны
 */
export interface MoonPhase {
  phase: string;
  illumination: number;
  date: string;
  emoji: string;
  name: string;
}

/**
 * Событие
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  link?: string;
  important: boolean;
}

/**
 * Астрологические данные
 */
export interface AstroData {
  moonSign: string;
  moonPhase: string;
  illumination: number;
  nextFullMoon: string;
  nextNewMoon: string;
}

/**
 * Опции временного интервала для графиков
 */
export type TimeframeOption = '1d' | '7d' | '14d' | '30d' | '90d' | '365d';

/**
 * Свечные данные для графика
 */
export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Свойства компонента BitcoinChartWithLunarPhases
 */
export interface BitcoinChartProps {
  timeframe: string;
  data: CandlestickData[];
}

/**
 * Параметр запроса для получения цены биткоина
 */
export interface BitcoinPriceParams {
  currency?: string;
}

/**
 * Параметр запроса для получения исторических данных о цене биткоина
 */
export interface BitcoinHistoricalParams extends BitcoinPriceParams {
  days?: number;
}

/**
 * Параметр запроса для получения событий
 */
export interface EventsParams {
  count?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Параметр запроса для получения данных о луне
 */
export interface MoonParams {
  count?: number;
  startDate?: string;
  endDate?: string;
}
