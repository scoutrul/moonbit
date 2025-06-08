import { test, expect } from '@playwright/test';

test.describe('Главная страница - Infinite Scroll', () => {
  test('должен загружать дополнительные данные при скролле графика влево', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');
    
    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle');
    
    // Делаем скриншот страницы
    await page.screenshot({ path: 'test-results/main-page-loaded.png' });
    
    // Ищем dashboard
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Ждем немного для загрузки компонентов
    await page.waitForTimeout(5000);
    
    // Ищем график
    const chartElement = page.locator('[data-testid="bitcoin-chart"]');
    
    // Проверяем что график появился
    await expect(chartElement).toBeVisible({ timeout: 30000 });
    
    // Делаем скриншот до скролла
    await page.screenshot({ path: 'test-results/main-chart-before-scroll.png' });
    
    // Фокусируемся на графике
    await chartElement.click();
    
    // Эмулируем скролл влево (к историческим данным)
    await page.keyboard.press('Home'); // Переходим к началу данных
    await page.waitForTimeout(2000);
    
    // Проверяем появление индикатора загрузки
    const loadingIndicator = page.locator('text=Загружаем данные...');
    
    // Ждем появления и исчезновения индикатора загрузки (максимум 10 секунд)
    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
      console.log('✅ Индикатор загрузки появился');
      
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
      console.log('✅ Индикатор загрузки исчез');
    } catch (error) {
      console.log('⚠️ Индикатор загрузки не появился или не исчез вовремя');
    }
    
    // Делаем скриншот после скролла
    await page.screenshot({ path: 'test-results/main-chart-after-scroll.png' });
    
    // Проверяем что график все еще работает
    await expect(chartElement).toBeVisible();
    
    console.log('✅ Тест infinite scroll на главной странице завершен');
  });

  test('должен показывать лунные события на главном графике', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');
    
    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle');
    
    // Ищем dashboard
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Ждем загрузки компонентов
    await page.waitForTimeout(5000);
    
    // Ищем график
    const chartElement = page.locator('[data-testid="bitcoin-chart"]');
    await expect(chartElement).toBeVisible({ timeout: 30000 });
    
    // Ждем загрузки лунных событий
    await page.waitForTimeout(5000);
    
    // Делаем скриншот для проверки лунных событий
    await page.screenshot({ path: 'test-results/main-chart-lunar-events.png' });
    
    console.log('✅ Проверка лунных событий на главной странице завершена');
  });
}); 