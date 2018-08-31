'use strict';

class SubscriptionService {
  constructor(app) {
    this.app = app;
  }

  async create(userId, rssId) {
    const { db } = this.app;
    const res = await db.run('insert into subscription(user_id, rss_id, created_date) values (?,?,?)', [ userId, rssId, new Date() ]);
    return res;
  }

  async destroy(userId, rssId) {
    const { db } = this.app;
    const res = await db.run('delete from subscription where user_id = ? and rss_id = ?', [ userId, rssId ]);
    return res;
  }

  async show(userId, rssId) {
    const { db } = this.app;
    const res = await db.all('select * from subscription where user_id = ? and rss_id = ?', [ userId, rssId ]);
    if (!res || res.length === 0) return null;
    return res;
  }

  async findByUserId(userId) {
    const { db } = this.app;
    const res = await db.all('select * from subscription where user_id = ?', userId);
    if (!res || res.length === 0) return null;
    return res;
  }

  async findByRssId(rssId) {
    const { db } = this.app;
    const res = await db.all('select * from subscription where rss_id = ?', rssId);
    if (!res || res.length === 0) return null;
    return res;
  }
}

module.exports = SubscriptionService;
