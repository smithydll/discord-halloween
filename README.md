# Halloween discord bot

The Halloween discord bot is a game of trick or treat for your private discord
server.

## Config

There are two config files, `config.json` for the bot config, and
`halloween.json` for the game config.

### Bot config

The `config.json` file has the following configuration options:

```
{
    "discord": {
        "token": "your_token",
        "channel": "your channel id"
    },
    "sqlite": {
        "file": "db.sqlite"
    }
}
```

### Halloween config

The `halloween.json` contains the game config for tricksters, treaters, and
item rewards.

```
{
    "trickers": [
        {
            "name": "TRICKSTER_NAME"
        }
    ],
    "treaters": [
        {
            "name": "TREATER_NAME"
        }
    ],
    "items": [
        {
            "name": "ITEM_NAME"
        }
    ]
}
```

## Installation

To initialise the game run the following command to initialise the sqlite
database.

```
npm run init
```

## Game play

To start the game run the following command

```
npm start
```

The bot will start spawning trick or treaters in your discord server when it
has been active recently. Be on the lookout and respond with either `trick` or
`treat` when prompted.

A point and an item will be awarded to the first user to respond correctly with
either `trick` or `treat`. A point will be deducted for an incorrect response.

Only one trickster or treater can spawn at a time.
