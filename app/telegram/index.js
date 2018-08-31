'use strict';

const Parser = require('rss-parser');
const parser = new Parser();
const UserService = require('../service/user');
const RssService = require('../service/rss');
const SubscriptionService = require('../service/subscription');

class Telegram {
  constructor(app) {
    this.bot = app.bot;
    this.userService = new UserService(app);
    this.rssService = new RssService(app);
    this.subscriptionService = new SubscriptionService(app);
    this.init();
  }

  init() {
    this.bot.onText(/\/sub/, async msg => {
      const res = await this.sub(msg);
      this.bot.sendMessage(msg.chat.id, res);
    });

    this.bot.onText(/\/unsub/, async msg => {
      const res = await this.unsub(msg);
      this.bot.sendMessage(msg.chat.id, res);
    });

    this.bot.onText(/\/list/, async msg => {
      const res = await this.list(msg);
      this.bot.sendMessage(msg.chat.id, res, { parse_mode: 'Markdown' });
    });
  }

  async sub(msg) {
    const rssUrl = msg.text.split(' ')[1];
    const feed = await parser.parseURL(rssUrl);
    const userId = msg.chat.id;
    const isExistUser = await this.userService.show(msg.chat.id);
    const isExistRss = await this.rssService.findByUrl(rssUrl);
    let rssId;
    if (!isExistUser) {
      await this.userService.create(userId, msg.chat.username);
    }

    if (!isExistRss) {
      await this.rssService.create(feed.title, rssUrl, feed.items[0].guid);
      const res = await this.rssService.findByUrl(rssUrl);
      rssId = res.id;
    } else {
      rssId = isExistRss.id;
    }

    const isSubed = await this.subscriptionService.show(userId, rssId);

    if (!isSubed) {
      await this.subscriptionService.create(userId, rssId);
      return 'Succeed';
    }
    return 'Subscribed';
  }

  async unsub(msg) {
    const rssUrl = msg.text.split(' ')[1];
    const userId = msg.chat.id;
    const rssData = await this.rssService.findByUrl(rssUrl);

    if (!rssData) {
      return 'Not Found';
    }

    const rssId = rssData.id;
    const rssList = await this.subscriptionService.findByRssId(rssId);
    let isExist = false;

    rssList.forEach(item => {
      if (item.user_id === userId) {
        isExist = true;
      }
    });

    if (!isExist) {
      return 'Not Found';
    }

    const res = await this.subscriptionService.destroy(userId, rssId);

    if (!res) {
      return 'Failed';
    }

    if (rssList.length === 1) {
      await this.rssService.destroy(rssId);
    }

    return 'Unsubscribed';
  }

  async list(msg) {
    const userId = msg.chat.id;
    const subRss = await this.subscriptionService.findByUserId(userId);

    if (!subRss || subRss.length === 0) {
      return 'Empty';
    }

    const ids = subRss.map(item => item.rss_id);

    const rssData = await this.rssService.findByIds(ids.join(','));

    if (!rssData || rssData.length === 0) {
      return 'Empty';
    }

    let res = '';
    rssData.forEach(item => {
      res += `[${item.title}](${item.url})\n`;
    });
    return res;
  }

  async check() {
    const rssData = await this.rssService.index();

    if (!rssData || rssData.length === 0) return;

    rssData.forEach(async (rss, index) => {
      const feed = await parser.parseURL(rss.url);
      const latestGuid = feed.items[0].guid;
      if (rss.latest_guid === latestGuid) {
        if (index === 0) return;
        await this.rssService.update(rss.id, latestGuid);
        const subscription = await this.subscriptionService.findByRssId(rss.id);
        subscription.forEach(item => {
          for (let i = 0; i < index; i++) {
            this.bot.sendMessage(item.user_id, feed.items[i].url);
          }
        });
      }
    });
  }
}

module.exports = Telegram;
