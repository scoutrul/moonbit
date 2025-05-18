FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Устанавливаем порт для сервера
EXPOSE 3001

# Запускаем сервер
CMD ["npm", "run", "start"] 