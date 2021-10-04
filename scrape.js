const axios = require('axios');
const ytdl = require('ytdl-core');
const streams = require('stream');
const fs = require('fs');
const { createAudioResource, StreamType } = require('@discordjs/voice');

var expression = /\/watch\?v=([a-zA-Z0-9()[\]+\-*\/%]{11})/gi;
var rgx = new RegExp(expression);

async function getLink(query){
    const resp = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);

    let arr = [];
    while ((result = rgx.exec(resp.data))){
        arr.push(result);
    }

    // console.log(arr);

    for (let i = 0; i < arr.length; i++){
        // console.log(arr[i]);
        let link = `https://www.youtube.com/watch?v=${arr[i][1]}`;
        return link;
        
    }

    return undefined;
 
}

async function playSound(link){
    var ps = new streams.PassThrough();

    if (link){
        // await interaction.followUp(`Playing: ${link}`);
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

module.exports = {
    "getLink": getLink,
    "playSound": playSound
}
