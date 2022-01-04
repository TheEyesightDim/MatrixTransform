# MatrixTransform Twitchbot

NodeJS chat bot for Twitch.

## Usage

```.
npm run build
```

or

```.
node main.mjs
```

A `settings.json` file must be configured in the project root.

An SQLite3 named `user.db` file can be added to `/res/`; If not, the bot will create one on startup. Database management should be accomplished with an external program such as [DB4S](https://github.com/sqlitebrowser/sqlitebrowser). The bot will not handle the creation or deletion of tables.
