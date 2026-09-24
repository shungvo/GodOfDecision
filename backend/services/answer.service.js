import fs from 'fs';
import path from 'path';

let decisions = null;

const loadAnswers = () => {
  if (decisions) return decisions;
  try {
    const dataPath = path.resolve('./data/Decision.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(rawData);
    decisions = parsed.book_answers || [];
  } catch (error) {
    console.error('Error loading Decision.json:', error);
    decisions = [];
  }
  return decisions;
};

export const getAnswers = () => {
  return loadAnswers();
};

let byId = null;

/**
 * One answer by its book number.
 *
 * Interpreting an already drawn answer means a second request, and
 * that request may only name the answer — every word the model reads
 * about it is looked up here, never taken from the request body.
 */
export const getAnswerById = (id) => {
  if (!byId) {
    byId = new Map(loadAnswers().map((answer) => [answer.id, answer]));
  }

  return byId.get(id) ?? null;
};

export const pickAnswer = () => {
  const answers = getAnswers();
  if (!answers || answers.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * answers.length);
  return answers[index];
};
