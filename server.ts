import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface ChatRequestBody {
  message: string;
  language?: 'en' | 'ur' | 'auto';
  userName?: string;
  deviceContext?: {
    batteryLevel?: number;
    isCharging?: boolean;
    flashlightOn?: boolean;
    online?: boolean;
    currentTime?: string;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Mirror AI Assistant Chat & Intent Analysis Route
app.post('/api/mirror/chat', async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  try {
    const { message, language = 'auto', userName = 'Boss', deviceContext, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    if (!ai) {
      // Local fallback intelligent response if API key is not yet set
      const isUrduQuery = language === 'ur' || /[\u0600-\u06FF]/.test(message);
      res.json({
        reply: isUrduQuery
          ? `جی ${userName}! میں مرر اے آئی ہوں۔ سسٹم مکمل فعال ہے۔ میں آپ کی آواز اور احکامات سن رہا ہوں۔`
          : `Online and ready, ${userName}. All Mirror AI systems are nominal. How may I assist you today?`,
        language: isUrduQuery ? 'ur' : 'en',
        detectedIntent: 'general_query',
        action: null,
      });
      return;
    }

    const systemInstruction = `You are "Mirror AI", a sophisticated, futuristic personal AI voice assistant inspired by JARVIS, engineered specifically for the user's Android smartphone.
The user's name is "${userName}".
Current time and context: ${JSON.stringify(deviceContext || {})}.

Core Responsibilities:
1. Tone: Sharp, loyal, concise, technologically advanced, calm, polite, and directly actionable (ideal for spoken voice playback). Keep responses under 2-3 sentences unless explaining a complex question.
2. Bilingual Mastery:
   - English: Futuristic, witty, concise JARVIS persona.
   - Urdu (اردو): Fluent, natural, courteous Pakistani Urdu (using words like جی جناب, فرمائیے, حکم کیجیے, میں تیار ہوں).
   - If the user talks in Urdu or requested Urdu, reply in Urdu (Urdu script or romanized if requested, default to clean Urdu script).
3. Mobile & IoT Intent Detection:
   Classify what action Mirror AI should execute on the smartphone or smart home:
   - "OPEN_APP": Target apps: 'youtube', 'whatsapp', 'camera', 'gallery', 'settings', 'phone', 'chrome', 'maps', 'calculator', 'clock'.
   - "TOGGLE_FLASHLIGHT": 'on' | 'off' | 'toggle'
   - "CHECK_BATTERY": Query battery stats.
   - "SET_TIMER": Seconds to count down and optional label.
   - "SET_ALARM": Target time string.
   - "MAKE_CALL": Name or phone number to call.
   - "CONTROL_LIGHTS": Room name ('living_room', 'bedroom', 'studio', 'desk') and state ('on' | 'off' | 'toggle') and optional color or brightness.
   - "DEVICE_INFO": Hardware & system status query.
   - "NONE": Pure conversational or general knowledge answer.

Always respond in valid JSON matching the specified schema.`;

    const chatMessagesFormatted = conversationHistory.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const promptText = `User says: "${message}". Target Language preference: "${language}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...chatMessagesFormatted,
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The spoken response message in the user target language (Urdu or English).',
            },
            language: {
              type: Type.STRING,
              description: 'The language code used: "en" or "ur".',
            },
            action: {
              type: Type.OBJECT,
              description: 'The phone or smart home command to execute, or null if conversational.',
              properties: {
                type: {
                  type: Type.STRING,
                  description: 'Action type: "OPEN_APP", "TOGGLE_FLASHLIGHT", "CHECK_BATTERY", "SET_TIMER", "SET_ALARM", "MAKE_CALL", "CONTROL_LIGHTS", "DEVICE_INFO", or "NONE"',
                },
                appTarget: {
                  type: Type.STRING,
                  description: 'For OPEN_APP: youtube, whatsapp, camera, gallery, settings, phone, chrome, maps, calculator, etc.',
                },
                flashlightState: {
                  type: Type.STRING,
                  description: 'For TOGGLE_FLASHLIGHT: on, off, or toggle',
                },
                timerSeconds: {
                  type: Type.INTEGER,
                  description: 'For SET_TIMER: number of seconds',
                },
                timerLabel: {
                  type: Type.STRING,
                  description: 'For SET_TIMER: label like Pasta, Workout, Tea',
                },
                alarmTime: {
                  type: Type.STRING,
                  description: 'For SET_ALARM: e.g. 07:00 AM',
                },
                contactTarget: {
                  type: Type.STRING,
                  description: 'For MAKE_CALL: recipient name or digits',
                },
                lightsTarget: {
                  type: Type.STRING,
                  description: 'For CONTROL_LIGHTS: room name e.g. living_room, bedroom, desk, studio',
                },
                lightsState: {
                  type: Type.STRING,
                  description: 'For CONTROL_LIGHTS: on, off, or dim',
                },
              },
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 short follow-up voice prompt recommendations.',
            },
          },
          required: ['reply', 'language'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.action && typeof parsed.action.type === 'string') {
      const validTypes = ['OPEN_APP', 'TOGGLE_FLASHLIGHT', 'CHECK_BATTERY', 'SET_TIMER', 'SET_ALARM', 'MAKE_CALL', 'CONTROL_LIGHTS', 'DEVICE_INFO', 'NONE'];
      const matched = validTypes.find((t) => parsed.action.type.toUpperCase().includes(t));
      parsed.action.type = matched || parsed.action.type;
    }
    res.json(parsed);
  } catch (err: unknown) {
    console.warn('[Mirror AI] Gemini API call notice (switching to local cognitive fallback):', err);
    // Intelligent local fallback engine (handles 429 quota exhaustion and offline mode)
    const fallback = generateLocalMirrorFallback(req.body.message, req.body.language, req.body.userName, req.body.deviceContext);
    res.json(fallback);
  }
});

function generateLocalMirrorFallback(
  message: string,
  langPref: 'en' | 'ur' | 'auto' = 'auto',
  userName = 'Boss',
  deviceContext: ChatRequestBody['deviceContext']
) {
  const lower = (message || '').toLowerCase();
  const isUrdu = langPref === 'ur' || /[\u0600-\u06FF]/.test(message);
  const batteryLevel = deviceContext?.batteryLevel ?? 85;
  const isCharging = deviceContext?.isCharging ?? false;

  // 1. Flashlight Intent
  if (lower.includes('torch') || lower.includes('flashlight') || lower.includes('فلیش') || lower.includes('ٹارچ')) {
    const isOff = lower.includes('off') || lower.includes('بند') || lower.includes('deactivate');
    return {
      reply: isUrdu
        ? `جی ${userName}، فلیش لائٹ ${isOff ? 'بند' : 'آن'} کر دی گئی ہے۔`
        : `Flashlight ${isOff ? 'deactivated' : 'activated'}, ${userName}.`,
      language: isUrdu ? 'ur' : 'en',
      action: {
        type: 'TOGGLE_FLASHLIGHT',
        flashlightState: isOff ? 'off' : 'on',
      },
      suggestedFollowUps: isUrdu ? ['فلیش لائٹ بند کرو', 'بیٹری چیک کرو'] : ['Turn off flashlight', 'Check battery'],
    };
  }

  // 2. Battery Intent
  if (lower.includes('battery') || lower.includes('charge') || lower.includes('بیٹری') || lower.includes('چارج')) {
    return {
      reply: isUrdu
        ? `آپ کے فون کی بیٹری ${batteryLevel} فیصد ہے ${isCharging ? 'اور فون چارج ہو رہا ہے' : ''}۔`
        : `Your battery is currently at ${batteryLevel}% ${isCharging ? 'and actively charging' : 'on battery power'}, ${userName}.`,
      language: isUrdu ? 'ur' : 'en',
      action: {
        type: 'CHECK_BATTERY',
      },
      suggestedFollowUps: isUrdu ? ['فلیش لائٹ آن کرو', 'سیٹنگز کھولیں'] : ['Turn on flashlight', 'Open Settings'],
    };
  }

  // 3. Timers Intent
  if (lower.includes('timer') || lower.includes('ٹائمر')) {
    const minMatch = message.match(/(\d+)\s*(min|minute|منٹ)/i) || message.match(/(\d+)/);
    const mins = minMatch ? parseInt(minMatch[1], 10) : 5;
    return {
      reply: isUrdu
        ? `جی جناب، ${mins} منٹ کا ٹائمر سیٹ کر دیا گیا ہے۔`
        : `Setting a ${mins}-minute countdown timer right away, ${userName}.`,
      language: isUrdu ? 'ur' : 'en',
      action: {
        type: 'SET_TIMER',
        timerSeconds: mins * 60,
        timerLabel: `${mins}m Timer`,
      },
      suggestedFollowUps: isUrdu ? ['ٹائمر چیک کرو', 'الارم لگاؤ'] : ['Check timers', 'Set alarm'],
    };
  }

  // 4. Apps Intent
  const appKeywords: Record<string, string[]> = {
    youtube: ['youtube', 'یوٹیوب'],
    whatsapp: ['whatsapp', 'واٹس ایپ', 'میسج'],
    camera: ['camera', 'کیمرہ', 'تصویر'],
    gallery: ['gallery', 'photos', 'گیلری', 'تصاویر'],
    settings: ['settings', 'سیٹنگز', 'سیٹنگ'],
    phone: ['dialer', 'phone', 'call', 'کال', 'ڈائلر'],
    maps: ['maps', 'navigation', 'راستہ', 'میپس'],
    calculator: ['calculator', 'کیلکولیٹر', 'حساب'],
  };

  for (const [appId, terms] of Object.entries(appKeywords)) {
    if (terms.some((t) => lower.includes(t))) {
      return {
        reply: isUrdu
          ? `جی ${userName}، ${terms[terms.length - 1]} کھول رہا ہوں۔`
          : `Launching ${appId.toUpperCase()} now, ${userName}.`,
        language: isUrdu ? 'ur' : 'en',
        action: {
          type: 'OPEN_APP',
          appTarget: appId,
        },
        suggestedFollowUps: isUrdu ? ['واپس آؤ', 'بیٹری کیا ہے؟'] : ['Return to core', 'Check battery'],
      };
    }
  }

  // 5. Smart Lights Intent
  if (lower.includes('light') || lower.includes('bulb') || lower.includes('لائٹ') || lower.includes('روشنی')) {
    const isOff = lower.includes('off') || lower.includes('بند');
    let room = 'living_room';
    if (lower.includes('bedroom') || lower.includes('بیڈ')) room = 'bedroom';
    if (lower.includes('studio') || lower.includes('سٹوڈیو')) room = 'studio';
    if (lower.includes('desk') || lower.includes('ڈیسک')) room = 'desk';

    return {
      reply: isUrdu
        ? `جی جناب، ${room.replace('_', ' ')} کی سمارٹ لائٹس ${isOff ? 'بند' : 'آن'} کر دی گئی ہیں۔`
        : `Smart lights in the ${room.replace('_', ' ')} have been turned ${isOff ? 'off' : 'on'}.`,
      language: isUrdu ? 'ur' : 'en',
      action: {
        type: 'CONTROL_LIGHTS',
        lightsTarget: room,
        lightsState: isOff ? 'off' : 'on',
      },
      suggestedFollowUps: isUrdu ? ['تمام لائٹس بند کرو', 'نائٹ موڈ'] : ['Turn all lights off', 'Night mode'],
    };
  }

  // 6. Time and Date Intent
  if (lower.includes('time') || lower.includes('date') || lower.includes('وقت') || lower.includes('ٹائم') || lower.includes('تاریخ')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    return {
      reply: isUrdu
        ? `اس وقت وقت ${timeStr} ہے اور آج ${dateStr} ہے۔`
        : `The current time is ${timeStr} on ${dateStr}, ${userName}.`,
      language: isUrdu ? 'ur' : 'en',
      action: { type: 'NONE' },
      suggestedFollowUps: isUrdu ? ['الارم لگاؤ', 'بیٹری چیک کرو'] : ['Set an alarm', 'Check battery'],
    };
  }

  // 7. General Assistant Identity & Conversational Query
  return {
    reply: isUrdu
      ? `جی ${userName}! میں مرر اے آئی ہوں۔ تمام سب سسٹمز مکمل فعال ہیں۔ آپ فلیش لائٹ، یوٹیوب، واٹس ایپ، بیٹری یا لائٹس کنٹرول کر سکتے ہیں۔`
      : `Mirror AI neural core online, ${userName}. All device interfaces and voice systems are nominal. How can I help you?`,
    language: isUrdu ? 'ur' : 'en',
    action: { type: 'NONE' },
    suggestedFollowUps: isUrdu
      ? ['فلیش لائٹ آن کرو', 'بیٹری کا اسٹیٹس', 'یوٹیوب کھولیں']
      : ['Flashlight on', 'Check battery', 'Open YouTube'],
  };
}

// App status info endpoint
app.get('/api/mirror/status', (_req: Request, res: Response) => {
  res.json({
    name: 'Mirror AI Core Engine',
    version: '2.5.0-android',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    serverTime: new Date().toISOString(),
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT || '3000', 10);

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Mirror AI] Server active on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error in Mirror AI server:', err);
  process.exit(1);
});
