const express = require('express');
const router = express.Router();
const fs = require('fs')
const Catalog = JSON.parse(fs.readFileSync('./songs/songs.json', 'utf8'));

// export interface Playlist {
//     uri: string,
//     coverImage: string,
//     artist: string,
//     name: string,
// }

async function validate_media_path(path) {
    return await fs.existsSync('./uploads/' + path)
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
