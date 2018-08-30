'use strict';

const Service = require('egg').Service;

class RssService extends Service {
  async create(title, url, latest_guid) {
    const { db } = this.ctx.app;
    const res = await db.run('insert into rss(title, url, latest_guid, created_date) values (?,?,?,?)', [ title, url, latest_guid, new Date() ]);
    return res;
  }

  async destroy(id) {
    const { db } = this.ctx.app;
    const res = await db.run('delete from rss where id = ?', id);
    return res;
  }

  async show(id) {
    const { db } = this.ctx.app;
    const res = await db.all('select * from rss where id = ?', id);
    if (!res || res.length === 0) return null;
    return res[0];
  }

  async index() {
    const { db } = this.ctx.app;
    const res = await db.all('select * from rss');
    return res;
  }

  async update(id, latest_guid) {
    const { db } = this.ctx.app;
    const res = await db.run('update rss set latest_guid = ?, updated_date = ? where id = ?', [ latest_guid, new Date(), id ]);
    return res;
  }
}

module.exports = RssService;
