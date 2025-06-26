# 🏗️ MoonBit - Архитектура системы

> **Comprehensive guide** по архитектуре и техническим решениям проекта MoonBit

## 📋 Содержание

- [🎯 Обзор архитектуры](#-обзор-архитектуры)
- [🌐 Frontend архитектура](#-frontend-архитектура)
- [🚀 Backend архитектура](#-backend-архитектура)
- [💾 Data Layer](#-data-layer)
- [🔄 Communication patterns](#-communication-patterns)
- [🧩 Component design](#-component-design)
- [📊 State management](#-state-management)
- [🔒 Security architecture](#-security-architecture)
- [⚡ Performance considerations](#-performance-considerations)
- [🧪 Testing architecture](#-testing-architecture)

---

## 🎯 Обзор архитектуры

**MoonBit** построен на основе **современной микросервисной архитектуры** с четким разделением ответственности между frontend, backend и data layer.

### 📊 **High-level архитектурная диаграмма**

```mermaid
graph TD
    subgraph "🌐 Client Layer"
        UI[🎨 React UI Components]
        Charts[📊 Chart Components]
        State[⚙️ State Management]
        Routing[🛣️ React Router]
    end
    
    subgraph "🔄 Communication Layer"
        HTTP[📡 HTTP/REST APIs]
        WS[⚡ WebSocket Real-time]
        Cache[💾 Client-side Cache]
    end
    
    subgraph "🚀 Server Layer"
        Gateway[🛡️ API Gateway]
        Auth[🔐 Authentication]
        Services[🧩 Business Services]
        Controllers[🎮 Controllers]
    end
    
    subgraph "💾 Data Layer"
        Redis[🔴 Redis Cache]
        APIs[📡 External APIs]
        Astro[🌙 Astronomical Data]
    end
    
    subgraph "🐳 Infrastructure"
        Docker[🐳 Docker Containers]
        Network[🌐 Bridge Network]
        Volumes[💿 Persistent Volumes]
    end
    
    UI --> HTTP
    Charts --> WS
    State --> Cache
    HTTP --> Gateway
    WS --> Gateway
    Gateway --> Auth
    Gateway --> Controllers
    Controllers --> Services
    Services --> Redis
    Services --> APIs
    Services --> Astro
    
    Docker --> Network
    Docker --> Volumes
    Redis --> Volumes
```

### 🏛️ **Архитектурные принципы**

| Принцип | Реализация | Преимущества |
|---------|------------|--------------|
| **Separation of Concerns** | Frontend/Backend/Data разделение | Независимое развитие компонентов |
| **Dependency Injection** | Inversify контейнер | Testability и loose coupling |
| **Single Responsibility** | Service-based architecture | Maintainability и modularity |
| **Interface Segregation** | TypeScript interfaces | Type safety и clear contracts |
| **Don't Repeat Yourself** | Shared utilities и components | Code reusability |

---

## 🌐 Frontend архитектура

### 📱 **React Application Structure**

```
src/
├── components/           # Reusable UI components
│   ├── atoms/           # Basic building blocks  
│   ├── organisms/       # Complex composed components
│   ├── BitcoinChart/    # Chart-specific components
│   └── Dashboard/       # Page-level components
├── services/            # API communication layer
├── utils/               # Helper functions и utilities
├── types/               # TypeScript type definitions
└── main.jsx            # Application entry point
```

### 🧩 **Component Architecture Pattern**

MoonBit использует **Atomic Design Pattern** для организации React компонентов:

```mermaid
graph TD
    subgraph "⚛️ Atomic Design Structure"
        Atoms[🔹 Atoms<br/>Button, Input, Icon]
        Molecules[🔸 Molecules<br/>SearchBox, ChartControls]
        Organisms[🔺 Organisms<br/>ChartContainer, Dashboard]
        Templates[📄 Templates<br/>PageLayout, ChartLayout]
        Pages[📱 Pages<br/>Dashboard, Settings]
    end
    
    Atoms --> Molecules
    Molecules --> Organisms
    Organisms --> Templates
    Templates --> Pages
    
    subgraph "🎯 Specialized Components"
        Charts[📊 Chart Components<br/>BaseChart, CurrencyChart]
        State[⚙️ State Components<br/>Context Providers]
        Routing[🛣️ Routing<br/>AppRouting, Guards]
    end
    
    Pages --> Charts
    Pages --> State
    Pages --> Routing
```

### 📊 **Chart Architecture**

**Lightweight Charts integration** с memory management:

```mermaid
graph LR
    subgraph "📊 Chart System"
        Base[🎯 BaseChart<br/>Core chart logic]
        Currency[💰 CurrencyChart<br/>Bitcoin-specific]
        Container[📦 ChartContainer<br/>UI wrapper]
        Memory[🧠 ChartMemoryManager<br/>Cleanup management]
    end
    
    subgraph "📈 Data Flow"
        API[🔌 API Service]
        Adapter[🔄 DataAdapter]
        Events[⚡ Event System]
        State[💾 Local State]
    end
    
    API --> Adapter
    Adapter --> Base
    Base --> Currency
    Currency --> Container
    Container --> Memory
    
    Events --> State
    State --> Base
```

### ⚙️ **State Management Architecture**

**Context + Custom Hooks pattern** для state management:

```mermaid
graph TD
    subgraph "🏪 Global State"
        AppContext[🌍 AppContext<br/>App-wide state]
        ThemeContext[🎨 ThemeContext<br/>Dark/light theme]
        DataContext[📊 DataContext<br/>Chart data]
    end
    
    subgraph "🪝 Custom Hooks"
        UseBitcoin[📈 useBitcoin<br/>Price data]
        UseMoon[🌙 useMoon<br/>Lunar events]
        UseChart[📊 useChart<br/>Chart interactions]
        UseTheme[🎨 useTheme<br/>Theme switching]
    end
    
    subgraph "🧩 Components"
        Dashboard[📱 Dashboard]
        Chart[📊 Chart]
        Controls[🎮 Controls]
    end
    
    AppContext --> UseBitcoin
    ThemeContext --> UseTheme
    DataContext --> UseChart
    DataContext --> UseMoon
    
    UseBitcoin --> Dashboard
    UseChart --> Chart
    UseTheme --> Dashboard
    UseMoon --> Chart
```

---

## 🚀 Backend архитектура

### 🏗️ **Server Architecture Overview**

```
src/
├── controllers/         # Request handling logic
│   ├── BitcoinController.ts
│   ├── MoonController.ts
│   └── EventsController.ts
├── services/           # Business logic layer
│   ├── BitcoinService.ts
│   ├── MoonService.ts
│   └── AstroService.ts
├── repositories/       # Data access layer
│   ├── BitcoinRepository.ts
│   └── MoonRepository.ts
├── routes/            # Express route definitions
├── utils/             # Helper utilities
└── types/             # TypeScript definitions
```

### 🧬 **Dependency Injection Architecture**

**Inversify container** для управления dependencies:

```mermaid
graph TD
    subgraph "🏗️ DI Container"
        Container[📦 Inversify Container]
        Types[🏷️ TYPES definitions]
        Config[⚙️ inversify.config.ts]
    end
    
    subgraph "🎮 Controllers Layer"
        BitcoinCtrl[💰 BitcoinController]
        MoonCtrl[🌙 MoonController]
        EventsCtrl[⚡ EventsController]
    end
    
    subgraph "🧩 Services Layer"  
        BitcoinSvc[💰 BitcoinService]
        MoonSvc[🌙 MoonService]
        AstroSvc[🌟 AstroService]
        CacheSvc[💾 CacheService]
    end
    
    subgraph "💾 Repository Layer"
        BitcoinRepo[💰 BitcoinRepository]
        MoonRepo[🌙 MoonRepository]
        Redis[🔴 Redis Client]
    end
    
    Container --> BitcoinCtrl
    Container --> MoonCtrl
    Container --> EventsCtrl
    
    BitcoinCtrl --> BitcoinSvc
    MoonCtrl --> MoonSvc
    EventsCtrl --> AstroSvc
    
    BitcoinSvc --> BitcoinRepo
    MoonSvc --> MoonRepo
    AstroSvc --> CacheSvc
    
    BitcoinRepo --> Redis
    MoonRepo --> Redis
    CacheSvc --> Redis
```

### 🔌 **Service Layer Architecture**

Каждый service реализует **specific business domain**:

```mermaid
graph LR
    subgraph "💰 BitcoinService"
        B1[🔌 API Integration<br/>CoinGecko + Binance]
        B2[💾 Data Caching<br/>Redis storage]
        B3[📊 Data Processing<br/>Price formatting]
        B4[⚡ Real-time<br/>WebSocket updates]
    end
    
    subgraph "🌙 MoonService"
        M1[🧮 Astronomical<br/>Calculations]
        M2[📅 Event Scheduling<br/>Moon phases]
        M3[💾 Data Persistence<br/>Event caching]
        M4[🔄 Synchronization<br/>External APIs]
    end
    
    subgraph "🌟 AstroService"
        A1[🌌 Astronomical<br/>Events calculation]
        A2[🎯 Astrological<br/>Aspects analysis]
        A3[📊 Correlation<br/>Data processing]
        A4[🔮 Future<br/>Event prediction]
    end
    
    B1 --> B2 --> B3 --> B4
    M1 --> M2 --> M3 --> M4
    A1 --> A2 --> A3 --> A4
```

---

## 💾 Data Layer

### 🔴 **Redis Cache Architecture**

**Redis** используется как primary caching layer:

```mermaid
graph TD
    subgraph "🔴 Redis Data Structure"
        Keys[🔑 Key Patterns]
        TTL[⏰ TTL Management]
        Types[📋 Data Types]
        Persistence[💾 Persistence]
    end
    
    subgraph "📊 Cache Patterns"
        Price[💰 bitcoin:price:*<br/>Price data cache]
        Moon[🌙 moon:events:*<br/>Lunar events]
        Astro[🌟 astro:data:*<br/>Astronomical calc]
        Session[👤 session:*<br/>User preferences]
    end
    
    subgraph "🔄 Cache Strategies"
        WriteThrough[✍️ Write-through<br/>Immediate update]
        LazyLoad[🏃 Lazy loading<br/>On-demand fetch]
        TTLExpire[⏰ TTL expiration<br/>Auto cleanup]
        Invalidation[🗑️ Smart invalidation<br/>Event-based]
    end
    
    Keys --> Price
    TTL --> Moon
    Types --> Astro
    Persistence --> Session
    
    Price --> WriteThrough
    Moon --> LazyLoad
    Astro --> TTLExpire
    Session --> Invalidation
```

### 📡 **External API Integration**

```mermaid
graph LR
    subgraph "🌐 External APIs"
        CoinGecko[🦎 CoinGecko API<br/>Bitcoin price data]
        Binance[⚡ Binance WebSocket<br/>Real-time prices]
        FarmSense[🌙 FarmSense API<br/>Moon phase data]
        Astronomia[🌟 Astronomia Lib<br/>Calculations]
    end
    
    subgraph "🔄 Integration Layer"
        BitcoinSvc[💰 BitcoinService]
        MoonSvc[🌙 MoonService]
        AstroSvc[🌟 AstroService]
    end
    
    subgraph "💾 Caching Layer"
        Redis[🔴 Redis Cache]
        Memory[🧠 In-memory cache]
    end
    
    CoinGecko --> BitcoinSvc
    Binance --> BitcoinSvc
    FarmSense --> MoonSvc
    Astronomia --> AstroSvc
    
    BitcoinSvc --> Redis
    MoonSvc --> Redis
    AstroSvc --> Memory
```

---

## 🔄 Communication patterns

### 📡 **HTTP REST API**

**RESTful endpoints** с consistent response format:

```
GET  /api/bitcoin/price          # Current Bitcoin price
GET  /api/bitcoin/history/:period # Historical price data
GET  /api/moon/phases            # Moon phases data  
GET  /api/moon/events/:date      # Moon events for date
GET  /api/astro/events           # Astronomical events
POST /api/astro/correlations     # Calculate correlations
```

**Response format**:
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    cache?: boolean;
    ttl?: number;
  };
}
```

### ⚡ **WebSocket Real-time**

**WebSocket connections** для real-time updates:

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Binance
    participant Redis
    
    Client->>Server: WebSocket Connect
    Server->>Binance: Subscribe to BTC price
    Binance->>Server: Price update
    Server->>Redis: Cache new price
    Server->>Client: Broadcast price
    
    Client->>Server: Request historical data
    Server->>Redis: Check cache
    alt Cache hit
        Redis->>Server: Return cached data
        Server->>Client: Send cached data
    else Cache miss
        Server->>Binance: Fetch from API
        Binance->>Server: Historical data
        Server->>Redis: Cache data
        Server->>Client: Send fresh data
    end
```

---

## 🧩 Component design

### 📊 **Chart Component Pattern**

**Compound component pattern** для complex chart interactions:

```typescript
// Main chart container component
<ChartContainer>
  <ChartHeader>
    <TimeframeSelector />
    <ThemeToggle />
  </ChartHeader>
  
  <ChartBody>
    <CurrencyChart data={bitcoinData} />
    <LunarEvents events={moonEvents} />
    <AstroEvents events={astroEvents} />
  </ChartBody>
  
  <ChartControls>
    <ZoomControls />
    <ExportControls />
  </ChartControls>
</ChartContainer>
```

### 🪝 **Custom Hooks Architecture**

**Composition over inheritance** через custom hooks:

```typescript
// Chart data management
function useChartData(timeframe: string) {
  const { data: bitcoinData } = useBitcoinPrice(timeframe);
  const { data: moonEvents } = useMoonEvents(timeframe);
  const { data: astroEvents } = useAstroEvents(timeframe);
  
  return useMemo(() => ({
    bitcoin: bitcoinData,
    lunar: moonEvents,
    astro: astroEvents,
    combined: combineChartData(bitcoinData, moonEvents, astroEvents)
  }), [bitcoinData, moonEvents, astroEvents]);
}

// Chart interactions
function useChartInteractions() {
  const [selectedTimeframe, setTimeframe] = useState('1D');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState([]);
  
  return {
    timeframe: { value: selectedTimeframe, set: setTimeframe },
    zoom: { value: zoomLevel, set: setZoomLevel },
    events: { selected: selectedEvents, set: setSelectedEvents }
  };
}
```

---

## 📊 State management

### 🏪 **Context Providers Structure**

```mermaid
graph TD
    subgraph "🌍 App Context Hierarchy"
        App[📱 App Root]
        Theme[🎨 ThemeProvider]
        Data[📊 DataProvider]
        Chart[📈 ChartProvider]
        User[👤 UserProvider]
    end
    
    subgraph "🔄 State Flow"
        Actions[⚡ Actions]
        Reducers[🔄 Reducers]
        Selectors[🎯 Selectors]
        Effects[💫 Side Effects]
    end
    
    App --> Theme
    Theme --> Data
    Data --> Chart
    Chart --> User
    
    Actions --> Reducers
    Reducers --> Selectors
    Selectors --> Effects
    Effects --> Actions
```

### 💾 **State Persistence Strategy**

```typescript
// Local storage persistence
interface PersistedState {
  theme: 'light' | 'dark';
  preferences: UserPreferences;
  chartSettings: ChartSettings;
  lastVisited: string;
}

// Session storage (temporary)
interface SessionState {
  currentTimeframe: string;
  selectedEvents: string[];
  chartZoom: number;
  scrollPosition: number;
}

// Memory only (volatile)
interface VolatileState {
  loadingStates: Record<string, boolean>;
  errorStates: Record<string, Error | null>;
  realTimeConnected: boolean;
  lastUpdateTime: number;
}
```

---

## 🔒 Security architecture

### 🛡️ **Security Layers**

```mermaid
graph TD
    subgraph "🌐 Network Security"
        HTTPS[🔒 HTTPS/TLS]
        CORS[🌍 CORS Policy]
        CSP[🛡️ Content Security Policy]
    end
    
    subgraph "🚪 Application Security"
        Helmet[⛑️ Helmet.js Headers]
        RateLimit[⏰ Rate Limiting]
        Validation[✅ Input Validation]
        Sanitization[🧹 Data Sanitization]
    end
    
    subgraph "💾 Data Security"
        Encryption[🔐 Data Encryption]
        Secrets[🗝️ Environment Secrets]
        Access[🎫 Access Control]
    end
    
    HTTPS --> Helmet
    CORS --> RateLimit
    CSP --> Validation
    Validation --> Sanitization
    
    Sanitization --> Encryption
    Encryption --> Secrets
    Secrets --> Access
```

### 🔐 **Security Implementation**

```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
};

// Input validation with express-validator
const validateBitcoinRequest = [
  query('timeframe').isIn(['1h', '4h', '1d', '1w', '1m']),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.coingecko.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
```

---

## ⚡ Performance considerations

### 🚀 **Frontend Performance**

```mermaid
graph LR
    subgraph "📦 Bundle Optimization"
        CodeSplit[🧩 Code Splitting]
        TreeShake[🌳 Tree Shaking]
        Compression[🗜️ Gzip/Brotli]
        CDN[🌐 CDN Assets]
    end
    
    subgraph "🎯 Runtime Performance"
        Memo[🧠 React.memo]
        Callback[🔄 useCallback]
        Virtual[📜 Virtualization]
        LazyLoad[😴 Lazy Loading]
    end
    
    subgraph "💾 Caching Strategy"
        ServiceWorker[⚙️ Service Worker]
        LocalCache[💾 Local Storage]
        MemoryCache[🧠 Memory Cache]
        HTTPCache[📡 HTTP Cache]
    end
    
    CodeSplit --> Memo
    TreeShake --> Callback
    Compression --> Virtual
    CDN --> LazyLoad
    
    Memo --> ServiceWorker
    Callback --> LocalCache
    Virtual --> MemoryCache
    LazyLoad --> HTTPCache
```

### 🔧 **Backend Performance**

```typescript
// Memory-efficient chart data processing
class ChartMemoryManager {
  private instances = new WeakMap();
  private cleanupTimers = new Map();
  
  register(chartId: string, instance: any) {
    this.instances.set(chartId, instance);
    this.scheduleCleanup(chartId);
  }
  
  private scheduleCleanup(chartId: string) {
    const timer = setTimeout(() => {
      this.cleanup(chartId);
    }, CLEANUP_DELAY);
    
    this.cleanupTimers.set(chartId, timer);
  }
  
  cleanup(chartId: string) {
    const instance = this.instances.get(chartId);
    if (instance?.remove) {
      instance.remove();
    }
    this.instances.delete(chartId);
    this.cleanupTimers.delete(chartId);
  }
}

// Efficient Redis caching with compression
async function cacheData(key: string, data: any, ttl: number = 3600) {
  const compressed = await gzip(JSON.stringify(data));
  await redis.setex(key, ttl, compressed);
}

async function getCachedData(key: string) {
  const compressed = await redis.get(key);
  if (!compressed) return null;
  
  const decompressed = await gunzip(compressed);
  return JSON.parse(decompressed.toString());
}
```

---

## 🧪 Testing architecture

### 🎯 **Testing Pyramid**

```mermaid
graph TD
    subgraph "🧪 Testing Layers"
        E2E[🌐 E2E Tests<br/>Playwright]
        Integration[🔗 Integration Tests<br/>API + DB]
        Unit[⚙️ Unit Tests<br/>Jest + Vitest]
        Static[📝 Static Analysis<br/>TypeScript + ESLint]
    end
    
    subgraph "📊 Test Distribution"
        E2E_Perc[🌐 E2E: 10%<br/>Critical user flows]
        Int_Perc[🔗 Integration: 20%<br/>Service interactions]
        Unit_Perc[⚙️ Unit: 60%<br/>Individual functions]
        Static_Perc[📝 Static: 10%<br/>Code quality]
    end
    
    E2E --> E2E_Perc
    Integration --> Int_Perc
    Unit --> Unit_Perc
    Static --> Static_Perc
```

### 🔧 **Test Implementation**

```typescript
// E2E test example
test('Bitcoin chart displays with lunar events', async ({ page }) => {
  await page.goto('/');
  
  // Wait for chart to load
  await page.waitForSelector('[data-testid="bitcoin-chart"]');
  
  // Verify price data is displayed
  const priceElement = page.locator('[data-testid="current-price"]');
  await expect(priceElement).toBeVisible();
  
  // Switch timeframe and verify lunar events
  await page.click('[data-testid="timeframe-1d"]');
  await page.waitForSelector('[data-testid="lunar-event"]');
  
  const lunarEvents = page.locator('[data-testid="lunar-event"]');
  await expect(lunarEvents).toHaveCount.greaterThan(0);
});

// Unit test example  
describe('BitcoinService', () => {
  let service: BitcoinService;
  let mockRedis: jest.Mocked<Redis>;
  
  beforeEach(() => {
    mockRedis = createMockRedis();
    service = new BitcoinService(mockRedis);
  });
  
  it('should cache price data with TTL', async () => {
    const priceData = { price: 50000, timestamp: Date.now() };
    
    await service.cachePrice('BTC', priceData);
    
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'bitcoin:price:BTC',
      3600,
      JSON.stringify(priceData)
    );
  });
});
```

---

## 📚 Дополнительные ресурсы

### 📖 **Связанная документация**
- [🚀 Deployment Guide](DEPLOYMENT.md) - Production deployment инструкции
- [🔧 Development Setup](docs/DEVELOPMENT.md) - Local development guide
- [🧪 Testing Strategy](docs/TESTING.md) - Comprehensive testing approach
- [📊 API Reference](docs/API.md) - Complete API documentation

### 🎯 **Архитектурные решения (ADRs)**
- [ADR-001: Frontend Framework Selection](docs/adr/001-frontend-framework.md)
- [ADR-002: State Management Strategy](docs/adr/002-state-management.md)
- [ADR-003: Caching Architecture](docs/adr/003-caching-strategy.md)
- [ADR-004: Testing Approach](docs/adr/004-testing-strategy.md)

### 🔗 **External References**
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- [Redis Documentation](https://redis.io/docs/)

---

**🏗️ Эта архитектура обеспечивает scalable, maintainable и performant решение для MoonBit проекта!** 