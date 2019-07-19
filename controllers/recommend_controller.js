const express = require('express');
const router = express.Router();
const fs = require('fs')
const Catalog = JSON.parse(fs.readFileSync('./songs/songs.json', 'utf8'));
const extractFrames = require('ffmpeg-extract-frames')
const { getVideoDurationInSeconds } = require('get-video-duration')
const exec = require("child_process").execSync;
const net = require('net');

// export interface Playlist {
//     uri: string,
//     coverImage: string,
//     artist: string,
//     name: string,
// }

async function validate_media_path(path) {
    return await fs.existsSync('./uploads/' + path)
}

async function extract_frames(file_name) {
    const duration = await getVideoDurationInSeconds('./uploads/C4604DF7-1665-438E-A78C-FDB196BBD9A7.mov')
    console.log('duration', duration)

    // remove .jpg and .mov
    const file_name_no_ext = file_name.slice(0, file_name.length - 4)

    await extractFrames({
        input: './uploads/' + file_name,
        output: `./uploads/${file_name_no_ext}-${i}.jpg`,
        offsets: [
            1000,
            2000,
        ]
    })
}

SOCKET_BUSY = false
router.get('/:file_path', async (req, res) => {
    const file_exists = await (validate_media_path(req.params.file_path))
    console.log('[Recommendation][file_path][exists]', req.params.file_path, file_exists)

    const playlist = []
    const tabu = new Set()

    console.log('.....Waiting for Deep Leanring Model to finish.....')
    /////////////////////////////////////////////////
    /////////////////////////////////////////////////
    /////////////////////////////////////////////////
    if (SOCKET_BUSY === true) {
        res.status(503)
        return
    }

    const client = new net.Socket();

    client.connect(65432, '127.0.0.1', function() {
        console.log('Calling YuanxinModel');
        SOCKET_BUSY = true
        client.write('path to image')
    });

    client.on('data', function(data) {
        console.log('Received: ' + data);
        client.destroy(); // kill client after server's response
        SOCKET_BUSY = false
    });

    client.on('close', function() {
        console.log('Disconnected from YuxanxinModel');
        SOCKET_BUSY = false
    });

    i = 0
    while (tabu.size < 3) {
        if (Math.random() > 0.5 && tabu.has(i) === false) {
            playlist.push(Catalog.songs[i])
            tabu.add(i)
        }
        i = (i + 1) % Catalog.songs.length
    }

    res.json(playlist)
})

module.exports = router
