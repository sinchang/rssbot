'use strict';

class UserService {
  constructor(app) {
    this.app = app;
  }
  async create(id, name) {
    const { db } = this.app;
    const res = await db.run('insert into user(id, name, created_date) values (?,?,?)', [ id, name, new Date() ]);
    return res;
  }

  async destroy(id) {
    const { db } = this.app;
    const res = await db.run('delete from user where id = ?', id);
    return res;
  }

  async show(id) {
    const { db } = this.app;
    const res = await db.all('select * from user where id = ?', id);
    if (!res || res.length === 0) return null;
    return res[0];
  }

  async index() {
    const { db } = this.app;
    const res = await db.all('select * from user');
    return res;
  }

  async update(id, name) {
    const { db } = this.app;
    const res = await db.run('update user set name = ?, updated_date = ? where id = ?', [ name, new Date(), id ]);
    return res;
  }
}

module.exports = UserService;
