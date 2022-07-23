const { Client, Intents } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const { getLink, playSound } = require('./scrape');
const { deployCommands } = require('./deploy-commands');
const { remove, transports, add, info } = require('winston');
const { token } = require('./config.json');


remove(transports.Console);
add(new transports.Console, {
    colorize: true
});

var bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING
    ]
});

bot.once('ready', (_) => {
    info("Connected");
});

bot.on('guildCreate', (guild) => {
    deployCommands(guild.id);
});

let guildMap = new Map();


async function playNext(map) {
    let link = null;
    while (link === null) {
        if (map.idx === map.queue.length) {
            await (new Promise((resolve) => {
                setTimeout(resolve, 100);
            }));
        } else {
            link = map.queue[map.idx];
            map.idx++;
        }
    }
    let rsc = await playSound(link);
    map.player.play(rsc);
}

async function initBot(interaction) {
    if (!interaction.inGuild()) return;
    const gld = bot.guilds.cache.get(interaction.guildId);
    const guildId = interaction.guildId;
    const member = gld.members.cache.get(interaction.user.id);
    var channel = member.voice.channel;

    let queue = [];
    let queries = [];
    let firstPlay = true;

    if (channel) {
        let connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        });
        let player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });

        player.on(AudioPlayerStatus.Idle, async () => {
            await playNext();
        });

        connection.subscribe(player);

        guildMap.set(guildId, {
            queue: queue,
            queries: queries,
            firstPlay: firstPlay,
            wakeup: true,
            idx: -1,
            connection: connection,
            player: player,
        })
    } else {
        await interaction.followUp("Join a voice channel please.");
    }
}

bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    let map = guildMap.get(interaction.guildId);

    if (commandName === "wakeup") {
        await interaction.reply("Yo!");
        await initBot(interaction);
    }
    else if (commandName === "play") {
        if (!(map?.wakeup)) {
            await initBot(interaction);
        }
        map = guildMap.get(interaction.guildId);
        const title = interaction.options.getString("search_title");
        await interaction.reply(`Searching for: ${title}`);

        let link = await getLink(title);
        if (map.firstPlay) {
            map.firstPlay = false;
            const rsc = await playSound(link);
            map.player.play(rsc);
            map.connection.subscribe(map.player);
            map.queue.push(link);
            map.idx = 1;
        } else {
           map.queue.push(link);
        }
        map.queries.push(title);
        interaction.followUp(`Enqueuing: ${link}`);

    } else if (commandName === "sleep") {
        if (map?.connection) {
            map.connection.destroy();
            map.connection = null;
        }
        await interaction.reply("Bye Bye!");
    } else if (commandName === "pause") {
        if (map?.player) {
            map.player.pause();
        }
        await interaction.reply(":pause_button:");
    } else if (commandName === "resume") {
        if (map?.player) {
            map.player.unpause();
        }
        await interaction.reply(":play_pause:");
    } else if (commandName === "next") {
        if (map.idx < map.queue.length) {
            await playNext(map);
            interaction.reply("Going forward");
        } else {
            interaction.reply("End of queue");
        }
    } else if (commandName === "prev") {
        if (map.idx > 1) {
            map.idx -= 2;
            await playNext(map);
            interaction.reply("Going backward");
        } else {
            interaction.reply("Beginning of playlist");
        }
    } else if (commandName === "queue") {
        let s = "```\n";
        for (let i = 0; i < map.queries.length; i++) {
            s += map.queries[i] + " - " + map.queue[i];
            if (map.idx == i + 1) {
                s += " <-- Current track";
            }
            s += "\n";
        }
        s += "```\n";
        interaction.reply(s);
    }

});


bot.login(token);

