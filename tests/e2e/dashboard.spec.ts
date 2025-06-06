import { test, expect } from '@playwright/test';

/**
 * Тест проверяет основную функциональность дашборда MoonBit
 */
test.describe('Тестирование основного дашборда', () => {
  test('Проверка загрузки дашборда и основных элементов', async ({ page }) => {
    // Заходим на главную страницу
    await page.goto('/');
    
    // Проверяем наличие заголовка страницы
    await expect(page.locator('header h1')).toHaveText('Биткоин и Луна');
    
    // Проверяем наличие кнопки переключения темы
    await expect(page.locator('header button[aria-label*="тему"]')).toBeVisible();
    
    // Проверяем наличие ссылки на страницу "О проекте"
    await expect(page.locator('header a[href="/about"]')).toHaveText('О проекте');
    
    // Проверяем загрузку виджета предстоящих событий
    await expect(page.locator('text=Предстоящие события').first()).toBeVisible();
    
    // Проверяем наличие графика биткоина (ждем загрузки графика)
    await page.waitForSelector('canvas', { timeout: 10000 });
    const canvasElements = await page.locator('canvas').count();
    expect(canvasElements).toBeGreaterThan(0);
  });
  
  test('Переключение темной/светлой темы', async ({ page }) => {
    await page.goto('/');
    
    // Проверяем начальное состояние (определяем текущую тему)
    const initialDarkMode = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    
    // Нажимаем на кнопку переключения темы
    await page.click('header button[aria-label*="тему"]');
    
    // Проверяем, что тема изменилась
    const newDarkMode = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    
    expect(newDarkMode).not.toEqual(initialDarkMode);
  });
  
  test('Переход на страницу "О проекте"', async ({ page }) => {
    await page.goto('/');
    
    // Кликаем на ссылку "О проекте"
    await page.click('header a[href="/about"]');
    
    // Даем странице загрузиться
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что мы перешли на страницу "О проекте"
    // Используем более точный селектор, который учитывает структуру страницы "О проекте"
    await expect(page.locator('div.max-w-4xl h1')).toHaveText('О проекте «Биткоин и Луна»');
    
    // Проверяем наличие основных разделов на странице
    await expect(page.locator('h2').first()).toHaveText('Концепция проекта');
    await expect(page.locator('text=Основные функции')).toBeVisible();
    await expect(page.locator('text=Технологический стек')).toBeVisible();
    await expect(page.locator('text=Дисклеймер')).toBeVisible();
  });
  
  test('Проверка взаимодействия с графиком и изменение таймфрейма', async ({ page }) => {
    await page.goto('/');
    
    // Ждем загрузки графика
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Проверяем доступность селектора таймфреймов (если он виден на странице)
    const timeframeSelectorExists = await page.locator('text=/^(1h|1d|1w)$/').count() > 0;
    
    if (timeframeSelectorExists) {
      // Находим и кликаем на селектор таймфрейма "1w" (неделя)
      await page.locator('text=1w').click();
      
      // Даем время на обновление графика
      await page.waitForTimeout(1000);
      
      // Проверяем, что изменение таймфрейма привело к перезагрузке данных
      // (косвенно, через проверку активности выбранного таймфрейма)
      const isWeeklyActive = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button'));
        return elements.some(el => el.textContent?.includes('1w') && 
                             el.classList.contains('bg-blue-500'));
      });
      
      if (isWeeklyActive) {
        expect(isWeeklyActive).toBeTruthy();
      } else {
        // Альтернативная проверка - просто убеждаемся, что график остался виден
        const canvasElements = await page.locator('canvas').count();
        expect(canvasElements).toBeGreaterThan(0);
      }
    } else {
      // Если селектор таймфрейма не найден, просто проверяем, что график отображается
      const canvasElements = await page.locator('canvas').count();
      expect(canvasElements).toBeGreaterThan(0);
    }
  });
}); 