# Технический контекст MoonBit

## Серверная часть

### Стек технологий
- **Язык программирования**: JavaScript (Node.js)
- **Веб-фреймворк**: Express.js
- **Логирование**: Winston
- **Валидация данных**: Zod
- **Обработка HTTP-запросов**: Axios
- **Документация API**: JSDoc + HTML-документация

### Структура серверной части
- **/src/controllers/** - обработчики запросов
- **/src/routes/** - маршруты API
- **/src/services/** - бизнес-логика и взаимодействие с внешними API
- **/src/utils/** - утилиты и вспомогательные функции
- **/src/data/** - локальное хранение данных и кэш
- **/src/models/** - модели данных
- **/docs/** - документация API
- **/logs/** - логи приложения
- **/__tests__/** - тесты

### Внешние API и интеграции
1. **CoinGecko API** 
   - Используется для получения данных о цене биткоина
   - Имеет лимит запросов (до 50 запросов в минуту для бесплатного плана)
   - Endpoint: https://api.coingecko.com/api/v3/

2. **FarmSense API**
   - Используется для получения данных о фазах луны
   - Endpoint: https://api.farmsense.net/v1/moonphases/

### Механизмы кэширования
- Файловый кэш для данных от внешних API
- Стратегия кэширования: TTL (Time-To-Live) с разными значениями в зависимости от типа данных:
  - Цена биткоина: 15 минут
  - Исторические данные: 24 часа
  - Данные о луне: 1 час
  - Астрологические данные: 6 часов
  - События: 30 минут

### Синхронизация данных
- Сервис DataSyncService координирует обновление всех данных
- Работает в фоновом режиме через интервалы
- Имеет механизмы повторных попыток при ошибках
- Записывает результаты синхронизации в логи

## Клиентская часть

### Стек технологий
- **Библиотека UI**: React.js
- **Сборка**: Vite
- **Стили**: TailwindCSS
- **Графики**: Chart.js
- **Управление состоянием**: React Context API + useState/useReducer
- **HTTP-клиент**: Axios
- **Форматирование дат**: Day.js

### Структура клиентской части
- **/src/components/** - компоненты React
- **/src/hooks/** - пользовательские хуки
- **/src/services/** - сервисы для работы с API
- **/src/utils/** - вспомогательные функции
- **/src/assets/** - статические ресурсы
- **/public/** - публичные файлы
- **/__tests__/** - тесты
- **/__mocks__/** - моки для тестирования

### Особенности реализации
- Адаптивный дизайн (mobile-first)
- Темная и светлая темы с автоматическим переключением в зависимости от фазы луны
- Оптимизированные ререндеры компонентов через мемоизацию
- Механизм перехвата и обработки ошибок (ErrorBoundary)
- Отладочная панель в режиме разработки (DevPanel)

## Инфраструктура и деплой

### Разработка
- **Контроль версий**: Git (GitHub)
- **Линтинг**: ESLint с Airbnb style guide
- **Форматирование**: Prettier
- **Pre-commit хуки**: Husky + lint-staged
- **Тестирование**: Jest + React Testing Library

### Деплой
- **Контейнеризация**: Docker
- **Непрерывная интеграция**: GitHub Actions
- **Хостинг**: Любой провайдер, поддерживающий Docker

## Требования и ограничения

### Производительность
- Время первой загрузки: < 2 секунды
- Время отклика API: < 300 мс
- Размер бандла: < 500 KB (gzipped)

### Совместимость
- Поддержка последних 2 версий основных браузеров
- Мобильные устройства: iOS 13+, Android 8+

### Безопасность
- Отсутствие хранения чувствительных данных
- Защита от основных веб-уязвимостей (XSS, CSRF)
- Валидация всех входных данных

### Масштабируемость
- Горизонтальное масштабирование через Docker
- Кэширование для снижения нагрузки на внешние API 