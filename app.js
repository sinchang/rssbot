'use strict';

const TelegramBot = require('node-telegram-bot-api');
const Telegram = require('./app/telegram');

module.exports = app => {
  const config = app.config;

  const token = config.TELEGRAM_BOT_TOKEN;

  app.bot = new TelegramBot(token, { polling: true });

  app.telegram = new Telegram(app);
};
