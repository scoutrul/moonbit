import { test, expect } from '@playwright/test';

test.describe('Network Debug', () => {
  test('анализируем сетевые запросы и ошибки загрузки', async ({ page }) => {
    console.log('🌐 Анализируем сетевые запросы...');
    
    // Перехватываем все сетевые запросы
    const requests: string[] = [];
    const failedRequests: string[] = [];
    const responses: { url: string; status: number; contentType: string }[] = [];
    
    page.on('request', request => {
      const url = request.url();
      requests.push(url);
      console.log('📤 REQUEST:', url);
    });
    
    page.on('requestfailed', request => {
      const url = request.url();
      failedRequests.push(url);
      console.log('❌ FAILED REQUEST:', url, request.failure()?.errorText);
    });
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      const contentType = response.headers()['content-type'] || 'unknown';
      
      responses.push({ url, status, contentType });
      
      if (status >= 400) {
        console.log('❌ ERROR RESPONSE:', status, url);
      } else if (url.includes('lightweight') || url.includes('chart')) {
        console.log('📊 CHART RELATED:', status, url, contentType);
      }
    });
    
    // Перехватываем консольные ошибки
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const message = msg.text();
        consoleErrors.push(message);
        console.log('🔴 CONSOLE ERROR:', message);
      } else if (msg.text().includes('Demo:') || msg.text().includes('lightweight')) {
        console.log('📊 CHART LOG:', msg.text());
      }
    });
    
    // Перехватываем JavaScript ошибки
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      const message = error.message;
      jsErrors.push(message);
      console.log('💥 JS ERROR:', message);
    });
    
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Ждем немного для завершения всех запросов
    await page.waitForTimeout(3000);
    
    console.log('\n📊 АНАЛИЗ СЕТЕВЫХ ЗАПРОСОВ:');
    console.log('- Всего запросов:', requests.length);
    console.log('- Неудачных запросов:', failedRequests.length);
    console.log('- Консольных ошибок:', consoleErrors.length);
    console.log('- JavaScript ошибок:', jsErrors.length);
    
    // Анализируем запросы к модулям
    const moduleRequests = requests.filter(url => 
      url.includes('.js') || url.includes('.ts') || url.includes('.jsx') || url.includes('.tsx')
    );
    
    console.log('\n📦 МОДУЛЬНЫЕ ЗАПРОСЫ:');
    moduleRequests.forEach(url => {
      const response = responses.find(r => r.url === url);
      const status = response ? response.status : 'unknown';
      const isFailed = failedRequests.includes(url);
      
      console.log(`  ${isFailed ? '❌' : '✅'} ${status} ${url.split('/').pop()}`);
    });
    
    // Ищем lightweight-charts специально
    const lightweightRequests = requests.filter(url => 
      url.includes('lightweight') || url.includes('chart')
    );
    
    if (lightweightRequests.length > 0) {
      console.log('\n📈 LIGHTWEIGHT-CHARTS ЗАПРОСЫ:');
      lightweightRequests.forEach(url => {
        const response = responses.find(r => r.url === url);
        console.log(`  ${response?.status || 'unknown'} ${url}`);
      });
    } else {
      console.log('\n⚠️ НЕТ ЗАПРОСОВ К LIGHTWEIGHT-CHARTS!');
    }
    
    // Анализируем ошибки
    if (consoleErrors.length > 0) {
      console.log('\n🔴 КОНСОЛЬНЫЕ ОШИБКИ:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (jsErrors.length > 0) {
      console.log('\n💥 JAVASCRIPT ОШИБКИ:');
      jsErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (failedRequests.length > 0) {
      console.log('\n❌ НЕУДАЧНЫЕ ЗАПРОСЫ:');
      failedRequests.forEach(url => console.log(`  - ${url}`));
    }
    
    // Проверяем что страница загрузилась
    const pageTitle = await page.title();
    console.log('\n📄 СТРАНИЦА:', pageTitle);
    
    // Проверяем есть ли основные элементы
    const hasHeader = await page.locator('h1').isVisible();
    const hasChartWidget = await page.locator('.chart-widget').isVisible();
    
    console.log('- Заголовок найден:', hasHeader ? '✅' : '❌');
    console.log('- Chart widget найден:', hasChartWidget ? '✅' : '❌');
    
    await page.screenshot({ path: 'network-debug-screenshot.png', fullPage: true });
  });
}); 