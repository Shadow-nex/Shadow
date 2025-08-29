// lib/whatsapp.js
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import qrcode from 'qrcode';

let sock = null;
let authState = null;

export async function initWhatsApp(sessionFile = process.env.SESSION_FILE || 'session') {
  if (sock) return sock;

  // usa multi-file auth (guarda archivos de sesión en carpeta)
  authState = await useMultiFileAuthState(sessionFile);

  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({
    printQRInTerminal: false,
    auth: authState.state,
    version
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      // emitiremos/guardaremos el qr en memoria si hace falta
      sock.lastQR = qr;
    }
    if (connection === 'close') {
      const reason = (lastDisconnect?.error && Boom.isBoom(lastDisconnect.error))
        ? lastDisconnect.error.output.statusCode
        : lastDisconnect?.error;
      console.log('WhatsApp closed:', reason);
      // reconectar si no es acción del usuario
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => initWhatsApp(sessionFile), 3000);
      } else {
        // eliminar sesión si fue logout
        console.log('Session logged out, delete session files manually if needed.');
      }
    } else if (connection === 'open') {
      console.log('WhatsApp conectado correctamente');
    }
  });

  sock.ev.on('creds.update', authState.saveCreds);

  return sock;
}

export async function getQRCodeDataURL() {
  if (!sock || !sock.lastQR) {
    return null;
  }
  return qrcode.toDataURL(sock.lastQR);
}

// enviar texto
export async function sendText(to, text) {
  if (!sock) throw new Error('WhatsApp no inicializado');
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  const res = await sock.sendMessage(jid, { text });
  return res;
}

// enviar imagen desde URL o Buffer (simple)
export async function sendImage(to, imageBuffer, caption = '') {
  if (!sock) throw new Error('WhatsApp no inicializado');
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  const res = await sock.sendMessage(jid, { image: imageBuffer, caption });
  return res;
}

// util: descargar media (ejemplo)
// --- puedes ampliar con getMessage, downloadContent, etc.
export function isConnected() {
  return !!sock;
}