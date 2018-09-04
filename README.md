# rssbot

a rss bot for telegram

## Command

- `/sub <rss url>` Subscribe

- `/unsub <rss url>` Unsubscribe

- `/list` List all rss

- `/export` Export all rss as opml text

## Tip

send opml file to bot we will auto import and subscribed.

## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.

[egg]: https://eggjs.org
