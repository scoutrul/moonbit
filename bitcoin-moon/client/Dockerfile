FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем клиентскую часть
RUN npm run build

# Устанавливаем простой сервер для раздачи статики
RUN npm install -g serve

# Порт для клиентской части
EXPOSE 3000

# Запускаем сервер для раздачи статики
CMD ["serve", "-s", "dist", "-l", "3000"] 