const express = require('express')
const app = express()

const fileUpload = require('express-fileupload')
app.use(fileUpload())

app.use('/', express.static('build'))
app.use('/uploads', express.static('uploads'))
app.use('/songs', express.static('songs'))
app.use('/upload', require('./controllers/upload_controller'))
app.use('/recommend', require('./controllers/recommend_controller'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server Started on ${PORT} 🚀`))
