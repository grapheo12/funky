var { Client, Intents, Options } = require('discord.js');
var { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
var getResource = require('./scrape');

var logger = require('winston');
var auth = require('./config.json');

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

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

bot.once('ready', (e) => {
    logger.info("Connected");
});

var connection = null;
var player = null;

bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    logger.info(interaction);

    if (commandName === "wakeup") {
        await interaction.reply("Yo!");
        const gld = bot.guilds.cache.get(auth.guildId);
        const member = gld.members.cache.get(interaction.user.id);
        var channel = member.voice.channel;

        if (channel) {
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            });
        } else {
            await interaction.followUp("Join a voice channel please.");
        }
    } else if (commandName === "play") {
        const title = interaction.options.getString("search_title");
        await interaction.reply(`Searching for: ${title}`);
        if (connection) {
            player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause
                }
            });
            const rsc = await getResource(title, interaction)
            player.play(rsc);

            connection.subscribe(player);

        }
    } else if (commandName === "stop") {
        if (player) {
            player.stop();
        }
        player = null;
        interaction.reply(":zipper_mouth:");

    } else if (commandName === "sleep") {
        if (connection) {
            connection.destroy();
        }
        connection = null;
        await interaction.reply("Bye Bye!");
    } else if (commandName === "pause") {
        if (player){
            player.pause();
        }
        await interaction.reply(":pause_button:");
    } else if (commandName === "resume") {
        if (player){
            player.unpause();
        }
        await interaction.reply(":play_pause:");
    }

});


bot.login(auth.token);