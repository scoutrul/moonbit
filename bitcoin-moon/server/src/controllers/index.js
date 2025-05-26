/**
 * Индексный файл для экспорта всех контроллеров
 */
const bitcoinController = require('./bitcoinController');
const moonController = require('./moonController');
const astroController = require('./astroController');
const eventsController = require('./eventsController');

module.exports = {
  bitcoinController,
  moonController,
  astroController,
  eventsController,
};
