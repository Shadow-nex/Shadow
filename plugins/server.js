import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

// 🔑 Tus API Keys disponibles
const keys = [
  { id: 1, name: "Shadow-xyz", key: "Shadow-xyz" },
  { id: 2, name: "RinItoshiDev", key: "RinItoshiDev" },
  { id: 3, name: "MyCustomKey", key: "TuClavePersonal123" }
];

// Ruta para obtener todas las keys
app.get("/api/keys", (req, res) => {
  res.json({ status: 200, keys });
});

// Ruta proxy para usar la API real de descarga MP3
app.get("/api/ytmp3", async (req, res) => {
  const { url, apikey } = req.query;
  if (!url || !apikey) {
    return res.status(400).json({ error: "Falta URL o API Key" });
  }

  try {
    const response = await fetch(`https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}&apikey=${apikey}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error conectando con la API principal" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));