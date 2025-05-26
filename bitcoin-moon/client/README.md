# MoonBit Client

## E2E-тестирование и автоматический дебаг с помощью Playwright

Для автоматического тестирования пользовательского интерфейса и сбора ошибок из консоли браузера используется Playwright.

### Как это работает

- Тесты запускаются с помощью Playwright (`npx playwright test`).
- В процессе теста автоматически:
  - Логируются все сообщения из консоли браузера
  - Ловятся JS-ошибки (`pageerror`)
  - Сохраняется DOM-дерево страницы
  - Делаются скриншоты
- Все артефакты сохраняются в папку `tests/e2e/artifacts`.

### Пример теста (tests/e2e/console-debug.spec.ts)

```ts
import { test, expect } from '@playwright/test';
import fs from 'fs';

const ARTIFACTS_DIR = './tests/e2e/artifacts';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

test('Логируем консоль браузера, ошибки и DOM', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (error) => {
    errors.push(`[pageerror] ${error.message}`);
  });

  await page.goto('/');
  const dom = await page.content();
  fs.writeFileSync(`${ARTIFACTS_DIR}/dom.html`, dom);
  await page.screenshot({ path: `${ARTIFACTS_DIR}/screenshot.png` });
  fs.writeFileSync(`${ARTIFACTS_DIR}/console.log`, logs.join('\n'));
  fs.writeFileSync(`${ARTIFACTS_DIR}/errors.log`, errors.join('\n'));
  await expect(page).not.toHaveTitle('');
});
```

### Конфигурация Playwright (playwright.config.ts)

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev --prefix bitcoin-moon/client',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Как запустить e2e-тесты

1. Установить зависимости:
   ```bash
   npm install
   npx playwright install --with-deps
   ```
2. Запустить тесты:
   ```bash
   npx playwright test
   ```
3. После выполнения тестов артефакты будут доступны в `tests/e2e/artifacts`.
