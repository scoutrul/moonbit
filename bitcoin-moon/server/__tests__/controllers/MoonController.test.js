import MoonController from '../../src/controllers/MoonController.js';
import moonService from '../../src/services/MoonService.js';

// Мокаем зависимости
jest.mock('../../src/services/MoonService.js');
jest.mock('../../src/utils/logger.js');

describe('MoonController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Мокаем методы сервиса
    moonService.getCurrentPhase = jest.fn().mockReturnValue({
      phase: 'waxing_gibbous',
      illumination: 0.75,
      age: 10.5,
      distance: 384400,
    });

    moonService.getUpcomingPhases = jest.fn().mockReturnValue([
      {
        phase: 'full_moon',
        date: '2024-01-15T12:00:00Z',
        illumination: 1.0,
      },
      {
        phase: 'new_moon',
        date: '2024-01-30T12:00:00Z',
        illumination: 0.0,
      },
    ]);
  });

  describe('getCurrentPhase', () => {
    it('должен возвращать текущую фазу луны', async () => {
      await MoonController.getCurrentPhase(req, res, next);

      expect(moonService.getCurrentPhase).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        phase: 'waxing_gibbous',
        illumination: 0.75,
        age: 10.5,
        distance: 384400,
      });
    });
  });

  describe('getUpcomingPhases', () => {
    it('должен возвращать предстоящие фазы луны', async () => {
      req.query = { days: '30' };

      await MoonController.getUpcomingPhases(req, res, next);

      expect(moonService.getUpcomingPhases).toHaveBeenCalledWith(30);
      expect(res.json).toHaveBeenCalledWith([
        {
          phase: 'full_moon',
          date: '2024-01-15T12:00:00Z',
          illumination: 1.0,
        },
        {
          phase: 'new_moon',
          date: '2024-01-30T12:00:00Z',
          illumination: 0.0,
        },
      ]);
    });
  });
});
