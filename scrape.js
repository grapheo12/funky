const puppeteer = require('puppeteer');
const ytdl = require('ytdl-core');
const streams = require('stream');
const fs = require('fs');
const { createAudioResource, StreamType } = require('@discordjs/voice');


async function getLink(query){
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);

    let arr = await page.$$('a');

    for (let i = 0; i < arr.length; i++){
        let linker = await arr[i].getProperty("href");
        let link = await linker.jsonValue();

        if (link.startsWith("https://www.youtube.com/watch?v=")){
            return link;
        }
    }

    return undefined;
 
}

module.exports = async (query, interaction) => {
    var ps = new streams.PassThrough();

    let link = await getLink(query);
    if (link){
        await interaction.followUp(`Playing: ${link}`);
        ytdl(link, {
            quality: 'highestaudio',
            filter: format => format.container === "webm",
            highWaterMark: 1024 * 1024 * 10
        }).pipe(ps);

        // ps.pipe(fs.createWriteStream("./test2.webm"))
        rsc = createAudioResource(ps, {
            inputType: StreamType.WebmOpus,
            inlineVolume: true
        });

        // rsc = createAudioResource("./test.mp3");
        return rsc;
    }

    return undefined;
}
