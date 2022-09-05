import { Client, Intents } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus } from '@discordjs/voice';
import { getLink, playSound } from './scrape';
import { deployCommands } from './deploy-commands';
import { createLogger, format, transports } from 'winston';
import { token } from './config.json';

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

const logger = createLogger({
    format : format.json(),
    transports: [new transports.Console()]
});

bot.once('ready', (_) => {
    logger.info("Connected");
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
    if (!gld) return;
    const guildId = interaction.guildId;
    const member = gld.members.cache.get(interaction.user.id);
    if (!member) return;
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
        let map = {
            queue: [],
            queries: [],
            firstPlay: true,
            wakeup: false,
            idx: -1,
            player: player,
            connection: connection
        };

        player.on(AudioPlayerStatus.Idle, async () => {
            await playNext(map);
        });

        connection.subscribe(player);
        map.wakeup = true;
        map.player = player;
        map.connection = connection;

        guildMap.set(guildId, map);
    } else {
        await interaction.reply("Join a voice channel please.");
    }
}

bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    let map = guildMap.get(interaction.guildId);
    if (!(map?.wakeup)) {
        await initBot(interaction);
    }

    if (commandName === "wakeup") {
        await interaction.reply("Yo!");
    }
    else if (commandName === "play") {
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

