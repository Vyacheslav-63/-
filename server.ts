import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

let cachedAiClient: GoogleGenAI | null = null;
let fastLiteSupported: boolean | null = null;
let fastLiteCooldownUntil = 0;

function getAiClient(): GoogleGenAI {
  if (cachedAiClient) return cachedAiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  cachedAiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 15000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return cachedAiClient;
}

type Direction = 'auto' | 'ru-en' | 'en-ru';

interface TranslationResult {
  sourceLang: 'ru' | 'en';
  targetLang: 'en' | 'ru';
  sourceText: string;
  translatedText: string;
  phoneticRu: string;
  usageTipRu: string;
  alternatives: Array<{
    text: string;
    noteRu: string;
  }>;
}

async function generateFastJson(
  ai: GoogleGenAI,
  contents: unknown,
  systemInstruction: string,
  responseSchema: Record<string, unknown>,
  liteTimeoutMs = 3500
): Promise<{ text: string; model: string }> {
  const now = Date.now();
  if (fastLiteSupported !== false && now >= fastLiteCooldownUntil) {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          abortSignal: AbortSignal.timeout(liteTimeoutMs),
          httpOptions: {
            timeout: 10000,
            retryOptions: { attempts: 1 },
          },
        },
      });
      fastLiteSupported = true;
      return { text: (res.text ?? '{}').trim(), model: 'gemini-3.1-flash-lite' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      const isAbortOrTimeout =
        (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) ||
        lower.includes('abort') ||
        lower.includes('timeout');
      if (msg.includes('404') || msg.includes('NOT_FOUND') || lower.includes('not found')) {
        fastLiteSupported = false;
      } else if (
        isAbortOrTimeout ||
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        lower.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED')
      ) {
        // Cool down overloaded/slow fast-lite for 2 minutes and fail over immediately
        fastLiteCooldownUntil = Date.now() + 120_000;
        console.warn(`[gemini] flash-lite fast-fail (${msg.slice(0, 120)}), switching to gemini-4-hydrogen`);
      } else {
        throw err;
      }
    }
  }

  const fallbackRes = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
      abortSignal: AbortSignal.timeout(15000),
      httpOptions: {
        timeout: 15000,
        retryOptions: { attempts: 2, initialDelay: 0.3, maxDelay: 1.0 },
      },
    },
  });
  return { text: (fallbackRes.text ?? '{}').trim(), model: 'gemini-4-hydrogen' };
}

const TEXT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sourceLang: { type: Type.STRING },
    targetLang: { type: Type.STRING },
    sourceText: { type: Type.STRING },
    translatedText: { type: Type.STRING },
    phoneticRu: { type: Type.STRING },
    usageTipRu: { type: Type.STRING },
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          noteRu: { type: Type.STRING },
        },
        required: ['text', 'noteRu'],
      },
    },
  },
  required: [
    'sourceLang',
    'targetLang',
    'sourceText',
    'translatedText',
    'phoneticRu',
    'usageTipRu',
    'alternatives',
  ],
};

async function translateWithGemini(
  ai: GoogleGenAI,
  text: string,
  direction: Direction
): Promise<TranslationResult> {
  const directionInstruction =
    direction === 'ru-en'
      ? 'Source is Russian -> translate to natural conversational English.'
      : direction === 'en-ru'
        ? 'Source is English -> translate to natural Russian.'
        : 'Auto-detect Russian or English. Russian -> English; English -> Russian.';

  const systemInstruction = `Bilingual RU<->EN conversational translator for Russian learners. ${directionInstruction}
Output concise JSON:
- sourceLang: "ru" or "en"; targetLang: opposite ("en" or "ru").
- phoneticRu: full Cyrillic pronunciation of the ENGLISH phrase wrapped in a single pair of square brackets with stress accent, e.g. "[Ха́у мач из ит?]".
- usageTipRu: 1 short sentence tip in Russian.
- alternatives: 1-2 short natural variants with brief Russian notes.`;

  const { text: raw, model } = await generateFastJson(
    ai,
    `"${text}"`,
    systemInstruction,
    TEXT_SCHEMA,
    3000
  );
  const parsed = JSON.parse(raw) as TranslationResult;
  console.log(`[translate-text:model=${model}]`);
  return {
    sourceLang: parsed.sourceLang === 'en' ? 'en' : 'ru',
    targetLang: parsed.targetLang === 'ru' ? 'ru' : 'en',
    sourceText: parsed.sourceText || text,
    translatedText: parsed.translatedText || '',
    phoneticRu: parsed.phoneticRu || '',
    usageTipRu: parsed.usageTipRu || '',
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      fastLite: fastLiteSupported,
      fastLiteCooldownMs: Math.max(0, fastLiteCooldownUntil - Date.now()),
    });
  });

  // Text translation endpoint (RU <-> EN)
  app.post('/api/translate-text', async (req: Request, res: Response) => {
    const t0 = Date.now();
    try {
      const { text, direction = 'auto' } = req.body as {
        text?: string;
        direction?: Direction;
      };

      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Введите или продиктуйте фразу для перевода.' });
        return;
      }

      const ai = getAiClient();
      const result = await translateWithGemini(ai, text.trim(), direction);
      console.log(`[translate-text] ${Date.now() - t0}ms`);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка перевода';
      console.error('translate-text error:', err);
      res.status(500).json({ error: message });
    }
  });

  // Voice recording -> Multimodal Transcription & Translation
  app.post('/api/translate-voice', async (req: Request, res: Response) => {
    const t0 = Date.now();
    try {
      const { audioBase64, mimeType = 'audio/webm', direction = 'auto' } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        direction?: Direction;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'Аудиозапись не получена.' });
        return;
      }

      const ai = getAiClient();

      const directionInstruction =
        direction === 'ru-en'
          ? 'Speaker is speaking Russian -> transcribe Russian in sourceText, translate to conversational English in translatedText.'
          : direction === 'en-ru'
            ? 'Speaker is speaking English -> transcribe English in sourceText, translate to clear Russian in translatedText.'
            : 'Auto-detect Russian or English. Transcribe spoken phrase in sourceText and translate to the other language in translatedText.';

      const voiceSchema = {
        type: Type.OBJECT,
        properties: {
          audible: { type: Type.BOOLEAN },
          ...TEXT_SCHEMA.properties,
        },
        required: ['audible', ...TEXT_SCHEMA.required],
      };

      const systemInstruction = `Bilingual RU<->EN speech recognizer & translator for Russian learners. ${directionInstruction}
Rules:
1. ANTI-HALLUCINATION: NEVER invent words for silence, hiss, tone, or background noise. If there is no clearly spoken human speech, you MUST set audible=false and empty strings for all text fields.
2. phoneticRu: full Cyrillic pronunciation of the ENGLISH phrase wrapped in a single pair of square brackets with stress mark, e.g. "[Ха́у мач из ит?]".
3. usageTipRu: 1 short sentence in Russian.
4. alternatives: 1-2 short variants with brief Russian notes.`;

      const { text: raw, model } = await generateFastJson(
        ai,
        {
          parts: [
            { inlineData: { mimeType, data: audioBase64 } },
            { text: 'Transcribe and translate the spoken words accurately.' },
          ],
        },
        systemInstruction,
        voiceSchema,
        4500
      );

      const parsed = JSON.parse(raw) as TranslationResult & { audible?: boolean };
      console.log(`[translate-voice:model=${model}] ${Date.now() - t0}ms audible=${parsed.audible}`);

      if (parsed.audible === false || !parsed.sourceText?.trim()) {
        res.status(422).json({
          error: 'Не удалось расслышать речь. Попробуйте сказать чуть громче и ближе к микрофону.',
        });
        return;
      }

      res.json({
        sourceLang: parsed.sourceLang === 'en' ? 'en' : 'ru',
        targetLang: parsed.targetLang === 'ru' ? 'ru' : 'en',
        sourceText: parsed.sourceText,
        translatedText: parsed.translatedText,
        phoneticRu: parsed.phoneticRu || '',
        usageTipRu: parsed.usageTipRu || '',
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка голосового перевода';
      console.error('translate-voice error:', err);
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware in dev, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SpeakEasy server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
