import cors from 'cors'
import express from 'express'
import { apiRouter } from './routes/api.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())
app.use('/api', apiRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Splitwise-Lite API running on http://localhost:${PORT}`)
})
