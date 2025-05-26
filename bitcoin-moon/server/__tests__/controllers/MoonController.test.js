const MoonController = require('../../src/controllers/MoonController');
const moonService = require('../../src/services/MoonService');
const { validateResponse } = require('../../src/utils/validators');

// Мокаем зависимости
jest.mock('../../src/services/MoonService');
jest.mock('../../src/utils/validators');
jest.mock('../../src/utils/logger');

describe('MoonController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Сбрасываем все моки перед каждым тестом
    jest.clearAllMocks();

    // Создаем моки для req, res и next
    req = {
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Мокаем методы сервиса
    moonService.getCurrentPhase = jest.fn().mockReturnValue({
      phase: 0.25,
      phaseName: 'Первая четверть',
      illumination: 50,
      date: '2023-06-01T12:00:00Z',
      nextFullMoon: '2023-06-15T12:00:00Z',
      nextNewMoon: '2023-06-30T12:00:00Z'
    });

    moonService.getPhasesForPeriod = jest.fn().mockReturnValue([
      { date: '2023-05-01', phase: 0.0, phaseName: 'Новолуние' },
      { date: '2023-05-08', phase: 0.25, phaseName: 'Первая четверть' },
      { date: '2023-05-15', phase: 0.5, phaseName: 'Полнолуние' }
    ]);

    moonService.getNextSignificantPhases = jest.fn().mockReturnValue([
      { date: '2023-06-15', phase: 0.5, phaseName: 'Полнолуние' },
      { date: '2023-06-30', phase: 0.0, phaseName: 'Новолуние' }
    ]);

    // Мокаем валидацию
    validateResponse.mockImplementation((schema, data) => data);
  });

  describe('getCurrentPhase', () => {
    it('должен возвращать текущую фазу луны', async () => {
      // Вызываем метод контроллера
      await MoonController.getCurrentPhase(req, res, next);

      // Проверяем, что сервис был вызван
      expect(moonService.getCurrentPhase).toHaveBeenCalled();

      // Проверяем, что ответ был отправлен с правильными данными
      expect(res.json).toHaveBeenCalledWith({
        phase: 0.25,
        phaseName: 'Первая четверть',
        illumination: 50,
        date: '2023-06-01T12:00:00Z',
        nextFullMoon: '2023-06-15T12:00:00Z',
        nextNewMoon: '2023-06-30T12:00:00Z'
      });

      // Проверяем, что next не был вызван (нет ошибок)
      expect(next).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки и вызывать next с ошибкой', async () => {
      // Имитируем ошибку в сервисе
      const error = new Error('Ошибка сервиса');
      moonService.getCurrentPhase.mockImplementationOnce(() => {
        throw error;
      });

      // Вызываем метод контроллера
      await MoonController.getCurrentPhase(req, res, next);

      // Проверяем, что next был вызван с ошибкой
      expect(next).toHaveBeenCalledWith(error);

      // Проверяем, что ответ не был отправлен
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPhasesForPeriod', () => {
    it('должен возвращать фазы луны за период', async () => {
      // Устанавливаем параметры запроса
      req.query.startDate = '2023-05-01';
      req.query.endDate = '2023-05-15';

      // Вызываем метод контроллера
      await MoonController.getPhasesForPeriod(req, res, next);

      // Проверяем, что сервис был вызван с правильными параметрами
      expect(moonService.getPhasesForPeriod).toHaveBeenCalledWith('2023-05-01', '2023-05-15');

      // Проверяем, что ответ был отправлен с правильными данными
      expect(res.json).toHaveBeenCalledWith([
        { date: '2023-05-01', phase: 0.0, phaseName: 'Новолуние' },
        { date: '2023-05-08', phase: 0.25, phaseName: 'Первая четверть' },
        { date: '2023-05-15', phase: 0.5, phaseName: 'Полнолуние' }
      ]);

      // Проверяем, что next не был вызван (нет ошибок)
      expect(next).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки и вызывать next с ошибкой', async () => {
      // Имитируем ошибку в сервисе
      const error = new Error('Ошибка сервиса');
      moonService.getPhasesForPeriod.mockImplementationOnce(() => {
        throw error;
      });

      // Устанавливаем параметры запроса
      req.query.startDate = '2023-05-01';
      req.query.endDate = '2023-05-15';

      // Вызываем метод контроллера
      await MoonController.getPhasesForPeriod(req, res, next);

      // Проверяем, что next был вызван с ошибкой
      expect(next).toHaveBeenCalledWith(error);

      // Проверяем, что ответ не был отправлен
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getNextSignificantPhases', () => {
    it('должен возвращать следующие значимые фазы луны', async () => {
      // Устанавливаем параметры запроса
      req.query.count = '2';

      // Вызываем метод контроллера
      await MoonController.getNextSignificantPhases(req, res, next);

      // Проверяем, что сервис был вызван с правильными параметрами
      expect(moonService.getNextSignificantPhases).toHaveBeenCalledWith('2');

      // Проверяем, что ответ был отправлен с правильными данными
      expect(res.json).toHaveBeenCalledWith([
        { date: '2023-06-15', phase: 0.5, phaseName: 'Полнолуние' },
        { date: '2023-06-30', phase: 0.0, phaseName: 'Новолуние' }
      ]);

      // Проверяем, что next не был вызван (нет ошибок)
      expect(next).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки и вызывать next с ошибкой', async () => {
      // Имитируем ошибку в сервисе
      const error = new Error('Ошибка сервиса');
      moonService.getNextSignificantPhases.mockImplementationOnce(() => {
        throw error;
      });

      // Устанавливаем параметры запроса
      req.query.count = '2';

      // Вызываем метод контроллера
      await MoonController.getNextSignificantPhases(req, res, next);

      // Проверяем, что next был вызван с ошибкой
      expect(next).toHaveBeenCalledWith(error);

      // Проверяем, что ответ не был отправлен
      expect(res.json).not.toHaveBeenCalled();
    });
  });
}); 