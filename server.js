import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors()); // Permite que tu HTML haga fetch al backend

// Endpoint para ejecutar cualquier comando
app.post('/execute', (req, res) => {
  const { command } = req.body;

  if(!command) return res.send('❌ No command provided');

  exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) return res.send(`❌ Error: ${error.message}`);
    if (stderr) return res.send(`⚠️ ${stderr}`);
    res.send(stdout || '✅ Comando ejecutado correctamente');
  });
});

// Endpoint especial para clonar repositorios Git
app.post('/gitclone', (req, res) => {
  let { url, token } = req.body;
  if(!url) return res.send('❌ Debes proporcionar la URL del repositorio');

  // Si es privado y tiene token, lo agregamos
  if(token) {
    url = url.replace('https://', `https://${token}@`);
  }

  exec(`git clone ${url}`, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) return res.send(`❌ Error: ${error.message}`);
    if (stderr) return res.send(`⚠️ ${stderr}`);
    res.send(stdout || '✅ Repositorio clonado correctamente');
  });
});

app.listen(3000, () => console.log('Servidor escuchando en http://localhost:3000'));