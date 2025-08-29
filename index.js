// index.js
// Plantilla mínima usando baileys + express para un panel con QR

import express from 'express'
import { makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { writeFileSync } from 'fs'
import qrcode from 'qrcode'
import dotenv from 'dotenv'
import pino from 'pino'

dotenv.config()
const PORT = process.env.PORT || 3000
const SESSION_FILE = process.env.SESSION_FILE || 'auth_info.json'
const logger = pino({ level: 'info' })

// auth state stored in single file (persistente)
const { state, saveState } = useSingleFileAuthState(SESSION_FILE)

let sock
let latestQR = null
let connected = false

async function startBot() {
  try {
    const { version } = await fetchLatestBaileysVersion()
    logger.info({version}, 'Baileys version')

    sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      version
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update
      if (qr) {
        // guarda el QR (data URI) para el dashboard
        qrcode.toDataURL(qr).then(data => { latestQR = data })
      }

      if (connection === 'open') {
        connected = true
        logger.info('Conectado a WhatsApp')
      }

      if (connection === 'close') {
        connected = false
        const code = lastDisconnect?.error?.output?.statusCode || null
        logger.warn('Conexión cerrada', { code })
        // reintentar si no es logout
        if (code !== DisconnectReason.loggedOut) {
          setTimeout(() => startBot(), 3000)
        } else {
          logger.info('Sesión cerrada - elimina el archivo de sesión para volver a autenticar')
        }
      }
    })

    // ejemplo simple de listener de mensajes
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const msg = m.messages && m.messages[0]
        if (!msg || msg.key && msg.key.remoteJid === 'status@broadcast') return

        const from = msg.key.remoteJid
        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '')

        if (text) {
          if (text.toLowerCase().includes('ping')) {
            await sock.sendMessage(from, { text: 'pong' })
          }
        }
      } catch (e) {
        logger.error(e)
      }
    })

  } catch (e) {
    logger.error('Error al iniciar el bot', e)
    setTimeout(() => startBot(), 5000)
  }
}

startBot()

// --- express dashboard ---
const app = express()
app.use(express.static('public'))

app.get('/status', (req, res) => {
  res.json({ connected, qr: latestQR ? true : false })
})

app.get('/qr', (req, res) => {
  if (!latestQR) return res.status(404).send('QR no disponible')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>QR</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#111;color:#fff;"><div><h2>Escanea el QR con WhatsApp</h2><img src="${latestQR}" alt="qr"/></div></body></html>`
  res.send(html)
})

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))