import { Client, Intents, TextChannel, Message } from 'discord.js';
import * as sqlite3 from 'sqlite3';

const _config = require('./config.json');
const _halloween = require('./halloween.json');

var db = new sqlite3.Database(_config.sqlite.file);

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] });

type TrickOrTreatMode = '' | 'trick' | 'treat';

interface TrickOrTreatState {
  waiting : boolean;
  waitingId: any,
  message: Message | null,
  trickOrTreat: TrickOrTreatMode,
  trickOrTreater: { name : string } | null,
}

const state : TrickOrTreatState = {
  waiting: false,
  waitingId: null,
  message: null,
  trickOrTreat: '',
  trickOrTreater: null
};

client.once('ready', () => {
  console.log("Ready...");
});

client.on('messageCreate', (message) => {
  if (message.author.bot) {
    return;
  }

  if (state.waitingId && (message.content.toLocaleLowerCase() == 'trick' || message.content.toLocaleLowerCase() == 'treat')) {
    clearTimeout(state.waitingId);
    state.waitingId = null;
    state.waiting = false;
    const trickOrTreaterMessage = state.message;
    
    if (message.content.toLocaleLowerCase() == state.trickOrTreat) {
      // add points to user
      db.run("INSERT INTO users (id, name, points) VALUES (?, ?, 1) ON CONFLICT(id) DO UPDATE SET points = points + 1;", [ message.author.id, message.author.username ]);

      // add a random item to the user's inventory
      const item = _halloween['items'][Math.floor(Math.random() * _halloween['items'].length)];

      if (item) {
        const item_key = item.name;

        db.run("INSERT INTO user_items (user_id, item_key, count) VALUES (?, ?, 1) ON CONFLICT(user_id, item_key) DO UPDATE SET count = count + 1", [ message.author.id, item_key ]);

        trickOrTreaterMessage?.edit(`${state.trickOrTreater?.name} rewarded <@${message.author.id}> for their kindness with a ${item_key}`);
      }
    } else {
      // remove points from user
      db.run("INSERT INTO users (id, name, points) VALUES (?, ?, 0) ON CONFLICT(id) DO UPDATE SET points = points - 1;", [ message.author.id, message.author.username ]);

      trickOrTreaterMessage?.edit(`<@${message.author.id}> scared off ${state.trickOrTreater?.name} and did not receive any items`);
    }

    // delete the message after 5 minutes
    setTimeout(() => {
      if (trickOrTreaterMessage) {
        trickOrTreaterMessage.delete();
      }
    }, 300000);
  }

  if (message.content.toLocaleLowerCase() == 'h!inventory') {
    // send the user's inventory
    sendInventory(message.author.id);
  }

  if (message.content.toLocaleLowerCase() == 'h!leaderboard') {
    // send the leaderboard
    sendLeaderboard();
  }

  // trigger on a message so the bot only triggers while people are active
  if (!state.waiting) {
    // don't make it seem too predictable
    if (Math.random() < 0.5) {
      const trickDelay = Math.random() * 300000;
      const trickDate = new Date(Date.now() + trickDelay);

      console.log(`initiating trick or treat at ${trickDate.toISOString()}`);

      state.waiting = true;
      setTimeout(sendTrickOrTreat, trickDelay);
    }
  }
});

const sendInventory = async (userId : string) => {
  db.all("SELECT * FROM user_items WHERE user_id = ?", [ userId ], async (error, result) => {
    const itemsTable = result.map((row, index) => {
      return `${row.item_key.padEnd(24)} | ${row.count.toString().padStart(5)}`;
    }).join('\n');

    const channel = client.channels.cache.get(_config.discord.channel) as TextChannel;

    const itemsHeader = `<@${userId}>'s items:\n\`\`\`\nItem                     | Count\n====================================\n`
    const itemsFooter = '\n```';

    const message = await channel.send(itemsHeader + itemsTable + itemsFooter);

    setTimeout(() => {
      // delete the bot's message after the timeout
      if (message) {
        message.delete();
      }
    }, 120000);
  });
}

const sendLeaderboard = async () => {
  db.all("SELECT * FROM users ORDER BY points DESC", async (error, result) => {
    const pointsTable = result.map((row, index) => {
      return `${(index + 1).toString().padStart(4)} | ${row.points.toString().padStart(6)} | ${row.name}`;
    }).join('\n');

    const channel = client.channels.cache.get(_config.discord.channel) as TextChannel;

    const pointsHeader = '```\nRank | Points | User\n====================================\n'
    const pointsFooter = '\n```';

    await channel.send(pointsHeader + pointsTable + pointsFooter);
  });
}

const sendTrickOrTreat = async () => {
  state.trickOrTreat = Math.random() < 0.5 ? 'trick' : 'treat';

  state.trickOrTreater = getTrickOrTreater(state.trickOrTreat);

  const channel = client.channels.cache.get(_config.discord.channel) as TextChannel;

  const message = await channel.send(`${state.trickOrTreater?.name} has stopped by for trick or treat, greet them with a ${state.trickOrTreat}`);

  state.message = message;
  state.waitingId = setTimeout(() => {
    state.waiting = false;

    // delete the bot's message after the timeout
    if (message) {
      message.delete();
      state.message = null;
    }
  }, 300000);
}

const getTrickOrTreater = (value : TrickOrTreatMode) => {
  switch (value) {
    case 'trick':
      return _halloween['trickers'][Math.floor(Math.random() * _halloween['trickers'].length)];
    case 'treat':
      return _halloween['treaters'][Math.floor(Math.random() * _halloween['treaters'].length)];
  }
}

client.login(_config.discord.token);
