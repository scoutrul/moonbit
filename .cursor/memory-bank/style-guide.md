# MoonBit Style Guide

## 🎨 Обзор дизайн-системы

Этот style guide определяет визуальные стандарты для проекта MoonBit - платформы анализа корреляций цены Bitcoin с лунными фазами.

## 🌙 Дизайн-философия

- **Темная тема по умолчанию** - соответствует trading приложениям и Bitcoin тематике
- **Минимализм и читаемость** - фокус на данных, не на украшениях
- **Космическая/лунная тематика** - тонкие акценты без overwhelming эффектов
- **Professional trading UI** - знакомые паттерны для трейдеров
- **Максимальная экономия пространства** - эффективное использование каждого пикселя
- **Максимальная ширина экрана** - full-width подход с ограничениями только для читаемости

## 🎯 TailwindCSS Framework

### Основные принципы
- **Utility-first** подход - использование Tailwind классов вместо custom CSS
- **Design tokens** - все значения берутся из Tailwind конфигурации
- **Responsive-first** - mobile-first подход с breakpoints
- **Component composition** - сборка компонентов из utility классов

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // Управление темной темой через класс
  theme: {
    extend: {
      colors: {
        'bitcoin': '#f7931a',
        'moon': '#c0c0c0',
        'dark-bg': '#0f0f23',
        'dark-card': '#1a1a2e',
        'dark-elevated': '#16213e'
      },
      spacing: {
        '18': '4.5rem', // Кастомные spacing для trading UI
        '88': '22rem'
      },
      maxWidth: {
        'screen-2xl': '1536px' // Максимальная ширина контента
      }
    }
  }
}
```

### Utility Classes Strategy
- **Композиция над кастомизацией** - использовать готовые классы
- **Responsive modifiers** - `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **State modifiers** - `hover:`, `focus:`, `active:`, `disabled:`
- **Dark mode** - `dark:` префикс для темной темы

## 🧱 Атомарный дизайн и компонентная архитектура

### Структура компонентов

```
src/components/
├── atoms/           # Самые простые переиспользуемые элементы
│   ├── Button/
│   ├── Input/
│   ├── Spinner/
│   ├── Badge/
│   └── Icon/
├── molecules/       # Простые группы атомов
│   ├── SearchBox/
│   ├── ToggleGroup/
│   ├── PriceDisplay/
│   └── EventMarker/
├── organisms/       # Сложные UI компоненты
│   ├── EventFilterPanel/
│   ├── ChartContainer/
│   ├── TradingHeader/
│   └── CurrencySelector/
├── templates/       # Компоненты страниц
│   ├── DashboardLayout/
│   └── ChartLayout/
└── pages/          # Полные страницы
    ├── Dashboard/
    └── Settings/
```

### Принципы переиспользования

#### 🔸 Atoms (Атомы)
- **Максимально простые** - одна ответственность
- **Полностью переиспользуемые** - работают в любом контексте
- **Props-driven** - всё поведение через props
- **Zero business logic** - только UI логика

```jsx
// atoms/Button/Button.jsx
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:ring-2 focus:ring-bitcoin/50';
  const variants = {
    primary: 'bg-bitcoin hover:bg-bitcoin/90 text-white',
    secondary: 'bg-dark-elevated hover:bg-dark-card text-gray-200 border border-gray-600',
    ghost: 'hover:bg-dark-elevated text-gray-300'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### 🔸 Molecules (Молекулы) 
- **Группы атомов** с общей функциональностью
- **Контекстные** - специфичны для определенных use cases
- **Простая логика** - базовые интерактивности

```jsx
// molecules/ToggleGroup/ToggleGroup.jsx
const ToggleGroup = ({ options, value, onChange, size = 'md' }) => {
  return (
    <div className="flex rounded-lg bg-dark-elevated p-1">
      {options.map(option => (
        <Button
          key={option.value}
          variant={value === option.value ? 'primary' : 'ghost'}
          size={size}
          onClick={() => onChange(option.value)}
          className="flex-1 rounded-md"
        >
          {option.icon && <Icon name={option.icon} className="mr-2 w-4 h-4" />}
          {option.label}
        </Button>
      ))}
    </div>
  );
};
```

#### 🔸 Organisms (Организмы)
- **Сложная функциональность** - комбинируют molecules и atoms
- **Business logic** - знают о данных и состоянии
- **Специализированные** - для конкретных бизнес-задач

### Максимальная экономия пространства

#### Space Efficiency Patterns
```css
/* Компактные spacing для trading UI */
.compact-spacing {
  @apply space-y-2; /* 8px между элементами */
}

.ultra-compact {
  @apply space-y-1; /* 4px для плотного контента */
}

/* Максимальное использование ширины */
.full-width-container {
  @apply w-full max-w-none px-4 lg:px-6;
}

/* Эффективные grid layouts */
.trading-grid {
  @apply grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3;
}
```

#### Mobile Space Optimization
```css
/* Адаптивные отступы */
.responsive-padding {
  @apply px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4;
}

/* Сжатая типографика на мобильных */
.mobile-compact-text {
  @apply text-sm sm:text-base lg:text-lg;
}

/* Компактные кнопки на мобильных */
.mobile-button {
  @apply px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm;
}
```

## 🎨 Цветовая палитра

### Основные цвета (Dark Theme)
- **Background Primary**: `#0f0f23` | `bg-dark-bg`
- **Background Secondary**: `#1a1a2e` | `bg-dark-card`  
- **Background Elevated**: `#16213e` | `bg-dark-elevated`

### Accent цвета
- **Bitcoin Orange**: `#f7931a` | `bg-bitcoin text-bitcoin`
- **Moon Silver**: `#c0c0c0` | `bg-moon text-moon`
- **Success Green**: `#10b981` | `bg-emerald-500 text-emerald-500`
- **Danger Red**: `#ef4444` | `bg-red-500 text-red-500`
- **Warning Yellow**: `#f59e0b` | `bg-amber-500 text-amber-500`

### Текстовые цвета
- **Text Primary**: `text-white`
- **Text Secondary**: `text-gray-400`
- **Text Muted**: `text-gray-500`
- **Text Disabled**: `text-gray-600`

## 📏 Spacing System (Tailwind-based)

### Responsive Spacing Strategy
```css
/* Базовые отступы с адаптивностью */
.content-spacing {
  @apply space-y-4 sm:space-y-6 lg:space-y-8;
}

/* Секционные отступы */
.section-spacing {
  @apply mb-6 sm:mb-8 lg:mb-12;
}

/* Компонентные отступы */
.component-padding {
  @apply p-3 sm:p-4 lg:p-6;
}
```

### Flexbox Layouts with Wrapping
```css
/* Адаптивные flex контейнеры */
.flex-responsive {
  @apply flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4;
}

/* Grid с flex fallback */
.adaptive-grid {
  @apply flex flex-wrap -m-2;
}

.adaptive-grid > * {
  @apply flex-1 min-w-64 m-2;
}
```

## 🔲 Переиспользуемые компоненты (Atoms)

### Button Component
```jsx
// Все варианты кнопок в одном компоненте
<Button variant="primary" size="md">Primary</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<Button variant="ghost" size="lg" icon="moon">With Icon</Button>
```

### Input Component  
```jsx
// Универсальный input с валидацией
<Input 
  type="text" 
  placeholder="Enter value"
  error="This field is required"
  leftIcon="search"
  rightIcon="clear"
/>
```

### Badge Component
```jsx
// Универсальные бэджи для статусов
<Badge variant="success">Online</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
<Badge variant="bitcoin">₿ BTC</Badge>
```

### Icon System
```jsx
// Иконочная система на SVG
<Icon name="bitcoin" size="md" className="text-bitcoin" />
<Icon name="moon-phase-full" size="lg" />
<Icon name="trend-up" className="text-emerald-500" />
```

## 📱 Responsive Design & Mobile Adaptation

### Breakpoint Strategy
```css
/* Mobile-first responsive approach */
.responsive-component {
  /* Mobile default */
  @apply text-sm px-2 py-1;
  
  /* Tablet */
  @apply sm:text-base sm:px-3 sm:py-2;
  
  /* Desktop */
  @apply lg:text-lg lg:px-4 lg:py-3;
  
  /* Large desktop */
  @apply xl:text-xl xl:px-6 xl:py-4;
}
```

### Mobile Typography Scaling
```css
/* Адаптивная типографика */
.heading-responsive {
  @apply text-xl sm:text-2xl lg:text-3xl xl:text-4xl;
}

.body-responsive {
  @apply text-sm sm:text-base lg:text-lg;
}

.caption-responsive {
  @apply text-xs sm:text-sm;
}
```

### Mobile Navigation Patterns
```css
/* Сворачиваемая навигация */
.mobile-nav {
  @apply hidden sm:flex; /* Desktop navigation */
}

.mobile-nav-button {
  @apply block sm:hidden; /* Mobile hamburger */
}

/* Touch-friendly elements */
.touch-target {
  @apply min-h-11 min-w-11; /* 44px minimum touch target */
}
```

## 📊 Trading UI Specific Patterns

### Price Display Components
```jsx
// Стандартизированное отображение цен
<PriceDisplay 
  value={42150.50}
  change={+2.5}
  currency="USD"
  size="lg"
  showTrend={true}
/>
```

### Chart Integration Styles
```css
/* TradingView интеграция */
.chart-container {
  @apply w-full bg-dark-card rounded-lg overflow-hidden;
  min-height: 400px;
}

.chart-controls {
  @apply flex items-center justify-between p-3 bg-dark-elevated border-b border-gray-700;
}

.chart-legend {
  @apply flex items-center space-x-4 text-sm text-gray-400;
}
```

### Event Markers
```css
/* Маркеры событий на графике */
.event-marker {
  @apply absolute w-3 h-3 rounded-full border-2 border-white;
}

.event-marker.moon-phase {
  @apply bg-moon;
}

.event-marker.economic {
  @apply bg-amber-500;
}

.event-marker.astro {
  @apply bg-purple-500;
}
```

## 🧹 Code Quality Standards

### CSS Organization
```scss
// Порядок CSS классов
.component {
  // Layout
  @apply flex flex-col;
  
  // Positioning  
  @apply relative;
  
  // Box Model
  @apply w-full p-4 m-2;
  
  // Typography
  @apply text-base font-medium;
  
  // Visual
  @apply bg-dark-card border border-gray-700 rounded-lg;
  
  // Interactive
  @apply hover:bg-dark-elevated transition-colors;
}
```

### Component Props Interface
```typescript
// Строгая типизация props для переиспользования
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  className?: string;
}
```

### Accessibility Standards
```jsx
// A11y требования для всех компонентов
<Button
  aria-label="Close dialog"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && onClick()}
>
  ✕
</Button>
```

## 🔄 Animation & Transitions

### Standard Transitions
```css
/* Единые transition timing */
.transition-default {
  @apply transition-all duration-200 ease-in-out;
}

.transition-fast {
  @apply transition-all duration-150 ease-in-out;
}

.transition-slow {
  @apply transition-all duration-300 ease-in-out;
}
```

### Loading States
```jsx
// Консистентные loading состояния
<Spinner size="md" className="text-bitcoin" />
<Button loading variant="primary">
  {loading ? <Spinner size="sm" /> : 'Submit'}
</Button>
```

---

**Принципы этого Style Guide:**
1. **Utility-first с Tailwind** - минимум custom CSS
2. **Атомарный дизайн** - переиспользуемые компоненты-кирпичики  
3. **Максимальная экономия пространства** - эффективное использование экрана
4. **Mobile-first responsive** - адаптивность на всех уровнях
5. **Accessibility** - доступность для всех пользователей
6. **Trading UI patterns** - привычные паттерны для трейдеров

*Последнее обновление: версия 2.0 - TailwindCSS + Atomic Design + Space Efficiency* 