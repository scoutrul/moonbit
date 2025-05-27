FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем структуру папок и важные директории сначала
COPY src/ ./src/

# Проверяем наличие файлов маршрутов
RUN ls -la src/routes/

# Копируем остальные файлы
COPY . .

# Устанавливаем порт для сервера
EXPOSE 3001

# Запускаем сервер
CMD ["npm", "run", "start"] 