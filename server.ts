import express from "express";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { authRouter } from "./server/routes/auth.ts";
import { placementRouter } from "./server/routes/placement.ts";
import { createLessonAudioRouter } from "./server/routes/lessonAudio.ts";
import { createErrorMaterialsRouter } from "./server/routes/errorMaterials.ts";
import { createWritingCorrectRouter } from "./server/routes/writingCorrect.ts";
import { createReadingRouter } from "./server/routes/reading.ts";
import { generateWithModelFallback, isQuotaError, quotaErrorMessage } from "./server/gemini.ts";
import "./server/db.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();

function parseGeminiJson(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON, raw text was:", text);
    return {
      reply: text,
      correction: "💡 Dica de Inglês: Continue praticando! A conversa está indo muito bem."
    };
  }
}

async function startServer() {
  if (!process.env.JWT_SECRET) {
    console.warn(
      "JWT_SECRET is missing. Using a development fallback. Set JWT_SECRET in .env before production."
    );
    process.env.JWT_SECRET = "englishflow-dev-secret-change-me";
  }

  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(cookieParser());
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Gemini if key exists
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  app.use("/api/auth", authRouter);
  app.use("/api/placement", placementRouter);
  app.use("/api/lesson-audio", createLessonAudioRouter(ai));
  app.use("/api/error-materials", createErrorMaterialsRouter(ai));
  app.use("/api/writing", createWritingCorrectRouter(ai));
  app.use("/api/reading", createReadingRouter());

  // Transcribe interview audio via Gemini (local mic recording → text)
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64 || typeof audioBase64 !== "string") {
        return res.status(400).json({ error: "Áudio não enviado." });
      }

      if (!process.env.GEMINI_API_KEY || !ai) {
        return res.status(503).json({
          error: "Transcrição indisponível: configure GEMINI_API_KEY no servidor.",
        });
      }

      const response = await generateWithModelFallback(ai, {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a precise speech-to-text engine for an English job interview practice app.
Transcribe the candidate's spoken English answer.
Rules:
- Return ONLY the transcript text in English.
- Do not add explanations, quotes, or markdown.
- If the audio is empty or unintelligible, return an empty string.
- Fix obvious punctuation; keep the speaker's wording.`,
              },
              {
                inlineData: {
                  mimeType: mimeType || "audio/webm",
                  data: audioBase64,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
        },
      });

      const text = (response.text || "").trim();
      return res.json({ text });
    } catch (error: any) {
      console.error("Transcribe API Error:", error);
      if (isQuotaError(error)) {
        return res.status(429).json({ error: quotaErrorMessage(error) });
      }
      return res.status(500).json({ error: error.message || "Falha ao transcrever áudio." });
    }
  });

  // API Route for English chatbot (A1-A2 Supportive Teacher)
  // Auth protection intentionally deferred to Topic 2
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, currentTopic, grammarStructure } = req.body;
      
      // If no key or SDK init failed, use a smart simulation
      if (!process.env.GEMINI_API_KEY || !ai) {
        // Fallback simulated intelligent response for A1-A2 english
        const lastUserMessage = messages[messages.length - 1]?.content || "";
        let reply = "That sounds great! I would love to learn more about you. What do you usually do in your free time?";
        let correction = "💡 Dica de Inglês (Modo Simulação): Excelente esforço! Você usou palavras simples e corretas. (Insira sua chave GEMINI_API_KEY para respostas reais da IA).";
        
        if (lastUserMessage.toLowerCase().includes("hello") || lastUserMessage.toLowerCase().includes("hi")) {
          reply = "Hello! It's so nice to meet you. My name is Sarah. Today we are talking about " + currentTopic + ". Are you ready to practice English with me?";
          correction = "💡 Dica de Inglês: Quando cumprimentar alguém, 'Nice to meet you' (Prazer em conhecer você) é uma ótima frase de início!";
        } else if (lastUserMessage.toLowerCase().includes("yes") || lastUserMessage.toLowerCase().includes("ready")) {
          reply = "Wonderful! Let's start. Tell me: " + (currentTopic.toLowerCase().includes("rotina") ? "What is your morning routine? For example: I wake up at 7 AM." : "What do you like to do on weekends?");
          correction = "💡 Dica de Inglês: Para falar sobre rotinas, usamos o Present Simple. Exemplo: 'I study English' (Eu estudo inglês).";
        } else if (lastUserMessage.length > 0) {
          reply = `That is very interesting! Can you tell me more about it using our target structure "${grammarStructure}"?`;
          correction = `💡 Dica de Inglês: Tente incluir a estrutura "${grammarStructure}" na sua próxima frase! Por exemplo: "I usually ${grammarStructure.split(' ')[0]}..."`;
        }

        return res.json({ reply, correction });
      }

      const systemInstruction = `You are Sarah, an extremely kind, encouraging, and supportive English speaking teacher for A1-A2 adult learners.
Your goals:
1. Conduct a friendly chat with the student about the topic: "${currentTopic}".
2. Encourage them to use the target grammar structure of the day: "${grammarStructure}".
3. Keep your English responses short, simple (A1-A2 level suitable for beginners), clear, and very warm. Use emojis occasionally to feel welcoming.
4. IMPORTANT: Always read the student's last message. If they made any mistakes (grammar, spelling, word choice), provide a extremely friendly, gentle correction or tip in Portuguese at the very end of your response, starting with "💡 Dica de Inglês:". If they made no mistakes, congratulate them briefly in Portuguese (e.g., "💡 Dica de Inglês: Excelente! Sua frase está 100% correta.").
5. Keep your response in English, except for the "💡 Dica de Inglês:" feedback section which MUST be in Portuguese so that beginners can understand their mistake clearly.
6. Always end with a simple, easy-to-answer follow-up question to keep the conversation going.

Format your response as a JSON object with this exact structure:
{
  "reply": "Your English reply to the user, including the simple follow-up question.",
  "correction": "The gentle feedback/correction in Portuguese (starting with '💡 Dica de Inglês:'), or positive feedback if they made no mistakes."
}

Ensure the response is valid JSON. Do not wrap in markdown code blocks like \`\`\`json. Return only the JSON.`;

      const formattedHistory = messages.slice(-5).map((m: any) => `${m.role === 'user' ? 'Student' : 'Sarah'}: ${m.content}`).join("\n");
      const prompt = `Here is the conversation history so far:
${formattedHistory}

Student's last message: "${messages[messages.length - 1].content}"

Please reply to the student's last message following your instructions and return the JSON object.`;

      const response = await generateWithModelFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const jsonResponse = parseGeminiJson(text);
      res.json(jsonResponse);

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (isQuotaError(error)) {
        return res.status(429).json({ error: quotaErrorMessage(error) });
      }
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
