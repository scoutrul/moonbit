import { test, expect } from '@playwright/test';

test.describe('BaseChart Debug', () => {
  test('проверяем почему BaseChart не рендерится', async ({ page }) => {
    console.log('🎯 Отлаживаем рендеринг BaseChart...');
    
    // Перехватываем все console.log из BaseChart
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleLogs.push(message);
      
      // Выводим любые логи содержащие ключевые слова
      if (message.includes('BaseChart') || 
          message.includes('Error updating chart data') ||
          message.includes('lightweight') ||
          message.includes('pluginsLoading') ||
          message.includes('plugins') ||
          message.includes('loading')) {
        console.log('🔍 BASECHART:', message);
      }
    });
    
    // Добавляем отладочные логи в BaseChart через оценку
    await page.addInitScript(() => {
      // Перехватываем createChart
      const originalCreateChart = (window as any).LightweightCharts?.createChart;
      if (originalCreateChart) {
        (window as any).LightweightCharts.createChart = function(...args: any[]) {
          console.log('🎨 LightweightCharts.createChart вызван!', args[0]);
          const chart = originalCreateChart.apply(this, args);
          console.log('✅ Chart создан:', !!chart);
          return chart;
        };
      }
    });
    
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Анализируем состояние BaseChart...');
    
    // Проверяем состояние через React DevTools или прямой доступ к компоненту
    const baseChartState = await page.evaluate(() => {
      // Ищем BaseChart в DOM
      const chartContainers = document.querySelectorAll('[style*="height"]');
      const chartDivs = Array.from(chartContainers).filter(el => 
        el.getAttribute('style')?.includes('height') && 
        el.className?.includes('w-full')
      );
      
      return {
        chartContainers: chartContainers.length,
        chartDivs: chartDivs.length,
        chartDivsInfo: chartDivs.map(div => ({
          tagName: div.tagName,
          className: div.className,
          style: div.getAttribute('style'),
          children: div.children.length,
          innerHTML: div.innerHTML.substring(0, 100)
        }))
      };
    });
    
    console.log('📊 BaseChart DOM состояние:', JSON.stringify(baseChartState, null, 2));
    
    // Проверяем наличие LightweightCharts
    const lightweightChartsStatus = await page.evaluate(() => {
      return {
        LightweightChartsExists: typeof (window as any).LightweightCharts !== 'undefined',
        createChartExists: typeof (window as any).LightweightCharts?.createChart === 'function',
        version: (window as any).LightweightCharts?.version || 'unknown'
      };
    });
    
    console.log('📈 LightweightCharts статус:', lightweightChartsStatus);
    
    // Проверяем есть ли JavaScript ошибки
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('❌ JS ERROR:', error.message);
    });
    
    // Проверяем загрузились ли модули
    const moduleStatus = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const modules = scripts.filter(s => s.getAttribute('src')?.includes('lightweight-charts'));
      
      return {
        totalScripts: scripts.length,
        lightweightChartsModules: modules.map(s => s.getAttribute('src')),
        hasLightweightCharts: modules.length > 0
      };
    });
    
    console.log('📦 Модули:', moduleStatus);
    
    // Проверяем props которые передаются в BaseChart
    const propsCheck = await page.evaluate(() => {
      // Ищем React компонент и его props в DOM
      const chartWidget = document.querySelector('.chart-widget');
      if (!chartWidget) return { error: 'chart-widget не найден' };
      
      // Проверяем содержимое последнего div (должен быть BaseChart)
      const allDivs = chartWidget.querySelectorAll('div');
      const lastDiv = allDivs[allDivs.length - 1];
      
      return {
        chartWidgetChildren: chartWidget.children.length,
        lastDivClass: lastDiv?.className,
        lastDivStyle: lastDiv?.getAttribute('style'),
        lastDivChildren: lastDiv?.children.length,
        hasCanvasChild: !!lastDiv?.querySelector('canvas')
      };
    });
    
    console.log('🔧 Props проверка:', propsCheck);
    
    await page.screenshot({ path: 'basechart-debug.png', fullPage: true });
    
    console.log('\n📝 ИТОГОВАЯ ДИАГНОСТИКА BASECHART:');
    console.log('- LightweightCharts доступен:', lightweightChartsStatus.LightweightChartsExists);
    console.log('- createChart функция:', lightweightChartsStatus.createChartExists);
    console.log('- Найдено chart div контейнеров:', baseChartState.chartDivs);
    console.log('- JS ошибки:', errors.length);
    console.log('- Модули lightweight-charts:', moduleStatus.hasLightweightCharts);
    
    if (errors.length > 0) {
      console.log('\n❌ JAVASCRIPT ОШИБКИ:');
      errors.forEach(error => console.log('  -', error));
    }
    
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('chart') || log.includes('Chart') || 
      log.includes('lightweight') || log.includes('canvas') ||
      log.includes('Plugin') || log.includes('loading')
    );
    
    if (relevantLogs.length > 0) {
      console.log('\n📊 РЕЛЕВАНТНЫЕ ЛОГИ:');
      relevantLogs.forEach(log => console.log('  -', log));
    }
  });
}); 