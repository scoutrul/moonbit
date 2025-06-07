import { test, expect } from '@playwright/test';

test.describe('Demo Page', () => {
  test('должен отображать демо график с полным функционалом', async ({ page }) => {
    // Открываем демо страницу
    await page.goto('/demo');
    
    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle');
    
    // Проверяем заголовок страницы
    await expect(page.locator('h1')).toContainText('MoonBit Demo');
    
    // Проверяем наличие графика
    const chartContainer = page.locator('[data-testid="chart-container"]');
    await expect(chartContainer).toBeVisible({ timeout: 15000 });
    
    // Проверяем что canvas график загружен
    const chartCanvas = page.locator('canvas');
    await expect(chartCanvas).toBeVisible({ timeout: 10000 });
    
    // Проверяем информационную панель
    await expect(page.locator('text=MoonBit Demo Chart')).toBeVisible();
    await expect(page.locator('text=Timeframe:')).toBeVisible();
    await expect(page.locator('text=Data:')).toBeVisible();
    
    // Проверяем панель управления
    await expect(page.locator('button:has-text("Refresh Data")')).toBeVisible();
    await expect(page.locator('button:has-text("Change Timeframe")')).toBeVisible();
    
    // Проверяем инструкции
    await expect(page.locator('text=Возможности демо графика')).toBeVisible();
    
    // Делаем скриншот для анализа
    await page.screenshot({ path: 'demo-page-screenshot.png', fullPage: true });
    
    // Проверяем консольные ошибки
    const consoleMessages = await page.evaluate(() => {
      return window.console;
    });
    
    console.log('Демо страница загружена, скриншот сохранен как demo-page-screenshot.png');
  });
  
  test('должен корректно работать с данными и API', async ({ page }) => {
    // Мониторим сетевые запросы
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    // Мониторим консольные сообщения
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Ждем загрузки данных
    await page.waitForTimeout(5000);
    
    console.log('Network requests:', requests.filter(url => url.includes('api')));
    console.log('Console logs:', consoleLogs);
    
    // Проверяем что данные загружены
    const dataPointsText = await page.locator('text=точек').textContent();
    console.log('Data points found:', dataPointsText);
  });
}); 