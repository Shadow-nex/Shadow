# WhatsApp Bot — Plantilla (Cloud)

Plantilla para ejecutar un bot de WhatsApp usando `@whiskeysockets/baileys` + express para un dashboard simple.

## Requisitos
- Node.js 18+ (recomendado)
- PM2 (opcional, para mantener el proceso 24/7)
- gcloud (si usas Compute Engine)

## Instalación rápida (VM o Cloud Shell persistente)

```bash
# clona y entra
git clone <tu-repo-url> whatsapp-bot
cd whatsapp-bot

# instala dependencias
npm install

# crea .env a partir del ejemplo
cp .env.example .env

# inicia con pm2 (recomendado)
pm install -g pm2
pm2 start ecosystem.config.js
pm2 save