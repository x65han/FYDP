const express = require('express');
const router = express.Router();
const fs = require('fs')

router.get('/list', (req, res) => {
    const files = fs.readdirSync("./uploads")
    return res.status(200).send(files)
})

router.get('/rm/:path', async (req, res) => {
    path = 'uploads/' + req.params.path
    if (fs.existsSync(path)) {
        fs.unlinkSync(path)
        const files = fs.readdirSync("./uploads")
        return res.status(200).send(files)
    } else {
        const files = fs.readdirSync("./uploads")
        return res.status(404).send(files)
    }
})

router.post('/', (req, res) => {
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file was uploaded' })
    }

    const file = req.files.file
    file.mv(`${__dirname}/../uploads/${file.name}`, err => {
        if (err) {
            console.error(err)
            return res.status(500).send(err)
        }

        res.json({
            fileName: file.name,
            filePath: `/uploads/${file.name}`
        })
    })
})

module.exports = router
