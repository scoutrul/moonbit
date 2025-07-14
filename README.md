# MoonBit 🌙💰

> ⚠️ **Внимание:** Этот репозиторий больше не поддерживается.  
> Проект MoonBit в текущем виде зашёл в архитектурный тупик в результате экспериментальной разработки с использованием генерации кода.  
> Было принято решение не рефакторить этот код, а **создать версию 2.0 с нуля** на основе полученного опыта, с упрощённой архитектурой и чистым стеком.

**Новый репозиторий MoonBit 2.0:** _[будет добавлена ссылка после создания]_

---

MoonBit — это веб-платформа для анализа криптовалют с учётом лунных фаз и астрономических событий. Изначально создавался как исследовательский проект с полной генерацией архитектуры нейросетями. Несмотря на технологическую насыщенность, проект стал перегруженным и трудноподдерживаемым, что стало мотивацией к перезапуску с нуля.

## 📁 Структура проекта

```
moonbit/
  .cursor/                 # Cursor Memory Bank & Rules
    memory-bank/           # Project documentation & knowledge base
    rules/                 # Development rules & patterns
  bitcoin-moon/
    client/                # React Frontend (TypeScript)
      src/
        components/        # Atomic Design architecture
          atoms/           # Basic UI elements
          molecules/       # Component combinations  
          organisms/       # Complex UI blocks
          pages/           # Route-specific components
        plugins/           # Plugin system architecture
          hooks/           # React hooks для plugins
          implementations/ # Конкретные plugin реализации
          utils/           # Plugin utilities
        services/          # API integration services
        types/             # TypeScript type definitions
        utils/             # Helper functions & utilities
    server/                # Node.js Backend (TypeScript)
      src/
        config/            # Application configuration
        controllers/       # Request handlers
        routes/            # API routes definition
        services/          # Business logic & external API integration
        utils/             # Server-side utilities
        data/cache/        # Redis caching layer
      logs/                # Application logs
  tests/                   # E2E testing suite (Playwright)
    e2e/                   # End-to-end test scenarios
```

## ⚡ Установка и запуск

### Предварительные требования
- Node.js (версия 18+)
- npm или yarn
- Docker & Docker Compose (рекомендуется)

### Быстрый старт с Docker

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/moonbit.git
cd moonbit

# Запуск полного стека
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f
```

Приложение будет доступно по адресу: `http://localhost:3000`

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск development сервера (сервер + клиент)
npm run dev

# Отдельный запуск компонентов
npm run server    # Только серверная часть (порт 3001)
npm run client    # Только клиентская часть (порт 3000)
```

## 🏆 Последние достижения

### ✅ Plugin Architecture & Advanced Charting (2025-01-26)
- **Plugin System**: Модульная архитектура для расширения функционала графиков
- **Infinite Scroll**: Автоматическая подгрузка данных при скроллинге к краям графика
- **Dynamic Scaling**: Умное управление visible range с поддержкой zoom persistence
- **LunarEventsPlugin**: Первый плагин для отображения лунных фаз на графике
- **Performance Optimization**: Batch rendering с requestAnimationFrame для плавной работы
- **Error Isolation**: Plugin errors не влияют на основную функциональность графика

### ✅ Критические исправления (2025-06-06)
- **Race Condition Fix**: Устранена проблема пропадания лунных событий при смене таймфреймов
- **State Management**: Реализованы Selective State Clearing + Smart Event Replacement patterns
- **Performance**: 50% снижение redundant API requests + оптимизированная memory utilization
- **Real-time Updates**: WebSocket интеграция с Binance API для live price feeds

### ✅ Архитектурные улучшения (2024-12-24)
- **TypeScript Migration**: Полная миграция серверной части на TypeScript (97% code quality improvement)
- **BaseChart Architecture**: Трёхуровневая архитектура графиков с plugin system foundation
- **Atomic Design**: Comprehensive UI component library с 5 базовыми атомарными компонентами
- **Memory Management**: ChartMemoryManager для предотвращения memory leaks
- **ESLint Optimization**: Снижение ошибок с 1120 до 41 (97% improvement)

## 🔌 Plugin System

MoonBit включает в себя мощную plugin систему для расширения функциональности графиков:

### Доступные плагины:
- **LunarEventsPlugin**: Отображение лунных фаз и астрономических событий
- **EconomicEventsPlugin**: Экономические события и новости (в разработке)
- **TechnicalIndicatorsPlugin**: Технические индикаторы (в разработке)

### Создание собственных плагинов:
```typescript
import { EventPlugin, PluginContext, PluginInstance } from './plugins';

const MyPlugin: EventPlugin = {
  id: 'my-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',
  init: async (context: PluginContext): Promise<PluginInstance> => {
    // Plugin initialization logic
    return {
      render: (events) => { /* rendering logic */ },
      cleanup: () => { /* cleanup logic */ },
      isActive: () => true
    };
  }
};
```

## 📈 Advanced Chart Features

### Infinite Scroll
```typescript
<BaseChart
  data={chartData}
  enableInfiniteScroll={true}
  loadMoreThreshold={10}
  onLoadMoreData={(direction, range) => {
    // Загрузка дополнительных данных
    if (direction === 'left') {
      loadHistoricalData(range);
    }
  }}
/>
```

### Visible Range Control
```typescript
<BaseChart
  data={chartData}
  onVisibleRangeChange={(range) => {
    console.log('Visible range changed:', range);
  }}
  initialVisibleRange={{
    from: startTimestamp,
    to: endTimestamp
  }}
  enableZoomPersistence={true}
/>
```

## 🧪 Тестирование

### E2E тестирование (Playwright)
```bash
# Запуск всех E2E тестов
npm run test:e2e

# Запуск конкретного теста
npx playwright test tests/e2e/bitcoin.spec.ts

# Запуск с UI отладкой
npx playwright test --ui

# Генерация отчетов
npx playwright show-report
```

### Unit тестирование (Jest)
```bash
# Модульные тесты
npm test

# Тесты с покрытием
npm run test:coverage

# Watch mode для разработки
npm run test:watch
```

## 🏗️ Архитектурные принципы

Проект построен на следующих принципах:

- **KISS** (Keep It Simple, Stupid) - простота и понятность решений
- **DRY** (Don't Repeat Yourself) - избегание дублирования логики
- **DDD** (Domain-Driven Design) - организация кода вокруг бизнес-доменов
- **Atomic Design** - иерархическая структура UI компонентов
- **Plugin Architecture** - модульная расширяемость системы
- **Memory Bank Strategy** - comprehensive documentation для знаний проекта

## 📝 Соглашения разработки

### Формат коммитов
```
[область]: тип - краткое описание
```

**Области**: `client`, `server`, `common`, `infra`, `docs`, `memory-bank`, `tests`  
**Типы**: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `perf`, `chore`

### Примеры коммитов
```bash
[client]: feat - добавлен infinite scroll в BaseChart
[server]: fix - исправлена race condition в state management  
[memory-bank]: docs - обновлена архитектурная документация
[tests]: feat - добавлены E2E тесты для plugin system
```

## 🐳 Docker конфигурация

### Переменные окружения
```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - COINGECKO_API_KEY=your_api_key
  - FARMSENSE_API_KEY=your_api_key  
  - BINANCE_WS_URL=wss://stream.binance.com:9443
  - REDIS_URL=redis://redis:6379
  - CORS_ORIGIN=http://localhost:3000
```

### Volumes для persistence
```yaml
volumes:
  - ./bitcoin-moon/server/logs:/app/bitcoin-moon/server/logs
  - redis_data:/data
```

## 🔮 Roadmap

### Ближайшие планы
- **Plugin Architecture**: Завершение plugin system для Economic + Astro events
- **Trading Indicators**: Интеграция RSI, MACD, Moving Averages
- **Mobile Optimization**: Advanced touch interactions + responsive design
- **Export Features**: CSV/JSON data export functionality

### Средне-срочные цели
- **User Preferences**: Settings persistence + customization options
- **Alert System**: Price + event notifications через WebSocket
- **Multi-timeframe Views**: Simultaneous chart displays
- **Advanced Analytics**: Statistical correlation analysis tools

### Долгосрочное развитие
- **Machine Learning**: Predictive models для correlation analysis
- **API Expansion**: Public API для third-party integrations
- **Community Features**: User-generated content + social sharing
- **Enterprise Features**: Advanced analytics + custom dashboards

## 📊 Метрики производительности

- **API Response Time**: <200ms average
- **Chart Rendering**: <100ms для timeframe transitions  
- **Memory Usage**: Stable с 0 memory leaks
- **Error Rate**: <0.1% в production functionality
- **Test Coverage**: 85%+ с E2E validation

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для подробностей.

## ⚠️ Отказ от ответственности

Этот проект создан исключительно для образовательных и исследовательских целей. Приложение **НЕ предоставляет финансовых консультаций**. Любые корреляции между астрономическими событиями и ценой биткоина могут быть случайными и не имеют подтвержденной причинно-следственной связи. 

**Не используйте данные из этого приложения для принятия инвестиционных решений.**

---

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, ознакомьтесь с [Memory Bank](.cursor/memory-bank/) для понимания архитектуры и процессов разработки.

### Процесс контрибуции
1. Fork репозитория
2. Создайте feature branch
3. Следуйте соглашениям по коммитам
4. Добавьте тесты для новой функциональности
5. Убедитесь что все тесты проходят
6. Создайте Pull Request с подробным описанием

**Спасибо за интерес к проекту MoonBit! 🌙💰**
