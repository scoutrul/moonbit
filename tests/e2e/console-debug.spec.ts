import { test, expect } from '@playwright/test';
import fs from 'fs';

// Папка для артефактов
const ARTIFACTS_DIR = './tests/e2e/artifacts';

// Убедиться, что папка существует
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

test('Логируем консоль браузера, ошибки и DOM', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    errors.push(`[pageerror] ${error.message}`);
  });

  await page.goto('/');

  // Сохраняем DOM
  const dom = await page.content();
  fs.writeFileSync(`${ARTIFACTS_DIR}/dom.html`, dom);

  // Скриншот
  await page.screenshot({ path: `${ARTIFACTS_DIR}/screenshot.png` });

  // Сохраняем логи
  fs.writeFileSync(`${ARTIFACTS_DIR}/console.log`, logs.join('\n'));
  fs.writeFileSync(`${ARTIFACTS_DIR}/errors.log`, errors.join('\n'));

  // Проверка, что страница не пустая
  await expect(page).not.toHaveTitle('');
}); 