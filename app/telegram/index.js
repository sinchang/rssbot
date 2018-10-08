'use strict';

const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser();
const UserService = require('../service/user');
const RssService = require('../service/rss');
const SubscriptionService = require('../service/subscription');
const parseOpml = require('node-opml-parser');

class Telegram {
  constructor(app) {
    this.app = app;
    this.bot = app.bot;
    this.userService = new UserService(app);
    this.rssService = new RssService(app);
    this.subscriptionService = new SubscriptionService(app);
    this.init();
  }

  init() {
    this.bot.on('message', async msg => {
      if (msg.document && msg.document.mime_type === 'text/x-opml+xml') {
        const readStream = await this.bot.getFileStream(msg.document.file_id);
        const chunks = [];

        readStream.on('data', chunk => {
          chunks.push(chunk);
        });

        readStream.on('end', () => {
          const data = Buffer.concat(chunks).toString();
          parseOpml(data, (err, items) => {
            if (err) {
              this.bot.sendMessage(msg.chat.id, 'Failed');
              return;
            }

            if (items.length === 0) {
              this.bot.sendMessage(msg.chat.id, 'Empty');
              return;
            }

            items.forEach(async item => {
              msg.text = item.feedUrl;
              await this.sub(msg);
            });

            this.bot.sendMessage(msg.chat.id, 'Imported');
          });
        });
      }
    });

    this.bot.onText(/\/sub/, async msg => {
      const res = await this.sub(msg);
      this.bot.sendMessage(msg.chat.id, res);
    });

    this.bot.onText(/\/unsub/, async msg => {
      const res = await this.unsub(msg);
      this.bot.sendMessage(msg.chat.id, res);
    });

    this.bot.onText(/\/export/, async msg => {
      const userId = msg.chat.id;
      const res = await this.export(msg);
      const filepath = path.resolve(`opml/${userId}.opml`);

      fs.writeFileSync(filepath, res);

      const fileOptions = {
        // Explicitly specify the file name.
        filename: `${userId}.opml`,
        // Explicitly specify the MIME type.
        contentType: 'text/x-opml+xml',
      };

      this.bot.sendDocument(userId, filepath, {}, fileOptions);
    });

    this.bot.onText(/\/list/, async msg => {
      const res = await this.list(msg);
      let str = '';
      if (Array.isArray(res)) {
        res.forEach(item => {
          str += `[${item.title}](${item.url})\n`;
        });
      } else {
        str = res;
      }
      this.bot.sendMessage(msg.chat.id, str, { parse_mode: 'Markdown' });
    });
  }

  async sub(msg) {
    const rssUrlArray = msg.text.split(' ');
    const rssUrl = rssUrlArray.length > 1 ? rssUrlArray[1] : rssUrlArray[0];
    const feed = await parser.parseURL(rssUrl);
    const userId = msg.chat.id;
    const isExistUser = await this.userService.show(msg.chat.id);
    const isExistRss = await this.rssService.findByUrl(rssUrl);
    let rssId;
    if (!isExistUser) {
      await this.userService.create(userId, msg.chat.username);
    }

    if (!isExistRss) {
      await this.rssService.create(feed.title, rssUrl, feed.items[0].guid || feed.items[0].id);
      const res = await this.rssService.findByUrl(rssUrl);
      rssId = res.id;
    } else {
      rssId = isExistRss.id;
    }

    const isSubed = await this.subscriptionService.show(userId, rssId);

    if (!isSubed) {
      await this.subscriptionService.create(userId, rssId);
      return 'Subscribed';
    }
    return 'Already Subscribed';
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

    return rssData;
  }

  async check() {
    const rssData = await this.rssService.index();

    if (!rssData || rssData.length === 0) return;

    rssData.forEach(async rss => {
      const { items } = await parser.parseURL(rss.url);
      const latestGuid = rss.latest_guid;

      for (let index = 0; index < items.length; index++) {
        const element = items[index];
        if (element.guid === latestGuid) {
          if (index === 0) return;
          await this.rssService.update(rss.id, items[0].guid);
          const subscription = await this.subscriptionService.findByRssId(rss.id);
          // eslint-disable-next-line no-loop-func
          subscription.forEach(userRow => {
            [ ...Array(index).keys() ].forEach(i => {
              this.bot.sendMessage(userRow.user_id, items[i].link);
            });
          });
        }
      }
    });
  }

  async export(msg) {
    const list = await this.list(msg);
    let opmlData = `
    <?xml version="1.0" encoding="UTF-8"?>
    <opml version="1.0">
        <head>
            <title>subscriptions</title>
        </head>
        <body>
    `;

    list.forEach(item => {
      opmlData += `<outline type="rss" text="${item.title}" title="${item.title}" xmlUrl="${item.url}" htmlUrl="${item.url}"/>`;
    });

    opmlData += `
      </body>
    </opml>`;

    return opmlData;
  }
}

module.exports = Telegram;
