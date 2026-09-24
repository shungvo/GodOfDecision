import * as tarotService from '../services/tarot.service.js';
import * as cardService from '../services/card.service.js';
import { TOPICS, TOPIC_IDS } from '../constants/topics.js';
import * as authService from '../services/auth.service.js';
import { streamProse } from '../utils/stream.js';

const ARCANA = ['major', 'minor'];
const SUITS = ['wands', 'cups', 'swords', 'pentacles'];
const LANGS = ['vi', 'en'];
const MAX_CARDS = 3;

const fail = (res, status, error) =>
  res.status(status).json({ success: false, error });

const serverError = (res, error) => {
  console.error('Tarot Controller Error:', error);
  return fail(res, 500, error.message || 'Internal server error.');
};

export const listCards = async (req, res) => {
  try {
    const { arcana, suit } = req.query;

    if (arcana && !ARCANA.includes(arcana)) {
      return fail(
        res,
        400,
        `Invalid arcana. Expected one of: ${ARCANA.join(', ')}.`,
      );
    }

    if (suit && !SUITS.includes(suit)) {
      return fail(
        res,
        400,
        `Invalid suit. Expected one of: ${SUITS.join(', ')}.`,
      );
    }

    const cards = cardService.getCards({ arcana, suit });

    return res.status(200).json({
      success: true,
      data: { total: cards.length, cards },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getCard = async (req, res) => {
  try {
    const card = cardService.getCardBySlug(req.params.slug);

    if (!card) {
      return fail(res, 404, 'Card not found.');
    }

    return res.status(200).json({ success: true, data: card });
  } catch (error) {
    return serverError(res, error);
  }
};

export const listTopics = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        topics: TOPICS.map(({ id, vi, en }) => ({ id, vi, en })),
      },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/**
 * Draw a spread. No question, no topic, no AI.
 */
export const draw = async (req, res) => {
  try {
    const { spread = 'single' } = req.body ?? {};

    const spreads = Object.keys(tarotService.SPREADS);

    if (!spreads.includes(spread)) {
      return fail(
        res,
        400,
        `Invalid spread. Expected one of: ${spreads.join(', ')}.`,
      );
    }

    return res.status(200).json({
      success: true,
      data: tarotService.drawSpread(spread),
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/**
 * Interpret an already drawn spread for one life aspect.
 */
export const interpret = async (req, res) => {
  try {
    const { cards, topic, lang = 'vi', depth = 'brief' } = req.body ?? {};

    if (!Array.isArray(cards) || cards.length === 0) {
      return fail(res, 400, 'cards is required and must be a non-empty array.');
    }

    if (cards.length > MAX_CARDS) {
      return fail(res, 400, `A spread holds at most ${MAX_CARDS} cards.`);
    }

    const badCard = cards.find(
      (card) =>
        !card || typeof card.slug !== 'string' || card.slug.length === 0,
    );

    if (badCard !== undefined) {
      return fail(res, 400, 'Every card needs a slug.');
    }

    if (!TOPIC_IDS.includes(topic)) {
      return fail(
        res,
        400,
        `Invalid topic. Expected one of: ${TOPIC_IDS.join(', ')}.`,
      );
    }

    if (!LANGS.includes(lang)) {
      return fail(
        res,
        400,
        `Invalid lang. Expected one of: ${LANGS.join(', ')}.`,
      );
    }

    if (!tarotService.DEPTHS.includes(depth)) {
      return fail(
        res,
        400,
        `Invalid depth. Expected one of: ${tarotService.DEPTHS.join(', ')}.`,
      );
    }

    /*
     * The gate the model call sits behind. Checked before the first
     * byte, because past it the status line is spent. The last
     * reading of the day may overshoot the allowance — the charge is
     * whatever the call really cost, recorded afterwards.
     */
    if (authService.quotaFor(req.user).remaining <= 0) {
      return fail(
        res,
        429,
        'Bạn đã dùng hết năng lượng phân tích hôm nay. Năng lượng sẽ đầy lại vào ngày mai.',
      );
    }

    return await streamProse(
      res,
      tarotService.streamInterpretation({
        cards,
        topic,
        lang,
        depth,
        onUsage: (tokens) => authService.charge(req.user.id, tokens),
      }),
      {
        badRequest: (error) => /^Unknown card:/.test(error.message),
        label: 'Tarot interpret',
      },
    );
  } catch (error) {
    if (/^Unknown card:/.test(error.message)) {
      return fail(res, 400, error.message);
    }

    return serverError(res, error);
  }
};
