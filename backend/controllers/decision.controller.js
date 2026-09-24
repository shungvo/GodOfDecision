import * as decisionService from '../services/decision.service.js';
import * as authService from '../services/auth.service.js';
import { streamProse } from '../utils/stream.js';

const LANGS = ['vi', 'en'];
const MAX_QUESTION = 500;

const fail = (res, status, error) =>
  res.status(status).json({ success: false, error });

const serverError = (res, error) => {
  console.error('Decision Controller Error:', error);
  return fail(res, 500, error.message || 'Internal server error.');
};

/**
 * A question is optional, on both endpoints.
 *
 * The book is drawn from either way — the answer does not depend on
 * what was asked. The Oracle screen has no field to type into any
 * more, the same way the Tarot screen stopped asking for one; a
 * required question would make that screen impossible.
 *
 * Returns the question, or null for "none given", or an Error to
 * report back.
 */
const readQuestion = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;

  if (typeof raw !== 'string') {
    return new Error('Question must be a string when given.');
  }

  const question = raw.trim();

  if (!question) return null;

  if (question.length > MAX_QUESTION) {
    return new Error(
      `Question exceeds maximum length of ${MAX_QUESTION} characters.`,
    );
  }

  return question;
};

/**
 * Draw one answer. No AI, so it costs nothing and never fails slowly.
 */
export const draw = async (req, res) => {
  try {
    const question = readQuestion(req.body?.question);

    if (question instanceof Error) {
      return fail(res, 400, question.message);
    }

    return res.status(200).json({
      success: true,
      data: decisionService.drawAnswer(question),
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/**
 * Interpret an answer the reader already has.
 *
 * Only the answer's id travels; the text is resolved from the book
 * here, so the request body cannot put words in the model's mouth.
 */
export const interpret = async (req, res) => {
  try {
    const { answerId, lang = 'vi' } = req.body ?? {};

    if (typeof answerId !== 'string' || answerId.length === 0) {
      return fail(res, 400, 'answerId is required.');
    }

    const question = readQuestion(req.body?.question);

    if (question instanceof Error) {
      return fail(res, 400, question.message);
    }

    if (!LANGS.includes(lang)) {
      return fail(
        res,
        400,
        `Invalid lang. Expected one of: ${LANGS.join(', ')}.`,
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
      decisionService.streamInterpretation({
        answerId,
        question,
        lang,
        onUsage: (tokens) => authService.charge(req.user.id, tokens),
      }),
      {
        badRequest: (error) => /^Unknown answer:/.test(error.message),
        label: 'Decision interpret',
      },
    );
  } catch (error) {
    return serverError(res, error);
  }
};
