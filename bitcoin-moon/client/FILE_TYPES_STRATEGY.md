# File Types Strategy - MoonBit Client

## 📝 Стратегия использования типов файлов

### 🎯 Цель
Определить четкие правила использования JS/TS/JSX/TSX файлов в проекте для максимальной типобезопасности и consistency.

## 📋 Правила типов файлов

### 💎 **TypeScript First Strategy**

#### **Приоритетный порядок использования:**
1. **`.tsx`** - React компоненты с TypeScript (РЕКОМЕНДУЕТСЯ)
2. **`.ts`** - Утилиты, сервисы, типы с TypeScript (РЕКОМЕНДУЕТСЯ)  
3. **`.jsx`** - Legacy React компоненты (МИГРАЦИЯ НА .tsx)
4. **`.js`** - Legacy утилиты и сервисы (МИГРАЦИЯ НА .ts)
5. **`.mjs`** - ES модули конфигурации (только при необходимости)

### 📁 **Правила по директориям:**

#### **`src/components/`** - React компоненты
- **Новые компоненты**: `.tsx` обязательно
- **Существующие `.jsx`**: мигрировать в `.tsx` по возможности
- **Пример**: `Button.tsx`, `EventFilterPanel.tsx`

#### **`src/services/`** - Бизнес-логика и API
- **Новые сервисы**: `.ts` обязательно
- **Существующие `.js`**: мигрировать в `.ts` в приоритете
- **Пример**: `BitcoinService.ts`, `AstroService.ts`

#### **`src/utils/`** - Утилиты и helpers
- **Все файлы**: `.ts` обязательно
- **Строгая типизация**: export типизированных функций
- **Пример**: `dateUtils.ts`, `formatters.ts`

#### **`src/types/`** - Типы и interfaces
- **Все файлы**: `.ts` только
- **Barrel exports**: через `index.ts`
- **Пример**: `api.ts`, `chart.ts`, `moon.ts`

#### **`src/hooks/`** - React hooks
- **Все файлы**: `.ts` обязательно
- **Типизация returns**: всегда указывать возвращаемые типы
- **Пример**: `useLocalStorage.ts`, `useBitcoinPrice.ts`

### 🔄 **Миграционная стратегия:**

#### **Phase 1: Критические файлы (Приоритет ВЫСОКИЙ)**
```
- src/services/*.js → *.ts (API и бизнес-логика)
- src/utils/*.js → *.ts (Утилиты)  
- src/types/*.js → *.ts (Типы)
```

#### **Phase 2: Компоненты (Приоритет СРЕДНИЙ)** 
```
- src/components/*.jsx → *.tsx (React компоненты)
- src/hooks/*.js → *.ts (React hooks)
```

#### **Phase 3: Остальные файлы (Приоритет НИЗКИЙ)**
```
- Остальные .js файлы → .ts если возможно
- Конфигурационные файлы остаются как есть
```

### ⚙️ **Конфигурационные файлы:**

#### **Vite конфигурация**
- ✅ `vite.config.ts` (объединенная конфигурация)
- ❌ `vite.config.js` (удален)

#### **ESLint конфигурация**
- Обновить правила для поддержки TypeScript:
```json
{
  "extends": [
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"]
}
```

#### **Jest конфигурация**
- 🟡 `jest.config.js` (сохранить для совместимости с Vitest)

### 🚫 **Избегать:**
- Смешивание `.js` и `.ts` в одной директории без плана миграции
- Создание новых `.jsx` компонентов (использовать `.tsx`)
- Создание новых `.js` файлов в `src/` (использовать `.ts`)
- Использование `any` типов без веских причин

### ✅ **Рекомендации:**
- Всегда добавлять TypeScript типы для props компонентов
- Использовать `interface` для объектов, `type` для unions
- Экспортировать типы компонентов для переиспользования
- Создавать barrel exports в каждой директории с компонентами

### 🔍 **ESLint правила для принуждения к TypeScript:**

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-interface": "error"
  }
}
```

---

**Статус**: ✅ Стратегия определена
**Следующий шаг**: Начать миграцию критических файлов (services, utils)
**Дата**: $(date) 