import { Client, Intents, TextChannel } from 'discord.js';
import * as sqlite3 from 'sqlite3';

const _config = require('./config.json');
const _halloween = require('./halloween.json');

var db = new sqlite3.Database(_config.sqlite.file);

db.serialize(function() {
  db.run("CREATE TABLE users (id TEXT NOT NULL PRIMARY KEY, name TEXT, points INTEGER)");
  db.run("CREATE TABLE user_items (user_id TEXT, item_key TEXT, count INTEGER)");
  db.run("CREATE UNIQUE INDEX `user_item_uk` ON `user_items` ( `user_id`, `item_key` )");
});

db.close();
