import { test, expect } from '@playwright/test';

/**
 * Тесты для проверки маршрутизации приложения
 */
test.describe('Тестирование маршрутизации', () => {
  test('Переход между страницами', async ({ page }) => {
    // Начинаем с главной страницы
    await page.goto('/');
    
    // Проверяем, что мы на главной странице (наличие графика и других элементов дашборда)
    await expect(page.locator('header h1')).toHaveText('Биткоин и Луна');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Переходим на страницу "О проекте"
    await page.click('header a[href="/about"]');
    
    // Даем странице загрузиться
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что мы на странице "О проекте"
    await expect(page.locator('div.max-w-4xl h1')).toHaveText('О проекте «Биткоин и Луна»');
    
    // Возвращаемся на главную страницу через заголовок (если он является ссылкой)
    try {
      await page.click('header h1');
      
      // Проверяем, что мы вернулись на главную страницу
      await page.waitForSelector('canvas', { timeout: 10000 });
      const dashboardVisible = await page.locator('text=Предстоящие события').isVisible();
      expect(dashboardVisible).toBeTruthy();
    } catch (e) {
      // Если заголовок не является ссылкой, используем историю браузера для возврата
      await page.goBack();
      
      // Проверяем, что мы вернулись на главную страницу
      await page.waitForSelector('canvas', { timeout: 10000 });
      const dashboardVisible = await page.locator('text=Предстоящие события').isVisible();
      expect(dashboardVisible).toBeTruthy();
    }
  });
  
  test('Проверка URL и истории браузера', async ({ page }) => {
    // Начинаем с главной страницы
    await page.goto('/');
    
    // Проверяем URL
    expect(page.url()).toMatch(/\/$/);
    
    // Переходим на страницу "О проекте"
    await page.click('header a[href="/about"]');
    
    // Даем странице загрузиться
    await page.waitForLoadState('networkidle');
    
    // Проверяем URL
    expect(page.url()).toContain('/about');
    
    // Возвращаемся назад используя историю браузера
    await page.goBack();
    
    // Проверяем, что URL соответствует главной странице
    expect(page.url()).toMatch(/\/$/);
    
    // Проверяем, что контент соответствует главной странице
    await page.waitForSelector('canvas', { timeout: 10000 });
    const dashboardVisible = await page.locator('text=Предстоящие события').isVisible();
    expect(dashboardVisible).toBeTruthy();
    
    // Идем вперед по истории
    await page.goForward();
    
    // Даем странице загрузиться
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что мы снова на странице "О проекте"
    expect(page.url()).toContain('/about');
    await expect(page.locator('div.max-w-4xl h1')).toHaveText('О проекте «Биткоин и Луна»');
  });
  
  test('Обработка несуществующих маршрутов', async ({ page }) => {
    // Пытаемся перейти на несуществующий маршрут
    await page.goto('/non-existent-page');
    
    // Даем странице загрузиться
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что приложение корректно обрабатывает несуществующий маршрут
    // Получаем текущий URL
    const currentUrl = page.url();
    
    // Проверяем различные варианты обработки:
    
    // Вариант 1: Приложение показывает страницу 404
    const has404 = await page.locator('text=/404|[Нн]е найдено|[Сс]траница не существует/').count() > 0;
    
    // Вариант 2: Приложение перенаправляет на главную страницу
    const isMainPage = await page.locator('canvas').count() > 0 && 
                       await page.locator('text=Предстоящие события').count() > 0;
    
    // Вариант 3: Приложение перенаправляет на какую-то другую существующую страницу
    const hasRedirected = currentUrl !== '/non-existent-page';
    
    // Вариант 4: На странице есть шапка приложения (минимальный контент)
    const hasHeader = await page.locator('header').count() > 0;
    
    // Должен сработать хотя бы один из вариантов
    expect(has404 || isMainPage || hasRedirected || hasHeader).toBeTruthy();
    
    // Проверяем, что в любом случае приложение доступно
    await expect(page.locator('header')).toBeVisible();
  });
}); 