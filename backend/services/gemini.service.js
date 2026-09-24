import { GoogleGenAI } from '@google/genai';

export const generate = async ({ system, prompt, temperature = 0.8 }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: system,
        temperature: temperature,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;

    // Parse json if output is json format, else just return the string
    let interpretation = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.interpretation) {
        interpretation = parsed.interpretation;
      }
    } catch (e) {
      // It's just plain text, continue
    }

    return interpretation.trim();
  } catch (error) {
    console.error('Gemini Service Error:', error.message);
    throw new Error('Vị thần đang im lặng. Hãy thử lại sau.');
  }
};

/**
 * Same call, delivered in pieces.
 *
 * No JSON response format here. A half finished JSON object is
 * not renderable, so streaming prompts ask for plain prose and
 * the caller appends chunks as they land.
 *
 * `onUsage`, if given, is called once after the last chunk with the
 * total token count of the call — the model's own number, which is
 * what user quotas are charged against. Reported at the end because
 * that is when Gemini reports it; a caller metering a stream it cut
 * short simply never gets a number, and charges its estimate instead.
 */
export async function* generateStream({
  system,
  prompt,
  temperature = 0.8,
  onUsage,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const ai = new GoogleGenAI({ apiKey });

  const stream = await ai.models.generateContentStream({
    model,
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature,
    },
  });

  let usage = null;
  let chars = 0;

  for await (const chunk of stream) {
    if (chunk.usageMetadata) usage = chunk.usageMetadata;

    const text = chunk.text;

    if (text) {
      chars += text.length;
      yield text;
    }
  }

  if (onUsage) {
    /*
     * Belt and braces: if the metadata never came, estimate from the
     * prose. Vietnamese runs roughly two characters per token, plus
     * the prompt the reader never sees. Over-charging a reader on a
     * missing number would be worse, but an uncounted call would make
     * the whole meter decorative.
     */
    onUsage(usage?.totalTokenCount ?? Math.ceil(chars / 2) + 600);
  }
}
