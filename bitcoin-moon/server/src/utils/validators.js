import { z } from 'zod';
import logger from './logger.js';

/**
 * Схемы валидации данных с использованием Zod
 */

// Схема запроса для фаз луны за период
const moonPeriodRequestSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/, 'Формат даты должен быть YYYY-MM-DD')
      .refine((date) => !isNaN(new Date(date).getTime()), {
        message: 'Недопустимая дата начала периода',
      }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/, 'Формат даты должен быть YYYY-MM-DD')
      .refine((date) => !isNaN(new Date(date).getTime()), {
        message: 'Недопустимая дата конца периода',
      }),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: 'Дата начала должна быть раньше или равна дате окончания',
      path: ['startDate'],
    }
  );

// Схема запроса для следующих значимых фаз луны
const moonNextRequestSchema = z.object({
  count: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 4))
    .pipe(
      z
        .number()
        .int('Количество должно быть целым числом')
        .positive('Количество должно быть положительным')
        .max(10, 'Максимальное количество - 10')
    ),
});

// Схема ответа с фазой луны
const moonPhaseResponseSchema = z.object({
  date: z.string(),
  phase: z.number().min(0).max(1),
  phaseName: z.string(),
});

// Схема ответа со значимой фазой луны
const significantMoonPhaseResponseSchema = z.object({
  date: z.string(),
  type: z.enum(['Новолуние', 'Полнолуние']),
  phase: z.number().min(0).max(1),
});

// Схема запроса для цены биткоина
const bitcoinPriceRequestSchema = z.object({
  currency: z.enum(['usd', 'eur', 'rub']).default('usd'),
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30))
    .pipe(
      z
        .number()
        .int('Количество дней должно быть целым числом')
        .positive('Количество дней должно быть положительным')
        .max(365, 'Максимальное количество дней - 365')
    ),
});

// Схема ответа с текущей ценой биткоина
const bitcoinCurrentPriceResponseSchema = z.object({
  price: z.number().positive(),
  currency: z.string(),
  last_updated: z.string(),
  change_24h: z.number(),
  change_percentage_24h: z.number(),
});

// Схема запроса для событий
const eventsRequestSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5))
    .pipe(
      z
        .number()
        .int('Лимит должен быть целым числом')
        .positive('Лимит должен быть положительным')
        .max(100, 'Максимальное количество событий - 100')
    ),
});

/**
 * Валидирует данные запроса по схеме
 * @param {Object} schema - Схема валидации Zod
 * @param {Object} data - Данные для валидации
 * @returns {Object} Валидированные данные или выбрасывает ошибку
 */
function validateRequest(schema, data) {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.warn('Ошибка валидации запроса', { error: error.errors });
    throw {
      status: 400,
      message: 'Ошибка валидации данных',
      errors: error.errors,
    };
  }
}

/**
 * Валидирует данные ответа по схеме
 * @param {Object} schema - Схема валидации Zod
 * @param {Object} data - Данные для валидации
 * @returns {Object} Валидированные данные
 */
function validateResponse(schema, data) {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.error('Ошибка валидации ответа', {
      error: error.errors,
      data,
    });

    // Не выбрасываем ошибку, только логируем
    return data;
  }
}

// Экспортируем функции и схемы
export { validateRequest, validateResponse };

// Экспортируем схемы
export const schemas = {
  moonPeriodRequest: moonPeriodRequestSchema,
  moonNextRequest: moonNextRequestSchema,
  moonPhaseResponse: moonPhaseResponseSchema,
  significantMoonPhaseResponse: significantMoonPhaseResponseSchema,
  bitcoinPriceRequest: bitcoinPriceRequestSchema,
  bitcoinCurrentPriceResponse: bitcoinCurrentPriceResponseSchema,
  eventsRequest: eventsRequestSchema,
};
