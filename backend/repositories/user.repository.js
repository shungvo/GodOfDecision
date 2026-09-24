import fs from 'node:fs';
import path from 'node:path';

/**
 * Users, in one JSON file.
 *
 * Node 22.8 has no node:sqlite yet and better-sqlite3 would drag a
 * native build into an otherwise pure-JS backend, so at this scale a
 * file is the honest choice. Everything goes through this module, so
 * the day the file is outgrown, a real database replaces one file.
 *
 * Writes go to a temp file and are renamed into place — a crash mid
 * write leaves the previous version, never half a JSON document.
 *
 * `storage/` rather than `data/`: data/ holds the app's content
 * (decks, the book), which ships with the code. This is state.
 */
const FILE = path.resolve('./storage/users.json');

let cache = null;
let nextId = 1;

const load = () => {
  if (cache) return cache;

  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf-8'));

    cache = parsed.users ?? [];
    nextId = cache.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  } catch {
    // First boot, or an unreadable file: start empty. The file is
    // only written on the first registration, so booting is never
    // what destroys data.
    cache = [];
    nextId = 1;
  }

  return cache;
};

const flush = () => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });

  const tmp = `${FILE}.tmp`;

  fs.writeFileSync(tmp, JSON.stringify({ users: cache }, null, 2));
  fs.renameSync(tmp, FILE);
};

export const findByEmail = (email) =>
  load().find((user) => user.email === email) ?? null;

export const findById = (id) => load().find((user) => user.id === id) ?? null;

export const create = ({ email, passwordHash }) => {
  const users = load();

  const user = {
    id: nextId++,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),

    /*
     * The day's analysis spend, against `usedOn` (local YYYY-MM-DD).
     * A row from a previous day just reads as zero — nothing resets
     * it, the date makes it stale.
     */
    tokensUsed: 0,
    tokensUsedOn: null,
  };

  users.push(user);
  flush();

  return user;
};

export const saveUsage = (id, tokensUsed, tokensUsedOn) => {
  const user = findById(id);

  if (!user) return;

  user.tokensUsed = tokensUsed;
  user.tokensUsedOn = tokensUsedOn;

  flush();
};
