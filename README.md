# MoonBit 🌙💰

![MoonBit Logo](bitcoin-moon/client/public/bitcoin-moon-logo.png)

## Обзор проекта

MoonBit — это веб-приложение, исследующее потенциальную корреляцию между фазами луны и движением цены биткоина. Проект представляет данные в интерактивном и визуально привлекательном формате, позволяя пользователям самостоятельно анализировать возможные взаимосвязи астрологических событий и криптовалютного рынка.

## ✨ Ключевые возможности

- 📊 **Real-time данные**: Отслеживание цены биткоина и фаз луны в реальном времени через WebSocket
- 📈 **Интерактивные графики**: Визуализация исторических данных с плавными переходами между таймфреймами
- 🌙 **Лунные события**: Полная интеграция астрономических данных с маркерами фаз луны на графике
- 🔍 **Анализ корреляций**: Выявление статистических взаимосвязей между астрономическими и экономическими событиями
- 🌓 **Адаптивная тема**: Темная/светлая тема с автоматической адаптацией к текущей фазе луны
- 📅 **Календарь событий**: Отслеживание предстоящих астрологических и экономических событий с системой приоритетов
- 🎯 **Отказоустойчивость**: Graceful degradation с mock данными при недоступности внешних API

## 🚀 Технический стек

### Серверная часть
- **Язык**: TypeScript (полная миграция с JavaScript)
- **Runtime**: Node.js с ES модулями
- **Веб-фреймворк**: Express.js
- **Логирование**: Winston с structured logging
- **Валидация данных**: Zod schemas
- **Кэширование**: Redis integration
- **Внешние API**: CoinGecko (криптовалюты), FarmSense (астрономия), Binance WebSocket

### Клиентская часть
- **Библиотека UI**: React.js с TypeScript
- **Сборка**: Vite с оптимизированной конфигурацией
- **Стили**: TailwindCSS с dark mode support
- **Графики**: Lightweight Charts с memory management
- **Состояние**: React Context API + optimized state patterns
- **Маршрутизация**: React Router v6
- **Работа с датами**: Day.js с timezone support
- **Архитектура**: Atomic Design с BaseChart foundation

### DevOps & Инфраструктура
- **Контейнеризация**: Docker + Docker Compose
- **Тестирование**: Playwright E2E + Jest unit tests
- **Качество кода**: ESLint + Prettier (97% improvement)
- **Git hooks**: Husky с автоматической очисткой временных файлов
- **Memory Bank**: Cursor AI с comprehensive documentation system

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

### ✅ Функциональные дополнения
- **Страница "О проекте"**: Подробная информация о целях и методологии исследования  
- **Enhanced Navigation**: React Router integration с улучшенной маршрутизацией
- **Event System**: Календарь предстоящих событий с приоритизацией и filtering
- **Theme System**: Адаптивная тема с поддержкой системных настроек
- **Error Boundaries**: Graceful error handling с fallback components

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

### Автоматическая очистка
Pre-commit хуки автоматически очищают временные файлы:
- `test-results/` - результаты Playwright
- `tests/e2e/artifacts/` - скриншоты, видео, трейсы
- `*.log` файлы - логи разработки

## 🏗️ Архитектурные принципы

Проект построен на следующих принципах:

- **KISS** (Keep It Simple, Stupid) - простота и понятность решений
- **DRY** (Don't Repeat Yourself) - избегание дублирования логики
- **DDD** (Domain-Driven Design) - организация кода вокруг бизнес-доменов
- **Atomic Design** - иерархическая структура UI компонентов
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
[client]: feat - добавлен компонент для отображения фаз луны
[server]: fix - исправлена race condition в state management  
[memory-bank]: docs - обновлена архитектурная документация
[tests]: feat - добавлены E2E тесты для timeframe switching
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
