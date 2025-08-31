import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import morgan from 'morgan';
import { analyzeImage, extractVisionResult, synthesizeSpeech } from './azure.js';

console.log("DEBUG ENV: ", {
  endpoint: process.env.AZURE_VISION_ENDPOINT,
  key: process.env.AZURE_VISION_KEY,
  region: process.env.AZURE_SPEECH_REGION
});

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));


app.get('/health', (_req, res) => res.json({ ok: true }));


app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Aucun fichier image fourni.' });
    }
    const visionResult = await analyzeImage(req.file.buffer);
    res.json({ result: visionResult });
  } catch (err: any) {
    console.error("Erreur dans /analyze :", err.message);
    res.status(500).json({ error: err.message });
  }
});


app.post('/speak', async (req, res) => {
try {
const text = (req.body?.text || req.query.text || '').toString();
if (!text) return res.status(400).json({ error: 'Paramètre "text" requis.' });
const audio = await synthesizeSpeech(text);
res.setHeader('Content-Type', 'audio/mpeg');
res.send(audio);
} catch (err: any) {
console.error(err);
res.status(500).json({ error: err?.message || 'Échec synthèse vocale' });
}
});


const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API démarrée sur http://localhost:${port}`));