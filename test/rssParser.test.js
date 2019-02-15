'use strict';

const Parser = require('rss-parser');
const assert = require('assert');
const parser = new Parser();

(async () => {
  const feed = await parser.parseURL('https://usesthis.com/feed.atom');
  assert(feed.items.length > 0);
})();
