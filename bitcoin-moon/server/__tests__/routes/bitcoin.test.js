import request from 'supertest';
import express from 'express';
import bitcoinRoutes from '../../src/routes/bitcoin.js';

// Мокаем контроллер
jest.mock('../../src/controllers/BitcoinController.js', () => ({
  getCurrentPrice: jest.fn((req, res) => res.json({ price: 50000 })),
  getHistoricalData: jest.fn((req, res) => res.json({ data: [] })),
  getPriceAnalysis: jest.fn((req, res) => res.json({ trend: 'bullish' })),
}));

const app = express();
app.use('/api/bitcoin', bitcoinRoutes);

describe('Bitcoin Routes', () => {
  describe('GET /api/bitcoin/price', () => {
    it('должен возвращать текущую цену', async () => {
      const response = await request(app)
        .get('/api/bitcoin/price')
        .expect(200);
      
      expect(response.body).toHaveProperty('price');
    });
  });

  describe('GET /api/bitcoin/historical', () => {
    it('должен возвращать исторические данные', async () => {
      const response = await request(app)
        .get('/api/bitcoin/historical')
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/bitcoin/analysis', () => {
    it('должен возвращать анализ цены', async () => {
      const response = await request(app)
        .get('/api/bitcoin/analysis')
        .expect(200);
      
      expect(response.body).toHaveProperty('trend');
    });
  });
});
