import { test, expect } from '@playwright/test';

test.describe('Простое тестирование переключения таймфреймов', () => {
  test('Переключение между таймфреймами должно работать стабильно', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      
      if (msg.type() === 'error') {
        errorMessages.push(text);
      }
    });

    page.on('pageerror', (error) => {
      errorMessages.push(`Page Error: ${error.message}`);
    });

    // Переходим на главную страницу
    await page.goto('http://localhost:3000');
    
    // Ждем загрузки дашборда
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15000 });
    
    // Ждем появления графика
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Исходный график загружен');
    
    // Пауза для полной загрузки
    await page.waitForTimeout(3000);
    
    // Переключаемся на 1h таймфрейм
    console.log('🔄 Переключаемся на 1Ч');
    await page.locator('button:has-text("1Ч")').click();
    
    // Ждем 5 секунд для загрузки нового графика
    await page.waitForTimeout(5000);
    
    // Проверяем, что график все еще видим
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
    console.log('✅ График 1Ч загружен');
    
    // Переключаемся на 1d таймфрейм  
    console.log('🔄 Переключаемся на 1Д');
    await page.locator('button:has-text("1Д")').click();
    
    // Ждем 5 секунд для загрузки нового графика
    await page.waitForTimeout(5000);
    
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
    console.log('✅ График 1Д загружен');
    
    // Проверяем взаимодействие с графиком
    const chartContainer = page.locator('[data-testid="bitcoin-chart"]');
    await chartContainer.hover();
    await chartContainer.click();
    
    console.log('✅ Взаимодействие с графиком работает');
    
    // Проверяем наличие критических ошибок
    const criticalErrors = errorMessages.filter(error => 
      error.includes('Cannot read') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.toLowerCase().includes('crash') ||
      error.toLowerCase().includes('failed')
    );
    
    console.log(`Всего ошибок: ${errorMessages.length}, критических: ${criticalErrors.length}`);
    
    if (criticalErrors.length > 0) {
      console.error('Критические ошибки:', criticalErrors);
    }
    
    // Тест успешен, если нет критических ошибок
    expect(criticalErrors.length).toBe(0);
  });
  
  test('Быстрое двойное переключение таймфрейма', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Исходный график загружен');
    
    // Пауза для полной загрузки
    await page.waitForTimeout(2000);
    
    // Быстро переключаемся 1д -> 1ч -> 1д 
    console.log('🔄 Быстрое переключение: 1Д -> 1Ч -> 1Д');
    
    await page.locator('button:has-text("1Д")').click();
    await page.waitForTimeout(1000); // Короткая пауза
    
    await page.locator('button:has-text("1Ч")').click(); 
    await page.waitForTimeout(1000); // Короткая пауза
    
    await page.locator('button:has-text("1Д")').click();
    
    // Ждем 5 секунд для стабилизации
    await page.waitForTimeout(5000);
    
    // Проверяем, что график все еще видим и работает
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
    
    const chartContainer = page.locator('[data-testid="bitcoin-chart"]');
    await chartContainer.hover();
    
    console.log('✅ Быстрое переключение завершено успешно');
  });
}); 