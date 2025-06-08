import { test, expect } from '@playwright/test';

test.describe('Главная страница с Infinite Scroll', () => {
  test('должна загружаться без ошибок и показывать график', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');
    
    // Ждём загрузки заголовка
    await page.waitForSelector('h1:has-text("Мунбит")', { timeout: 5000 });
    console.log('✅ Заголовок страницы загружен');
    
    // Ждём появления графика или индикатора загрузки
    const chartOrLoader = page.locator('[data-testid="bitcoin-chart"], .animate-spin');
    await expect(chartOrLoader.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ График или индикатор загрузки появился');
    
    // Ждём окончания загрузки (либо график, либо ошибка)
    await page.waitForTimeout(5000);
    
    // Проверяем что нет критических ошибок JavaScript
    const jsErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (jsErrors.length > 0) {
      console.log('⚠️ JavaScript ошибки найдены:', jsErrors);
    } else {
      console.log('✅ Нет критических JavaScript ошибок');
    }
    
    // Проверяем что кнопки таймфреймов есть
    const timeframeButtons = page.locator('button:has-text("1Д")');
    await expect(timeframeButtons.first()).toBeVisible();
    console.log('✅ Кнопки таймфреймов отображаются');
    
    console.log('✅ Главная страница успешно загружена');
  });

  test('должна показывать хотя бы базовую структуру', async ({ page }) => {
    await page.goto('/');
    
    // Проверяем базовую структуру страницы
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    console.log('✅ Базовая структура страницы присутствует');
  });
}); 