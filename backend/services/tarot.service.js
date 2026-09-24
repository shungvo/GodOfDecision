import * as geminiService from './gemini.service.js';
import * as cardService from './card.service.js';
import { getTopic } from '../constants/topics.js';

export const SPREADS = {
  single: { count: 1, positions: [null] },
  three: { count: 3, positions: ['past', 'present', 'future'] },
};

const POSITION_LABELS = {
  past: { vi: 'Quá khứ', en: 'Past' },
  present: { vi: 'Hiện tại', en: 'Present' },
  future: { vi: 'Hướng đi', en: 'Direction' },
};

/**
 * Shape one card for the API response.
 * `meaning` is already resolved by orientation so the client does not branch.
 */
const formatCard = (card, orientation, position) => ({
  id: `T${card.id.toString().padStart(3, '0')}`,
  slug: card.slug,
  position,
  orientation,
  arcana: card.arcana,
  suit: card.suit,
  number: card.number,
  name: { vi: card.name_vn, en: card.name_en },
  image: card.image,
  keywords: { vi: card.keywords_vn, en: card.keywords_en },
  meaning:
    orientation === 'reversed'
      ? { vi: card.reversed_vn, en: card.reversed_en }
      : { vi: card.upright_vn, en: card.upright_en },
});

/**
 * Draw a spread.
 *
 * No AI. The user has not chosen a topic yet, and the cards
 * must be on the table before they do.
 */
export const drawSpread = (spread = 'single') => {
  const config = SPREADS[spread];

  if (!config) {
    throw new Error(`Unknown spread: ${spread}`);
  }

  const drawn = cardService.drawCards(config.count);

  if (drawn.length === 0) {
    throw new Error('Tarot data not found.');
  }

  return {
    spread,
    cards: drawn.map((entry, index) =>
      formatCard(
        entry.card,
        entry.orientation,
        config.positions[index] ?? null,
      ),
    ),
  };
};

/**
 * Resolve client supplied cards against Tarot.json.
 *
 * The client may only name a card and its orientation. Every
 * word the AI reads about that card comes from the deck file,
 * never from the request body.
 */
const resolveCards = (cards) => {
  return cards.map((entry, index) => {
    const card = cardService.getCardBySlug(entry.slug);

    if (!card) {
      throw new Error(`Unknown card: ${entry.slug}`);
    }

    const orientation =
      entry.orientation === 'reversed' ? 'reversed' : 'upright';

    return formatCard(card, orientation, entry.position ?? null);
  });
};

/**
 * How much room the reading gets.
 *
 * `brief` is what a spread wants: the screen shows three cards and a
 * topic, and the reader is there to glance. `deep` is for a single
 * card someone has opened a sheet to sit with — the same rules, more
 * room to unfold them.
 */
export const DEPTHS = ['brief', 'deep'];

const LENGTH_RULE = {
  brief: '- Be concise. Three to five sentences in total.',
  deep: `- Write three or four short paragraphs, separated by a blank
  line. Move through: what the card is about, how its theme might
  be showing up right now, what is worth paying attention to, and
  a gentle closing thought. Still prose — no headings, no lists.`,
};

const buildSystemPrompt = (
  lang,
  topic,
  depth,
) => `You are "God of Decision", a gentle tarot companion.

You are NOT a fortune teller. You interpret symbolism.

Rules:
- The drawn cards are the source of truth.
- Do not invent, replace or swap any card.
- Do not predict the future.
- Do not claim certainty.
- Do not give medical, legal or financial advice.
- The reading is about ${topic.focus}. Keep it there.
- The user asked no question. Do not invent one, and do not
  ask them what their situation is. Speak to the theme itself.
- Connect the cards to each other when there is more than one.
${LENGTH_RULE[depth] ?? LENGTH_RULE.brief}
- Tone: warm, gentle, slightly magical, reflective, encouraging.
- Never frighten the user. Even difficult cards are framed as an
  invitation to reflect.
- Do not mention that you are an AI.
- Respond in ${lang === 'en' ? 'English' : 'Vietnamese'}.

Reply with the reading itself and nothing else. No JSON, no
headings, no bullet points, no preamble.`;

const buildUserPrompt = (cards, topic, lang) => {
  const cardLines = cards
    .map((card) => {
      const position = card.position
        ? `${POSITION_LABELS[card.position]?.[lang === 'en' ? 'en' : 'vi'] || card.position}: `
        : '';
      const name = lang === 'en' ? card.name.en : card.name.vi;
      const keywords = (
        lang === 'en' ? card.keywords.en : card.keywords.vi
      ).join(', ');
      const meaning = lang === 'en' ? card.meaning.en : card.meaning.vi;

      return `${position}${name} (${card.orientation})
Keywords: ${keywords}
Meaning: ${meaning}`;
    })
    .join('\n\n');

  return `Life aspect:
${lang === 'en' ? topic.en : topic.vi}

Cards drawn:

${cardLines}

Read these cards for that aspect of their life.`;
};

/**
 * Interpret an already drawn spread for one life aspect,
 * yielding the reading as the model produces it.
 *
 * The caller already holds the cards it drew, so only the
 * prose travels back.
 */
export async function* streamInterpretation({
  cards,
  topic: topicId,
  lang = 'vi',
  depth = 'brief',
  onUsage,
}) {
  const topic = getTopic(topicId);

  if (!topic) {
    throw new Error(`Unknown topic: ${topicId}`);
  }

  const resolved = resolveCards(cards);

  yield* geminiService.generateStream({
    system: buildSystemPrompt(lang, topic, depth),
    prompt: buildUserPrompt(resolved, topic, lang),
    temperature: 0.8,
    onUsage,
  });
}
