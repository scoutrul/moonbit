FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Открываем порт для dev-сервера
EXPOSE 3000

# Запускаем Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 