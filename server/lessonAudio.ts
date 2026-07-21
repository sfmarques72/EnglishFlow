/**
 * Wrap raw PCM s16le mono into a WAV container for browser playback.
 */
export function pcmToWavBuffer(pcm: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export type LessonSummaryInput = {
  title: string;
  topic: string;
  level: string;
  grammarTitle: string;
  grammarStructure: string;
  grammarExplanation: string;
  grammarExample: string;
};

export function buildLessonSummaryPrompt(input: LessonSummaryInput): string {
  return `Você é a Sarah, host de um mini-podcast de inglês bem descolado (estilo NotebookLM / study-with-me).
Escreva um ROTEIRO FALADO curto para o aluno ouvir ANTES de praticar a lição do dia.

Contexto da lição:
- Nível CEFR: ${input.level}
- Título: ${input.title}
- Tema: ${input.topic}
- Gramática: ${input.grammarTitle}
- Estrutura: ${input.grammarStructure}
- Explicação: ${input.grammarExplanation}
- Exemplo: ${input.grammarExample}

Estilo:
- Português brasileiro, informal, amigável, "descolado" (sem ser infantil).
- Como uma amiga inteligente explicando no fone de ouvido.
- Inclua 2–4 exemplos em inglês falados naturalmente (pode dizer: "tipo assim: ...").
- Explique a ideia da gramática sem jargão pesado.
- Motive o aluno a praticar na sequência.
- Duração alvo: 45–70 segundos de fala (aprox. 110–160 palavras).
- NÃO use markdown, listas, títulos, emojis ou aspas de citação longas.
- NÃO diga "neste roteiro" nem "como IA".
- Comece direto, tipo: "E aí..." / "Beleza..." / "Bora..."

Retorne APENAS o texto do roteiro, pronto para ser lido em voz alta.`;
}

export function buildTtsPrompt(script: string): string {
  return `Fale em português brasileiro de forma descontraída, calorosa e natural, como um podcast curto de estudos. Ritmo leve, pausas naturais, sem soar robótico nem solenemente professoral:

${script}`;
}
