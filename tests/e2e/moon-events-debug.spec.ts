import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Папка для артефактов
const ARTIFACTS_DIR = './tests/e2e/artifacts/moon-events';

// Убедиться, что папка существует
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

test('Отладка ошибок API лунных событий и сортировки данных', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];
  const networkRequests: { url: string, method: string, status?: number, data?: string }[] = [];
  
  // Мониторим консоль
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    // Сразу логируем в консоль для отладки
    console.log(text);
  });
  
  // Мониторим ошибки
  page.on('pageerror', error => {
    const text = `[pageerror] ${error.message}`;
    errors.push(text);
    console.error(text);
  });
  
  // Мониторим сетевые запросы
  page.on('request', request => {
    const url = request.url();
    // Фильтруем только API-запросы
    if (url.includes('/api/')) {
      networkRequests.push({
        url,
        method: request.method()
      });
    }
  });
  
  // Мониторим ответы
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      const request = networkRequests.find(req => req.url === url);
      
      if (request) {
        request.status = status;
        
        // Для ошибок сохраняем тело ответа
        if (status >= 400) {
          try {
            request.data = await response.text();
          } catch (e) {
            request.data = `Не удалось получить данные: ${e}`;
          }
        }
      }
    }
  });

  // Переходим на страницу
  await page.goto('/');
  
  // Ждем загрузку компонентов
  await page.waitForSelector('[data-testid="bitcoin-price"]', { timeout: 30000 });
  
  // Ждем, чтобы увидеть, появятся ли ошибки
  await page.waitForTimeout(5000);
  
  // Проверяем, отображаются ли события на странице
  const lunarEventsCount = await page.locator('.moon-event').count();
  console.log(`Найдено лунных событий на странице: ${lunarEventsCount}`);
  
  // Сохраняем DOM
  const dom = await page.content();
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'dom.html'), dom);
  
  // Делаем скриншот
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot.png'), fullPage: true });
  
  // Сохраняем логи
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'console.log'), consoleMessages.join('\n'));
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'errors.log'), errors.join('\n'));
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'network.json'), JSON.stringify(networkRequests, null, 2));
  
  // Выполняем JavaScript в контексте страницы для получения данных
  const lunarEventsData = await page.evaluate(() => {
    // @ts-ignore
    return window.__DEBUG_LUNAR_EVENTS || 'Данные не найдены';
  });
  
  // Сохраняем данные о лунных событиях
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'lunar-events-data.json'), 
    JSON.stringify(lunarEventsData, null, 2)
  );
}); 