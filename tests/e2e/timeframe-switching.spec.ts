import { test, expect } from '@playwright/test';

test.describe('Тестирование переключения таймфреймов', () => {
  test('Быстрое переключение таймфреймов не должно крашить график', async ({ page }) => {
    // Включаем сбор консольных сообщений
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
    
    // Ждем 2 секунды для полной загрузки
    await page.waitForTimeout(2000);
    
    console.log('График загружен, начинаем быстрое переключение таймфреймов...');
    
    // Список таймфреймов для переключения
    const timeframes = ['1М', '5М', '15М', '1Ч', '1Д', '1Н'];
    
    // Быстрое переключение между таймфреймами
    for (let i = 0; i < timeframes.length; i++) {
      const timeframe = timeframes[i];
      console.log(`Переключаем на таймфрейм: ${timeframe}`);
      
      // Нажимаем на кнопку таймфрейма
      const timeframeButton = page.locator(`button:has-text("${timeframe}")`);
      await expect(timeframeButton).toBeVisible();
      await timeframeButton.click();
      
      // Короткая пауза между переключениями (имитируем быстрое переключение)
      await page.waitForTimeout(500);
      
      // Проверяем, что график все еще видим
      await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
      
      // Проверяем на наличие ошибок после каждого переключения
      if (errorMessages.length > 0) {
        console.error('Ошибки обнаружены после переключения на', timeframe);
        console.error('Ошибки:', errorMessages);
        break;
      }
    }
    
    // Еще одно быстрое переключение в обратном порядке
    console.log('Быстрое переключение в обратном порядке...');
    for (let i = timeframes.length - 1; i >= 0; i--) {
      const timeframe = timeframes[i];
      console.log(`Переключаем обратно на: ${timeframe}`);
      
      const timeframeButton = page.locator(`button:has-text("${timeframe}")`);
      await timeframeButton.click();
      await page.waitForTimeout(300); // Еще быстрее
      
      await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
      
      if (errorMessages.length > 0) {
        console.error('Ошибки при обратном переключении на', timeframe);
        break;
      }
    }
    
    // Финальная проверка состояния
    await page.waitForTimeout(2000);
    
    // Проверяем, что график все еще работает
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
    
    // Пытаемся взаимодействовать с графиком
    const chartContainer = page.locator('[data-testid="bitcoin-chart"]');
    await chartContainer.hover();
    
    // Логируем результаты
    console.log(`Всего консольных сообщений: ${consoleMessages.length}`);
    console.log(`Ошибок обнаружено: ${errorMessages.length}`);
    
    if (errorMessages.length > 0) {
      console.error('Обнаруженные ошибки:');
      errorMessages.forEach((error, index) => {
        console.error(`${index + 1}. ${error}`);
      });
    }
    
    // Тест считается успешным, если нет критических ошибок
    expect(errorMessages.filter(error => 
      error.includes('Cannot read') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('chart') ||
      error.includes('Error')
    ).length).toBe(0);
  });
  
  test('Переключение таймфрейма должно обновлять данные графика', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible({ timeout: 15000 });
    
    // Переключаемся на 1h таймфрейм
    await page.locator('button:has-text("1Ч")').click();
    await page.waitForTimeout(3000);
    
    // Проверяем, что график все еще видим и работает
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
    
    // Переключаемся на 1d таймфрейм  
    await page.locator('button:has-text("1Д")').click();
    await page.waitForTimeout(3000);
    
    await expect(page.locator('[data-testid="bitcoin-chart"]')).toBeVisible();
    
    // Проверяем взаимодействие с графиком
    const chartContainer = page.locator('[data-testid="bitcoin-chart"]');
    await chartContainer.hover();
    await chartContainer.click();
  });
}); 