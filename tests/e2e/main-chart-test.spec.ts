import { test, expect } from '@playwright/test';

test.describe('Главная страница - Базовая проверка', () => {
  test('должен загружать главную страницу с графиком', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');
    
    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle');
    
    // Ищем dashboard
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Делаем скриншот
    await page.screenshot({ path: 'test-results/main-page-working.png' });
    
    // Ждем загрузки компонентов
    await page.waitForTimeout(5000);
    
    // Ищем график
    const chartElement = page.locator('[data-testid="bitcoin-chart"]');
    
    // Проверяем что график появился
    await expect(chartElement).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Главная страница работает!');
  });
}); 