// routes/api.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { sendText, sendImage, initWhatsApp, getQRCodeDataURL, isConnected } from '../lib/whatsapp.js';
import axios from 'axios';

const router = express.Router();
const upload = multer();

function requireApiKey(req, res, next) {
  const key = req.header('x-api-key');
  if (!key || key !== process.env.API_KEY) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  next();
}

router.use(requireApiKey);

// health
router.get('/status', async (req, res) => {
  res.json({ ok: true, connected: isConnected() });
});

// init/connect
router.post('/connect', async (req, res) => {
  try {
    await initWhatsApp();
    res.json({ ok: true, msg: 'Inicializando conexión (revisar logs)' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// obtener QR (data URL)
router.get('/qr', async (req, res) => {
  try {
    const dataUrl = await getQRCodeDataURL();
    if (!dataUrl) return res.status(404).json({ ok: false, error: 'No QR available' });
    res.json({ ok: true, qr: dataUrl });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// enviar texto
router.post('/sendText', express.json(), async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ ok: false, error: '`to` y `text` son requeridos' });
    const resp = await sendText(to, text);
    res.json({ ok: true, resp });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// enviar imagen por URL
router.post('/sendImageByUrl', express.json(), async (req, res) => {
  try {
    const { to, url, caption = '' } = req.body;
    if (!to || !url) return res.status(400).json({ ok: false, error: '`to` y `url` son requeridos' });
    const r = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(r.data);
    const resp = await sendImage(to, buffer, caption);
    res.json({ ok: true, resp });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;