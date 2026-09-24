import * as authService from '../services/auth.service.js';
import { parseCookies } from '../utils/crypto.js';

export const COOKIE_NAME = 'god_session';

/** The logged-in user, or null. Never throws. */
export const readUser = (req) => {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];

  return token ? authService.userForToken(token) : null;
};

/**
 * For endpoints that spend money on the caller's behalf.
 *
 * 401 rather than a redirect: the API's caller is a fetch, and the
 * screen decides what a login prompt looks like.
 */
export const requireAuth = (req, res, next) => {
  const user = readUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Đăng nhập để nghe vị thần giải nghĩa.',
    });
  }

  req.user = user;

  return next();
};
