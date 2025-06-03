# Стратегия тестирования проекта MoonBit

> Этот документ основан на оригинальном TESTING.md из проекта и интегрирован с архитектурными принципами и паттернами, описанными в Memory Bank.

## Связь с Memory Bank

- Архитектурные принципы: см. [architecturalPrinciples.md](./architecturalPrinciples.md)
- Архитектура системы: см. [systemPatterns.md](./systemPatterns.md)
- Технический стек: см. [techContext.md](./techContext.md)
- Актуальный прогресс: см. [progress.md](./progress.md)

---

# Система тестирования проекта MoonBit

В проекте MoonBit используется комплексный подход к тестированию, обеспечивающий высокое качество кода и стабильность работы приложения.

## Структура тестов

### Серверная часть (Node.js/Express)

- **Фреймворк**: Jest
- **Тестирование API**: Supertest

Структура директорий:

```
server/
  __tests__/
    services/      # Тесты для сервисов
    routes/        # Тесты для API-маршрутов
    utils/         # Тесты для утилит
```

### Клиентская часть (React)

- **Фреймворк**: Jest
- **Тестирование компонентов**: React Testing Library

Структура директорий:

```
client/
  __tests__/
    components/    # Тесты для React-компонентов
  __mocks__/       # Моки для стилей и ресурсов
```

## Запуск тестов

### Серверная часть

```bash
cd bitcoin-moon/server
npm test                # Запуск всех тестов
npm run test:watch      # Запуск тестов в режиме наблюдения
npm run test:coverage   # Запуск тестов с отчетом о покрытии
```

### Клиентская часть

```bash
cd bitcoin-moon/client
npm test                # Запуск всех тестов
npm run test:watch      # Запуск тестов в режиме наблюдения
npm run test:coverage   # Запуск тестов с отчетом о покрытии
```

## Типы тестов

### Юнит-тесты

- Тестирование отдельных функций и методов
- Мокирование зависимостей
- Проверка всех возможных путей выполнения

### Интеграционные тесты

- Тестирование взаимодействия между компонентами системы
- Тестирование API-эндпоинтов
- Проверка корректности передачи данных между слоями приложения

### Компонентные тесты (для React)

- Тестирование отображения компонентов
- Тестирование обработки пользовательских событий
- Тестирование жизненного цикла компонентов

### E2E тесты (Playwright)

- Тестирование полного пользовательского пути в браузере
- Проверка взаимодействия клиентской и серверной частей
- Тестирование в реальных условиях (с использованием Docker Compose)

## Правила написания тестов

1. **Изоляция тестов**: Каждый тест должен быть независимым от других тестов
2. **Описательные имена**: Имена тестов должны ясно описывать, что именно тестируется
3. **Мокирование зависимостей**: Внешние зависимости (API, файловая система и т.д.) должны быть замокированы (при необходимости)
4. **Полное покрытие**: Стремитесь к полному покрытию критически важных пользовательских сценариев
5. **Состояния**: Тестируйте все возможные состояния (загрузка, успех, ошибка и т.д.)

## Соглашения по именованию

- Файлы с юнит/интеграционными тестами (Jest/Vitest) должны иметь суффикс `.test.js` или `.test.ts`
- Файлы с E2E тестами (Playwright) должны иметь суффикс `.spec.ts`
- Названия тестов должны следовать формату `describe('Группа тестов', () => { test('описание теста', async ({ page }) => {...}) })`

## Интеграция с CI/CD

- В будущем планируется интеграция тестов с системой непрерывной интеграции (GitHub Actions) для автоматического запуска тестов при создании pull-запросов.
- Playwright тесты будут запускаться в Docker контейнере в рамках CI/CD пайплайна.

## Примеры тестов

### Тест серверного сервиса (Jest/TypeScript)

```typescript
// __tests__/services/BitcoinService.test.ts
describe('BitcoinService', () => {
  it('should return cached price if cache is valid', async () => {
    // ...
  });
});
```

### Тест API-эндпоинта (Jest/Supertest)

```javascript
// __tests__/routes/bitcoin.test.js
describe('GET /api/bitcoin/price', () => {
  it('should return current bitcoin price', async () => {
    // ...
  });
});
```

### Тест React-компонента (Vitest/RTL)

```typescript
// __tests__/components/CurrentPrice.test.tsx
describe('CurrentPrice Component', () => {
  it('should render price data correctly', async () => {
    // ...
  });
});
```

### E2E тест (Playwright)

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('should display bitcoin price and moon phase widget', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Текущая цена Bitcoin')).toBeVisible();
    await expect(page.locator('data-testid=moon-phase-widget')).toBeVisible();
  });
});
```
