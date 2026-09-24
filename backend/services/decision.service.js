import * as geminiService from './gemini.service.js';
import * as answerService from './answer.service.js';

/** Shape one book answer for the API. */
const formatAnswer = (answer) => ({
  id: `A${answer.id.toString().padStart(3, '0')}`,
  vi: answer.answer_vn,
  en: answer.answer_en,
  type: 'general',
  tags: ['oracle'],
  emoji: '✨',
});

/** Wire ids look like `A042`. The book numbers its pages from 1. */
const parseAnswerId = (id) => {
  const match = /^A(\d{3})$/.exec(id);

  return match ? Number(match[1]) : null;
};

/**
 * Draw from the book.
 *
 * No AI. This is what every press pays for, and all it does is open
 * the book at one page: the answer is already written, and it is what
 * the reader came for.
 */
export const drawAnswer = (question = null) => {
  const raw = answerService.pickAnswer();

  if (!raw) {
    throw new Error('Answer data not found.');
  }

  return { question, answer: formatAnswer(raw) };
};

const LENGTH_RULE = `- Write three or four short paragraphs, separated by a
  blank line. Move through: what the answer is really saying, how that
  theme might be showing up right now, what is worth paying attention
  to, and a gentle closing thought. Still prose — no headings, no
  lists.`;

const buildSystemPrompt = (lang, question) => `You are "God of Decision", an
oracle-style companion.

You do NOT decide anything for the reader. You interpret one answer
that has already been drawn from the book.

Rules:
- The drawn answer is the source of truth.
- Do not replace it, contradict it, turn it into its opposite, or
  offer a different answer.
- Do not predict the future and do not claim certainty.
- Do not give medical, legal or financial advice.
${
  question
    ? '- Read the answer against the question the reader asked.'
    : `- The reader asked nothing out loud. Do not invent a question and
  do not ask what their situation is — speak to the answer itself and
  leave room for them to place it.`
}
- Tone: warm, thoughtful, a little mystical, never grandiose.
- No motivational clichés.
- Never frighten the reader. Even a discouraging answer is framed as
  an invitation to look more closely.
- Do not mention that you are an AI.
- Respond in ${lang === 'en' ? 'English' : 'Vietnamese'}.
${LENGTH_RULE}

Reply with the interpretation itself and nothing else. No JSON, no
headings, no bullet points, no preamble.`;

const buildUserPrompt = (answer, question, lang) => `${
  question ? `The reader asked:\n"${question}"\n\n` : ''
}Answer drawn from the book:
"${lang === 'en' ? answer.en : answer.vi}"

Answer type:
${answer.type}

Tags:
${answer.tags.join(', ')}

Interpret it for them.`;

/**
 * Interpret an already drawn answer, yielding it as the model writes.
 *
 * A separate call from the draw on purpose. Most readers are done at
 * the answer, so generating the long version for all of them would
 * spend a model call per press to be read by a fraction of them.
 *
 * Streamed rather than returned whole because a few paragraphs take a
 * few seconds, and the first sentence is worth more on screen than in
 * a buffer.
 */
export async function* streamInterpretation({
  answerId,
  question = null,
  lang = 'vi',
  onUsage,
}) {
  const id = parseAnswerId(answerId);
  const raw = id === null ? null : answerService.getAnswerById(id);

  if (!raw) {
    throw new Error(`Unknown answer: ${answerId}`);
  }

  yield* geminiService.generateStream({
    system: buildSystemPrompt(lang, question),
    prompt: buildUserPrompt(formatAnswer(raw), question, lang),
    temperature: 0.85,
    onUsage,
  });
}
