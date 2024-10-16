// defining the port for the app
const PORT = 8000
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())
require('dotenv').config()
const fs = require('fs')
const multer = require('multer')
const { GoogleGenerativeAI} = require("@google/generative-ai")

// passing the api key as parameter
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const storage = multer.diskStorage({
    // this is from the documentation (just copy and paste)
    destination: (req, file, cb) => {
        // all images are saved in the public file
        cb(null, 'public')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    }
})

// also from the documentation
const upload = multer({ storage:storage}).single('file')
let filePath

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if(err) {
            return res.send(500).json(err)
        }
        filePath = req.file.path
    })
})

app.post('/gemini', async (req, res) => {
    try {
        function fileToGenerativePart(path, mimeType) {
            return {
                inlineData: {
                    data: Buffer.from(fs.readFileSync(path)).toString("base64"),
                    mimeType
                }
            }
        }
        const model = genAI.getGenerativeModel({model: "gemini-1.5-flash-latest"})
        const prompt = req.body.message
        const result = await model.generateContent([prompt, fileToGenerativePart(filePath, "image/jpeg")])
        const response = await result.response
        const text = response.text()
        res.send(text)
    } catch(err) {
        console.error(err)
    }
})

app.listen(PORT, () => console.log("Listening to the changes on PORT " + PORT))