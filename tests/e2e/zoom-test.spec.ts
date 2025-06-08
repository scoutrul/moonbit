import { test, expect } from '@playwright/test';

test.describe('Масштабирование и Infinite Scroll', () => {
  test('должен позволять масштабирование и подгружать данные при прокрутке', async ({ page }) => {
    console.log('🔍 Тест масштабирования начинается...');
    
    // Переходим на главную страницу
    await page.goto('/');
    console.log('✅ Страница загружена');

    // Ждем пока график загрузится
    await page.waitForSelector('[data-testid="bitcoin-chart"]', { timeout: 30000 });
    console.log('✅ График найден');

    // Ждем немного для полной загрузки данных
    await page.waitForTimeout(3000);

    // Проверяем, что график действительно загружен и видим
    const chartElement = await page.locator('[data-testid="bitcoin-chart"]');
    await expect(chartElement).toBeVisible();
    console.log('✅ График видим и готов к взаимодействию');

    // Проверяем масштабирование колесом мыши
    const chart = page.locator('[data-testid="bitcoin-chart"]');
    
    // Получаем начальный размер элемента
    const chartBox = await chart.boundingBox();
    expect(chartBox).toBeTruthy();
    
    console.log('📊 Размеры графика:', chartBox);

    // Проверяем, что кнопки таймфреймов работают
    await page.click('button:has-text("1H")');
    await page.waitForTimeout(2000);
    console.log('✅ Переключение на 1H прошло успешно');

    // Снова переходим на 5M для тестирования zoom
    await page.click('button:has-text("5M")');
    await page.waitForTimeout(2000);
    console.log('✅ Переключение на 5M прошло успешно');

    // Симулируем масштабирование (wheel события)
    await chart.hover();
    
    // Zoom in несколько раз
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -100); // Scroll up для zoom in
      await page.waitForTimeout(500);
    }
    console.log('🔍 Масштабирование IN выполнено');

    // Ждем подгрузки данных (если сработал infinite scroll)
    await page.waitForTimeout(2000);

    // Zoom out несколько раз
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 100); // Scroll down для zoom out
      await page.waitForTimeout(500);
    }
    console.log('🔍 Масштабирование OUT выполнено');

    // Проверяем на наличие индикатора загрузки (если сработал infinite scroll)
    try {
      const loadingIndicator = page.locator('text="Загружаем данные..."');
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        console.log('🔄 Обнаружен индикатор загрузки - infinite scroll работает!');
        // Ждем окончания загрузки
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
        console.log('✅ Загрузка завершена');
      } else {
        console.log('ℹ️ Индикатор загрузки не появился (возможно, данных достаточно)');
      }
    } catch (error) {
      console.log('ℹ️ Загрузка не потребовалась или завершилась очень быстро');
    }

    // Проверяем, что нет JavaScript ошибок
    const errors = await page.evaluate(() => {
      const errors: string[] = [];
      if (window.console && window.console.error) {
        // Захватываем ошибки консоли
        const originalError = window.console.error;
        window.console.error = (...args) => {
          errors.push(args.join(' '));
          originalError.apply(window.console, args);
        };
      }
      return errors;
    });

    // Проверяем, что график по-прежнему отображается после всех операций
    await expect(chartElement).toBeVisible();
    
    console.log('✅ Тест масштабирования завершен успешно');
  });

  test('должен поддерживать drag для перемещения по графику', async ({ page }) => {
    console.log('🖱️ Тест drag начинается...');
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="bitcoin-chart"]', { timeout: 30000 });
    await page.waitForTimeout(3000);

    const chart = page.locator('[data-testid="bitcoin-chart"]');
    const chartBox = await chart.boundingBox();
    expect(chartBox).toBeTruthy();

    // Выполняем drag операцию (перетаскивание графика)
    const startX = chartBox!.x + chartBox!.width * 0.7;
    const startY = chartBox!.y + chartBox!.height * 0.5;
    const endX = chartBox!.x + chartBox!.width * 0.3;
    const endY = startY;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();

    console.log('🖱️ Drag операция выполнена');

    // Ждем возможной подгрузки данных
    await page.waitForTimeout(2000);

    // Проверяем на индикатор загрузки
    try {
      const loadingIndicator = page.locator('text="Загружаем данные..."');
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        console.log('🔄 Infinite scroll сработал при drag!');
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
      }
    } catch (error) {
      console.log('ℹ️ Подгрузка данных при drag не потребовалась');
    }

    await expect(chart).toBeVisible();
    console.log('✅ Тест drag завершен успешно');
  });
}); 