// Используем корневую конфигурацию ESLint
module.exports = {
  extends: '../../.eslintrc.js',
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  rules: {
    // Специфичные для сервера правила
  }
}; 