import { test, expect } from '@playwright/test';

test.describe('Canvas Debug', () => {
  test('проверяем состояние loading и создание canvas', async ({ page }) => {
    console.log('🎯 Отлаживаем создание canvas элемента...');
    
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleLogs.push(message);
      
      // Выводим важные сообщения сразу
      if (message.includes('loading') || message.includes('Loading') || message.includes('BaseChart') || message.includes('canvas') || message.includes('chart')) {
        console.log('📊 CHART LOG:', message);
      }
    });
    
    await page.goto('/demo');
    
    // Ждем полной загрузки
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Проверяем состояние loading...');
    
    // Проверяем наличие Spinner/Loading состояния
    const loadingSpinners = await page.locator('.animate-spin').count();
    console.log('Spinner элементов:', loadingSpinners);
    
    // Проверяем текст Loading
    const loadingTexts = await page.locator('text=/[Ll]oading/').count();
    console.log('Loading текстов:', loadingTexts);
    
    // Проверяем text "Loading chart..."
    const chartLoading = await page.locator('text=Loading chart...').isVisible();
    console.log('Chart loading состояние:', chartLoading ? '🔄 ДА' : '✅ НЕТ');
    
    // Проверяем text "Loading plugins..."
    const pluginLoading = await page.locator('text=Loading plugins...').isVisible();
    console.log('Plugin loading состояние:', pluginLoading ? '🔄 ДА' : '✅ НЕТ');
    
    if (chartLoading || pluginLoading) {
      console.log('⚠️ График находится в состоянии loading - ждем...');
      
      // Ждем завершения loading состояния
      await page.waitForSelector('text=Loading chart...', { state: 'detached', timeout: 10000 }).catch(() => {
        console.log('⏰ Timeout: Loading chart не исчез');
      });
      
      await page.waitForSelector('text=Loading plugins...', { state: 'detached', timeout: 10000 }).catch(() => {
        console.log('⏰ Timeout: Loading plugins не исчез');
      });
    }
    
    // Перепроверяем canvas после ожидания
    console.log('🔍 Повторная проверка canvas...');
    
    await page.waitForTimeout(2000); // Даем время для инициализации
    
    const canvasCount = await page.locator('canvas').count();
    console.log('Canvas элементов (после ожидания):', canvasCount);
    
    if (canvasCount === 0) {
      console.log('❌ Canvas НЕ СОЗДАН - ищем причину...');
      
      // Проверяем есть ли chart container
      const chartContainer = await page.locator('.chart-widget').isVisible();
      console.log('Chart container существует:', chartContainer ? '✅' : '❌');
      
      // Проверяем содержимое chart-widget
      if (chartContainer) {
        const containerHTML = await page.locator('.chart-widget').innerHTML();
        console.log('Chart container HTML длина:', containerHTML.length);
        console.log('Chart container содержимое:', containerHTML.substring(0, 200) + '...');
      }
      
      // Проверяем DOM структуру
      const chartElements = await page.evaluate(() => {
        const chartWidget = document.querySelector('.chart-widget');
        if (!chartWidget) return { error: 'chart-widget не найден' };
        
        return {
          chartWidget: {
            tagName: chartWidget.tagName,
            children: chartWidget.children.length,
            innerHTML: chartWidget.innerHTML.substring(0, 300)
          },
          allCanvases: document.querySelectorAll('canvas').length,
          allDivs: chartWidget.querySelectorAll('div').length
        };
      });
      
      console.log('🔬 DOM анализ:', JSON.stringify(chartElements, null, 2));
    } else {
      console.log('✅ Canvas найден!');
      
      const canvas = page.locator('canvas').first();
      const canvasBox = await canvas.boundingBox();
      console.log('Canvas размеры:', canvasBox);
      
      const canvasAttrs = await canvas.evaluate((el) => {
        const canvasEl = el as HTMLCanvasElement;
        return {
          width: canvasEl.width,
          height: canvasEl.height,
          style: canvasEl.style.cssText
        };
      });
      console.log('Canvas атрибуты:', canvasAttrs);
    }
    
    // Финальный скриншот
    await page.screenshot({ path: 'canvas-debug-screenshot.png', fullPage: true });
    
    console.log('\n📝 ИТОГОВАЯ ДИАГНОСТИКА CANVAS:');
    console.log('- Canvas элементов:', canvasCount);
    console.log('- Loading состояние завершено:', !chartLoading && !pluginLoading);
    
    // Анализируем логи на предмет ошибок инициализации
    const chartLogs = consoleLogs.filter(log => 
      log.includes('chart') || log.includes('Chart') || 
      log.includes('canvas') || log.includes('Canvas') ||
      log.includes('lightweight') || log.includes('BaseChart')
    );
    
    if (chartLogs.length > 0) {
      console.log('\n📊 ЛОГИ СВЯЗАННЫЕ С ГРАФИКОМ:');
      chartLogs.forEach(log => console.log('  -', log));
    }
  });
}); 