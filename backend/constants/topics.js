/**
 * Life aspects a reading can be framed around.
 *
 * `id` is the contract with the client.
 * `focus` is what the AI is told to keep the reading about.
 */
export const TOPICS = [
  {
    id: 'general',
    vi: 'Tổng quát',
    en: 'General',
    focus: 'the shape of this period in their life as a whole',
  },
  {
    id: 'love',
    vi: 'Tình yêu',
    en: 'Love',
    focus: 'their romantic life, feelings and how they relate to a partner',
  },
  {
    id: 'relationships',
    vi: 'Mối quan hệ',
    en: 'Relationships',
    focus: 'family, friendships and the people around them',
  },
  {
    id: 'career',
    vi: 'Sự nghiệp',
    en: 'Career',
    focus: 'their work, direction and the things they are building',
  },
  {
    id: 'money',
    vi: 'Tiền bạc',
    en: 'Money',
    focus: 'money, resources and their sense of security',
  },
  {
    id: 'health',
    vi: 'Sức khỏe',
    en: 'Health',
    focus: 'their energy, rest and how they are treating their body',
  },
  {
    id: 'growth',
    vi: 'Bản thân',
    en: 'Self',
    focus: 'who they are becoming and what they are learning about themselves',
  },
  {
    id: 'study',
    vi: 'Học hành',
    en: 'Study',
    focus: 'learning, study and the skills they are developing',
  },
];

export const TOPIC_IDS = TOPICS.map((topic) => topic.id);

export const getTopic = (id) => TOPICS.find((topic) => topic.id === id) || null;
