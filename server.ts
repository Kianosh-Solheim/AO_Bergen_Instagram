import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Generate Instagram Post Copy & Carousel Outline
app.post('/api/gemini/generate-post', async (req, res) => {
  try {
    const { topic, location = 'Bergen', tone = 'engasjerende' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Emne/sak er påkrevd.' });
    }

    const ai = getAi();

    const systemPrompt = `Du er en ekspert på sosiale medier og byutviklingsdebatt (i stilen til Arkitekturopprøret).
Du hjelper med å lage Instagram-innlegg basert på oppskriften:
- Format: 1080x1350 Instagram innlegg (4:5)
- Farger: Lysegul (#fffdf7), Lysegrønn (#f7fff7), Lyselilla (#f7f9ff)
- Typografi: Agrandir (kort, direkte, engasjerende overskrift) eller Comic Sans for humor/tull og tøys
- Vanlige presets:
  1. Hook/Forside: f.eks. "Her skal det bygges..", "Kondolerer, Bergen", "Tradisjonelle nybygg på Nordnes!"
  2. Fra dette / Til dette (før og etter)
  3. Hva som rives / Hva de vil bygge
  4. Prislapp: f.eks. "Nytt Griegakademi", "Prislapp: 908 millioner kroner"
  5. Sitat: Rapportutdrag eller byantikvar-sitat med kildeangivelse
  6. Tull og tøys: Snakkeboble med humoristisk spissing

Lag et komplett sett med engasjerende tekster på norsk tilpasset saken: "${topic}" i ${location}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Lag tekster til en Instagram-karusell om denne saken: ${topic}.
Tone: ${tone}. Sted: ${location}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hookTitle: {
              type: Type.STRING,
              description: 'Kort, kraftfull overskrift til forsiden (maks 5-6 ord)',
            },
            hookSubtitle: {
              type: Type.STRING,
              description: 'Underoverskrift eller kort bildetekst under',
            },
            fraDetteCaption: {
              type: Type.STRING,
              description: 'Bildetekst til "Fra dette:" (f.eks. "Fra dette: Historisk trehusbebyggelse")',
            },
            tilDetteCaption: {
              type: Type.STRING,
              description: 'Bildetekst til "Til dette:" (f.eks. "Til dette: 6 etasjers glassblokk")',
            },
            hvaDeVilByggeTitle: {
              type: Type.STRING,
              description: 'Tittel til flerbilde-slide (f.eks. "Hva de vil bygge:")',
            },
            prislappTitle: {
              type: Type.STRING,
              description: 'Tittel til prislapp-slide',
            },
            prislappValue: {
              type: Type.STRING,
              description: 'Prisoverslag eller nøkkeltall (f.eks. "450 millioner kroner")',
            },
            quoteBody: {
              type: Type.STRING,
              description: 'Utdrag fra saksdokument, uttalelse fra byantikvar eller politiker (2-3 avsnitt)',
            },
            quoteHighlights: {
              type: Type.STRING,
              description: 'Kommaseparerte nøkkelord som skal markeres i gult',
            },
            quoteSource: {
              type: Type.STRING,
              description: 'Kildehenvisning (f.eks. "Kilde: Bergens Tidende")',
            },
            memeBubbleText: {
              type: Type.STRING,
              description: 'Spissformulert snakkeboble for "tull og tøys"-slide',
            },
            caption: {
              type: Type.STRING,
              description: 'Fullstendig Instagram-bildetekst med innledning, argument og oppfordring til kommentarer',
            },
            hashtags: {
              type: Type.STRING,
              description: 'Relevante hashtags (f.eks. "#arkitekturopprør #bergen #byutvikling")',
            },
          },
          required: [
            'hookTitle',
            'hookSubtitle',
            'caption',
            'hashtags',
            'quoteBody',
            'quoteSource',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Gemini API feil:', error);
    res.status(500).json({
      error: 'Kunne ikke generere tekster med AI.',
      details: error.message || String(error),
    });
  }
});

// Vite Middleware for SPA and Dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AO Instagram Malbygger kjører på http://0.0.0.0:${PORT}`);
  });
}

startServer();
