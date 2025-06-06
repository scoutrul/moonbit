# Husky Pre-commit Hook

## 🧹 Автоматическая очистка временных файлов

Данный pre-commit хук автоматически очищает временные файлы перед каждым коммитом.

### Что очищается:

#### 📁 Директории тестирования:
- `test-results/` - результаты Playwright тестов
- `tests/e2e/artifacts/` - артефакты E2E тестов (screenshots, videos, traces)
- `playwright-report/` - отчеты Playwright

#### 📄 Log файлы:
- `server-error.log` - логи ошибок сервера
- Все `*.log` файлы в корне проекта (исключая node_modules, bitcoin-moon, .git)

#### 🐳 Docker временные файлы:
- `docker-compose.override.yml` - локальные Docker override файлы

#### 🎭 Playwright кэш:
- `.playwright/` временные файлы (PNG, WebM, ZIP)

### Логи выполнения:

```bash
🧹 Очистка временных файлов...
  🗑️  Удаление test-results/
  🗑️  Очистка tests/e2e/artifacts/
  🗑️  Удаление server-error.log
✅ Временные файлы очищены
```

### Использование:

Хук запускается автоматически при каждом `git commit`. 

### Отключение (если нужно):

```bash
# Временно отключить хуки
git commit --no-verify -m "commit без pre-commit хука"

# Или закомментировать команды в .husky/pre-commit
```

### Совместимость:

- ✅ Обновлен для новой версии Husky (без deprecated формата)
- ✅ Безопасные команды с проверкой существования файлов
- ✅ Кроссплатформенная совместимость (Unix/macOS)

---

**Результат**: Всегда чистый репозиторий без временных файлов тестирования и разработки. 