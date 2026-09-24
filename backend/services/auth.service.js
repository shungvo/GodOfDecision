import * as users from '../repositories/user.repository.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from '../utils/crypto.js';

/** How long a login lasts. */
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

/**
 * Daily analysis allowance, in Gemini tokens.
 *
 * One deep reading runs 1,500–2,500 tokens end to end, so the default
 * buys roughly eight a day — generous for a ritual, tight for a bot.
 */
export const TOKEN_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT) || 20000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

const secret = () => {
  const value = process.env.JWT_SECRET;

  if (!value) {
    // Refusing to boot beats signing sessions with a guessable
    // fallback and calling it authentication.
    throw new Error('Missing JWT_SECRET environment variable');
  }

  return value;
};

/** Local calendar date, YYYY-MM-DD. The quota day is the user's day. */
const today = () => new Date().toLocaleDateString('en-CA');

/** What travels to the client. The hash never does. */
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt,
});

/** Thrown for anything that is the caller's to fix. */
export class AuthError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const register = ({ email, password }) => {
  const cleaned = String(email ?? '')
    .trim()
    .toLowerCase();

  if (!EMAIL.test(cleaned)) {
    throw new AuthError('Email không hợp lệ.');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw new AuthError(`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`);
  }

  if (users.findByEmail(cleaned)) {
    throw new AuthError('Email này đã được đăng ký.', 409);
  }

  const user = users.create({
    email: cleaned,
    passwordHash: hashPassword(password),
  });

  return session(user);
};

export const login = ({ email, password }) => {
  const cleaned = String(email ?? '')
    .trim()
    .toLowerCase();

  const user = users.findByEmail(cleaned);

  /*
   * One message for both failures. Which of the two fields was wrong
   * is exactly what an enumeration probe wants to know.
   */
  if (
    !user ||
    typeof password !== 'string' ||
    !verifyPassword(password, user.passwordHash)
  ) {
    throw new AuthError('Email hoặc mật khẩu không đúng.', 401);
  }

  return session(user);
};

const session = (user) => ({
  token: signToken({ sub: user.id }, secret(), SESSION_SECONDS),
  user: publicUser(user),
  quota: quotaFor(user),
});

/** The user behind a session token, or null. */
export const userForToken = (token) => {
  const payload = verifyToken(token, secret());

  if (!payload) return null;

  return users.findById(payload.sub);
};

export const me = (user) => ({
  user: publicUser(user),
  quota: quotaFor(user),
});

/* ==============================================================
   QUOTA
   ============================================================== */

export const quotaFor = (user) => {
  // Spend recorded against another day has already expired.
  const used = user.tokensUsedOn === today() ? user.tokensUsed : 0;

  return {
    limit: TOKEN_LIMIT,
    used,
    remaining: Math.max(0, TOKEN_LIMIT - used),
  };
};

/**
 * Record what an analysis actually cost.
 *
 * Called after the stream finishes, with the model's own count — so
 * one reading may overshoot the last of the allowance slightly. That
 * is the standard trade: blocking mid-sentence to stay exact would
 * punish the reader for the meter.
 */
export const charge = (userId, tokens) => {
  const user = users.findById(userId);

  if (!user || !Number.isFinite(tokens) || tokens <= 0) return;

  const day = today();
  const base = user.tokensUsedOn === day ? user.tokensUsed : 0;

  users.saveUsage(userId, base + Math.round(tokens), day);
};
