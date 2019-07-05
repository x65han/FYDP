const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        msg:'hello world recommend'
    })
})

module.exports = router
