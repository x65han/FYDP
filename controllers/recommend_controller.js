const express = require('express');
const router = express.Router();
const fs = require('fs')
const Catalog = JSON.parse(fs.readFileSync('./songs/songs.json', 'utf8'));
const extractFrames = require('ffmpeg-extract-frames')
const { getVideoDurationInSeconds } = require('get-video-duration')

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

router.get('/:file_path', async (req, res) => {
    const file_exists = await (validate_media_path(req.params.file_path))
    console.log('[Recommendation][file_path][exists]', req.params.file_path, file_exists)


    const playlist = []
    const tabu = new Set()

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
