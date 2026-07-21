# EnglishFlow

App de inglês por níveis CEFR (A1–C2): sessões de estudo, leitura de livros reais, prova, entrevista IA e caderno de erros.

## Run Locally

**Prerequisites:** Node.js 22+

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` and `JWT_SECRET`
3. Run the app:
   `npm run dev`

## Deploy na Vercel

1. Importe o repo `sfmarques72/EnglishFlow`
2. Em **Environment Variables**, adicione:
   - `JWT_SECRET` (string longa e aleatória)
   - `GEMINI_API_KEY`
3. Framework Preset: Other · Build Command: `npm run build:web` · Output: `dist`
4. Redeploy após salvar as variáveis

O arquivo `vercel.json` já roteia `/api/*` para o backend Express.
