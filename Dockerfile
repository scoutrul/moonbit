FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY bitcoin-moon/client/package*.json ./bitcoin-moon/client/
COPY bitcoin-moon/server/package*.json ./bitcoin-moon/server/

# Устанавливаем зависимости
RUN npm run install:all

# Копируем исходный код
COPY . .

# Собираем клиентскую и серверную части
RUN npm run build

# Порт, на котором будет работать приложение
EXPOSE 3001

# Запускаем сервер в production режиме
CMD ["npm", "run", "start:prod"] 