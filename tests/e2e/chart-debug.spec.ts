import { test, expect } from '@playwright/test';

test.describe('Chart Debug', () => {
  test('детальная диагностика демо графика', async ({ page }) => {
    console.log('🔍 Начинаем диагностику демо графика...');
    
    // Мониторим все консольные сообщения
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleLogs.push(message);
      console.log('CONSOLE:', message);
    });
    
    // Мониторим ошибки
    const errors: string[] = [];
    page.on('pageerror', error => {
      const message = `PAGE ERROR: ${error.message}`;
      errors.push(message);
      console.log('❌', message);
    });
    
    // Мониторим неудачные запросы
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      const message = `FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`;
      failedRequests.push(message);
      console.log('🚫', message);
    });
    
    // Открываем демо страницу
    console.log('📂 Открываем /demo...');
    await page.goto('/demo', { timeout: 30000 });
    
    // Ждем загрузки сети
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    console.log('✅ Страница загружена, проводим диагностику...');
    
    // 1. Проверяем наличие основных элементов
    console.log('1️⃣ Проверяем основные элементы...');
    
    const titleExists = await page.locator('h1:has-text("MoonBit - Демо")').isVisible();
    console.log('Заголовок демо:', titleExists ? '✅' : '❌');
    
    const infoPanel = await page.locator('text=MoonBit Demo Chart').isVisible();
    console.log('Информационная панель:', infoPanel ? '✅' : '❌');
    
    const controlPanel = await page.locator('button:has-text("Refresh Data")').isVisible();
    console.log('Панель управления:', controlPanel ? '✅' : '❌');
    
    // 2. Проверяем загрузку данных
    console.log('2️⃣ Проверяем загрузку данных...');
    
    // Ждем появления информации о данных
    const dataInfo = page.locator('text=точек');
    await dataInfo.waitFor({ timeout: 15000 });
    const dataText = await dataInfo.textContent();
    console.log('Данные:', dataText);
    
    // 3. Проверяем Chart компонент
    console.log('3️⃣ Проверяем Chart компонент...');
    
    // Ищем ChartContainer
    const chartContainer = page.locator('.chart-widget');
    const chartExists = await chartContainer.isVisible();
    console.log('Chart Container:', chartExists ? '✅' : '❌');
    
    if (chartExists) {
      // Ищем canvas элемент графика
      const canvas = chartContainer.locator('canvas');
      const canvasCount = await canvas.count();
      console.log('Canvas элементов:', canvasCount);
      
      if (canvasCount > 0) {
        const canvasVisible = await canvas.first().isVisible();
        console.log('Canvas видимый:', canvasVisible ? '✅' : '❌');
        
        // Проверяем размеры canvas
        const canvasBox = await canvas.first().boundingBox();
        console.log('Canvas размеры:', canvasBox);
      }
      
      // Проверяем loading состояние
      const loadingSpinner = chartContainer.locator('[data-testid="loading"]');
      const isLoading = await loadingSpinner.isVisible();
      console.log('Loading спиннер:', isLoading ? '🔄' : '✅ (не отображается)');
      
      // Проверяем error состояние
      const errorMessage = chartContainer.locator('[data-testid="error"]');
      const hasError = await errorMessage.isVisible();
      console.log('Error сообщение:', hasError ? '❌ (есть ошибка)' : '✅ (нет ошибок)');
      
      if (hasError) {
        const errorText = await errorMessage.textContent();
        console.log('Текст ошибки:', errorText);
      }
    }
    
    // 4. Проверяем плагины и события
    console.log('4️⃣ Проверяем плагины и события...');
    
    const eventsInfo = page.locator('text=лунных фаз');
    const eventsText = await eventsInfo.textContent();
    console.log('Лунные события:', eventsText);
    
    // 5. Делаем финальный скриншот
    console.log('5️⃣ Создаем скриншот...');
    await page.screenshot({ 
      path: 'chart-debug-screenshot.png', 
      fullPage: true 
    });
    
    // 6. Выводим итоговую диагностику
    console.log('\n📊 ИТОГОВАЯ ДИАГНОСТИКА:');
    console.log('Консольные сообщения:', consoleLogs.length);
    console.log('Ошибки страницы:', errors.length);
    console.log('Неудачные запросы:', failedRequests.length);
    
    if (errors.length > 0) {
      console.log('\n❌ ОШИБКИ:');
      errors.forEach(error => console.log('  -', error));
    }
    
    if (failedRequests.length > 0) {
      console.log('\n🚫 НЕУДАЧНЫЕ ЗАПРОСЫ:');
      failedRequests.forEach(req => console.log('  -', req));
    }
    
    console.log('\n📝 КЛЮЧЕВЫЕ ЛОГИ:');
    consoleLogs
      .filter(log => log.includes('Demo:') || log.includes('API') || log.includes('Chart') || log.includes('ERROR'))
      .forEach(log => console.log('  -', log));
    
    // Проверяем что базовые элементы есть
    await expect(page.locator('text=MoonBit Demo Chart')).toBeVisible();
    await expect(page.locator('text=точек')).toBeVisible();
  });
}); 