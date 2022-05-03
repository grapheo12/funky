var { Client, Intents, Options } = require('discord.js');
var { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
var { getLink, playSound } = require('./scrape');

var logger = require('winston');
var auth = require('./config.json');

var queue = [];
var queries = [];
var firstPlay = true;
let wakeup = false;
var idx = -1;

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

async function playNext(){
    let link = null;
    while (link === null){
        if (idx === queue.length){
            await(new Promise((resolve) => {
                setTimeout(resolve, 100);
            }));
        }else{
            link = queue[idx];
            idx++;
        }
    }
    let rsc = await playSound(link);
    player.play(rsc);
}

async function initBot(interaction){
    const gld = bot.guilds.cache.get(auth.guildId);
    const member = gld.members.cache.get(interaction.user.id);
    var channel = member.voice.channel;

    queue = [];
    queries = [];
    firstPlay = true;

    if (channel) {
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        });
        player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });
        
        player.on(AudioPlayerStatus.Idle, async () => {
            await playNext();
        });
        
        connection.subscribe(player);
    } else {
        await interaction.followUp("Join a voice channel please.");
    }
}

bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    logger.info(interaction);

    if (commandName === "wakeup") {
        await interaction.reply("Yo!");
        await initBot(interaction);
        wakeup = true;
    } 
    else if (commandName === "play") {
        logger.info(wakeup);
        logger.info(firstPlay);
        if(!wakeup){
            await initBot(interaction);
            wakeup = true;
        }
        const title = interaction.options.getString("search_title");
        await interaction.reply(`Searching for: ${title}`);
        
        let link = await getLink(title);
        if (firstPlay){
            firstPlay = false;
            const rsc = await playSound(link);
            player.play(rsc);
            connection.subscribe(player);
            queue.push(link);
            idx = 1;
        }else{
            queue.push(link);
        }
        queries.push(title);
        interaction.followUp(`Enqueuing: ${link}`);

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
    } else if (commandName === "next") {
        if (idx < queue.length){
        await playNext();
        interaction.reply("Going forward");
        }else{
            interaction.reply("End of queue");
        }
    } else if (commandName === "prev") {
        if (idx > 1){
            idx -= 2;
            await playNext();
            interaction.reply("Going backward");
        }else{
            interaction.reply("Beginning of playlist");
        }
    } else if (commandName === "queue") {
        let s = "```\n";
        for (let i = 0; i < queries.length; i++){
            s += queries[i] + " - " + queue[i];
            if (idx == i + 1){
                s += " <-- Current track";
            }
            s += "\n";
        }
        s += "```\n";
        interaction.reply(s);
    }

});


bot.login(auth.token); 
 
