FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости с использованием --legacy-peer-deps для решения конфликтов
RUN npm install --legacy-peer-deps

# Устанавливаем необходимые пакеты для работы в режиме ES Modules
RUN npm install --legacy-peer-deps reflect-metadata

# Копируем структуру папок и важные директории сначала
COPY src/ ./src/

# Копируем файлы конфигурации
COPY tsconfig.json ./

# Проверяем наличие файлов маршрутов
RUN ls -la src/routes/

# Копируем остальные файлы
COPY . .

# Сборка проекта
RUN npm run build

# Устанавливаем порт для сервера
EXPOSE 3001

# Запускаем сервер в режиме разработки
CMD ["npm", "run", "dev"] 