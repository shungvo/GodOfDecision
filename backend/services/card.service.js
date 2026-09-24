import fs from 'fs';
import path from 'path';

let cards = null;

const loadCards = () => {
  if (cards) return cards;
  try {
    const dataPath = path.resolve('./data/Tarot.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(rawData);
    cards = parsed.tarot_cards || [];
  } catch (error) {
    console.error('Error loading Tarot.json:', error);
    cards = [];
  }
  return cards;
};

export const getCards = ({ arcana, suit } = {}) => {
  let result = loadCards();

  if (arcana) {
    result = result.filter((card) => card.arcana === arcana);
  }

  if (suit) {
    result = result.filter((card) => card.suit === suit);
  }

  return result;
};

export const getCardBySlug = (slug) => {
  return loadCards().find((card) => card.slug === slug) || null;
};

/**
 * Draw `count` distinct cards.
 * Each card gets a random orientation.
 */
export const drawCards = (count = 1) => {
  const deck = loadCards();
  if (deck.length === 0) return [];

  const size = Math.min(count, deck.length);
  const pool = [...deck];
  const drawn = [];

  for (let i = 0; i < size; i++) {
    const index = Math.floor(Math.random() * pool.length);
    const [card] = pool.splice(index, 1);
    drawn.push({
      card,
      orientation: Math.random() < 0.5 ? 'reversed' : 'upright',
    });
  }

  return drawn;
};
