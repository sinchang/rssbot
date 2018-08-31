'use strict';


class RssService {
  constructor(app) {
    this.app = app;
  }

  async create(title, url, latest_guid) {
    const { db } = this.app;
    const res = await db.run('insert into rss(title, url, latest_guid, created_date) values (?,?,?,?)', [ title, url, latest_guid, new Date() ]);
    return res;
  }

  async destroy(id) {
    const { db } = this.app;
    const res = await db.run('delete from rss where id = ?', id);
    return res;
  }

  async findById(id) {
    const { db } = this.app;
    const res = await db.all('select * from rss where id = ?', id);
    if (!res || res.length === 0) return null;
    return res[0];
  }

  async findByIds(ids) {
    const { db } = this.app;
    const res = await db.all(`select * from rss where id in (${ids})`);
    if (!res || res.length === 0) return null;
    return res;
  }

  async findByUrl(url) {
    const { db } = this.app;
    const res = await db.all('select * from rss where url = ?', url);
    if (!res || res.length === 0) return null;
    return res[0];
  }

  async index() {
    const { db } = this.app;
    const res = await db.all('select * from rss');
    return res;
  }

  async update(id, latest_guid) {
    const { db } = this.app;
    const res = await db.run('update rss set latest_guid = ?, updated_date = ? where id = ?', [ latest_guid, new Date(), id ]);
    return res;
  }
}

module.exports = RssService;
