import * as authService from '../services/auth.service.js';
import { AuthError, SESSION_SECONDS } from '../services/auth.service.js';
import { COOKIE_NAME, readUser } from '../middlewares/auth.middleware.js';

const fail = (res, status, error) =>
  res.status(status).json({ success: false, error });

const handleError = (res, error) => {
  if (error instanceof AuthError) {
    return fail(res, error.status, error.message);
  }

  console.error('Auth Controller Error:', error);

  return fail(res, 500, 'Internal server error.');
};

/**
 * The session cookie.
 *
 * httpOnly, so the token never exists in JavaScript — through the
 * Next rewrite the API is same-origin, which is what lets a cookie
 * do this job at all (and why nothing here touches localStorage).
 *
 * `secure` follows the request: hard-coding it on would break plain
 * http on the LAN, leaving it off would let an https tunnel like
 * ngrok send the cookie in the clear.
 */
const setSession = (req, res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    maxAge: SESSION_SECONDS * 1000,
    path: '/',
  });
};

export const register = async (req, res) => {
  try {
    const { token, user, quota } = authService.register(req.body ?? {});

    setSession(req, res, token);

    // Registering *is* logging in. Bouncing a brand-new account to
    // the login form to retype what it just typed helps nobody.
    return res.status(201).json({ success: true, data: { user, quota } });
  } catch (error) {
    return handleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { token, user, quota } = authService.login(req.body ?? {});

    setSession(req, res, token);

    return res.status(200).json({ success: true, data: { user, quota } });
  } catch (error) {
    return handleError(res, error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });

  return res.status(200).json({ success: true, data: null });
};

/**
 * Who am I, and how much is left today.
 *
 * 200 with a null user rather than 401 for guests: the app boots by
 * asking this, and a guest opening the app is not an error.
 */
export const me = async (req, res) => {
  try {
    const user = readUser(req);

    return res.status(200).json({
      success: true,
      data: user ? authService.me(user) : { user: null, quota: null },
    });
  } catch (error) {
    return handleError(res, error);
  }
};
