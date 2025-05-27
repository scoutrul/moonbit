# Соглашения по именованию в проекте MoonBit

## Именование файлов

### PascalCase

**PascalCase** (стиль верблюжьего регистра с первой заглавной буквой) используется для:

- **Компонентов React**: `BitcoinPrice.jsx`, `MoonPhaseIndicator.jsx`
- **Классов и сервисов**: `AstroService.js`, `BitcoinService.js`
- **Моделей данных**: `MoonPhase.js`, `BitcoinData.js`

Пример:
```javascript
// AstroService.js
class AstroService {
  // реализация сервиса
}
```

### camelCase

**camelCase** (стиль верблюжьего регистра с первой строчной буквой) используется для:

- **Утилит и функций**: `astroEvents.js`, `dateFormatters.js`
- **Хуков React**: `useLocalStorage.js`, `useBitcoinPrice.js`
- **Вспомогательных файлов**: `astroCalculations.js`, `apiHelpers.js`

Пример:
```javascript
// astroEvents.js
export const fetchAstroEvents = async () => {
  // реализация функции
};
```

### kebab-case

**kebab-case** (слова, разделенные дефисами) используется для:

- **CSS-файлов**: `moon-phase.css`, `bitcoin-dashboard.css`
- **Статических ресурсов**: `full-moon-icon.svg`, `new-moon-icon.svg`

## Именование переменных и функций

- **Переменные**: используем camelCase (`bitcoinPrice`, `currentMoonPhase`)
- **Функции**: используем camelCase (`fetchBitcoinPrice`, `calculateMoonPhase`)
- **Константы**: используем UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_COUNT`)
- **Приватные методы и свойства**: начинаются с подчеркивания (`_calculatePhase`, `_validateResponse`)

## Именование компонентов

- **Компоненты React**: PascalCase (`BitcoinChart`, `MoonPhaseWidget`)
- **Контейнеры и страницы**: PascalCase с суффиксом типа (`DashboardPage`, `SettingsContainer`)

## Примеры правильного именования

### Файловая структура

```
bitcoin-moon/
  client/
    src/
      components/
        BitcoinPrice.jsx
        MoonPhaseWidget.jsx
        EventList.jsx
      services/
        AstroService.js
        BitcoinService.js
      utils/
        dateFormatters.js
        astroCalculations.js
      hooks/
        useLocalStorage.js
```

### Импорты

```javascript
import BitcoinPrice from './components/BitcoinPrice';
import AstroService from './services/AstroService';
import { formatDate } from './utils/dateFormatters';
import useLocalStorage from './hooks/useLocalStorage';
```

## Соблюдение соглашений

- **Проверка на этапе ревью кода**: следование соглашениям проверяется при ревью PR
- **Автоматическая проверка**: используются ESLint правила для проверки соответствия соглашениям
- **Рефакторинг**: при обнаружении нарушений соглашений файлы переименовываются и структура исправляется 