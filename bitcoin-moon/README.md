# Bitcoin Moon 🌙💰

![Bitcoin Moon Logo](client/public/bitcoin-moon-logo.png)

## Обзор проекта

Bitcoin Moon — это основное приложение проекта MoonBit, которое исследует корреляцию между фазами луны и динамикой цены биткоина. Приложение разделено на серверную и клиентскую части для обеспечения гибкости и масштабируемости.

## Структура проекта

```
bitcoin-moon/
  client/                  # Клиентская часть (React)
    src/
      components/          # React компоненты
        Dashboard.jsx      # Основной компонент дашборда
        CurrentPrice.jsx   # Отображение текущей цены
        CandlestickChart.jsx # График свечей
        UpcomingEvents.jsx # Предстоящие события
        ...
      hooks/               # Пользовательские хуки React
      services/            # Сервисы для работы с API
        api.js             # Базовый сервис для работы с API
        BitcoinService.js  # Сервис для данных о биткоине
        MoonService.js     # Сервис для данных о луне
        EventsService.js   # Сервис для данных о событиях
      utils/               # Вспомогательные функции
      types/               # TypeScript типы и интерфейсы
    public/                # Статические ресурсы
    __tests__/             # Тесты клиентской части
    __mocks__/             # Моки для тестов
  
  server/                  # Серверная часть (Node.js/Express)
    src/
      controllers/         # Контроллеры API
      routes/              # Маршруты API
        bitcoin.js         # API для данных о биткоине
        moon.js            # API для данных о луне
        events.js          # API для событий
        astro.js           # API для астрологических данных
      services/            # Сервисы бизнес-логики
        BitcoinService.js  # Сервис для работы с данными о биткоине
        MoonService.js     # Сервис для работы с данными о луне
        EventsService.js   # Сервис для работы с событиями
        AstroService.js    # Сервис для астрологических данных
        DataSyncService.js # Сервис синхронизации данных
      utils/               # Утилиты для серверной части
        logger.js          # Система логирования
        config.js          # Конфигурация приложения
        middlewares.js     # Express middleware
      data/                # Директория для хранения кэшированных данных
    docs/                  # Документация API
      api.html             # HTML-документация API
      api-routes.md        # Markdown-документация маршрутов API
    logs/                  # Директория для хранения логов
    __tests__/             # Тесты серверной части
  
  TESTING.md               # Информация о системе тестирования
```

## Компоненты системы

### Серверные сервисы

- **BitcoinService** — получает и кэширует данные о цене биткоина с CoinGecko API
- **MoonService** — рассчитывает и кэширует данные о фазах луны с FarmSense API
- **AstroService** — рассчитывает астрологические данные и события
- **EventsService** — управляет данными о важных событиях в мире криптовалют
- **DataSyncService** — координирует синхронизацию данных между всеми сервисами

### Клиентские компоненты

- **Dashboard** — основной компонент, объединяющий все остальные
- **CurrentPrice** — отображает текущую цену биткоина и изменение за 24 часа
- **CandlestickChart** — отображает график свечей для выбранного временного интервала
- **UpcomingEvents** — показывает список предстоящих значимых событий
- **MoonPhaseDisplay** — визуализирует текущую и предстоящие фазы луны

## API эндпоинты

### Биткоин API
- `GET /api/bitcoin/current` — получение текущей цены биткоина
- `GET /api/bitcoin/history` — получение исторических данных о цене

### Луна API
- `GET /api/moon/current` — получение текущей фазы луны
- `GET /api/moon/upcoming` — получение предстоящих фаз луны
- `GET /api/moon/history` — получение исторических данных о фазах луны

### События API
- `GET /api/events/upcoming` — получение предстоящих событий
- `GET /api/events/category` — получение событий по категории
- `GET /api/events/range` — получение событий за определенный период

### Астрология API
- `GET /api/astro/data` — получение астрологических данных по дате

## Запуск и разработка

### Разработка серверной части

```bash
cd server
npm install
npm run dev
```

Сервер запустится на порту 3001: http://localhost:3001

### Разработка клиентской части

```bash
cd client
npm install
npm run dev
```

Клиент запустится на порту 3000: http://localhost:3000

## Тестирование

Подробная информация о тестировании доступна в файле [TESTING.md](TESTING.md).

### Запуск тестов серверной части

```bash
cd server
npm test
```

### Запуск тестов клиентской части

```bash
cd client
npm test
```

## Документация API

При запущенном сервере документация API доступна по адресу: http://localhost:3001/api/docs 