'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1535606036877_6331';

  // add your config here
  config.middleware = [];

  config.sqlite3 = {
    database: 'rssbot.db',
  };

  return config;
};
