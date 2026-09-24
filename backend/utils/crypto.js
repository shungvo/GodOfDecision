import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from 'node:crypto';

/*
 * Everything here comes from node:crypto on purpose. An auth stack for
 * an app this size does not need bcrypt or a JWT library — it needs a
 * memory-hard hash and one HMAC, both of which Node ships. Fewer
 * dependencies is fewer things to audit.
 */

/* ==============================================================
   PASSWORDS

   scrypt with a per-user random salt, stored as `salt:hash` hex.
   Node's defaults (N=16384, r=8, p=1) are fine at this scale.
   ============================================================== */

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
};

export const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':');

  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
};

/* ==============================================================
   TOKENS

   A JWT, HS256 only. Signing and verifying live side by side and
   neither reads the algorithm from the token, so the classic
   alg-confusion attacks have nothing to talk to.
   ============================================================== */

const b64url = (value) =>
  Buffer.from(
    typeof value === 'string' ? value : JSON.stringify(value),
  ).toString('base64url');

const hmac = (input, secret) =>
  createHmac('sha256', secret).update(input).digest('base64url');

export const signToken = (payload, secret, maxAgeSeconds) => {
  const now = Math.floor(Date.now() / 1000);

  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url({ ...payload, iat: now, exp: now + maxAgeSeconds });

  return `${header}.${body}.${hmac(`${header}.${body}`, secret)}`;
};

/** The payload, or null for anything less than a valid, live token. */
export const verifyToken = (token, secret) => {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');

  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  const expected = Buffer.from(hmac(`${header}.${body}`, secret));
  const given = Buffer.from(signature);

  if (expected.length !== given.length) return null;
  if (!timingSafeEqual(expected, given)) return null;

  let payload;

  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number') return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return payload;
};

/* ==============================================================
   COOKIES

   Reading only. Setting them goes through res.cookie, which
   Express provides without cookie-parser.
   ============================================================== */

export const parseCookies = (header) => {
  const cookies = {};

  if (!header) return cookies;

  for (const part of header.split(';')) {
    const eq = part.indexOf('=');

    if (eq < 0) continue;

    const name = part.slice(0, eq).trim();

    if (!name) continue;

    try {
      cookies[name] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      // A malformed escape in one cookie should not hide the rest.
    }
  }

  return cookies;
};
