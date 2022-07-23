![Logo](/doc/logo.png)

# Funky

A Discord bot for music.

[Add to your server](https://discord.com/api/oauth2/authorize?client_id=888409922067378226&permissions=105800273216&scope=applications.commands%20bot)

## Commands

- `/wakeup`: Wakes up the bot which adds itself to your current voice channel
- `/sleep`: Opposite of wakeup
- `/play <song_title>`: Searches the song on youtube, then streams it to the voice channel it is added to
- `/pause`: Pauses the current song
- `/resume`: Resume the paused song
- `/stop`: Stops the current song

## Setup

Currently the app is not available publicly.
So in order to add it to your server, clone or fork-clone this repo.
Then follow [this link](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
to create a bot.
Use the Scopes and Bot permissions as seen in these screenshots:

![Scopes](/doc/permission2.png)

![Bot Permission](/doc/permission1.png)


Add this bot to your server (technically called a Guild).

Get the `token` and `clientId` of the app.
If you enable Advanced mode in your Discord settings, right clicking on the server and the bot icon will give you the option to copy the id.

Switch to a new branch in this repo. Do not push this branch to Github.
Create a file called `config.json` with the following contents:

```json
{
    "token": "<bot's token from app developer page>",
    "clientId": "<copy Id from the bot icon on your server page>",
}
```

`ffmpeg` is required for this to run.

Logo taken from [clipart-library](https://clipart-library.com)