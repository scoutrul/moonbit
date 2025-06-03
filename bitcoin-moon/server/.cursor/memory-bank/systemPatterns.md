# Архитектурные паттерны системы

## Архитектура системы

Проект Bitcoin-Moon использует клиент-серверную архитектуру с четким разделением ответственности между компонентами:

```
+------------------------+         +------------------------+
|                        |         |                        |
|   Client Application   |<------->|    Server Application  |
|       (React SPA)      |   API   |    (Express/Node.js)   |
|                        |         |                        |
+------------------------+         +------------------------+
                                            |
                                            | 
                                   +--------v---------+
                                   |                  |
                                   | External Services |
                                   | - CoinGecko API  |
                                   | - FarmSense API  |
                                   |                  |
                                   +------------------+
```

### Серверная часть

Серверная часть построена на принципах чистой архитектуры с использованием TypeScript и следующих ключевых паттернов:

1. **Dependency Injection** - Используется библиотека Inversify для внедрения зависимостей.
2. **Repository Pattern** - Абстрагирование доступа к данным через репозитории.
3. **Service Layer** - Инкапсуляция бизнес-логики в сервисах.
4. **Controller-Service-Repository** - Многослойная архитектура с разделением ответственности.

#### Структура серверной части

```
src/
├── config/           # Конфигурация приложения
├── controllers/      # Контроллеры для обработки HTTP-запросов
├── data/             # Данные и кэши
│   └── cache/        # Файлы кэширования
├── repositories/     # Репозитории для доступа к данным
├── routes/           # Определение маршрутов API
├── services/         # Бизнес-логика приложения
├── types/            # TypeScript типы и интерфейсы
│   ├── interfaces.ts # Определения интерфейсов
│   └── types.ts      # Символы для DI
├── utils/            # Вспомогательные утилиты
├── inversify.config.ts # Конфигурация DI-контейнера
└── index.ts          # Точка входа в приложение
```

### Клиентская часть

Клиентская часть реализована как SPA (Single Page Application) с использованием React и следующих паттернов:

1. **Component-Based Architecture** - Разделение UI на переиспользуемые компоненты.
2. **Flux/Redux Pattern** - Централизованное управление состоянием приложения.
3. **Custom Hooks** - Инкапсуляция логики в переиспользуемых хуках.
4. **Container/Presentational Pattern** - Разделение компонентов на контейнеры (логика) и представления (UI).

#### Структура клиентской части

```
src/
├── components/       # React компоненты
│   ├── BitcoinChart/ # Компоненты для отображения графиков
│   ├── MoonPhase/    # Компоненты для отображения фаз луны
│   └── ...
├── hooks/            # React хуки
├── services/         # Сервисы для взаимодействия с API
├── store/            # Redux store и actions
├── types/            # TypeScript типы
└── utils/            # Вспомогательные утилиты
```

## Ключевые технические решения

### Серверная часть

#### Dependency Injection

Использование DI позволяет:
- Упростить тестирование компонентов через моки
- Обеспечить слабую связанность между компонентами
- Централизованно управлять жизненным циклом объектов

```typescript
// inversify.config.ts
import { Container } from 'inversify';
import { TYPES } from './types/types';
import { IBitcoinService } from './types/interfaces';
import { BitcoinService } from './services/BitcoinService';

const container = new Container();
container.bind<IBitcoinService>(TYPES.BitcoinService).to(BitcoinService).inSingletonScope();

export { container };
```

#### Repository Pattern

Репозитории абстрагируют доступ к данным:

```typescript
// Интерфейс репозитория
export interface IBitcoinRepository {
  fetchCurrentPrice(): Promise<IBitcoinPrice>;
  fetchHistoricalData(days: number): Promise<IBitcoinHistoricalData>;
}

// Реализация репозитория
@injectable()
export class BitcoinRepository implements IBitcoinRepository {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig
  ) {}
  
  async fetchCurrentPrice(): Promise<IBitcoinPrice> {
    // Реализация
  }
}
```

#### Service Layer

Сервисы содержат бизнес-логику и используют репозитории для доступа к данным:

```typescript
@injectable()
export class BitcoinService implements IBitcoinService {
  constructor(
    @inject(TYPES.BitcoinRepository) private bitcoinRepository: IBitcoinRepository,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}
  
  async getCurrentPrice(): Promise<IBitcoinPriceResponse> {
    // Бизнес-логика
  }
}
```

#### Контроллеры

Контроллеры обрабатывают HTTP-запросы и делегируют логику сервисам:

```typescript
@injectable()
export class BitcoinController {
  constructor(
    @inject(TYPES.BitcoinService) private bitcoinService: IBitcoinService
  ) {}
  
  async getCurrentPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.bitcoinService.getCurrentPrice();
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}
```

### Клиентская часть

#### Компонентная архитектура

Компоненты разделены на:
- **Presentational Components** - Отвечают только за рендеринг UI
- **Container Components** - Содержат логику и состояние
- **HOC (Higher-Order Components)** - Для переиспользования логики

#### Custom Hooks

Хуки инкапсулируют логику работы с API и состоянием:

```javascript
// Хук для получения данных о биткоине
export function useBitcoinPrice() {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await BitcoinService.getCurrentPrice();
        setPrice(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return { price, loading, error };
}
```

#### Взаимодействие с API

Клиент взаимодействует с сервером через сервисные классы:

```javascript
// BitcoinService.js
import axios from 'axios';

class BitcoinService {
  static async getCurrentPrice() {
    return axios.get('/api/bitcoin/price');
  }
  
  static async getHistoricalData(days = 30) {
    return axios.get(`/api/bitcoin/history?days=${days}`);
  }
}

export default BitcoinService;
```

## Взаимодействие компонентов

### Flow запроса данных о биткоине

```
+---------------+    +----------------+    +----------------+    +------------------+
|               |    |                |    |                |    |                  |
| React         |    | Express        |    | Bitcoin        |    | Bitcoin          |
| Component     |--->| Controller     |--->| Service        |--->| Repository       |
|               |    |                |    |                |    |                  |
+---------------+    +----------------+    +----------------+    +------------------+
                                                                         |
                                                                         v
                                                               +------------------+
                                                               |                  |
                                                               | CoinGecko API    |
                                                               | или локальный кэш |
                                                               |                  |
                                                               +------------------+
```

### Flow получения данных о фазах луны

```
+---------------+    +----------------+    +----------------+    +------------------+
|               |    |                |    |                |    |                  |
| React         |    | Express        |    | Moon           |    | Moon             |
| Component     |--->| Controller     |--->| Service        |--->| Repository       |
|               |    |                |    |                |    |                  |
+---------------+    +----------------+    +----------------+    +------------------+
                                                                         |
                                                                         v
                                                               +------------------+
                                                               |                  |
                                                               | FarmSense API    |
                                                               | или astronomia    |
                                                               |                  |
                                                               +------------------+
```

## Взаимодействие между сервисами

Сервисы взаимодействуют между собой через DI и DataSyncService:

```
                +------------------+
                |                  |
                | DataSyncService  |
                |                  |
                +------------------+
                 /       |        \
                /        |         \
               /         |          \
              v          v           v
+----------------+ +----------------+ +----------------+
|                | |                | |                |
| BitcoinService | | MoonService    | | AstroService   |
|                | |                | |                |
+----------------+ +----------------+ +----------------+
```

## Принципы проектирования

### SOLID

1. **Single Responsibility Principle** - Каждый класс имеет одну ответственность
2. **Open/Closed Principle** - Классы открыты для расширения, закрыты для модификации
3. **Liskov Substitution Principle** - Возможность замены базовых типов их наследниками
4. **Interface Segregation Principle** - Клиенты не должны зависеть от интерфейсов, которые они не используют
5. **Dependency Inversion Principle** - Высокоуровневые модули не зависят от низкоуровневых

### DRY (Don't Repeat Yourself)

Избегание дублирования кода через:
- Общие утилиты и хелперы
- Переиспользуемые компоненты
- Абстракции и интерфейсы

### KISS (Keep It Simple, Stupid)

- Простые решения предпочтительнее сложных
- Избегание преждевременной оптимизации
- Понятный и поддерживаемый код

## Компонентная структура

### Основные компоненты серверной части

1. **BitcoinService** - Получение и обработка данных о биткоине
2. **MoonService** - Расчет фаз луны и лунных событий
3. **AstroService** - Работа с астрономическими данными
4. **EventsService** - Агрегация событий из разных источников
5. **DataSyncService** - Координация обновления данных

### Основные компоненты клиентской части

1. **Dashboard** - Главная страница с графиками и данными
2. **BitcoinChart** - График цены биткоина
3. **MoonPhaseWidget** - Виджет отображения фазы луны
4. **EventsTimeline** - Временная шкала предстоящих событий
5. **PriceAnalysis** - Анализ цены биткоина

## Стратегия тестирования

### Серверная часть

1. **Unit Tests** - Тестирование отдельных компонентов с моками зависимостей
2. **Integration Tests** - Тестирование взаимодействия между компонентами
3. **API Tests** - Тестирование API эндпоинтов

### Клиентская часть

1. **Component Tests** - Тестирование React компонентов
2. **Hook Tests** - Тестирование кастомных хуков
3. **E2E Tests** - Сквозное тестирование пользовательских сценариев

## Архитектурные ограничения

1. **Производительность** - Оптимизация запросов к внешним API через кэширование
2. **Безопасность** - Защита от XSS, CSRF и других уязвимостей
3. **Масштабируемость** - Возможность горизонтального масштабирования
4. **Доступность** - Соответствие стандартам WCAG 2.1

## Технический долг и ограничения

1. **Миграция на TypeScript** - Постепенный переход с JavaScript на TypeScript
2. **Улучшение тестового покрытия** - Увеличение покрытия кода тестами
3. **Документация API** - Добавление Swagger/OpenAPI
4. **Оптимизация запросов** - Улучшение производительности при работе с внешними API 