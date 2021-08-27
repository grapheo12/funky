![Logo](/doc/logo.png)

# Funky

A Discord bot for music.

## Setup

Currently the app is not available publicly.
So in order to add it to your server, clone or fork-clone this repo.
Then follow [this link](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
to create a bot.
Use the Scopes and Bot permissions as seen in these screenshots:

![Scopes](/doc/permission2.png)

![Bot Permission](/doc/permission1.png)


Add this bot to your server (technically called a Guild).

Get the `token` and `clientId` of the app and get the `guildId` of your server.
If you enable Advanced mode in your Discord settings, right clicking on the server and the bot icon will give you the option to copy the id.

Switch to a new branch in this repo. Do not push this branch to Github.
Create a file called `config.json` with the following contents:

```json
{
    "token": "<bot's token from app developer page>",
    "clientId": "<copy Id from the bot icon on your server page>",
    "guildId": "<copy Id from the server icon>"
}
```

Deploy this new branch on Heroku.

Add the following buildpacks (in this order) and then redeploy for correct operation:

```
https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
jontewks/puppeteer
```

Logo taken from [clipart-library](clipart-library.com)